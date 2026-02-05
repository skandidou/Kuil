/**
 * Scheduler Service (Refactored with Redis Queue)
 *
 * Handles automated publishing of scheduled posts to LinkedIn.
 * Uses Redis Sorted Sets for persistent job queue - survives server restarts.
 *
 * Architecture:
 * - Posts are scheduled in PostgreSQL (source of truth)
 * - Redis queue tracks jobs for processing (performance + persistence)
 * - On startup, syncs Redis queue from PostgreSQL
 * - Failed jobs go to dead letter queue for manual review
 */

import { query } from '../config/database';
import { LinkedInService } from './LinkedInService';
import { Logger } from './LoggerService';
import { CacheService } from './CacheService';
import { MetricsService } from './MetricsService';
import { PushNotificationService } from './PushNotificationService';

const QUEUE_NAME = 'kuil:scheduled_posts';
const LOCK_KEY = 'kuil:scheduler:lock';
const LOCK_TTL_MS = 60000; // 1 minute lock

interface ScheduledPostJob {
  postId: string;
  userId: string;
  content: string;
  linkedinId: string;
  linkedinAccessToken: string;
  retryCount: number;
  scheduledAt: number;
}

export class SchedulerService {
  private static MAX_RETRIES = 3;
  private static isRunning = false;
  private static intervalId: NodeJS.Timeout | null = null;
  private static isStopped = false;
  private static instanceId = Math.random().toString(36).substring(7);

  /**
   * Sync scheduled posts from PostgreSQL to Redis queue
   * Called on startup to ensure Redis queue is up-to-date
   */
  static async syncQueueFromDatabase(): Promise<number> {
    try {
      Logger.info('SCHEDULER', 'Syncing scheduled posts from database to queue...');

      // Get all scheduled posts from database
      const result = await query(
        `SELECT
          gp.id,
          gp.user_id,
          gp.content,
          gp.scheduled_at,
          gp.retry_count,
          u.linkedin_id,
          u.linkedin_access_token
         FROM generated_posts gp
         JOIN users u ON gp.user_id = u.id
         WHERE gp.status = 'scheduled'
           AND (gp.retry_count IS NULL OR gp.retry_count < $1)
         ORDER BY gp.scheduled_at ASC`,
        [this.MAX_RETRIES]
      );

      let syncedCount = 0;

      for (const row of result.rows) {
        const jobId = row.id;
        const scheduledAt = new Date(row.scheduled_at).getTime();

        // Check if already in queue
        const exists = await CacheService.queueExists(QUEUE_NAME, jobId);
        if (!exists) {
          const jobData: ScheduledPostJob = {
            postId: row.id,
            userId: row.user_id,
            content: row.content,
            linkedinId: row.linkedin_id,
            linkedinAccessToken: row.linkedin_access_token,
            retryCount: row.retry_count || 0,
            scheduledAt,
          };

          await CacheService.queueAdd(QUEUE_NAME, jobId, scheduledAt, jobData);
          syncedCount++;
        }
      }

      Logger.info('SCHEDULER', `Synced ${syncedCount} posts to queue`, {
        total: result.rows.length,
        synced: syncedCount,
      });

      return syncedCount;
    } catch (error: any) {
      Logger.error('SCHEDULER', 'Failed to sync queue from database', {}, error);
      return 0;
    }
  }

  /**
   * Add a new post to the scheduler queue
   * Called when a user schedules a post
   */
  static async schedulePost(
    postId: string,
    userId: string,
    content: string,
    linkedinId: string,
    linkedinAccessToken: string,
    scheduledAt: Date
  ): Promise<boolean> {
    try {
      const jobData: ScheduledPostJob = {
        postId,
        userId,
        content,
        linkedinId,
        linkedinAccessToken,
        retryCount: 0,
        scheduledAt: scheduledAt.getTime(),
      };

      const added = await CacheService.queueAdd(
        QUEUE_NAME,
        postId,
        scheduledAt.getTime(),
        jobData
      );

      if (added) {
        Logger.info('SCHEDULER', `Post ${postId.substring(0, 8)} added to queue`, {
          scheduledAt: scheduledAt.toISOString(),
        });
        MetricsService.recordPostScheduled();
      }

      return added;
    } catch (error: any) {
      Logger.error('SCHEDULER', 'Failed to add post to queue', { postId }, error);
      return false;
    }
  }

