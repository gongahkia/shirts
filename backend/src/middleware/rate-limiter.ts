import { Request, Response, NextFunction } from 'express';
import { APIResponse } from '@/types';
import logger from '@/utils/logger';

interface RateLimitData {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitData> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) { // 15 minutes
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const data = this.requests.get(identifier);

    if (!data || now > data.resetTime) {
      // First request or window expired
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs
      };
    }

    if (data.count >= this.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: data.resetTime
      };
    }

    // Increment count
    data.count++;
    this.requests.set(identifier, data);

    return {
      allowed: true,
      remaining: this.maxRequests - data.count,
      resetTime: data.resetTime
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [identifier, data] of this.requests.entries()) {
      if (now > data.resetTime) {
        this.requests.delete(identifier);
      }
    }
  }
}

const globalLimiter = new RateLimiter(
  parseInt(process.env.API_RATE_LIMIT || '100'),
  15 * 60 * 1000 // 15 minutes
);

const apiLimiter = new RateLimiter(
  parseInt(process.env.API_RATE_LIMIT || '100'),
  15 * 60 * 1000
);

const workflowLimiter = new RateLimiter(
  10, // More restrictive for workflow operations
  15 * 60 * 1000
);

export function createRateLimit(limiter: RateLimiter) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Use IP address as identifier, but in production you might want to use user ID
      const identifier = req.ip || req.connection.remoteAddress || 'unknown';

      const result = limiter.check(identifier);

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': limiter['maxRequests'].toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
      });

      if (!result.allowed) {
        logger.warn('Rate limit exceeded', {
          identifier,
          path: req.path,
          method: req.method,
          resetTime: new Date(result.resetTime).toISOString()
        });

        const response: APIResponse = {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          timestamp: new Date(),
          requestId: 'rate-limit-' + Date.now()
        };

        res.status(429).json(response);
        return;
      }

      next();

    } catch (error) {
      logger.error('Rate limiting error', {
        error: error instanceof Error ? error.message : error,
        path: req.path,
        method: req.method
      });

      // On error, allow the request to proceed
      next();
    }
  };
}

export const globalRateLimit = createRateLimit(globalLimiter);
export const apiRateLimit = createRateLimit(apiLimiter);
export const workflowRateLimit = createRateLimit(workflowLimiter);