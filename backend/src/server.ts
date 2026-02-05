import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { config } from './config/env';
import pool, { runMigrations } from './config/database';

// Services
import { CacheService } from './services/CacheService';
import { Logger } from './services/LoggerService';
import { SchedulerService } from './services/SchedulerService';
import { MetricsService } from './services/MetricsService';
import { VoiceEvolutionService } from './services/VoiceEvolutionService';

// Middleware
import {
  generalLimiter,
  authLimiter,
  aiGenerationLimiter,
  initializeRateLimitStore,
} from './middleware/rate-limiters';
import {
  requestIdMiddleware,
  inputValidationMiddleware,
  additionalSecurityHeaders,
} from './middleware/security.middleware';

// Routes
import authRoutes from './routes/auth.routes';
import linkedinRoutes from './routes/linkedin.routes';
import geminiRoutes from './routes/gemini.routes';
import userRoutes from './routes/user.routes';
import postsRoutes from './routes/posts.routes';
import analyticsRoutes from './routes/analytics.routes';
import notificationsRoutes from './routes/notifications.routes';
import { PushNotificationService } from './services/PushNotificationService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = config.port;

// Custom error classes for better error handling
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

// Export error classes for use in routes
export { AppError, ValidationError, NotFoundError, UnauthorizedError };

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: config.nodeEnv === 'production'
    ? [
        'kuil://', // iOS app custom scheme
        /^https?:\/\/localhost(:\d+)?$/, // localhost for dev
      ]
    : true, // Allow all in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware - Security
app.use(helmet()); // Security headers
app.use(additionalSecurityHeaders); // Additional security headers
app.use(requestIdMiddleware); // Request ID tracking
app.use(cors(corsOptions)); // CORS with config

// Custom logging middleware with structured logging and metrics
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Request tracking middleware (always active)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const latency = Date.now() - start;
    // Record metrics
    MetricsService.recordRequest(req.method, req.path, res.statusCode, latency);
    // Log in production
    if (config.nodeEnv === 'production') {
      Logger.httpRequest(
        req.method,
        req.path,
        res.statusCode,
        latency,
        { ip: req.ip, userAgent: req.get('User-Agent')?.substring(0, 50) }
      );
    }
  });
  next();
});

app.use(express.json({ limit: '1mb' })); // Parse JSON with size limit
app.use(express.urlencoded({ extended: true, limit: '1mb' })); // Parse URL-encoded with limit
app.use(inputValidationMiddleware); // Input validation and SQL injection detection
app.use(generalLimiter); // Apply general rate limit to all routes

/**
 * Advanced health check endpoint
 * Checks: database, Redis cache, external services
 */
app.get('/health', async (req, res) => {
  const startTime = Date.now();

  const checks: Record<string, { status: string; latency?: number; error?: string }> = {};

  // 1. Database check
  try {
    const dbStart = Date.now();
    await pool.query('SELECT 1');
    checks.database = {
      status: 'healthy',
      latency: Date.now() - dbStart,
    };
  } catch (error: any) {
    checks.database = {
      status: 'unhealthy',
      error: error.message,
    };
  }

  // 2. Redis/Cache check
  try {
    const cacheHealth = await CacheService.healthCheck();
    checks.cache = {
      status: cacheHealth.status,
      latency: cacheHealth.latency,
    };
    if (cacheHealth.mode) {
      (checks.cache as any).mode = cacheHealth.mode;
    }
  } catch (error: any) {
    checks.cache = {
      status: 'unhealthy',
      error: error.message,
    };
  }

  // 3. Scheduler check
  checks.scheduler = {
    status: 'healthy', // SchedulerService is always running if server is up
  };

  // Determine overall status
  const allHealthy = Object.values(checks).every((c) => c.status === 'healthy');
  const anyUnhealthy = Object.values(checks).some((c) => c.status === 'unhealthy');

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (allHealthy) {
    overallStatus = 'healthy';
  } else if (anyUnhealthy && checks.database.status === 'unhealthy') {
    overallStatus = 'unhealthy'; // Database is critical
  } else {
    overallStatus = 'degraded';
  }

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: config.version,
    environment: config.nodeEnv,
    uptime: process.uptime(),
    checks,
    responseTime: Date.now() - startTime,
  };

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  res.status(statusCode).json(response);
});

