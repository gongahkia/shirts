import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { APIResponse, WorkflowState } from '@/types';
import { WorkflowOrchestrator } from '@/agents/workflow-orchestrator';
import { cases } from './cases';
import logger from '@/utils/logger';

const router = express.Router();
const workflowOrchestrator = new WorkflowOrchestrator();

// Setup workflow event listeners
workflowOrchestrator.on('workflow-processing-required', async (data) => {
  const { workflowId } = data;
  const workflowState = workflowOrchestrator.getWorkflowState(workflowId);

  if (workflowState) {
    const caseData = cases.get(workflowState.caseId);
    if (caseData) {
      try {
        const processedCase = await workflowOrchestrator.processWorkflow(workflowId, caseData);
        cases.set(processedCase.id, processedCase);
      } catch (error) {
        logger.error('Workflow processing failed', { workflowId, error });
      }
    }
  }
});

router.get('/', async (req: express.Request, res: express.Response) => {
  const requestId = uuidv4();

  try {
    const activeWorkflows = workflowOrchestrator.getAllActiveWorkflows();
    const workflowArray = Array.from(activeWorkflows.entries()).map(([id, state]) => ({
      id,
      ...state
    }));

    const response: APIResponse<any[]> = {
      success: true,
      data: workflowArray,
      timestamp: new Date(),
      requestId
    };

    res.json(response);

  } catch (error) {
    logger.error('Failed to fetch workflows', {
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

router.get('/:id', async (req: express.Request, res: express.Response) => {
  const requestId = uuidv4();
  const { id } = req.params;

  try {
    const workflowState = workflowOrchestrator.getWorkflowState(id);

    if (!workflowState) {
      const response: APIResponse = {
        success: false,
        error: 'Workflow not found',
        timestamp: new Date(),
        requestId
      };

      return res.status(404).json(response);
    }

    const response: APIResponse<WorkflowState> = {
      success: true,
      data: workflowState,
      timestamp: new Date(),
      requestId
    };

    res.json(response);

  } catch (error) {
    logger.error('Failed to fetch workflow', {
      workflowId: id,
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

router.post('/:id/pause', async (req: express.Request, res: express.Response) => {
  const requestId = uuidv4();
  const { id } = req.params;

  try {
    await workflowOrchestrator.pauseWorkflow(id);

    logger.info('Workflow paused', {
      workflowId: id,
      requestId
    });

    const response: APIResponse = {
      success: true,
      message: 'Workflow paused successfully',
      timestamp: new Date(),
      requestId
    };

    res.json(response);

  } catch (error) {
    logger.error('Failed to pause workflow', {
      workflowId: id,
      error: error instanceof Error ? error.message : error,
      requestId
    });

    const response: APIResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date(),
      requestId
    };

    res.status(400).json(response);
  }
});

router.post('/:id/cancel', async (req: express.Request, res: express.Response) => {
  const requestId = uuidv4();
  const { id } = req.params;

  try {
    await workflowOrchestrator.cancelWorkflow(id);

    logger.info('Workflow cancelled', {
      workflowId: id,
      requestId
    });

    const response: APIResponse = {
      success: true,
      message: 'Workflow cancelled successfully',
      timestamp: new Date(),
      requestId
    };

    res.json(response);

  } catch (error) {
    logger.error('Failed to cancel workflow', {
      workflowId: id,
      error: error instanceof Error ? error.message : error,
      requestId
    });

    const response: APIResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date(),
      requestId
    };

    res.status(400).json(response);
  }
});

router.get('/:id/logs', async (req: express.Request, res: express.Response) => {
  const requestId = uuidv4();
  const { id } = req.params;

  try {
    const workflowState = workflowOrchestrator.getWorkflowState(id);

    if (!workflowState) {
      const response: APIResponse = {
        success: false,
        error: 'Workflow not found',
        timestamp: new Date(),
        requestId
      };

      return res.status(404).json(response);
    }

    const response: APIResponse<any[]> = {
      success: true,
      data: workflowState.logs,
      timestamp: new Date(),
      requestId
    };

    res.json(response);

  } catch (error) {
    logger.error('Failed to fetch workflow logs', {
      workflowId: id,
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

router.get('/:id/errors', async (req: express.Request, res: express.Response) => {
  const requestId = uuidv4();
  const { id } = req.params;

  try {
    const workflowState = workflowOrchestrator.getWorkflowState(id);

    if (!workflowState) {
      const response: APIResponse = {
        success: false,
        error: 'Workflow not found',
        timestamp: new Date(),
        requestId
      };

      return res.status(404).json(response);
    }

    const response: APIResponse<any[]> = {
      success: true,
      data: workflowState.errors,
      timestamp: new Date(),
      requestId
    };

    res.json(response);

  } catch (error) {
    logger.error('Failed to fetch workflow errors', {
      workflowId: id,
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