import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { APIResponse, RAGQuery, RAGResult } from '@/types';
import { validateInput, ragQuerySchema } from '@/utils/validation';
import { RAGService } from '@/services/rag';
import logger from '@/utils/logger';

const router = express.Router();
const ragService = new RAGService();

// Initialize RAG service
ragService.initialize().catch(error => {
  logger.error('Failed to initialize RAG service', { error });
});

router.post('/query', async (req: express.Request, res: express.Response) => {
  const requestId = uuidv4();

  try {
    const queryData = validateInput<RAGQuery>(ragQuerySchema, req.body);

    const result = await ragService.query(queryData);

    logger.info('RAG query executed', {
      query: queryData.query,
      resultsFound: result.totalResults,
      queryTime: result.queryTime,
      requestId
    });

    const response: APIResponse<RAGResult> = {
      success: true,
      data: result,
      timestamp: new Date(),
      requestId
    };

    res.json(response);

  } catch (error) {
    logger.error('RAG query failed', {
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

router.post('/documents', async (req: express.Request, res: express.Response) => {
  const requestId = uuidv4();

  try {
    const { id, title, content, source, metadata } = req.body;

    if (!id || !title || !content || !source) {
      const response: APIResponse = {
        success: false,
        error: 'Missing required fields: id, title, content, source',
        timestamp: new Date(),
        requestId
      };

      return res.status(400).json(response);
    }

    await ragService.addDocument({
      id,
      title,
      content,
      source,
      metadata: metadata || {}
    });

    logger.info('Document added to RAG index', {
      documentId: id,
      title,
      requestId
    });

    const response: APIResponse = {
      success: true,
      message: 'Document added successfully',
      timestamp: new Date(),
      requestId
    };

    res.status(201).json(response);

  } catch (error) {
    logger.error('Failed to add document to RAG index', {
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

router.post('/documents/bulk', async (req: express.Request, res: express.Response) => {
  const requestId = uuidv4();

  try {
    const { directoryPath } = req.body;

    if (!directoryPath) {
      const response: APIResponse = {
        success: false,
        error: 'Directory path is required',
        timestamp: new Date(),
        requestId
      };

      return res.status(400).json(response);
    }

    await ragService.addDocumentsFromDirectory(directoryPath);

    logger.info('Documents added from directory', {
      directoryPath,
      requestId
    });

    const response: APIResponse = {
      success: true,
      message: 'Documents processed successfully',
      timestamp: new Date(),
      requestId
    };

    res.json(response);

  } catch (error) {
    logger.error('Failed to process documents from directory', {
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

router.get('/stats', async (req: express.Request, res: express.Response) => {
  const requestId = uuidv4();

  try {
    const stats = await ragService.getStats();

    const response: APIResponse<any> = {
      success: true,
      data: stats,
      timestamp: new Date(),
      requestId
    };

    res.json(response);

  } catch (error) {
    logger.error('Failed to get RAG stats', {
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
    const healthy = await ragService.healthCheck();

    const response: APIResponse<{ healthy: boolean }> = {
      success: true,
      data: { healthy },
      timestamp: new Date(),
      requestId
    };

    res.json(response);

  } catch (error) {
    logger.error('RAG health check failed', {
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