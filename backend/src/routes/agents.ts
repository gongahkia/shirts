import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { APIResponse } from '@/types';
import { WorkflowOrchestrator } from '@/agents/workflow-orchestrator';
import logger from '@/utils/logger';

const router = express.Router();
const workflowOrchestrator = new WorkflowOrchestrator();

router.get('/', async (req: express.Request, res: express.Response) => {
  const requestId = uuidv4();

  try {
    const agentStatus = await workflowOrchestrator.getAgentStatus();
    const agentArray = Array.from(agentStatus.entries()).map(([type, status]) => ({
      type,
      ...status
    }));

    const response: APIResponse<any[]> = {
      success: true,
      data: agentArray,
      timestamp: new Date(),
      requestId
    };

    res.json(response);

  } catch (error) {
    logger.error('Failed to fetch agent status', {
      error: error instanceof Error ? error.message : error,
      requestId
    });

    const response: APIResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date(),
      requestId
    };

    res.status(500).json(response);
  }
});

router.get('/health', async (req: express.Request, res: express.Response) => {
  const requestId = uuidv4();

  try {
    const agentStatus = await workflowOrchestrator.getAgentStatus();
    const healthyAgents = Array.from(agentStatus.values()).filter(agent => agent.healthy);
    const totalAgents = agentStatus.size;

    const overallHealth = {
      healthy: healthyAgents.length === totalAgents,
      healthyCount: healthyAgents.length,
      totalCount: totalAgents,
      healthPercentage: totalAgents > 0 ? (healthyAgents.length / totalAgents) * 100 : 0
    };

    const response: APIResponse<any> = {
      success: true,
      data: overallHealth,
      timestamp: new Date(),
      requestId
    };

    res.json(response);

  } catch (error) {
    logger.error('Failed to check agent health', {
      error: error instanceof Error ? error.message : error,
      requestId
    });

    const response: APIResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date(),
      requestId
    };

    res.status(500).json(response);
  }
});

export default router;