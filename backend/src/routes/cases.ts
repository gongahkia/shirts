import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LegalCase, APIResponse, PaginatedResponse } from '@/types';
import { validateInput, createCaseSchema, updateCaseSchema, paginationSchema } from '@/utils/validation';
import { WorkflowOrchestrator } from '@/agents/workflow-orchestrator';
import logger from '@/utils/logger';

const router = express.Router();
const workflowOrchestrator = new WorkflowOrchestrator();

// In-memory storage for demo purposes - replace with database in production
const cases = new Map<string, LegalCase>();

router.post('/', async (req: express.Request, res: express.Response) => {
  const requestId = uuidv4();

  try {
    const caseData = validateInput(createCaseSchema, req.body);

    const newCase: LegalCase = {
      id: uuidv4(),
      plaintiffInfo: caseData.plaintiffInfo,
      caseDetails: caseData.caseDetails,
      status: 'intake',
      workflowStage: 'plaintiff-intake',
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    cases.set(newCase.id, newCase);

    const workflowId = await workflowOrchestrator.startWorkflow(newCase);

    logger.info('New case created', {
      caseId: newCase.id,
      workflowId,
      category: newCase.caseDetails.category,
      requestId
    });

    const response: APIResponse<{ case: LegalCase; workflowId: string }> = {
      success: true,
      data: { case: newCase, workflowId },
      message: 'Case created successfully',
      timestamp: new Date(),
      requestId
    };

    res.status(201).json(response);

  } catch (error) {
    logger.error('Failed to create case', {
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

router.get('/', async (req: express.Request, res: express.Response) => {
  const requestId = uuidv4();

  try {
    const pagination = validateInput(paginationSchema, req.query);
    const { page, limit } = pagination;

    const allCases = Array.from(cases.values());
    const total = allCases.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedCases = allCases
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(startIndex, endIndex);

    const response: PaginatedResponse<LegalCase> = {
      success: true,
      data: paginatedCases,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      timestamp: new Date(),
      requestId
    };

    res.json(response);

  } catch (error) {
    logger.error('Failed to fetch cases', {
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
    const legalCase = cases.get(id);

    if (!legalCase) {
      const response: APIResponse = {
        success: false,
        error: 'Case not found',
        timestamp: new Date(),
        requestId
      };

      return res.status(404).json(response);
    }

    const response: APIResponse<LegalCase> = {
      success: true,
      data: legalCase,
      timestamp: new Date(),
      requestId
    };

    res.json(response);

  } catch (error) {
    logger.error('Failed to fetch case', {
      caseId: id,
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

router.put('/:id', async (req: express.Request, res: express.Response) => {
  const requestId = uuidv4();
  const { id } = req.params;

  try {
    const existingCase = cases.get(id);

    if (!existingCase) {
      const response: APIResponse = {
        success: false,
        error: 'Case not found',
        timestamp: new Date(),
        requestId
      };

      return res.status(404).json(response);
    }

    const updateData = validateInput(updateCaseSchema, req.body);

    const updatedCase: LegalCase = {
      ...existingCase,
      ...updateData,
      updatedAt: new Date()
    };

    cases.set(id, updatedCase);

    logger.info('Case updated', {
      caseId: id,
      updatedFields: Object.keys(updateData),
      requestId
    });

    const response: APIResponse<LegalCase> = {
      success: true,
      data: updatedCase,
      message: 'Case updated successfully',
      timestamp: new Date(),
      requestId
    };

    res.json(response);

  } catch (error) {
    logger.error('Failed to update case', {
      caseId: id,
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

router.delete('/:id', async (req: express.Request, res: express.Response) => {
  const requestId = uuidv4();
  const { id } = req.params;

  try {
    const existingCase = cases.get(id);

    if (!existingCase) {
      const response: APIResponse = {
        success: false,
        error: 'Case not found',
        timestamp: new Date(),
        requestId
      };

      return res.status(404).json(response);
    }

    cases.delete(id);

    logger.info('Case deleted', {
      caseId: id,
      requestId
    });

    const response: APIResponse = {
      success: true,
      message: 'Case deleted successfully',
      timestamp: new Date(),
      requestId
    };

    res.json(response);

  } catch (error) {
    logger.error('Failed to delete case', {
      caseId: id,
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

router.get('/:id/documents', async (req: express.Request, res: express.Response) => {
  const requestId = uuidv4();
  const { id } = req.params;

  try {
    const legalCase = cases.get(id);

    if (!legalCase) {
      const response: APIResponse = {
        success: false,
        error: 'Case not found',
        timestamp: new Date(),
        requestId
      };

      return res.status(404).json(response);
    }

    const response: APIResponse<any[]> = {
      success: true,
      data: legalCase.documents,
      timestamp: new Date(),
      requestId
    };

    res.json(response);

  } catch (error) {
    logger.error('Failed to fetch case documents', {
      caseId: id,
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

router.post('/:id/restart-workflow', async (req: express.Request, res: express.Response) => {
  const requestId = uuidv4();
  const { id } = req.params;

  try {
    const legalCase = cases.get(id);

    if (!legalCase) {
      const response: APIResponse = {
        success: false,
        error: 'Case not found',
        timestamp: new Date(),
        requestId
      };

      return res.status(404).json(response);
    }

    const workflowId = await workflowOrchestrator.startWorkflow(legalCase);

    logger.info('Workflow restarted', {
      caseId: id,
      workflowId,
      requestId
    });

    const response: APIResponse<{ workflowId: string }> = {
      success: true,
      data: { workflowId },
      message: 'Workflow restarted successfully',
      timestamp: new Date(),
      requestId
    };

    res.json(response);

  } catch (error) {
    logger.error('Failed to restart workflow', {
      caseId: id,
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

export { router as casesRouter, cases };
export default router;