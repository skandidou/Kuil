import Redis from 'ioredis';
import { config } from '../config/env';
import { Logger } from './LoggerService';

/**
 * CacheService - Redis cache with in-memory fallback
 *
 * Uses Redis (Upstash) for production, falls back to in-memory Map if Redis unavailable.
 * This ensures OAuth state and rate limiting work even without Redis configured.
 */

interface CacheItem {
  value: any;
  expiry: number;
}

class CacheServiceClass {
  private redis: Redis | null = null;
  private memoryCache: Map<string, CacheItem> = new Map();
  private isRedisConnected: boolean = false;
  private connectionAttempted: boolean = false;
  private memoryCleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize Redis connection
   */
  async initialize(): Promise<void> {
    if (this.connectionAttempted) return;
    this.connectionAttempted = true;

    const redisUrl = config.redis?.url;

    if (!redisUrl) {
      Logger.warn('CACHE', 'REDIS_URL not configured, using in-memory fallback');
      this.startMemoryCleanup();
      return;
    }

    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            Logger.error('CACHE', 'Redis connection failed after 3 retries, using memory fallback');
            return null; // Stop retrying
          }
          return Math.min(times * 200, 2000);
        },
        connectTimeout: 10000,
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        this.isRedisConnected = true;
        Logger.info('CACHE', 'Redis connected successfully');
      });

      this.redis.on('error', (err) => {
        Logger.error('CACHE', `Redis error: ${err.message}`);
        this.isRedisConnected = false;
      });

      this.redis.on('close', () => {
        this.isRedisConnected = false;
        Logger.warn('CACHE', 'Redis connection closed');
      });

      await this.redis.connect();

      // Test connection
      await this.redis.ping();
      this.isRedisConnected = true;
      Logger.info('CACHE', 'Redis ping successful');

    } catch (error: any) {
      Logger.error('CACHE', `Failed to connect to Redis: ${error.message}`);
      this.isRedisConnected = false;
      this.redis = null;
      this.startMemoryCleanup();
    }
  }

  /**
   * Start periodic cleanup of expired memory cache entries
   */
  private startMemoryCleanup(): void {
    if (this.memoryCleanupInterval) {
      clearInterval(this.memoryCleanupInterval);
    }

    this.memoryCleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.memoryCache.entries()) {
        if (now > item.expiry) {
          this.memoryCache.delete(key);
        }
      }
    }, 60 * 1000); // Clean every minute
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.isRedisConnected && this.redis) {
        const value = await this.redis.get(key);
        if (value) {
          return JSON.parse(value) as T;
        }
        return null;
      }

      // Fallback to memory
      const item = this.memoryCache.get(key);
      if (item && Date.now() <= item.expiry) {
        return item.value as T;
      }
      this.memoryCache.delete(key);
      return null;
    } catch (error: any) {
      Logger.error('CACHE', `Get error for key ${key}: ${error.message}`);
      return null;
    }
  }

  /**
   * Set a value in cache with TTL
   */
  async set(key: string, value: any, ttlMs: number): Promise<boolean> {
    try {
      if (this.isRedisConnected && this.redis) {
        const ttlSeconds = Math.ceil(ttlMs / 1000);
        await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
        return true;
      }

      // Fallback to memory
      this.memoryCache.set(key, {
        value,
        expiry: Date.now() + ttlMs,
      });
      return true;
    } catch (error: any) {
      Logger.error('CACHE', `Set error for key ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      if (this.isRedisConnected && this.redis) {
        await this.redis.del(key);
        return true;
      }

      // Fallback to memory
      this.memoryCache.delete(key);
      return true;
    } catch (error: any) {
      Logger.error('CACHE', `Delete error for key ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (this.isRedisConnected && this.redis) {
        const result = await this.redis.exists(key);
        return result === 1;
      }

      // Fallback to memory
      const item = this.memoryCache.get(key);
      if (item && Date.now() <= item.expiry) {
        return true;
      }
      this.memoryCache.delete(key);
      return false;
    } catch (error: any) {
      Logger.error('CACHE', `Exists error for key ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * Increment a counter (for rate limiting)
   */
  async increment(key: string, ttlMs: number): Promise<number> {
    try {
      if (this.isRedisConnected && this.redis) {
        const ttlSeconds = Math.ceil(ttlMs / 1000);
        const result = await this.redis.multi()
          .incr(key)
          .expire(key, ttlSeconds)
          .exec();

        if (result && result[0] && result[0][1]) {
          return result[0][1] as number;
        }
        return 1;
      }

      // Fallback to memory
      const item = this.memoryCache.get(key);
      if (item && Date.now() <= item.expiry) {
        item.value = (item.value || 0) + 1;
        return item.value;
      }

      this.memoryCache.set(key, {
        value: 1,
        expiry: Date.now() + ttlMs,
      });
      return 1;
    } catch (error: any) {
      Logger.error('CACHE', `Increment error for key ${key}: ${error.message}`);
      return 1;
    }
  }

  /**
   * Get current count for a key (for rate limiting)
   */
  async getCount(key: string): Promise<number> {
    try {
      if (this.isRedisConnected && this.redis) {
        const value = await this.redis.get(key);
        return value ? parseInt(value, 10) : 0;
      }

      // Fallback to memory
      const item = this.memoryCache.get(key);
      if (item && Date.now() <= item.expiry) {
        return item.value || 0;
      }
      return 0;
    } catch (error: any) {
      Logger.error('CACHE', `GetCount error for key ${key}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; mode: string; latency?: number }> {
    const start = Date.now();

    try {
      if (this.isRedisConnected && this.redis) {
        await this.redis.ping();
        return {
          status: 'healthy',
          mode: 'redis',
          latency: Date.now() - start,
        };
      }

      return {
        status: 'degraded',
        mode: 'memory',
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        mode: 'none',
      };
    }
  }

  /**
   * Get Redis connection status
   */
  isConnected(): boolean {
    return this.isRedisConnected;
  }

  /**
   * Get underlying Redis client (for rate-limit-redis)
   */
  getRedisClient(): Redis | null {
    return this.redis;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.memoryCleanupInterval) {
      clearInterval(this.memoryCleanupInterval);
      this.memoryCleanupInterval = null;
    }

    if (this.redis) {
      await this.redis.quit();
      Logger.info('CACHE', 'Redis connection closed gracefully');
    }
  }

  // ===========================
  // QUEUE OPERATIONS (for Scheduler)
  // Uses Redis Sorted Sets for persistent job queue
  // ===========================

  /**
   * Add a job to the queue with a scheduled time (score)
   * @param queueName - Name of the queue
   * @param jobId - Unique job identifier
   * @param scheduledAt - Unix timestamp (ms) when job should run
   * @param data - Job data to store
   */
  async queueAdd(queueName: string, jobId: string, scheduledAt: number, data: any): Promise<boolean> {
    try {
      if (this.isRedisConnected && this.redis) {
        // Store job data
        await this.redis.hset(`${queueName}:data`, jobId, JSON.stringify(data));
        // Add to sorted set with score = scheduled time
        await this.redis.zadd(queueName, scheduledAt, jobId);
        return true;
      }
      Logger.warn('CACHE', 'Queue operations require Redis - job not persisted');
      return false;
    } catch (error: any) {
      Logger.error('CACHE', `Queue add error: ${error.message}`);
      return false;
    }
  }

  /**
   * Get jobs that are ready to be processed (scheduled time <= now)
   * @param queueName - Name of the queue
   * @param limit - Max number of jobs to return
   */
  async queueGetReady(queueName: string, limit: number = 10): Promise<Array<{ jobId: string; data: any }>> {
    try {
      if (this.isRedisConnected && this.redis) {
        const now = Date.now();
        // Get jobs with score <= now (ready to process)
        const jobIds = await this.redis.zrangebyscore(queueName, 0, now, 'LIMIT', 0, limit);

        if (jobIds.length === 0) return [];

        // Get job data for each
        const jobs: Array<{ jobId: string; data: any }> = [];
        for (const jobId of jobIds) {
          const dataStr = await this.redis.hget(`${queueName}:data`, jobId);
          if (dataStr) {
            jobs.push({ jobId, data: JSON.parse(dataStr) });
          }
        }
        return jobs;
      }
      return [];
    } catch (error: any) {
      Logger.error('CACHE', `Queue get ready error: ${error.message}`);
      return [];
    }
  }

  /**
   * Remove a job from the queue (after processing)
   * @param queueName - Name of the queue
   * @param jobId - Job identifier to remove
   */
  async queueRemove(queueName: string, jobId: string): Promise<boolean> {
    try {
      if (this.isRedisConnected && this.redis) {
        await this.redis.zrem(queueName, jobId);
        await this.redis.hdel(`${queueName}:data`, jobId);
        return true;
      }
      return false;
    } catch (error: any) {
      Logger.error('CACHE', `Queue remove error: ${error.message}`);
      return false;
    }
  }

  /**
   * Move a job to a dead letter queue (failed jobs)
   * @param queueName - Original queue name
   * @param jobId - Job identifier
   * @param errorMessage - Reason for failure
   */
  async queueMoveToDeadLetter(queueName: string, jobId: string, errorMessage: string): Promise<boolean> {
    try {
      if (this.isRedisConnected && this.redis) {
        const dataStr = await this.redis.hget(`${queueName}:data`, jobId);
        if (dataStr) {
          const data = JSON.parse(dataStr);
          data.failedAt = Date.now();
          data.error = errorMessage;

          // Add to dead letter queue
          await this.redis.hset(`${queueName}:dead`, jobId, JSON.stringify(data));
        }

        // Remove from main queue
        await this.queueRemove(queueName, jobId);
        return true;
      }
      return false;
    } catch (error: any) {
      Logger.error('CACHE', `Queue dead letter error: ${error.message}`);
      return false;
    }
  }

  /**
   * Get queue statistics
   * @param queueName - Name of the queue
   */
  async queueStats(queueName: string): Promise<{ pending: number; ready: number; dead: number }> {
    try {
      if (this.isRedisConnected && this.redis) {
        const now = Date.now();
        const total = await this.redis.zcard(queueName);
        const ready = await this.redis.zcount(queueName, 0, now);
        const dead = await this.redis.hlen(`${queueName}:dead`);

        return {
          pending: total - ready,
          ready,
          dead,
        };
      }
      return { pending: 0, ready: 0, dead: 0 };
    } catch (error: any) {
      Logger.error('CACHE', `Queue stats error: ${error.message}`);
      return { pending: 0, ready: 0, dead: 0 };
    }
  }

  /**
   * Check if a job exists in the queue
   * @param queueName - Name of the queue
   * @param jobId - Job identifier
   */
  async queueExists(queueName: string, jobId: string): Promise<boolean> {
    try {
      if (this.isRedisConnected && this.redis) {
        const score = await this.redis.zscore(queueName, jobId);
        return score !== null;
      }
      return false;
    } catch (error: any) {
      Logger.error('CACHE', `Queue exists error: ${error.message}`);
      return false;
    }
  }

  /**
   * Reschedule a job (update its scheduled time)
   * @param queueName - Name of the queue
   * @param jobId - Job identifier
   * @param newScheduledAt - New Unix timestamp (ms)
   */
  async queueReschedule(queueName: string, jobId: string, newScheduledAt: number): Promise<boolean> {
    try {
      if (this.isRedisConnected && this.redis) {
        // Update the score (scheduled time)
        await this.redis.zadd(queueName, newScheduledAt, jobId);
        return true;
      }
      return false;
    } catch (error: any) {
      Logger.error('CACHE', `Queue reschedule error: ${error.message}`);
      return false;
    }
  }
}

// Singleton instance
export const CacheService = new CacheServiceClass();
