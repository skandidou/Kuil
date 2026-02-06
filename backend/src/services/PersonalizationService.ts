/**
 * PersonalizationService - Enhanced context building for AI generation
 *
 * Responsibilities:
 * 1. Build comprehensive user context for AI prompts
 * 2. Track post selections and edit patterns
 * 3. Calibrate hook scores based on actual engagement
 * 4. Identify and track success patterns
 * 5. Manage voice signature evolution
 */

import { query } from '../config/database';
import { Logger } from './LoggerService';
import { CacheService } from './CacheService';
import {
  EnhancedUserContext,
  PostSelection,
  CreatePostSelectionDTO,
  EngagementFeedback,
  HookCalibration,
  SuccessPattern,
  VoiceSignatureSnapshot,
  VoiceSignatureContext,
  CalibrationContext,
  StylePreferences,
  PatternContext,
  PerformingPostExample,
  PerformanceSummary,
  CalibrationDataPoint,
  LinearRegressionResult,
  PatternType,
  CalibrationHistoryEntry,
  VoiceEvolutionStatus,
} from '../models/PersonalizationModels';

// Cache configuration
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CONTEXT_CACHE_PREFIX = 'user_context:';
const VOICE_CACHE_PREFIX = 'voice:';

class PersonalizationServiceClass {
  // ============================================
  // ENHANCED CONTEXT BUILDING
  // ============================================

  /**
   * Build comprehensive user context for AI generation
   * This is the main method called by ClaudeService before generation
   */
  async buildEnhancedContext(userId: string): Promise<EnhancedUserContext> {
    const cacheKey = `${CONTEXT_CACHE_PREFIX}${userId}`;

    // Check cache first
    const cached = await CacheService.get<EnhancedUserContext>(cacheKey);
    if (cached) {
      Logger.debug('PERSONALIZATION', 'Using cached context', { userId });
      return cached;
    }

    Logger.info('PERSONALIZATION', 'Building enhanced context', { userId });

    // Parallel fetch all required data
    const [
      userProfile,
      voiceSignature,
      hookCalibration,
      successPatterns,
      topPosts,
      performanceStats,
    ] = await Promise.all([
      this.getUserProfile(userId),
      this.getVoiceSignatureCached(userId),
      this.getHookCalibration(userId),
      this.getTopSuccessPatterns(userId, 5),
      this.getTopPerformingPosts(userId, 3),
      this.getPerformanceSummary(userId),
    ]);

    // Default voice signature if none exists
    const defaultVoice: VoiceSignatureContext = {
      formal: 5,
      bold: 5,
      empathetic: 5,
      complexity: 5,
      brevity: 5,
      primaryTone: 'Professional',
      confidence: 0.5,
    };

    // Default calibration
    const defaultCalibration: CalibrationContext = {
      factor: 1.0,
      bias: 0,
      confidence: 0,
    };

    // Calculate overall confidence
    const voiceConfidence = voiceSignature?.confidence || 0.5;
    const calibrationConfidence = hookCalibration?.confidence || 0;
    const patternConfidence = successPatterns.length > 0 ? Math.min(successPatterns.length / 5, 1) : 0;
    const overallConfidence = (voiceConfidence + calibrationConfidence + patternConfidence) / 3;

    const context: EnhancedUserContext = {
      userId,
      name: userProfile.name || 'Professional',
      headline: userProfile.headline || '',
      role: userProfile.role || 'Professional',
      persona: userProfile.persona || 'Practitioner',
      topicPreferences: userProfile.topic_preferences || [],

      voiceSignature: voiceSignature || defaultVoice,

      hookCalibration: hookCalibration || defaultCalibration,

      stylePreferences: {
        preferredLength: (userProfile.preferred_post_length as StylePreferences['preferredLength']) || 'medium',
        emojiUsage: (userProfile.emoji_preference as StylePreferences['emojiUsage']) || 'moderate',
        personalizationLevel: (userProfile.personalization_level as StylePreferences['personalizationLevel']) || 'balanced',
      },

      topSuccessPatterns: successPatterns.map((p) => ({
        type: p.pattern_type as PatternType,
        value: p.pattern_value,
        successRate: parseFloat(p.success_rate) || 0,
      })),

      topPerformingPosts: topPosts,
      performanceSummary: performanceStats,
      overallConfidence,
    };

    // Cache the context
    await CacheService.set(cacheKey, context, CACHE_TTL_MS);

    return context;
  }