/**
 * Readiness probe (for Kubernetes/Cloud Run)
 */
app.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false });
  }
});

/**
 * Liveness probe (for Kubernetes/Cloud Run)
 */
app.get('/live', (req, res) => {
  res.status(200).json({ live: true });
});

/**
 * Metrics endpoint (JSON format)
 */
app.get('/metrics', (req, res) => {
  res.json(MetricsService.getMetrics());
});

/**
 * Prometheus metrics endpoint
 */
app.get('/metrics/prometheus', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(MetricsService.getPrometheusMetrics());
});

// Root endpoint with API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'Kuil Backend API',
    version: config.version,
    status: 'running',
    documentation: {
      health: {
        '/health': 'Comprehensive health check with all service statuses',
        '/ready': 'Readiness probe for orchestrators',
        '/live': 'Liveness probe for orchestrators',
      },
      auth: {
        'GET /auth/linkedin': 'Initiate LinkedIn OAuth flow',
        'GET /auth/callback': 'LinkedIn OAuth callback handler',
        'POST /auth/refresh': 'Refresh JWT token',
      },
      user: {
        'GET /api/user/profile': 'Get user profile with voice signature',
        'GET /api/user/stats': 'Get user statistics',
        'GET /api/user/activity': 'Get recent user activity',
        'GET /api/user/export-data': 'Export all user data (GDPR)',
        'DELETE /api/user/account': 'Delete account and all data (GDPR)',
        'POST /api/user/update-role': 'Update professional role',
        'POST /api/user/update-persona': 'Update writing persona',
      },
      linkedin: {
        'GET /api/linkedin/profile': 'Fetch LinkedIn profile',
        'GET /api/linkedin/posts': 'Fetch LinkedIn posts',
        'POST /api/linkedin/publish': 'Publish post to LinkedIn',
        'POST /api/linkedin/sync-posts': 'Sync LinkedIn posts cache',
      },
      voice: {
        'POST /api/voice/analyze': 'Analyze posts for voice signature',
        'GET /api/voice/signature': 'Get current voice signature',
        'POST /api/voice/generate': 'Generate post content',
        'POST /api/voice/calibration-posts': 'Get calibration sample posts',
        'POST /api/voice/calibration': 'Save tone calibration',
        'POST /api/voice/hook-score': 'Calculate hook score',
        'POST /api/voice/improve': 'Improve post content',
        'GET /api/voice/daily-spark': 'Get daily post ideas',
        'GET /api/voice/daily-inspirations': 'Get quick inspirations',
      },
      posts: {
        'GET /api/posts/scheduled': 'Get scheduled/draft/published posts',
        'POST /api/posts/schedule': 'Schedule a post',
        'POST /api/posts/publish': 'Publish post immediately',
        'GET /api/posts/optimal-time': 'Get AI-recommended posting time',
        'PUT /api/posts/:id': 'Update scheduled post',
        'DELETE /api/posts/:id': 'Delete post',
        'POST /api/posts/bulk-delete': 'Delete multiple posts',
      },
      analytics: {
        'GET /api/analytics': 'Get analytics overview',
        'GET /api/analytics/insights': 'Get AI-generated insights',
        'GET /api/analytics/engagement-trends': 'Get engagement trends',
        'GET /api/analytics/top-posts': 'Get top performing posts',
      },
    },
  });
});

// Mount routes with specific rate limiters
app.use('/auth', authLimiter, authRoutes);
app.use('/api/linkedin', linkedinRoutes); // Note: publish endpoint has its own limiter
app.use('/api/voice', aiGenerationLimiter, geminiRoutes);
app.use('/api/user', userRoutes);
app.use('/api/posts', aiGenerationLimiter, postsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: 'See GET / for available endpoints',
  });
});

