import { Agent, AgentType, AgentStatus, LegalCase, WorkflowLog } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import logger from '@/utils/logger';
import { EventEmitter } from 'events';

export abstract class BaseAgent extends EventEmitter {
  protected agent: Agent;
  protected isProcessing: boolean = false;

  constructor(
    name: string,
    type: AgentType,
    description: string,
    capabilities: string[]
  ) {
    super();
    this.agent = {
      id: uuidv4(),
      name,
      type,
      description,
      capabilities,
      status: 'idle',
      processedCases: 0,
      averageProcessingTime: 0
    };
  }

  async process(caseData: LegalCase): Promise<LegalCase> {
    if (this.isProcessing) {
      throw new Error(`Agent ${this.agent.name} is already processing a case`);
    }

    const startTime = Date.now();
    this.isProcessing = true;
    this.agent.status = 'processing';
    this.agent.currentTask = `Processing case ${caseData.id}`;

    logger.info(`Agent ${this.agent.name} started processing case ${caseData.id}`, {
      agentId: this.agent.id,
      caseId: caseData.id,
      agentType: this.agent.type
    });

    this.emit('processing-started', {
      agentId: this.agent.id,
      caseId: caseData.id,
      timestamp: new Date()
    });

    try {
      const result = await this.executeTask(caseData);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      this.updateMetrics(processingTime);

      const log: WorkflowLog = {
        timestamp: new Date(),
        stage: caseData.workflowStage,
        agent: this.agent.name,
        action: 'completed',
        details: `Successfully processed by ${this.agent.name}`,
        duration: processingTime
      };

      logger.info(`Agent ${this.agent.name} completed processing case ${caseData.id}`, {
        agentId: this.agent.id,
        caseId: caseData.id,
        processingTime,
        agentType: this.agent.type
      });

      this.emit('processing-completed', {
        agentId: this.agent.id,
        caseId: caseData.id,
        processingTime,
        log,
        timestamp: new Date()
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error(`Agent ${this.agent.name} failed to process case ${caseData.id}`, {
        agentId: this.agent.id,
        caseId: caseData.id,
        error: errorMessage,
        agentType: this.agent.type
      });

      this.emit('processing-failed', {
        agentId: this.agent.id,
        caseId: caseData.id,
        error: errorMessage,
        timestamp: new Date()
      });

      this.agent.status = 'error';
      throw error;

    } finally {
      this.isProcessing = false;
      this.agent.currentTask = undefined;
      if (this.agent.status !== 'error') {
        this.agent.status = 'idle';
      }
    }
  }

  protected abstract executeTask(caseData: LegalCase): Promise<LegalCase>;

  private updateMetrics(processingTime: number): void {
    this.agent.processedCases++;

    if (this.agent.processedCases === 1) {
      this.agent.averageProcessingTime = processingTime;
    } else {
      this.agent.averageProcessingTime =
        (this.agent.averageProcessingTime * (this.agent.processedCases - 1) + processingTime) /
        this.agent.processedCases;
    }
  }

  getAgentInfo(): Agent {
    return { ...this.agent };
  }

  getStatus(): AgentStatus {
    return this.agent.status;
  }

  isAvailable(): boolean {
    return this.agent.status === 'idle' && !this.isProcessing;
  }

  setMaintenanceMode(enabled: boolean): void {
    if (this.isProcessing) {
      throw new Error('Cannot set maintenance mode while processing');
    }

    this.agent.status = enabled ? 'maintenance' : 'idle';

    logger.info(`Agent ${this.agent.name} maintenance mode ${enabled ? 'enabled' : 'disabled'}`, {
      agentId: this.agent.id,
      agentType: this.agent.type
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      return await this.performHealthCheck();
    } catch (error) {
      logger.error(`Health check failed for agent ${this.agent.name}`, {
        agentId: this.agent.id,
        error: error instanceof Error ? error.message : error
      });
      this.agent.status = 'error';
      return false;
    }
  }

  protected async performHealthCheck(): Promise<boolean> {
    return true;
  }

  protected createWorkflowLog(
    stage: any,
    action: string,
    details: string,
    duration: number = 0
  ): WorkflowLog {
    return {
      timestamp: new Date(),
      stage,
      agent: this.agent.name,
      action,
      details,
      duration
    };
  }

  protected logProgress(caseId: string, message: string, details?: any): void {
    logger.info(`Agent ${this.agent.name} progress`, {
      agentId: this.agent.id,
      caseId,
      message,
      details
    });

    this.emit('progress-update', {
      agentId: this.agent.id,
      caseId,
      message,
      details,
      timestamp: new Date()
    });
  }
}