  /**
   * Get voice signature with caching
   */
  async getVoiceSignatureCached(userId: string): Promise<VoiceSignatureContext | null> {
    const cacheKey = `${VOICE_CACHE_PREFIX}${userId}`;

    // Check cache first
    const cached = await CacheService.get<VoiceSignatureContext>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const result = await query(
      `SELECT formal, bold, empathetic, complexity, brevity, primary_tone, confidence
       FROM voice_signatures WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const signature: VoiceSignatureContext = {
      formal: parseFloat(row.formal),
      bold: parseFloat(row.bold),
      empathetic: parseFloat(row.empathetic),
      complexity: parseFloat(row.complexity),
      brevity: parseFloat(row.brevity),
      primaryTone: row.primary_tone,
      confidence: parseFloat(row.confidence),
    };

    // Cache it
    await CacheService.set(cacheKey, signature, CACHE_TTL_MS);

    return signature;
  }

  /**
   * Invalidate user's cached context
   */
  async invalidateContext(userId: string): Promise<void> {
    await CacheService.delete(`${CONTEXT_CACHE_PREFIX}${userId}`);
    await CacheService.delete(`${VOICE_CACHE_PREFIX}${userId}`);
  }

  // ============================================
  // POST SELECTION TRACKING
  // ============================================

  /**
   * Track user's variant selection and edit patterns
   */
  async trackSelection(selection: CreatePostSelectionDTO): Promise<void> {
    const editDistance = selection.finalContent
      ? this.calculateEditDistance(selection.originalContent, selection.finalContent)
      : 0;

    const editPercentage = selection.finalContent
      ? (editDistance / Math.max(selection.originalContent.length, 1)) * 100
      : 0;

    await query(
      `INSERT INTO post_selections
       (user_id, generated_post_id, session_id, selected_variant_number, total_variants,
        original_hook_score, original_content, final_content, edit_distance,
        edit_percentage, was_edited, time_to_select_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        selection.userId,
        selection.generatedPostId || null,
        selection.sessionId,
        selection.selectedVariantNumber,
        selection.totalVariants || 3,
        selection.originalHookScore,
        selection.originalContent,
        selection.finalContent || null,
        editDistance,
        editPercentage,
        editDistance > 0,
        selection.timeToSelectMs || null,
      ]
    );

    Logger.info('PERSONALIZATION', 'Selection tracked', {
      userId: selection.userId,
      variant: selection.selectedVariantNumber,
      wasEdited: editDistance > 0,
      editPercentage: editPercentage.toFixed(1),
    });

    // Invalidate context cache
    await this.invalidateContext(selection.userId);
  }

  /**
   * Get user's selection patterns
   */
  async getSelectionPatterns(userId: string): Promise<{
    avgEditPercentage: number;
    preferredVariant: number;
    totalSelections: number;
  }> {
    const result = await query(
      `SELECT
         AVG(edit_percentage) as avg_edit_percentage,
         MODE() WITHIN GROUP (ORDER BY selected_variant_number) as preferred_variant,
         COUNT(*) as total_selections
       FROM post_selections
       WHERE user_id = $1`,
      [userId]
    );

    const row = result.rows[0];
    return {
      avgEditPercentage: parseFloat(row.avg_edit_percentage) || 0,
      preferredVariant: parseInt(row.preferred_variant) || 1,
      totalSelections: parseInt(row.total_selections) || 0,
    };
  }

  // ============================================
  // ENGAGEMENT FEEDBACK & CALIBRATION
  // ============================================

