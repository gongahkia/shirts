import { EventEmitter } from 'events';
import { LegalCase, WorkflowStage, WorkflowState, WorkflowLog, WorkflowError } from '@/types';
import { IntakeAgent } from './intake-agent';
import { ResearchAgent } from './research-agent';
import { DocumentAgent } from './document-agent';
import { BaseAgent } from './base-agent';
import logger from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class WorkflowOrchestrator extends EventEmitter {
  private agents: Map<string, BaseAgent> = new Map();
  private activeWorkflows: Map<string, WorkflowState> = new Map();
  private workflowQueue: string[] = [];
  private isProcessing: boolean = false;

  constructor() {
    super();
    this.initializeAgents();
    this.setupEventListeners();
  }

  private initializeAgents(): void {
    const intakeAgent = new IntakeAgent();
    const researchAgent = new ResearchAgent();
    const documentAgent = new DocumentAgent();

    this.agents.set('intake', intakeAgent);
    this.agents.set('research', researchAgent);
    this.agents.set('document', documentAgent);

    logger.info('Workflow orchestrator initialized with agents', {
      agentCount: this.agents.size,
      agents: Array.from(this.agents.keys())
    });
  }

  private setupEventListeners(): void {
    this.agents.forEach((agent, agentType) => {
      agent.on('processing-started', (data) => {
        this.handleAgentEvent('processing-started', agentType, data);
      });

      agent.on('processing-completed', (data) => {
        this.handleAgentEvent('processing-completed', agentType, data);
      });

      agent.on('processing-failed', (data) => {
        this.handleAgentEvent('processing-failed', agentType, data);
      });

      agent.on('progress-update', (data) => {
        this.handleAgentEvent('progress-update', agentType, data);
      });
    });
  }

  async startWorkflow(caseData: LegalCase): Promise<string> {
    const workflowId = uuidv4();

    const workflowState: WorkflowState = {
      caseId: caseData.id,
      currentStage: 'plaintiff-intake',
      completedStages: [],
      progress: 0,
      estimatedCompletion: this.calculateEstimatedCompletion(caseData),
      logs: [],
      errors: []
    };

    this.activeWorkflows.set(workflowId, workflowState);
    this.workflowQueue.push(workflowId);

    this.addWorkflowLog(workflowId, 'plaintiff-intake', 'workflow-orchestrator', 'started', 'Workflow initiated');

    logger.info('Workflow started', {
      workflowId,
      caseId: caseData.id,
      initialStage: workflowState.currentStage
    });

    this.emit('workflow-started', {
      workflowId,
      caseId: caseData.id,
      state: workflowState
    });

    if (!this.isProcessing) {
      this.processQueue();
    }

    return workflowId;
  }

  async processWorkflow(workflowId: string, caseData: LegalCase): Promise<LegalCase> {
    const workflowState = this.activeWorkflows.get(workflowId);
    if (!workflowState) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    try {
      let currentCase = { ...caseData };
      const stages = this.getWorkflowStages();

      for (const stage of stages) {
        if (workflowState.completedStages.includes(stage)) {
          continue;
        }

        workflowState.currentStage = stage;
        this.updateWorkflowProgress(workflowId, stage);

        this.emit('workflow-stage-started', {
          workflowId,
          caseId: currentCase.id,
          stage,
          state: workflowState
        });

        const agent = this.getAgentForStage(stage);
        if (!agent) {
          throw new Error(`No agent available for stage: ${stage}`);
        }

        const startTime = Date.now();

        try {
          currentCase = await agent.process(currentCase);
          const duration = Date.now() - startTime;

          workflowState.completedStages.push(stage);
          this.addWorkflowLog(
            workflowId,
            stage,
            agent.getAgentInfo().name,
            'completed',
            `Stage completed successfully`,
            duration
          );

          this.emit('workflow-stage-completed', {
            workflowId,
            caseId: currentCase.id,
            stage,
            duration,
            state: workflowState
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          this.addWorkflowError(
            workflowId,
            stage,
            agent.getAgentInfo().name,
            errorMessage,
            'high'
          );

          this.emit('workflow-stage-failed', {
            workflowId,
            caseId: currentCase.id,
            stage,
            error: errorMessage,
            state: workflowState
          });

          throw error;
        }
      }

      workflowState.currentStage = 'completed';
      workflowState.progress = 100;
      this.addWorkflowLog(workflowId, 'completed', 'workflow-orchestrator', 'completed', 'Workflow completed successfully');

      this.emit('workflow-completed', {
        workflowId,
        caseId: currentCase.id,
        state: workflowState,
        finalCase: currentCase
      });

      logger.info('Workflow completed successfully', {
        workflowId,
        caseId: currentCase.id,
        totalStages: stages.length,
        totalTime: workflowState.logs.reduce((sum, log) => sum + log.duration, 0)
      });

      return currentCase;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.addWorkflowError(
        workflowId,
        workflowState.currentStage,
        'workflow-orchestrator',
        errorMessage,
        'critical'
      );

      this.emit('workflow-failed', {
        workflowId,
        caseId: caseData.id,
        error: errorMessage,
        state: workflowState
      });

      logger.error('Workflow failed', {
        workflowId,
        caseId: caseData.id,
        currentStage: workflowState.currentStage,
        error: errorMessage
      });

      throw error;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.workflowQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.workflowQueue.length > 0) {
      const workflowId = this.workflowQueue.shift();
      if (!workflowId) continue;

      try {
        // In a real implementation, you would fetch the case data
        // For now, we'll emit an event requesting case data
        this.emit('workflow-processing-required', { workflowId });

      } catch (error) {
        logger.error('Failed to process workflow from queue', {
          workflowId,
          error: error instanceof Error ? error.message : error
        });
      }
    }

    this.isProcessing = false;
  }

  private getWorkflowStages(): WorkflowStage[] {
    return [
      'plaintiff-intake',
      'legal-research',
      'argument-generation',
      'document-drafting',
      'review-and-revision',
      'final-formatting'
    ];
  }

  private getAgentForStage(stage: WorkflowStage): BaseAgent | null {
    switch (stage) {
      case 'plaintiff-intake':
        return this.agents.get('intake') || null;
      case 'legal-research':
        return this.agents.get('research') || null;
      case 'argument-generation':
        return this.agents.get('research') || null; // Research agent handles argument generation
      case 'document-drafting':
        return this.agents.get('document') || null;
      case 'review-and-revision':
        return this.agents.get('document') || null; // Document agent handles review
      case 'final-formatting':
        return this.agents.get('document') || null; // Document agent handles formatting
      default:
        return null;
    }
  }

  private updateWorkflowProgress(workflowId: string, currentStage: WorkflowStage): void {
    const workflowState = this.activeWorkflows.get(workflowId);
    if (!workflowState) return;

    const stages = this.getWorkflowStages();
    const currentIndex = stages.indexOf(currentStage);
    const progress = Math.round((currentIndex / stages.length) * 100);

    workflowState.progress = progress;
    workflowState.currentStage = currentStage;

    this.emit('workflow-progress', {
      workflowId,
      caseId: workflowState.caseId,
      progress,
      currentStage,
      state: workflowState
    });
  }

  private addWorkflowLog(
    workflowId: string,
    stage: WorkflowStage | 'completed',
    agent: string,
    action: string,
    details: string,
    duration: number = 0
  ): void {
    const workflowState = this.activeWorkflows.get(workflowId);
    if (!workflowState) return;

    const log: WorkflowLog = {
      timestamp: new Date(),
      stage: stage as WorkflowStage,
      agent,
      action,
      details,
      duration
    };

    workflowState.logs.push(log);
  }

  private addWorkflowError(
    workflowId: string,
    stage: WorkflowStage,
    agent: string,
    error: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): void {
    const workflowState = this.activeWorkflows.get(workflowId);
    if (!workflowState) return;

    const workflowError: WorkflowError = {
      timestamp: new Date(),
      stage,
      agent,
      error,
      severity,
      resolved: false
    };

    workflowState.errors.push(workflowError);
  }

  private calculateEstimatedCompletion(caseData: LegalCase): Date {
    const baseMinutes = 30; // Base processing time
    const complexityMultiplier = {
      'low': 1,
      'medium': 1.5,
      'high': 2.5
    };

    const categoryMultiplier = {
      'civil-litigation': 2,
      'contract-dispute': 1.5,
      'employment-law': 1.8,
      'personal-injury': 2.2,
      'intellectual-property': 2.5,
      'real-estate': 1.3,
      'family-law': 1.7,
      'criminal-defense': 2.8,
      'business-law': 1.4,
      'other': 1
    };

    const estimatedMinutes = baseMinutes *
      complexityMultiplier[caseData.caseDetails.complexity] *
      categoryMultiplier[caseData.caseDetails.category];

    return new Date(Date.now() + estimatedMinutes * 60 * 1000);
  }

  private handleAgentEvent(eventType: string, agentType: string, data: any): void {
    logger.debug(`Agent event: ${eventType}`, {
      agentType,
      data
    });

    this.emit(`agent-${eventType}`, {
      agentType,
      ...data
    });
  }

  getWorkflowState(workflowId: string): WorkflowState | null {
    return this.activeWorkflows.get(workflowId) || null;
  }

  getAllActiveWorkflows(): Map<string, WorkflowState> {
    return new Map(this.activeWorkflows);
  }

  async pauseWorkflow(workflowId: string): Promise<void> {
    const workflowState = this.activeWorkflows.get(workflowId);
    if (!workflowState) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    this.addWorkflowLog(workflowId, workflowState.currentStage, 'workflow-orchestrator', 'paused', 'Workflow paused by user');

    this.emit('workflow-paused', {
      workflowId,
      caseId: workflowState.caseId,
      state: workflowState
    });
  }

  async cancelWorkflow(workflowId: string): Promise<void> {
    const workflowState = this.activeWorkflows.get(workflowId);
    if (!workflowState) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    this.addWorkflowLog(workflowId, workflowState.currentStage, 'workflow-orchestrator', 'cancelled', 'Workflow cancelled by user');

    this.activeWorkflows.delete(workflowId);

    this.emit('workflow-cancelled', {
      workflowId,
      caseId: workflowState.caseId,
      state: workflowState
    });
  }

  async getAgentStatus(): Promise<Map<string, any>> {
    const status = new Map();

    for (const [agentType, agent] of this.agents) {
      const agentInfo = agent.getAgentInfo();
      const health = await agent.healthCheck();

      status.set(agentType, {
        ...agentInfo,
        healthy: health
      });
    }

    return status;
  }
}