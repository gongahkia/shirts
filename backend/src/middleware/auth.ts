import { Request, Response, NextFunction } from 'express';
import { APIResponse } from '@/types';
import logger from '@/utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'lawyer' | 'paralegal' | 'client';
  };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response: APIResponse = {
        success: false,
        error: 'No authorization token provided',
        timestamp: new Date(),
        requestId: 'auth-' + Date.now()
      };

      res.status(401).json(response);
      return;
    }

    const token = authHeader.substring(7);

    // In a real implementation, you would verify the JWT token here
    // For demo purposes, we'll use a simple mock validation
    if (token === 'demo-token') {
      req.user = {
        id: 'demo-user',
        email: 'demo@example.com',
        role: 'lawyer'
      };

      next();
    } else {
      const response: APIResponse = {
        success: false,
        error: 'Invalid authorization token',
        timestamp: new Date(),
        requestId: 'auth-' + Date.now()
      };

      res.status(401).json(response);
    }

  } catch (error) {
    logger.error('Authentication error', {
      error: error instanceof Error ? error.message : error,
      path: req.path,
      method: req.method
    });

    const response: APIResponse = {
      success: false,
      error: 'Authentication failed',
      timestamp: new Date(),
      requestId: 'auth-' + Date.now()
    };

    res.status(500).json(response);
  }
}

export function authorize(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const response: APIResponse = {
        success: false,
        error: 'User not authenticated',
        timestamp: new Date(),
        requestId: 'authz-' + Date.now()
      };

      res.status(401).json(response);
      return;
    }

    if (!roles.includes(req.user.role)) {
      const response: APIResponse = {
        success: false,
        error: 'Insufficient permissions',
        timestamp: new Date(),
        requestId: 'authz-' + Date.now()
      };

      res.status(403).json(response);
      return;
    }

    next();
  };
}