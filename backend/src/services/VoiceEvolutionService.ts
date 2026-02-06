/**
 * VoiceEvolutionService - Periodic voice signature re-analysis
 *
 * Runs as a background service that:
 * 1. Checks users for voice evolution eligibility
 * 2. Triggers re-analysis when conditions are met
 * 3. Tracks voice signature changes over time
 */

import { query } from '../config/database';
import { Logger } from './LoggerService';
import { PersonalizationService } from './PersonalizationService';
import { ClaudeService } from './ClaudeService';

// Configuration
const EVOLUTION_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const BATCH_SIZE = 10; // Process this many users per check
const ACTIVITY_WINDOW_DAYS = 14; // Only analyze users active in last N days
const DAILY_ANALYSIS_BUDGET = 50; // Max AI analyses per day (cost control)

class VoiceEvolutionServiceClass {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private dailyAnalysisCount: number = 0;
  private lastBudgetResetDate: string = new Date().toISOString().split('T')[0];

  /**
   * Start the voice evolution checker
   */
  start(): void {
    if (this.isRunning) {
      Logger.warn('VOICE_EVOLUTION', 'Service already running');
      return;
    }

    Logger.info('VOICE_EVOLUTION', 'Starting voice evolution service', {
      checkIntervalHours: EVOLUTION_CHECK_INTERVAL_MS / (60 * 60 * 1000),
      batchSize: BATCH_SIZE,
    });

    this.isRunning = true;

    // Run initial check after a short delay (let server startup complete)
    setTimeout(() => this.checkAllUsers(), 60 * 1000); // 1 minute delay

    // Schedule periodic checks
    this.intervalId = setInterval(() => this.checkAllUsers(), EVOLUTION_CHECK_INTERVAL_MS);
  }

  /**
   * Stop the voice evolution checker
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    Logger.info('VOICE_EVOLUTION', 'Voice evolution service stopped');
  }

  /**
   * Check if service is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Reset daily budget counter if a new day has started
   */
  private resetDailyBudgetIfNeeded(): void {
    const today = new Date().toISOString().split('T')[0];
    if (today !== this.lastBudgetResetDate) {
      this.dailyAnalysisCount = 0;
      this.lastBudgetResetDate = today;
    }
  }

  /**
   * Check all users for voice evolution eligibility
   */
  async checkAllUsers(): Promise<void> {
    try {
      this.resetDailyBudgetIfNeeded();

      const budgetRemaining = DAILY_ANALYSIS_BUDGET - this.dailyAnalysisCount;
      if (budgetRemaining <= 0) {
        Logger.warn('VOICE_EVOLUTION', 'Daily analysis budget exhausted, skipping check', {
          budget: DAILY_ANALYSIS_BUDGET,
          used: this.dailyAnalysisCount,
        });
        return;
      }

      const effectiveBatchSize = Math.min(BATCH_SIZE, budgetRemaining);

      Logger.info('VOICE_EVOLUTION', 'Starting evolution check for active users', {
        activityWindowDays: ACTIVITY_WINDOW_DAYS,
        budgetRemaining,
        batchSize: effectiveBatchSize,
      });

      // Get users who might need evolution (only recently active users)
      const result = await query(
        `SELECT
           vs.user_id,
           vs.posts_since_last_evolution,
           vs.evolution_threshold,
           vs.last_analyzed_at,
           vs.last_evolution_check,
           u.name
         FROM voice_signatures vs
         JOIN users u ON vs.user_id = u.id
         WHERE vs.evolution_enabled = TRUE
           AND u.last_login_at > NOW() - INTERVAL '${ACTIVITY_WINDOW_DAYS} days'
           AND (
             vs.posts_since_last_evolution >= vs.evolution_threshold
             OR vs.last_evolution_check < NOW() - INTERVAL '30 days'
             OR vs.last_evolution_check IS NULL
           )
         ORDER BY vs.posts_since_last_evolution DESC
         LIMIT $1`,
        [effectiveBatchSize]
      );

      Logger.info('VOICE_EVOLUTION', `Found ${result.rows.length} active users eligible for evolution check`);

      let evolved = 0;
      let skipped = 0;
      let failed = 0;

      for (const user of result.rows) {
        // Check budget before each analysis
        this.resetDailyBudgetIfNeeded();
        if (this.dailyAnalysisCount >= DAILY_ANALYSIS_BUDGET) {
          Logger.warn('VOICE_EVOLUTION', 'Budget exhausted mid-batch, stopping', {
            processed: evolved + skipped + failed,
          });
          break;
        }

        try {
          const didEvolve = await this.evolveUserVoice(user.user_id, user.name);
          if (didEvolve) {
            evolved++;
            this.dailyAnalysisCount++;
          } else {
            skipped++;
          }
        } catch (error: any) {
          failed++;
          Logger.error('VOICE_EVOLUTION', `Failed to evolve user ${user.name}`, { userId: user.user_id }, error);
        }

        // Small delay between users to avoid rate limiting
        await this.sleep(1000);
      }

      Logger.info('VOICE_EVOLUTION', 'Evolution check complete', {
        total: result.rows.length,
        evolved,
        skipped,
        failed,
        dailyBudgetUsed: this.dailyAnalysisCount,
        dailyBudgetRemaining: DAILY_ANALYSIS_BUDGET - this.dailyAnalysisCount,
      });
    } catch (error: any) {
      Logger.error('VOICE_EVOLUTION', 'Failed to check users', {}, error);
    }
  }

