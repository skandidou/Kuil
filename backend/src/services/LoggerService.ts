import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';

/**
 * LoggerService - Structured JSON logging for production
 *
 * Features:
 * - JSON format for cloud logging (GCP, Railway)
 * - Correlation IDs for request tracing
 * - Log levels: DEBUG, INFO, WARN, ERROR
 * - Context enrichment (userId, requestId, etc.)
 * - Pretty printing in development mode
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogContext {
  correlationId?: string;
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  duration?: number;
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class LoggerServiceClass {
  private serviceName: string = 'kuil-api';
  private isDevelopment: boolean = config.nodeEnv === 'development';

  /**
   * Format and output log entry
   */
  private log(level: LogLevel, category: string, message: string, context?: LogContext, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message: `[${category}] ${message}`,
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    if (this.isDevelopment) {
      this.prettyPrint(entry);
    } else {
      // Production: single-line JSON for cloud logging
      console.log(JSON.stringify(entry));
    }
  }

  /**
   * Pretty print for development
   */
  private prettyPrint(entry: LogEntry): void {
    const levelColors: Record<LogLevel, string> = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';
    const dim = '\x1b[2m';

    const color = levelColors[entry.level];
    const time = entry.timestamp.split('T')[1].split('.')[0];

    let output = `${dim}${time}${reset} ${color}${entry.level.padEnd(5)}${reset} ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      const contextStr = Object.entries(entry.context)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
        .join(' ');
      if (contextStr) {
        output += ` ${dim}${contextStr}${reset}`;
      }
    }

    if (entry.error) {
      output += `\n  ${color}Error: ${entry.error.message}${reset}`;
      if (entry.error.stack) {
        output += `\n${dim}${entry.error.stack}${reset}`;
      }
    }

    console.log(output);
  }

  /**
   * Debug level log
   */
  debug(category: string, message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('DEBUG', category, message, context);
    }
  }

  /**
   * Info level log
   */
  info(category: string, message: string, context?: LogContext): void {
    this.log('INFO', category, message, context);
  }

  /**
   * Warning level log
   */
  warn(category: string, message: string, context?: LogContext): void {
    this.log('WARN', category, message, context);
  }

  /**
   * Error level log
   */
  error(category: string, message: string, context?: LogContext, error?: Error): void {
    this.log('ERROR', category, message, context, error);
  }

  /**
   * Generate a new correlation ID
   */
  generateCorrelationId(): string {
    return uuidv4();
  }

  /**
   * Create a child logger with preset context
   */
  withContext(context: LogContext): ContextualLogger {
    return new ContextualLogger(this, context);
  }

  /**
   * Log HTTP request/response
   */
  httpRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const level: LogLevel = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';
    this.log(level, 'HTTP', `${method} ${path} ${statusCode}`, {
      ...context,
      method,
      endpoint: path,
      statusCode,
      duration,
    });
  }

  /**
   * Log database query
   */
  dbQuery(query: string, duration: number, rowCount?: number, context?: LogContext): void {
    // Truncate long queries
    const truncatedQuery = query.length > 100 ? query.substring(0, 100) + '...' : query;
    this.debug('DB', `Query executed: ${truncatedQuery}`, {
      ...context,
      duration,
      rowCount,
    });
  }

  /**
   * Log external API call
   */
  externalApi(
    service: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const level: LogLevel = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';
    this.log(level, `API:${service}`, `${endpoint} ${statusCode}`, {
      ...context,
      service,
      endpoint,
      statusCode,
      duration,
    });
  }
}

/**
 * Contextual logger with preset context
 */
class ContextualLogger {
  constructor(
    private parent: LoggerServiceClass,
    private context: LogContext
  ) {}

  debug(category: string, message: string, additionalContext?: LogContext): void {
    this.parent.debug(category, message, { ...this.context, ...additionalContext });
  }

  info(category: string, message: string, additionalContext?: LogContext): void {
    this.parent.info(category, message, { ...this.context, ...additionalContext });
  }

  warn(category: string, message: string, additionalContext?: LogContext, error?: Error): void {
    if (error) {
      // Log as error level if error object is provided
      this.parent.error(category, message, { ...this.context, ...additionalContext }, error);
    } else {
      this.parent.warn(category, message, { ...this.context, ...additionalContext });
    }
  }

  error(category: string, message: string, additionalContext?: LogContext, error?: Error): void {
    this.parent.error(category, message, { ...this.context, ...additionalContext }, error);
  }
}

// Singleton instance
export const Logger = new LoggerServiceClass();