  /**
   * Remove a post from the queue (when deleted or manually published)
   */
  static async unschedulePost(postId: string): Promise<boolean> {
    try {
      const removed = await CacheService.queueRemove(QUEUE_NAME, postId);
      if (removed) {
        Logger.info('SCHEDULER', `Post ${postId.substring(0, 8)} removed from queue`);
      }
      return removed;
    } catch (error: any) {
      Logger.error('SCHEDULER', 'Failed to remove post from queue', { postId }, error);
      return false;
    }
  }

  /**
   * Reschedule a post to a new time
   */
  static async reschedulePost(postId: string, newScheduledAt: Date): Promise<boolean> {
    try {
      const rescheduled = await CacheService.queueReschedule(
        QUEUE_NAME,
        postId,
        newScheduledAt.getTime()
      );

      if (rescheduled) {
        Logger.info('SCHEDULER', `Post ${postId.substring(0, 8)} rescheduled`, {
          newTime: newScheduledAt.toISOString(),
        });
      }

      return rescheduled;
    } catch (error: any) {
      Logger.error('SCHEDULER', 'Failed to reschedule post', { postId }, error);
      return false;
    }
  }

  /**
   * Process all scheduled posts that are ready to be published
   * Uses distributed lock to prevent multiple instances processing same jobs
   */
  static async processScheduledPosts(): Promise<void> {
    if (this.isStopped) return;
    if (this.isRunning) {
      Logger.debug('SCHEDULER', 'Already running, skipping...');
      return;
    }

    // Try to acquire lock (prevents multiple instances processing same jobs)
    const lockAcquired = await CacheService.set(
      LOCK_KEY,
      { instanceId: this.instanceId, acquiredAt: Date.now() },
      LOCK_TTL_MS
    );

    if (!lockAcquired) {
      Logger.debug('SCHEDULER', 'Could not acquire lock, another instance is processing');
      return;
    }

    this.isRunning = true;

    try {
      Logger.debug('SCHEDULER', 'Processing scheduled posts...');

      // Get ready jobs from Redis queue
      const jobs = await CacheService.queueGetReady(QUEUE_NAME, 10);

      if (jobs.length === 0) {
        Logger.debug('SCHEDULER', 'No posts ready to publish');
        return;
      }

      Logger.info('SCHEDULER', `Found ${jobs.length} posts to publish`);

      let successCount = 0;
      let failureCount = 0;

      for (const { jobId, data } of jobs) {
        const job = data as ScheduledPostJob;

        // Verify post still exists and is scheduled in DB
        const postCheck = await query(
          `SELECT status FROM generated_posts WHERE id = $1`,
          [job.postId]
        );

        if (postCheck.rows.length === 0 || postCheck.rows[0].status !== 'scheduled') {
          // Post was deleted or already published - remove from queue
          await CacheService.queueRemove(QUEUE_NAME, jobId);
          Logger.debug('SCHEDULER', `Post ${jobId.substring(0, 8)} no longer scheduled, removed from queue`);
          continue;
        }

        const success = await this.publishPost(job);
        if (success) {
          successCount++;
          await CacheService.queueRemove(QUEUE_NAME, jobId);
        } else {
          failureCount++;
        }
      }

      Logger.info('SCHEDULER', 'Batch processing completed', {
        total: jobs.length,
        success: successCount,
        failed: failureCount,
      });
    } catch (error: any) {
      Logger.error('SCHEDULER', 'Error processing scheduled posts', {}, error);
    } finally {
      this.isRunning = false;
      // Release lock
      await CacheService.delete(LOCK_KEY);
    }
  }

