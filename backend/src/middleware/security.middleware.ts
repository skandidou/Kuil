/**
 * Security Middleware
 *
 * Additional security measures beyond Helmet:
 * - Request ID tracking
 * - Input sanitization
 * - Request size limits
 * - SQL injection prevention checks
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../services/LoggerService';

// Extend Request to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Add unique request ID to each request for tracing
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

/**
 * Sanitize string inputs to prevent XSS
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return input;

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Check for potential SQL injection patterns
 * NOTE: These patterns are intentionally conservative to avoid false positives
 * on legitimate content (like LinkedIn posts with apostrophes, hyphens, etc.)
 */
const SQL_INJECTION_PATTERNS = [
  // URL-encoded SQL attacks only (not plain apostrophes which are common in text)
  /(\%27|\%23).*(\%6F|\%4F)(\%72|\%52)/i, // URL-encoded 'or
  /(\%27|\%23).*union/i,                   // URL-encoded ' followed by union
  /;\s*(drop|delete|truncate|alter)\s+(table|database)/i, // Destructive commands
  /union\s+(all\s+)?select/i,              // UNION SELECT attacks
  /;\s*select\s+.*\s+from/i,               // Chained SELECT
  /'\s*or\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i, // Classic 'OR 1=1
  /'\s*or\s+['"]?[a-z]+['"]?\s*=\s*['"]?[a-z]+/i, // 'OR 'a'='a
  /--\s*$/,                                 // SQL comment at end of input only
];

export const detectSQLInjection = (input: string): boolean => {
  if (typeof input !== 'string') return false;
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
};

/**
 * Fields that should be excluded from SQL injection checks
 * because they contain user-generated content (posts, messages, etc.)
 */
const USER_CONTENT_FIELDS = [
  'content',
  'text',
  'message',
  'topic',
  'description',
  'bio',
  'headline',
  'hook',
  'commentary',
  'post',
  'body',
];

/**
 * Middleware to check request body for suspicious patterns
 */
export const inputValidationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Check JSON body for SQL injection
  if (req.body && typeof req.body === 'object') {
    const checkObject = (obj: Record<string, any>, path: string = ''): boolean => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;

        // Skip user content fields - they can legitimately contain apostrophes, etc.
        if (USER_CONTENT_FIELDS.includes(key.toLowerCase())) {
          continue;
        }

        if (typeof value === 'string' && detectSQLInjection(value)) {
          Logger.warn('SECURITY', 'Potential SQL injection detected', {
            requestId: req.requestId,
            path: currentPath,
            ip: req.ip,
          });
          return true;
        }

        if (typeof value === 'object' && value !== null) {
          if (checkObject(value, currentPath)) return true;
        }
      }
      return false;
    };

    if (checkObject(req.body)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid input detected',
      }) as any;
    }
  }

  // Check query parameters
  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === 'string' && detectSQLInjection(value)) {
      Logger.warn('SECURITY', 'Potential SQL injection in query params', {
        requestId: req.requestId,
        param: key,
        ip: req.ip,
      });
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid query parameter',
      }) as any;
    }
  }

  next();
};

/**
 * Content-Type validation middleware
 */
export const contentTypeValidation = (req: Request, res: Response, next: NextFunction): void => {
  // Only check for POST, PUT, PATCH requests with body
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
    const contentType = req.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        error: 'Unsupported Media Type',
        message: 'Content-Type must be application/json',
      }) as any;
    }
  }
  next();
};

/**
 * Validate UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Middleware to validate UUID parameters
 */
export const validateUUIDParam = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const uuid = req.params[paramName];
    if (uuid && !isValidUUID(uuid)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid ${paramName} format`,
      }) as any;
    }
    next();
  };
};

/**
 * Prevent sensitive data in logs
 */
export const sanitizeForLogging = (obj: Record<string, any>): Record<string, any> => {
  const sensitiveKeys = [
    'password',
    'token',
    'access_token',
    'refresh_token',
    'secret',
    'apiKey',
    'api_key',
    'authorization',
  ];

  const sanitized = { ...obj };

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }

  return sanitized;
};

/**
 * Security headers middleware (additional to Helmet)
 */
export const additionalSecurityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  next();
};
