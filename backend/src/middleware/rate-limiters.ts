import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { CacheService } from '../services/CacheService';
import { Logger } from '../services/LoggerService';

/**
 * Rate Limiters with Redis support
 *
 * Uses Redis for distributed rate limiting when available.
 * Falls back to in-memory rate limiting if Redis is not configured.
 */

// Store configuration for Redis-backed rate limiting
let redisStoreConfig: { sendCommand: (...args: string[]) => Promise<any> } | null = null;

/**
 * Initialize Redis store for rate limiting
 * Called after CacheService is initialized
 */
export async function initializeRateLimitStore(): Promise<void> {
  const redis = CacheService.getRedisClient();

  if (redis && CacheService.isConnected()) {
    redisStoreConfig = {
      sendCommand: async (...args: string[]): Promise<any> => {
        // @ts-ignore - Redis sendCommand accepts variadic args
        return redis.call(...args);
      },
    };
    Logger.info('RATE_LIMIT', 'Redis store initialized for rate limiting');
  } else {
    Logger.warn('RATE_LIMIT', 'Using in-memory rate limiting (Redis not available)');
  }
}

/**
 * Create a rate limiter with optional Redis backing
 */
function createLimiter(options: {
  windowMs: number;
  max: number;
  message: { error: string; message: string };
  keyPrefix: string;
}): RateLimitRequestHandler {
  const baseConfig = {
    windowMs: options.windowMs,
    max: options.max,
    message: options.message,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => {
      // Use user ID if authenticated, otherwise IP
      return req.userId || req.ip || 'anonymous';
    },
    handler: (req: any, res: any) => {
      Logger.warn('RATE_LIMIT', `Rate limit exceeded: ${options.keyPrefix}`, {
        userId: req.userId,
        ip: req.ip,
        endpoint: req.path,
      });
      res.status(429).json(options.message);
    },
  };

  // Use Redis store if available
  if (redisStoreConfig) {
    return rateLimit({
      ...baseConfig,
      store: new RedisStore({
        ...redisStoreConfig,
        prefix: `rl:${options.keyPrefix}:`,
      }),
    });
  }

  // Fallback to in-memory
  return rateLimit(baseConfig);
}

// General rate limiter - 100 requests per 15 minutes
export const generalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests', message: 'Please try again later' },
  keyPrefix: 'general',
});

// Auth endpoints - 10 requests per 15 minutes
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many auth attempts', message: 'Please try again later' },
  keyPrefix: 'auth',
});

// AI generation endpoints - 20 requests per minute
export const aiGenerationLimiter = createLimiter({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: { error: 'AI rate limit exceeded', message: 'Please wait before generating more content' },
  keyPrefix: 'ai',
});

// LinkedIn publish endpoint - 10 posts per hour
export const linkedinPublishLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'LinkedIn publish limit exceeded', message: 'Maximum 10 posts per hour. Please try again later.' },
  keyPrefix: 'linkedin',
});

/**
 * Dynamic rate limiter factory
 * Use this to create custom rate limiters at runtime
 */
export function createCustomLimiter(
  keyPrefix: string,
  windowMs: number,
  max: number,
  errorMessage: string
): RateLimitRequestHandler {
  return createLimiter({
    windowMs,
    max,
    message: { error: 'Rate limit exceeded', message: errorMessage },
    keyPrefix,
  });
}