  /**
   * Evolve a single user's voice signature
   */
  async evolveUserVoice(userId: string, userName: string): Promise<boolean> {
    try {
      Logger.info('VOICE_EVOLUTION', `Checking evolution for user ${userName}`, { userId });

      // Check if evolution is needed (double-check conditions)
      const status = await PersonalizationService.checkVoiceEvolution(userId);

      if (!status.shouldEvolve) {
        Logger.debug('VOICE_EVOLUTION', 'Evolution not needed', {
          userId,
          postsSince: status.postsSinceLastEvolution,
          threshold: status.evolutionThreshold,
        });

        // Update last check timestamp
        await query(
          `UPDATE voice_signatures SET last_evolution_check = NOW() WHERE user_id = $1`,
          [userId]
        );

        return false;
      }

      // Get fresh posts for analysis
      const postsResult = await query(
        `SELECT content FROM linkedin_posts
         WHERE user_id = $1 AND content IS NOT NULL AND LENGTH(content) > 50
         ORDER BY posted_at DESC
         LIMIT 30`,
        [userId]
      );

      if (postsResult.rows.length < 5) {
        Logger.info('VOICE_EVOLUTION', 'Insufficient posts for evolution', {
          userId,
          postCount: postsResult.rows.length,
        });

        // Update last check timestamp
        await query(
          `UPDATE voice_signatures SET last_evolution_check = NOW() WHERE user_id = $1`,
          [userId]
        );

        return false;
      }

      // Save current signature snapshot before evolution
      await PersonalizationService.saveVoiceSignatureSnapshot(userId, status.reason || 'periodic');

      // Re-analyze voice signature with Claude
      const posts = postsResult.rows.map((r) => r.content);
      const newSignature = await ClaudeService.analyzeVoiceSignature(userId, posts);

      Logger.info('VOICE_EVOLUTION', 'Voice signature evolved', {
        userId,
        userName,
        newTone: newSignature.primaryTone,
        confidence: newSignature.confidence,
        reason: status.reason,
      });

      return true;
    } catch (error: any) {
      Logger.error('VOICE_EVOLUTION', 'Evolution failed for user', { userId, userName }, error);
      throw error;
    }
  }

  /**
   * Manually trigger evolution for a specific user
   */
  async triggerManualEvolution(userId: string): Promise<{
    success: boolean;
    message: string;
    signature?: any;
  }> {
    try {
      // Get user name
      const userResult = await query(`SELECT name FROM users WHERE id = $1`, [userId]);
      const userName = userResult.rows[0]?.name || 'Unknown';

      // Get posts for analysis
      const postsResult = await query(
        `SELECT content FROM linkedin_posts
         WHERE user_id = $1 AND content IS NOT NULL AND LENGTH(content) > 50
         ORDER BY posted_at DESC
         LIMIT 30`,
        [userId]
      );

      if (postsResult.rows.length < 3) {
        return {
          success: false,
          message: `Insufficient posts for analysis. Found ${postsResult.rows.length}, need at least 3.`,
        };
      }

      // Save snapshot before evolution
      await PersonalizationService.saveVoiceSignatureSnapshot(userId, 'manual');

      // Re-analyze
      const posts = postsResult.rows.map((r) => r.content);
      const newSignature = await ClaudeService.analyzeVoiceSignature(userId, posts);

      Logger.info('VOICE_EVOLUTION', 'Manual evolution triggered', {
        userId,
        userName,
        newTone: newSignature.primaryTone,
      });

      return {
        success: true,
        message: 'Voice signature re-analyzed successfully',
        signature: newSignature,
      };
    } catch (error: any) {
      Logger.error('VOICE_EVOLUTION', 'Manual evolution failed', { userId }, error);
      return {
        success: false,
        message: `Evolution failed: ${error.message}`,
      };
    }
  }

  /**
   * Get evolution statistics
   */
  async getStats(): Promise<{
    totalUsersWithSignatures: number;
    usersNeedingEvolution: number;
    recentEvolutions: number;
    avgPostsSinceEvolution: number;
  }> {
    const result = await query(
      `SELECT
         COUNT(*) as total_users,
         COUNT(*) FILTER (WHERE posts_since_last_evolution >= evolution_threshold) as needing_evolution,
         COUNT(*) FILTER (WHERE last_evolution_check > NOW() - INTERVAL '7 days') as recent_evolutions,
         AVG(posts_since_last_evolution) as avg_posts_since
       FROM voice_signatures
       WHERE evolution_enabled = TRUE`
    );

    const row = result.rows[0];
    return {
      totalUsersWithSignatures: parseInt(row.total_users) || 0,
      usersNeedingEvolution: parseInt(row.needing_evolution) || 0,
      recentEvolutions: parseInt(row.recent_evolutions) || 0,
      avgPostsSinceEvolution: parseFloat(row.avg_posts_since) || 0,
    };
  }

  /**
   * Enable/disable evolution for a user
   */
  async setEvolutionEnabled(userId: string, enabled: boolean): Promise<void> {
    await query(
      `UPDATE voice_signatures SET evolution_enabled = $1 WHERE user_id = $2`,
      [enabled, userId]
    );

    Logger.info('VOICE_EVOLUTION', `Evolution ${enabled ? 'enabled' : 'disabled'} for user`, { userId });
  }

  /**
   * Update evolution threshold for a user
   */
  async setEvolutionThreshold(userId: string, threshold: number): Promise<void> {
    // Clamp to reasonable range
    const clampedThreshold = Math.max(5, Math.min(50, threshold));

    await query(
      `UPDATE voice_signatures SET evolution_threshold = $1 WHERE user_id = $2`,
      [clampedThreshold, userId]
    );

    Logger.info('VOICE_EVOLUTION', 'Evolution threshold updated', { userId, threshold: clampedThreshold });
  }

  /**
   * Helper to sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton export
export const VoiceEvolutionService = new VoiceEvolutionServiceClass();