  /**
   * Record engagement feedback from published post
   */
  async recordEngagementFeedback(
    userId: string,
    generatedPostId: string,
    linkedinPostId: string,
    metrics: { likes: number; comments: number; shares: number; impressions: number },
    predictedHookScore: number,
    hoursSincePublish: number
  ): Promise<void> {
    // Calculate actual engagement score (weighted formula)
    const engagementScore = this.calculateEngagementScore(metrics);
    const engagementRate =
      metrics.impressions > 0
        ? (metrics.likes + metrics.comments * 2 + metrics.shares * 3) / metrics.impressions
        : 0;

    await query(
      `INSERT INTO engagement_feedback
       (user_id, generated_post_id, linkedin_post_id, likes, comments, shares, impressions,
        engagement_rate, predicted_hook_score, actual_engagement_score, score_delta, hours_since_publish)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (generated_post_id, hours_since_publish) DO UPDATE SET
         likes = EXCLUDED.likes,
         comments = EXCLUDED.comments,
         shares = EXCLUDED.shares,
         impressions = EXCLUDED.impressions,
         engagement_rate = EXCLUDED.engagement_rate,
         actual_engagement_score = EXCLUDED.actual_engagement_score,
         score_delta = EXCLUDED.score_delta,
         captured_at = NOW()`,
      [
        userId,
        generatedPostId,
        linkedinPostId,
        metrics.likes,
        metrics.comments,
        metrics.shares,
        metrics.impressions,
        engagementRate,
        predictedHookScore,
        engagementScore,
        engagementScore - predictedHookScore,
        hoursSincePublish,
      ]
    );

    Logger.info('PERSONALIZATION', 'Engagement feedback recorded', {
      userId,
      predictedScore: predictedHookScore,
      actualScore: engagementScore,
      delta: engagementScore - predictedHookScore,
    });

    // Check if we should recalibrate
    await this.maybeRecalibrateHookScore(userId);

    // Increment posts since last evolution
    await this.incrementPostsSinceEvolution(userId);
  }

