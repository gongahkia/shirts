import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import fs from 'fs/promises';

import logger from '@/utils/logger';
import { globalRateLimit, apiRateLimit, workflowRateLimit } from '@/middleware/rate-limiter';
import { authenticate } from '@/middleware/auth';
import { APIResponse } from '@/types';

import casesRouter from '@/routes/cases';
import workflowsRouter from '@/routes/workflows';
import agentsRouter from '@/routes/agents';
import ragRouter from '@/routes/rag';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Ensure required directories exist
async function ensureDirectories(): Promise<void> {
  const directories = [
    './logs',
    './uploads',
    './data',
    './data/vector_db',
    './data/legal_docs',
    './data/case_law'
  ];

  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    }
  }
}));

// Rate limiting
app.use(globalRateLimit);

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  const response: APIResponse<any> = {
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date(),
      version: '1.0.0',
      uptime: process.uptime()
    },
    timestamp: new Date(),
    requestId: 'health-' + Date.now()
  };

  res.json(response);
});

// API routes with authentication and rate limiting
app.use('/api', apiRateLimit);

// Public API routes (for demo purposes - remove authentication in production if needed)
app.use('/api/cases', casesRouter);
app.use('/api/workflows', workflowRateLimit, workflowsRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/rag', ragRouter);

// Authenticated routes (uncomment for production)
// app.use('/api/cases', authenticate, casesRouter);
// app.use('/api/workflows', authenticate, workflowRateLimit, workflowsRouter);
// app.use('/api/agents', authenticate, agentsRouter);
// app.use('/api/rag', authenticate, ragRouter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 404 handler
app.use('*', (req, res) => {
  const response: APIResponse = {
    success: false,
    error: 'Route not found',
    timestamp: new Date(),
    requestId: '404-' + Date.now()
  };

  res.status(404).json(response);
});

// Global error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  const response: APIResponse = {
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error.message,
    timestamp: new Date(),
    requestId: 'error-' + Date.now()
  };

  res.status(500).json(response);
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  logger.info('Client connected to WebSocket', {
    socketId: socket.id,
    clientIP: socket.handshake.address
  });

  socket.on('join-case', (caseId: string) => {
    socket.join(`case-${caseId}`);
    logger.debug('Client joined case room', {
      socketId: socket.id,
      caseId
    });
  });

  socket.on('join-workflow', (workflowId: string) => {
    socket.join(`workflow-${workflowId}`);
    logger.debug('Client joined workflow room', {
      socketId: socket.id,
      workflowId
    });
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected from WebSocket', {
      socketId: socket.id
    });
  });
});

// Export io for use in other modules
export { io };

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Start server
async function startServer(): Promise<void> {
  try {
    await ensureDirectories();

    server.listen(PORT, () => {
      logger.info(`Server started on port ${PORT}`, {
        port: PORT,
        nodeEnv: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });

      console.log(`
🚀 Shirts Legal Workflow Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Server: http://localhost:${PORT}
🔍 Health: http://localhost:${PORT}/health
📚 API: http://localhost:${PORT}/api
🔌 WebSocket: ws://localhost:${PORT}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    });

  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : error
    });
    process.exit(1);
  }
}

startServer();