// Global error handler with proper status codes
app.use((err: Error | AppError, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Log error details
  Logger.error('SERVER', 'Unhandled error', {
    message: err.message,
    path: req.path,
    method: req.method,
  }, err);

  // Check if it's our custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.name.replace('Error', ''),
      message: err.message,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token expired',
    });
  }

  // Handle validation/parse errors
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid JSON',
    });
  }

  // Default to 500 for unknown errors
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : 'An unexpected error occurred',
  });
});

/**
 * Initialize services and start server
 */
async function startServer(): Promise<void> {
  try {
    Logger.info('SERVER', 'Starting Kuil Backend...');

    // 0. Run database migrations
    Logger.info('SERVER', 'Running database migrations...');
    await runMigrations();

    // 1. Initialize Redis/Cache service
    Logger.info('SERVER', 'Initializing cache service...');
    await CacheService.initialize();

    // 2. Initialize rate limit store with Redis
    Logger.info('SERVER', 'Initializing rate limit store...');
    await initializeRateLimitStore();

    // 3. Start HTTP server
    const HOST = config.nodeEnv === 'production' ? '0.0.0.0' : 'localhost';
    app.listen(PORT, HOST, async () => {
      Logger.info('SERVER', 'Server started successfully', {
        environment: config.nodeEnv,
        port: PORT,
        host: HOST,
        version: config.version,
      });

      if (config.nodeEnv === 'development') {
        console.log('');
        console.log('Kuil Backend Server Started');
        console.log('==================================');
        console.log(`Environment: ${config.nodeEnv}`);
        console.log(`Port: ${PORT}`);
        console.log(`URL: http://localhost:${PORT}`);
        console.log('');
        console.log('Endpoints:');
        console.log(`  Health Check:     http://localhost:${PORT}/health`);
        console.log(`  API Docs:         http://localhost:${PORT}/`);
        console.log(`  LinkedIn OAuth:   http://localhost:${PORT}/auth/linkedin`);
        console.log('');
        console.log('Press Ctrl+C to stop');
        console.log('==================================');
      }

      // 4. Start the scheduled post publisher (async - syncs from DB)
      await SchedulerService.start();
      Logger.info('SERVER', 'Scheduler service started');

      // 5. Initialize Push Notification service
      await PushNotificationService.initialize();
      Logger.info('SERVER', 'Push notification service initialized');

      // 6. Start Voice Evolution service (periodic voice signature re-analysis)
      VoiceEvolutionService.start();
      Logger.info('SERVER', 'Voice evolution service started');

      // 7. Start periodic metrics logging (every 5 minutes in production)
      if (config.nodeEnv === 'production') {
        setInterval(() => {
          MetricsService.logSummary();
        }, 5 * 60 * 1000);
      }
    });
  } catch (error: any) {
    Logger.error('SERVER', 'Failed to start server', {}, error);
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  Logger.info('SERVER', `${signal} received, initiating graceful shutdown...`);

  try {
    // Stop scheduler
    SchedulerService.stop();
    Logger.info('SERVER', 'Scheduler stopped');

    // Stop voice evolution service
    VoiceEvolutionService.stop();
    Logger.info('SERVER', 'Voice evolution service stopped');

    // Close Redis connection
    await CacheService.shutdown();
    Logger.info('SERVER', 'Cache service closed');

    // Close database pool
    await pool.end();
    Logger.info('SERVER', 'Database pool closed');

    Logger.info('SERVER', 'Graceful shutdown completed');
    process.exit(0);
  } catch (error: any) {
    Logger.error('SERVER', 'Error during shutdown', {}, error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  Logger.error('SERVER', 'Uncaught exception', {}, error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  Logger.error('SERVER', 'Unhandled rejection', { reason: reason?.message || reason });
});

// Start the server
startServer();

export default app;