  /**
   * Recalibrate hook score predictions based on accumulated feedback
   */
  async recalibrateHookScore(userId: string): Promise<HookCalibration | null> {
    // Get all engagement feedback for this user
    const feedbackResult = await query(
      `SELECT predicted_hook_score, actual_engagement_score
       FROM engagement_feedback
       WHERE user_id = $1 AND hours_since_publish >= 24
       ORDER BY captured_at DESC
       LIMIT 50`,
      [userId]
    );

    if (feedbackResult.rows.length < 5) {
      Logger.info('PERSONALIZATION', 'Insufficient data for calibration', {
        userId,
        sampleSize: feedbackResult.rows.length,
      });
      return null;
    }

    const data: CalibrationDataPoint[] = feedbackResult.rows.map((r) => ({
      predicted: r.predicted_hook_score,
      actual: r.actual_engagement_score,
    }));

    // Simple linear regression: actual = factor * predicted + bias
    const { factor, bias, rSquared } = this.linearRegression(data);

    // Get current calibration for history
    const currentCalibration = await this.getHookCalibrationRaw(userId);
    const history: CalibrationHistoryEntry[] = currentCalibration?.calibration_history || [];

    // Add new entry to history
    history.push({
      calibratedAt: new Date().toISOString(),
      factor,
      bias,
      sampleSize: data.length,
      rSquared,
    });

    // Keep only last 10 calibrations
    const trimmedHistory = history.slice(-10);

    // Upsert calibration
    await query(
      `INSERT INTO hook_calibrations
       (user_id, calibration_factor, calibration_bias, sample_size, r_squared,
        last_calibrated_at, calibration_history)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6)
       ON CONFLICT (user_id) DO UPDATE SET
         calibration_factor = EXCLUDED.calibration_factor,
         calibration_bias = EXCLUDED.calibration_bias,
         sample_size = EXCLUDED.sample_size,
         r_squared = EXCLUDED.r_squared,
         last_calibrated_at = NOW(),
         calibration_history = EXCLUDED.calibration_history,
         updated_at = NOW()`,
      [userId, factor, bias, data.length, rSquared, JSON.stringify(trimmedHistory)]
    );

    Logger.info('PERSONALIZATION', 'Hook score calibrated', {
      userId,
      factor,
      bias,
      rSquared,
      sampleSize: data.length,
    });

    // Invalidate context cache
    await this.invalidateContext(userId);

    return {
      id: '',
      userId,
      calibrationFactor: factor,
      calibrationBias: bias,
      sampleSize: data.length,
      rSquared,
      lastCalibratedAt: new Date(),
      calibrationMethod: 'linear_regression',
      calibrationHistory: trimmedHistory,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Apply calibration to a raw hook score
   */
  applyCalibratedScore(rawScore: number, calibration: CalibrationContext): number {
    if (calibration.confidence < 0.3) {
      // Not enough confidence - return raw score
      return rawScore;
    }

    // Apply calibration: calibrated = raw * factor + bias
    const calibrated = Math.round(rawScore * calibration.factor + calibration.bias);

    // Clamp to valid range
    return Math.max(0, Math.min(100, calibrated));
  }

  // ============================================
  // VOICE SIGNATURE EVOLUTION
  // ============================================

  /**
   * Check if voice signature needs evolution
   */
  async checkVoiceEvolution(userId: string): Promise<VoiceEvolutionStatus> {
    const result = await query(
      `SELECT
         vs.evolution_enabled,
         vs.posts_since_last_evolution,
         vs.evolution_threshold,
         vs.last_evolution_check,
         vs.last_analyzed_at,
         (SELECT COUNT(*) FROM linkedin_posts WHERE user_id = $1
          AND fetched_at > COALESCE(vs.last_analyzed_at, '1970-01-01')) as new_posts_count
       FROM voice_signatures vs
       WHERE vs.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return {
        evolutionEnabled: false,
        lastEvolutionCheck: null,
        postsSinceLastEvolution: 0,
        evolutionThreshold: 10,
        shouldEvolve: false,
      };
    }

    const sig = result.rows[0];
    const daysSinceLastCheck = sig.last_evolution_check
      ? (Date.now() - new Date(sig.last_evolution_check).getTime()) / (24 * 60 * 60 * 1000)
      : 999;

    // Check evolution conditions
    let shouldEvolve = false;
    let reason: string | undefined;

    if (!sig.evolution_enabled) {
      shouldEvolve = false;
    } else if (sig.posts_since_last_evolution >= sig.evolution_threshold) {
      shouldEvolve = true;
      reason = 'threshold_reached';
    } else if (parseInt(sig.new_posts_count) >= 5) {
      shouldEvolve = true;
      reason = 'new_posts_available';
    } else if (daysSinceLastCheck > 30) {
      shouldEvolve = true;
      reason = 'periodic_refresh';
    }

    return {
      evolutionEnabled: sig.evolution_enabled,
      lastEvolutionCheck: sig.last_evolution_check ? new Date(sig.last_evolution_check) : null,
      postsSinceLastEvolution: sig.posts_since_last_evolution,
      evolutionThreshold: sig.evolution_threshold,
      shouldEvolve,
      reason,
    };
  }

  /**
   * Save voice signature snapshot to history before evolution
   */
  async saveVoiceSignatureSnapshot(
    userId: string,
    triggerReason: string
  ): Promise<void> {
    // Get current signature
    const currentResult = await query(
      `SELECT formal, bold, empathetic, complexity, brevity, primary_tone, confidence,
              sample_posts_analyzed, analysis_source
       FROM voice_signatures WHERE user_id = $1`,
      [userId]
    );

    if (currentResult.rows.length === 0) return;

    const current = currentResult.rows[0];

    // Get previous snapshot for delta calculation
    const previousResult = await query(
      `SELECT formal, bold, empathetic, complexity, brevity
       FROM voice_signature_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    const prev = previousResult.rows[0];
    const deltaFormal = prev ? parseFloat(current.formal) - parseFloat(prev.formal) : null;
    const deltaBold = prev ? parseFloat(current.bold) - parseFloat(prev.bold) : null;
    const deltaEmpathetic = prev ? parseFloat(current.empathetic) - parseFloat(prev.empathetic) : null;
    const deltaComplexity = prev ? parseFloat(current.complexity) - parseFloat(prev.complexity) : null;
    const deltaBrevity = prev ? parseFloat(current.brevity) - parseFloat(prev.brevity) : null;

    // Save snapshot to history
    await query(
      `INSERT INTO voice_signature_history
       (user_id, formal, bold, empathetic, complexity, brevity, primary_tone, confidence,
        trigger_reason, sample_posts_analyzed, analysis_source,
        delta_formal, delta_bold, delta_empathetic, delta_complexity, delta_brevity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        userId,
        current.formal,
        current.bold,
        current.empathetic,
        current.complexity,
        current.brevity,
        current.primary_tone,
        current.confidence,
        triggerReason,
        current.sample_posts_analyzed,
        current.analysis_source,
        deltaFormal,
        deltaBold,
        deltaEmpathetic,
        deltaComplexity,
        deltaBrevity,
      ]
    );

    // Reset evolution counter
    await query(
      `UPDATE voice_signatures
       SET posts_since_last_evolution = 0,
           last_evolution_check = NOW()
       WHERE user_id = $1`,
      [userId]
    );

    Logger.info('PERSONALIZATION', 'Voice signature snapshot saved', {
      userId,
      reason: triggerReason,
    });

    // Invalidate cache
    await this.invalidateContext(userId);
  }

  /**
   * Get voice signature evolution history
   */
  async getEvolutionHistory(userId: string, limit: number = 10): Promise<VoiceSignatureSnapshot[]> {
    const result = await query(
      `SELECT id, user_id, formal, bold, empathetic, complexity, brevity,
              primary_tone, confidence, trigger_reason, sample_posts_analyzed,
              analysis_source, delta_formal, delta_bold, delta_empathetic,
              delta_complexity, delta_brevity, created_at
       FROM voice_signature_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      formal: parseFloat(row.formal),
      bold: parseFloat(row.bold),
      empathetic: parseFloat(row.empathetic),
      complexity: parseFloat(row.complexity),
      brevity: parseFloat(row.brevity),
      primaryTone: row.primary_tone,
      confidence: parseFloat(row.confidence),
      triggerReason: row.trigger_reason,
      samplePostsAnalyzed: row.sample_posts_analyzed,
      analysisSource: row.analysis_source,
      deltaFormal: row.delta_formal ? parseFloat(row.delta_formal) : null,
      deltaBold: row.delta_bold ? parseFloat(row.delta_bold) : null,
      deltaEmpathetic: row.delta_empathetic ? parseFloat(row.delta_empathetic) : null,
      deltaComplexity: row.delta_complexity ? parseFloat(row.delta_complexity) : null,
      deltaBrevity: row.delta_brevity ? parseFloat(row.delta_brevity) : null,
      createdAt: new Date(row.created_at),
    }));
  }

  // ============================================
  // SUCCESS PATTERNS
  // ============================================

  /**
   * Analyze and update success patterns from high-performing posts
   */
  async analyzeSuccessPatterns(userId: string): Promise<SuccessPattern[]> {
    // Get top posts with engagement data (limited to avoid unbounded result sets)
    const postsResult = await query(
      `SELECT
         lp.content,
         lp.likes,
         lp.comments,
         lp.shares,
         lp.impressions,
         gp.hook_score,
         (lp.likes + lp.comments * 2 + lp.shares * 3) as engagement_score
       FROM linkedin_posts lp
       LEFT JOIN generated_posts gp ON gp.linkedin_post_id = lp.linkedin_post_id
       WHERE lp.user_id = $1 AND lp.content IS NOT NULL AND LENGTH(lp.content) > 50
       ORDER BY engagement_score DESC
       LIMIT 100`,
      [userId]
    );

    if (postsResult.rows.length < 5) {
      Logger.info('PERSONALIZATION', 'Insufficient posts for pattern analysis', {
        userId,
        postCount: postsResult.rows.length,
      });
      return [];
    }

    const allPosts = postsResult.rows;
    const avgEngagement =
      allPosts.reduce((sum, p) => sum + parseFloat(p.engagement_score), 0) / allPosts.length;

    // Get top 25% performers
    const topPercentile = Math.ceil(allPosts.length * 0.25);
    const highPerformers = allPosts.slice(0, topPercentile);

    const patterns: Map<string, SuccessPattern> = new Map();

    // Analyze patterns in high performers
    for (const post of highPerformers) {
      const engagement = parseFloat(post.engagement_score);
      const hookScore = post.hook_score ? parseInt(post.hook_score) : null;

      // Hook style patterns
      const hookStyle = this.detectHookStyle(post.content);
      this.updatePatternMap(patterns, userId, 'hook_style', hookStyle, engagement, hookScore);

      // Length patterns
      const lengthCategory = this.categorizeLength(post.content.length);
      this.updatePatternMap(patterns, userId, 'length', lengthCategory, engagement, hookScore);

      // Structure patterns
      const structure = this.detectStructure(post.content);
      this.updatePatternMap(patterns, userId, 'structure', structure, engagement, hookScore);

      // Emoji usage patterns
      const emojiLevel = this.categorizeEmojiUsage(post.content);
      this.updatePatternMap(patterns, userId, 'emoji_usage', emojiLevel, engagement, hookScore);
    }

    // Calculate success rates (% of occurrences that are above average)
    for (const pattern of patterns.values()) {
      // Count occurrences in all posts vs high performers
      let totalOccurrences = 0;
      let highPerformerOccurrences = pattern.occurrenceCount;

      for (const post of allPosts) {
        const detected = this.detectPatternInPost(post.content, pattern.patternType, pattern.patternValue);
        if (detected) totalOccurrences++;
      }

      pattern.successRate = totalOccurrences > 0 ? highPerformerOccurrences / totalOccurrences : 0;
    }

    // Save patterns to database (batch upsert)
    const patternsToSave = Array.from(patterns.values()).filter(p => p.occurrenceCount >= 2);
    const savedPatterns: SuccessPattern[] = [];

    if (patternsToSave.length > 0) {
      const values: any[] = [];
      const placeholders: string[] = [];

      patternsToSave.forEach((pattern, index) => {
        const offset = index * 7;
        placeholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, NOW())`
        );
        values.push(
          userId,
          pattern.patternType,
          pattern.patternValue,
          pattern.occurrenceCount,
          pattern.avgEngagementScore,
          pattern.avgHookScore,
          pattern.successRate
        );
      });

      await query(
        `INSERT INTO success_patterns
         (user_id, pattern_type, pattern_value, occurrence_count, avg_engagement_score,
          avg_hook_score, success_rate, last_updated_at)
         VALUES ${placeholders.join(', ')}
         ON CONFLICT (user_id, pattern_type, pattern_value) DO UPDATE SET
           occurrence_count = EXCLUDED.occurrence_count,
           avg_engagement_score = EXCLUDED.avg_engagement_score,
           avg_hook_score = EXCLUDED.avg_hook_score,
           success_rate = EXCLUDED.success_rate,
           last_updated_at = NOW()`,
        values
      );

      savedPatterns.push(...patternsToSave);
    }

    Logger.info('PERSONALIZATION', 'Success patterns analyzed', {
      userId,
      patternsFound: savedPatterns.length,
    });

    // Invalidate cache
    await this.invalidateContext(userId);

    return savedPatterns;
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private async getUserProfile(userId: string): Promise<any> {
    const result = await query(
      `SELECT name, headline, role, persona, topic_preferences,
              personalization_level, preferred_post_length, emoji_preference
       FROM users WHERE id = $1`,
      [userId]
    );
    return result.rows[0] || {};
  }

  private async getHookCalibration(userId: string): Promise<CalibrationContext | null> {
    const result = await query(
      `SELECT calibration_factor, calibration_bias, sample_size
       FROM hook_calibrations WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      factor: parseFloat(row.calibration_factor),
      bias: parseInt(row.calibration_bias),
      confidence: Math.min(row.sample_size / 20, 1), // Max confidence at 20 samples
    };
  }

  private async getHookCalibrationRaw(userId: string): Promise<any | null> {
    const result = await query(
      `SELECT * FROM hook_calibrations WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  private async getTopSuccessPatterns(userId: string, limit: number): Promise<any[]> {
    const result = await query(
      `SELECT pattern_type, pattern_value, success_rate, avg_engagement_score
       FROM success_patterns
       WHERE user_id = $1 AND occurrence_count >= 2
       ORDER BY success_rate DESC, avg_engagement_score DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  private async getTopPerformingPosts(userId: string, limit: number): Promise<PerformingPostExample[]> {
    const result = await query(
      `SELECT gp.content, gp.hook_score,
              (lp.likes + lp.comments * 2 + lp.shares * 3) as engagement_score
       FROM generated_posts gp
       JOIN linkedin_posts lp ON gp.linkedin_post_id = lp.linkedin_post_id
       WHERE gp.user_id = $1 AND gp.status = 'published'
       ORDER BY engagement_score DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map((r) => ({
      content: r.content,
      hookScore: r.hook_score || 0,
      engagementScore: parseFloat(r.engagement_score) || 0,
    }));
  }

  private async getPerformanceSummary(userId: string): Promise<PerformanceSummary> {
    const result = await query(
      `SELECT
         COUNT(*) as total_posts,
         AVG(CASE WHEN lp.impressions > 0
             THEN (lp.likes + lp.comments * 2 + lp.shares * 3)::float / lp.impressions
             ELSE 0 END) as avg_engagement_rate,
         AVG(gp.hook_score) as avg_hook_score
       FROM generated_posts gp
       LEFT JOIN linkedin_posts lp ON gp.linkedin_post_id = lp.linkedin_post_id
       WHERE gp.user_id = $1 AND gp.status = 'published'`,
      [userId]
    );

    // Get top performing topics
    const topicsResult = await query(
      `SELECT sp.pattern_value, sp.success_rate
       FROM success_patterns sp
       WHERE sp.user_id = $1 AND sp.pattern_type = 'topic'
       ORDER BY sp.success_rate DESC
       LIMIT 5`,
      [userId]
    );

    return {
      avgEngagementRate: parseFloat(result.rows[0]?.avg_engagement_rate) || 0,
      avgHookScore: parseFloat(result.rows[0]?.avg_hook_score) || 0,
      totalPublishedPosts: parseInt(result.rows[0]?.total_posts) || 0,
      topPerformingTopics: topicsResult.rows.map((r) => r.pattern_value),
    };
  }

  private async maybeRecalibrateHookScore(userId: string): Promise<void> {
    const result = await query(
      `SELECT COUNT(*) as count FROM engagement_feedback
       WHERE user_id = $1 AND captured_at > (
         SELECT COALESCE(last_calibrated_at, '1970-01-01')
         FROM hook_calibrations WHERE user_id = $1
       )`,
      [userId]
    );

    const newFeedbackCount = parseInt(result.rows[0]?.count) || 0;

    // Recalibrate every 5 new feedback entries
    if (newFeedbackCount >= 5) {
      await this.recalibrateHookScore(userId);
    }
  }

  private async incrementPostsSinceEvolution(userId: string): Promise<void> {
    await query(
      `UPDATE voice_signatures
       SET posts_since_last_evolution = posts_since_last_evolution + 1
       WHERE user_id = $1`,
      [userId]
    );
  }

  /**
   * Calculate Levenshtein edit distance between two strings
   */
  private calculateEditDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;

    if (m === 0) return n;
    if (n === 0) return m;

    // Use only two rows for memory efficiency
    let prevRow = new Array(n + 1);
    let currRow = new Array(n + 1);

    for (let j = 0; j <= n; j++) prevRow[j] = j;

    for (let i = 1; i <= m; i++) {
      currRow[0] = i;
      for (let j = 1; j <= n; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        currRow[j] = Math.min(prevRow[j] + 1, currRow[j - 1] + 1, prevRow[j - 1] + cost);
      }
      [prevRow, currRow] = [currRow, prevRow];
    }

    return prevRow[n];
  }

  /**
   * Calculate engagement score from metrics (normalized to 0-100 scale)
   */
  private calculateEngagementScore(metrics: {
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
  }): number {
    // Weighted engagement score
    const rawScore = metrics.likes + metrics.comments * 2 + metrics.shares * 3;

    // Normalize based on impressions (if available) or absolute scale
    if (metrics.impressions > 0) {
      const rate = rawScore / metrics.impressions;
      return Math.min(Math.round(rate * 1000), 100); // 10% engagement = 100 score
    }

    // Absolute scale normalization
    return Math.min(Math.round(rawScore / 5), 100); // 500 engagement = 100 score
  }

  /**
   * Linear regression for calibration
   */
  private linearRegression(data: CalibrationDataPoint[]): LinearRegressionResult {
    const n = data.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;

    for (const { predicted: x, actual: y } of data) {
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }

    const denominator = n * sumX2 - sumX * sumX;
    const factor = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 1;
    const bias = (sumY - factor * sumX) / n;

    // Calculate R-squared
    const meanY = sumY / n;
    let ssTotal = 0,
      ssResidual = 0;

    for (const { predicted: x, actual: y } of data) {
      ssTotal += (y - meanY) ** 2;
      ssResidual += (y - (factor * x + bias)) ** 2;
    }

    const rSquared = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;

    return {
      factor: Math.max(0.5, Math.min(1.5, factor)), // Clamp to reasonable range
      bias: Math.max(-20, Math.min(20, Math.round(bias))),
      rSquared: Math.max(0, rSquared),
    };
  }

  // ============================================
  // PATTERN DETECTION HELPERS
  // ============================================

  private detectHookStyle(content: string): string {
    const firstLine = content.split('\n')[0].trim();

    if (firstLine.endsWith('?')) return 'question';
    if (/^\d+/.test(firstLine)) return 'number';
    if (/^I |^My |^We /.test(firstLine)) return 'personal';
    if (firstLine.length < 50) return 'short_punchy';
    if (/!$/.test(firstLine)) return 'exclamation';

    return 'statement';
  }

  private categorizeLength(length: number): string {
    if (length < 500) return 'short';
    if (length < 1200) return 'medium';
    return 'long';
  }

  private detectStructure(content: string): string {
    if (content.match(/^\d+\./m)) return 'numbered_list';
    if (content.match(/^[•\-\*]/m)) return 'bullet_list';
    if (content.split('\n\n').length > 3) return 'multi_paragraph';
    if (content.includes('TL;DR') || content.includes('Key takeaway')) return 'summary_included';

    return 'flowing_prose';
  }

  private categorizeEmojiUsage(content: string): string {
    const emojiCount = (
      content.match(
        /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu
      ) || []
    ).length;

    if (emojiCount === 0) return 'none';
    if (emojiCount <= 2) return 'minimal';
    if (emojiCount <= 5) return 'moderate';
    return 'heavy';
  }

  private detectPatternInPost(content: string, type: string, value: string): boolean {
    switch (type) {
      case 'hook_style':
        return this.detectHookStyle(content) === value;
      case 'length':
        return this.categorizeLength(content.length) === value;
      case 'structure':
        return this.detectStructure(content) === value;
      case 'emoji_usage':
        return this.categorizeEmojiUsage(content) === value;
      default:
        return false;
    }
  }

  private updatePatternMap(
    patterns: Map<string, SuccessPattern>,
    userId: string,
    type: PatternType,
    value: string,
    engagement: number,
    hookScore: number | null
  ): void {
    const key = `${type}:${value}`;
    const existing = patterns.get(key);

    if (existing) {
      existing.occurrenceCount++;
      existing.avgEngagementScore =
        (existing.avgEngagementScore * (existing.occurrenceCount - 1) + engagement) /
        existing.occurrenceCount;
      if (hookScore !== null) {
        existing.avgHookScore =
          (existing.avgHookScore * (existing.occurrenceCount - 1) + hookScore) /
          existing.occurrenceCount;
      }
    } else {
      patterns.set(key, {
        id: '',
        userId,
        patternType: type,
        patternValue: value,
        occurrenceCount: 1,
        avgEngagementScore: engagement,
        avgHookScore: hookScore || 0,
        successRate: 0, // Will be calculated later
        statisticalSignificance: null,
        examplePostIds: [],
        lastUpdatedAt: null,
        createdAt: new Date(),
      });
    }
  }
}

// Singleton export
export const PersonalizationService = new PersonalizationServiceClass();