  /**
   * Publish a single scheduled post
   */
  private static async publishPost(job: ScheduledPostJob): Promise<boolean> {
    const postIdShort = job.postId.substring(0, 8);

    try {
      Logger.info('SCHEDULER', `Publishing post ${postIdShort}...`, {
        userId: job.userId,
        postId: job.postId,
      });

      // Publish to LinkedIn
      const linkedinPostId = await LinkedInService.publishPost(
        job.linkedinId,
        job.linkedinAccessToken,
        job.content
      );

      // Update database - mark as published
      await query(
        `UPDATE generated_posts
         SET status = 'published',
             linkedin_post_id = $1,
             published_at = NOW(),
             failure_reason = NULL,
             retry_count = 0
         WHERE id = $2`,
        [linkedinPostId, job.postId]
      );

      Logger.info('SCHEDULER', `Post ${postIdShort} published successfully`, {
        postId: job.postId,
        linkedinPostId,
      });

      MetricsService.recordPostPublished();

      // Send push notification
      await PushNotificationService.notifyPostPublished(job.userId, job.content);

      return true;
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';

      // Check if this is a "duplicate" error - means the post was actually published!
      // LinkedIn returns: "Content is a duplicate of urn:li:share:XXXXXXX"
      if (errorMessage.toLowerCase().includes('duplicate')) {
        // Extract the LinkedIn post ID from the error message
        const urnMatch = errorMessage.match(/urn:li:share:(\d+)/);
        const linkedinPostId = urnMatch ? urnMatch[0] : null;

        Logger.info('SCHEDULER', `Post ${postIdShort} was already published (duplicate detected)`, {
          postId: job.postId,
          linkedinPostId,
        });

        // Mark as published since it's actually on LinkedIn
        await query(
          `UPDATE generated_posts
           SET status = 'published',
               published_at = NOW(),
               linkedin_post_id = $1,
               failure_reason = NULL
           WHERE id = $2`,
          [linkedinPostId, job.postId]
        );

        // Remove from queue
        await CacheService.queueRemove(QUEUE_NAME, job.postId);

        MetricsService.recordPostPublished();
        await PushNotificationService.notifyPostPublished(job.userId, job.content);

        return true; // Consider this a success
      }

      Logger.error('SCHEDULER', `Failed to publish post ${postIdShort}`, {
        postId: job.postId,
        userId: job.userId,
      }, error);

      const retryCount = job.retryCount + 1;

      // Determine if we should retry
      const shouldRetry = retryCount < this.MAX_RETRIES &&
        !this.isNonRetryableError(errorMessage);

      if (shouldRetry) {
        // Update retry count in DB
        await query(
          `UPDATE generated_posts
           SET retry_count = $1,
               failure_reason = $2
           WHERE id = $3`,
          [retryCount, errorMessage, job.postId]
        );

        // Reschedule for 5 minutes later
        const retryTime = Date.now() + (5 * 60 * 1000);
        job.retryCount = retryCount;
        await CacheService.queueReschedule(QUEUE_NAME, job.postId, retryTime);

        Logger.warn('SCHEDULER', `Post ${postIdShort} will retry in 5 minutes`, {
          postId: job.postId,
          retryCount,
          maxRetries: this.MAX_RETRIES,
        });
      } else {
        // Mark as failed - no more retries
        await query(
          `UPDATE generated_posts
           SET status = 'failed',
               failure_reason = $1,
               retry_count = $2
           WHERE id = $3`,
          [errorMessage, retryCount, job.postId]
        );

        // Move to dead letter queue
        await CacheService.queueMoveToDeadLetter(QUEUE_NAME, job.postId, errorMessage);

        Logger.error('SCHEDULER', `Post ${postIdShort} marked as failed`, {
          postId: job.postId,
          retryCount,
          reason: errorMessage,
        });

        // Send failure notification
        await PushNotificationService.notifyPostFailed(job.userId, errorMessage);
      }

      return false;
    }
  }

  /**
   * Determine if an error is non-retryable
   * Note: "duplicate" errors are handled separately as they mean the post was published
   */
  private static isNonRetryableError(errorMessage: string): boolean {
    const lowerMessage = errorMessage.toLowerCase();

    return (
      lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('forbidden') ||
      lowerMessage.includes('access token') ||
      lowerMessage.includes('invalid token')
    );
  }

  /**
   * Start the scheduler
   */
  static async start(): Promise<void> {
    if (this.intervalId) {
      Logger.warn('SCHEDULER', 'Scheduler already started');
      return;
    }

    this.isStopped = false;
    Logger.info('SCHEDULER', 'Starting scheduled post publisher...', {
      instanceId: this.instanceId,
    });

    // Sync queue from database on startup
    await this.syncQueueFromDatabase();

    // Run immediately on start
    this.processScheduledPosts();

    // Then run every 1 minute (more responsive than 2 minutes)
    this.intervalId = setInterval(() => {
      this.processScheduledPosts();
    }, 60 * 1000); // 1 minute

    Logger.info('SCHEDULER', 'Publisher started (checking every 1 minute)');
  }

  /**
   * Stop the scheduler
   */
  static stop(): void {
    this.isStopped = true;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      Logger.info('SCHEDULER', 'Scheduler stopped');
    }
  }

  /**
   * Check if scheduler is running
   */
  static isActive(): boolean {
    return this.intervalId !== null && !this.isStopped;
  }

  /**
   * Get scheduler status for health checks
   */
  static async getStatus(): Promise<{
    active: boolean;
    processing: boolean;
    queue: { pending: number; ready: number; dead: number };
  }> {
    const queueStats = await CacheService.queueStats(QUEUE_NAME);

    return {
      active: this.isActive(),
      processing: this.isRunning,
      queue: queueStats,
    };
  }
}
