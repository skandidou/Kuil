import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { query } from '../config/database';
import { ClaudeService } from '../services/ClaudeService';
import { VoiceSignatureResponse } from '../models/VoiceSignature';
import { PersonalizationService } from '../services/PersonalizationService';
import { VoiceEvolutionService } from '../services/VoiceEvolutionService';

const router = Router();

/**
 * Infer voice signature from calibration data when user has no LinkedIn posts
 * Uses persona, role, and swipe preferences to create a personalized baseline
 */
function inferVoiceFromCalibration(
  persona: string,
  role: string,
  preferences: boolean[]
): VoiceSignatureResponse {
  // Base values by persona (0-10 scale)
  const personaDefaults: Record<string, { formal: number; bold: number; empathetic: number; complexity: number; brevity: number; tone: string }> = {
    'Visionary': { formal: 6, bold: 8, empathetic: 6, complexity: 7, brevity: 5, tone: 'Visionary Leader' },
    'Practitioner': { formal: 7, bold: 6, empathetic: 5, complexity: 6, brevity: 6, tone: 'Analytical Expert' },
    'Storyteller': { formal: 4, bold: 5, empathetic: 8, complexity: 4, brevity: 4, tone: 'Engaging Storyteller' }
  };

  // Role-based adjustments
  const roleAdjustments: Record<string, { bold?: number; formal?: number; empathetic?: number; brevity?: number }> = {
    'Founder': { bold: 1, formal: -1 },
    'Job Seeker': { empathetic: 1, formal: 1 },
    'Creator': { bold: 1, brevity: -1 },
    'Freelancer': { empathetic: 1 },
    'Executive': { formal: 2, bold: 1 }
  };

  // Style impacts from calibration swipes (in order of swipe cards)
  // Each index represents a style: ANALYTICAL, INSPIRATIONAL, CONVERSATIONAL, etc.
  const styleImpacts = [
    { liked: { formal: 1 }, disliked: { formal: -1 } },           // ANALYTICAL
    { liked: { empathetic: 1 }, disliked: { empathetic: -1 } },   // INSPIRATIONAL
    { liked: { formal: -1 }, disliked: { formal: 1 } },           // CONVERSATIONAL
    { liked: { bold: 1 }, disliked: { bold: -1 } },               // AUTHORITATIVE
    { liked: { empathetic: 1 }, disliked: { empathetic: -1 } },   // EMPATHETIC
    { liked: { complexity: 1 }, disliked: { complexity: -1 } },   // DATA-DRIVEN
    { liked: { brevity: -1 }, disliked: { brevity: 1 } },         // STORYTELLING
    { liked: { bold: 1, brevity: 1 }, disliked: { bold: -1 } },   // DIRECT
    { liked: { complexity: 1 }, disliked: { complexity: -1 } },   // THOUGHTFUL
    { liked: { bold: 2 }, disliked: { bold: -1 } },               // BOLD
    { liked: { bold: -1, formal: -1 }, disliked: {} },            // HUMBLE
    { liked: { bold: 1, complexity: 1 }, disliked: {} }           // VISIONARY
  ];

  // Start with persona defaults
  const base = personaDefaults[persona] || personaDefaults['Practitioner'];
  const finalValues = {
    formal: base.formal,
    bold: base.bold,
    empathetic: base.empathetic,
    complexity: base.complexity,
    brevity: base.brevity,
    tone: base.tone
  };

  // Apply role adjustments
  const roleAdj = roleAdjustments[role] || {};
  if (roleAdj.bold) finalValues.bold = Math.max(1, Math.min(10, finalValues.bold + roleAdj.bold));
  if (roleAdj.formal) finalValues.formal = Math.max(1, Math.min(10, finalValues.formal + roleAdj.formal));
  if (roleAdj.empathetic) finalValues.empathetic = Math.max(1, Math.min(10, finalValues.empathetic + roleAdj.empathetic));
  if (roleAdj.brevity) finalValues.brevity = Math.max(1, Math.min(10, finalValues.brevity + roleAdj.brevity));

  // Apply calibration preferences
  if (preferences && Array.isArray(preferences)) {
    preferences.forEach((liked, i) => {
      if (i < styleImpacts.length) {
        const impact = liked ? styleImpacts[i].liked : styleImpacts[i].disliked;
        Object.entries(impact).forEach(([key, value]) => {
          if (key in finalValues && key !== 'tone') {
            (finalValues as any)[key] = Math.max(1, Math.min(10, (finalValues as any)[key] + value));
          }
        });
      }
    });
  }

  console.log(`🎯 Inferred voice signature: persona=${persona}, role=${role}, values=`, finalValues);

  return {
    formal: finalValues.formal,
    bold: finalValues.bold,
    empathetic: finalValues.empathetic,
    complexity: finalValues.complexity,
    brevity: finalValues.brevity,
    primaryTone: finalValues.tone,
    confidence: 0.6, // Lower confidence since based on calibration, not actual posts
    lastAnalyzedAt: new Date().toISOString(),
    postsAnalyzed: 0
  };
}

/**
 * POST /api/voice/analyze
 * Analyze user's LinkedIn posts and generate voice signature
 */
router.post('/analyze', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Get user's cached LinkedIn posts
    const postsResult = await query(
      `SELECT content FROM linkedin_posts
       WHERE user_id = $1 AND content IS NOT NULL AND content != ''
       ORDER BY posted_at DESC
       LIMIT 30`,
      [req.userId]
    );

    // If not enough posts, create signature from calibration data instead
    if (postsResult.rows.length < 3) {
      console.log(`📊 User ${req.userId} has ${postsResult.rows.length} posts, creating signature from calibration...`);

      // Get calibration preferences
      const calibrationResult = await query(
        `SELECT preferences FROM tone_calibrations WHERE user_id = $1`,
        [req.userId]
      );

      // Get user's persona and role
      let userPersona = 'Practitioner';
      let userRole = 'Professional';
      try {
        // Only select 'role' since 'persona' may not exist in all deployments yet
        const userResult = await query(`SELECT role FROM users WHERE id = $1`, [req.userId]);
        if (userResult.rows.length > 0) {
          userRole = userResult.rows[0].role || 'Professional';
        }
      } catch (e) {
        console.log('ℹ️ Role column not found, using defaults');
      }

      // Parse calibration preferences
      let preferences: boolean[] = [];
      if (calibrationResult.rows.length > 0 && calibrationResult.rows[0].preferences) {
        const rawPrefs = calibrationResult.rows[0].preferences;
        preferences = typeof rawPrefs === 'string' ? JSON.parse(rawPrefs) : rawPrefs;
      }

      // Infer voice signature from calibration
      const voiceSignature = inferVoiceFromCalibration(userPersona, userRole, preferences);

      // Save to database
      await query(
        `INSERT INTO voice_signatures
         (user_id, formal, bold, empathetic, complexity, brevity, primary_tone, confidence, sample_posts_analyzed, last_analyzed_at, analysis_source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), 'calibration')
         ON CONFLICT (user_id) DO UPDATE SET
           formal = EXCLUDED.formal,
           bold = EXCLUDED.bold,
           empathetic = EXCLUDED.empathetic,
           complexity = EXCLUDED.complexity,
           brevity = EXCLUDED.brevity,
           primary_tone = EXCLUDED.primary_tone,
           confidence = EXCLUDED.confidence,
           sample_posts_analyzed = EXCLUDED.sample_posts_analyzed,
           analysis_source = EXCLUDED.analysis_source,
           last_analyzed_at = NOW(),
           updated_at = NOW()`,
        [
          req.userId,
          voiceSignature.formal,
          voiceSignature.bold,
          voiceSignature.empathetic,
          voiceSignature.complexity,
          voiceSignature.brevity,
          voiceSignature.primaryTone,
          voiceSignature.confidence,
          0
        ]
      );

      console.log(`✅ Voice signature created from calibration for user ${req.userId}`);
      return res.json(voiceSignature);
    }

    const posts = postsResult.rows.map((row) => row.content);

    // Analyze with Gemini when we have enough posts
    const voiceSignature = await ClaudeService.analyzeVoiceSignature(req.userId!, posts);

    res.json(voiceSignature);
  } catch (error) {
    console.error('Voice analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze voice signature' });
  }
});

/**
 * GET /api/voice/signature
 * Get user's current voice signature
 */
router.get('/signature', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const signatureResult = await query(
      `SELECT formal, bold, empathetic, complexity, brevity, primary_tone, confidence, last_analyzed_at, sample_posts_analyzed
       FROM voice_signatures
       WHERE user_id = $1`,
      [req.userId]
    );

    if (signatureResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Voice signature not found',
        message: 'Please analyze your profile first',
      });
    }

    const signature = signatureResult.rows[0];

    // Ensure numeric types (PostgreSQL NUMERIC can return strings)
    res.json({
      formal: parseFloat(signature.formal) || 0,
      bold: parseFloat(signature.bold) || 0,
      empathetic: parseFloat(signature.empathetic) || 0,
      complexity: parseFloat(signature.complexity) || 0,
      brevity: parseFloat(signature.brevity) || 0,
      primaryTone: signature.primary_tone,
      confidence: parseFloat(signature.confidence) || 0,
      lastAnalyzedAt: signature.last_analyzed_at,
      postsAnalyzed: parseInt(signature.sample_posts_analyzed) || 0,
    });
  } catch (error) {
    console.error('Get voice signature error:', error);
    res.status(500).json({ error: 'Failed to get voice signature' });
  }
});

/**
 * POST /api/voice/generate
 * Generate post content based on prompt and source type
 */
router.post('/generate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, topic, sourceType } = req.body;
    const input = prompt || topic;

    if (!input || input.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt or topic is required' });
    }

    console.log(`📝 Generating post for user ${req.userId}, type: ${sourceType}`);

    const result = await ClaudeService.generatePost(req.userId!, input, sourceType || 'From Idea');

    res.json(result);

  } catch (error: any) {
    console.error('❌ Generate post route error:', {
      userId: req.userId,
      sourceType: req.body.sourceType,
      promptLength: req.body.prompt?.length,
      error: error.message
    });

    // Return specific error messages based on error type
    if (error.message.includes('Voice signature not found')) {
      return res.status(400).json({
        error: 'Voice signature required',
        message: 'Please analyze your LinkedIn profile first',
      });
    }

    if (error.message.includes('parse') || error.message.includes('JSON')) {
      return res.status(500).json({
        error: 'AI response parsing error',
        message: 'The AI returned an unexpected format. Please try again.',
      });
    }

    if (error.message.includes('invalid response structure')) {
      return res.status(500).json({
        error: 'AI response validation error',
        message: 'The AI response was incomplete. Please try again.',
      });
    }

    // Generic fallback
    res.status(500).json({
      error: 'Failed to generate post',
      message: 'An unexpected error occurred. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

/**
 * POST /api/voice/calibration-posts
 * Generate sample posts for tone calibration
 */
router.post('/calibration-posts', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { count = 5 } = req.body;

    console.log(`🤖 Generating ${count} calibration posts for user ${req.userId}...`);

    // Generate diverse sample posts with different tones
    const posts = await ClaudeService.generateCalibrationPosts(count);

    res.json({ posts });
  } catch (error) {
    console.error('Generate calibration posts error:', error);
    res.status(500).json({ error: 'Failed to generate calibration posts' });
  }
});

/**
 * POST /api/voice/calibration
 * Save user tone calibration preferences
 */
router.post('/calibration', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { preferences, posts } = req.body;

    if (!preferences || !Array.isArray(preferences)) {
      return res.status(400).json({ error: 'Preferences array is required' });
    }

    console.log(`💾 Saving tone calibration for user ${req.userId}...`);

    // Save calibration data
    await query(
      `INSERT INTO tone_calibrations (user_id, preferences, sample_posts, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET preferences = EXCLUDED.preferences, sample_posts = EXCLUDED.sample_posts, updated_at = NOW()`,
      [req.userId, JSON.stringify(preferences), JSON.stringify(posts || [])]
    );

    console.log('✅ Calibration saved, now creating voice signature...');

    // Get user's persona and role to create voice signature
    let userPersona = 'Practitioner';
    let userRole = 'Professional';
    try {
      // Only select 'role' since 'persona' may not exist in all deployments yet
      const userResult = await query(`SELECT role FROM users WHERE id = $1`, [req.userId]);
      if (userResult.rows.length > 0) {
        userRole = userResult.rows[0].role || 'Professional';
      }
    } catch (e) {
      console.log('ℹ️ Role column not found, using defaults');
    }

    // Create voice signature from calibration
    const voiceSignature = inferVoiceFromCalibration(userPersona, userRole, preferences);

    // Save voice signature to database
    await query(
      `INSERT INTO voice_signatures
       (user_id, formal, bold, empathetic, complexity, brevity, primary_tone, confidence, sample_posts_analyzed, last_analyzed_at, analysis_source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), 'calibration')
       ON CONFLICT (user_id) DO UPDATE SET
         formal = EXCLUDED.formal,
         bold = EXCLUDED.bold,
         empathetic = EXCLUDED.empathetic,
         complexity = EXCLUDED.complexity,
         brevity = EXCLUDED.brevity,
         primary_tone = EXCLUDED.primary_tone,
         confidence = EXCLUDED.confidence,
         sample_posts_analyzed = EXCLUDED.sample_posts_analyzed,
         analysis_source = EXCLUDED.analysis_source,
         last_analyzed_at = NOW(),
         updated_at = NOW()`,
      [
        req.userId,
        voiceSignature.formal,
        voiceSignature.bold,
        voiceSignature.empathetic,
        voiceSignature.complexity,
        voiceSignature.brevity,
        voiceSignature.primaryTone,
        voiceSignature.confidence,
        0
      ]
    );

    console.log(`✅ Voice signature created from calibration for user ${req.userId}:`, voiceSignature);

    res.json({
      success: true,
      message: 'Calibration saved and voice signature created',
      voiceSignature
    });
  } catch (error) {
    console.error('Save calibration error:', error);
    res.status(500).json({ error: 'Failed to save calibration' });
  }
});

/**
 * POST /api/voice/hook-score
 * Calculate hook score for post content
 */
router.post('/hook-score', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Calculate hook score with Gemini
    const result = await ClaudeService.calculateHookScore(content);

    res.json(result);
  } catch (error) {
    console.error('Hook score calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate hook score' });
  }
});

/**
 * POST /api/voice/improve
 * Improve post content with AI suggestions
 */
router.post('/improve', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Improve content with Gemini
    const result = await ClaudeService.improvePost(req.userId!, content);

    res.json(result);
  } catch (error) {
    console.error('Improve post error:', error);
    res.status(500).json({ error: 'Failed to improve post' });
  }
});

/**
 * GET /api/voice/daily-spark
 * Get daily AI-generated post suggestions based on current trends
 */
router.get('/daily-spark', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log(`✨ Generating daily spark for user ${req.userId}...`);

    // Generate 3 daily post ideas with AI
    const ideas = await ClaudeService.generateDailySpark(req.userId!);

    res.json({ ideas });
  } catch (error) {
    console.error('Generate daily spark error:', error);
    res.status(500).json({ error: 'Failed to generate daily spark' });
  }
});

/**
 * GET /api/voice/daily-inspirations
 * Get 2 quick AI-generated inspirations for the home screen (personalized by topics)
 */
router.get('/daily-inspirations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log(`💡 Generating daily inspirations for user ${req.userId}...`);

    // Get user's topic preferences for personalization
    const userResult = await query(
      `SELECT topic_preferences FROM users WHERE id = $1`,
      [req.userId]
    );
    const topicPreferences = userResult.rows[0]?.topic_preferences || [];

    // Generate 2 quick inspirations for home screen
    const inspirations = await ClaudeService.generateDailyInspirations(req.userId!, topicPreferences);

    res.json({ inspirations });
  } catch (error) {
    console.error('Generate inspirations error:', error);
    res.status(500).json({ error: 'Failed to generate inspirations' });
  }
});

// ============================================
// PERSONALIZATION & FEEDBACK ENDPOINTS
// ============================================

/**
 * POST /api/voice/generate-enhanced
 * Generate post with full personalization context (success patterns, calibration, etc.)
 */
router.post('/generate-enhanced', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, topic, sourceType } = req.body;
    const input = prompt || topic;

    if (!input || input.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt or topic is required' });
    }

    console.log(`📝 [ENHANCED] Generating post for user ${req.userId}, type: ${sourceType}`);

    const result = await ClaudeService.generatePostEnhanced(
      req.userId!,
      input,
      sourceType || 'From Idea'
    );

    res.json(result);
  } catch (error: any) {
    console.error('❌ Enhanced generate error:', error.message);
    res.status(500).json({
      error: 'Failed to generate post',
      message: error.message
    });
  }
});

/**
 * POST /api/voice/track-selection
 * Track which post variant the user selected and any edits made
 */
router.post('/track-selection', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      sessionId,
      selectedVariant,
      totalVariants,
      originalContent,
      originalHookScore,
      finalContent,
      timeToSelectMs,
      generatedPostId
    } = req.body;

    if (!sessionId || !selectedVariant || !originalContent) {
      return res.status(400).json({ error: 'Missing required fields: sessionId, selectedVariant, originalContent' });
    }

    await PersonalizationService.trackSelection({
      userId: req.userId!,
      generatedPostId,
      sessionId,
      selectedVariantNumber: selectedVariant,
      totalVariants: totalVariants || 3,
      originalHookScore: originalHookScore || 0,
      originalContent,
      finalContent,
      timeToSelectMs
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Track selection error:', error);
    res.status(500).json({ error: 'Failed to track selection' });
  }
});

/**
 * POST /api/voice/record-engagement
 * Record actual LinkedIn engagement for a published post (for calibration)
 */
router.post('/record-engagement', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      generatedPostId,
      linkedinPostId,
      likes,
      comments,
      shares,
      impressions,
      predictedHookScore,
      hoursSincePublish
    } = req.body;

    if (!generatedPostId || !linkedinPostId) {
      return res.status(400).json({ error: 'Missing required fields: generatedPostId, linkedinPostId' });
    }

    await PersonalizationService.recordEngagementFeedback(
      req.userId!,
      generatedPostId,
      linkedinPostId,
      {
        likes: likes || 0,
        comments: comments || 0,
        shares: shares || 0,
        impressions: impressions || 0
      },
      predictedHookScore || 0,
      hoursSincePublish || 24
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Record engagement error:', error);
    res.status(500).json({ error: 'Failed to record engagement' });
  }
});

/**
 * GET /api/voice/hook-calibration
 * Get user's current hook score calibration factors
 */
router.get('/hook-calibration', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT calibration_factor, calibration_bias, sample_size, r_squared,
              last_calibrated_at, calibration_history
       FROM hook_calibrations WHERE user_id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        calibrated: false,
        factor: 1.0,
        bias: 0,
        confidence: 0,
        message: 'No calibration data yet. Publish more posts to calibrate.'
      });
    }

    const cal = result.rows[0];

    res.json({
      calibrated: true,
      factor: parseFloat(cal.calibration_factor),
      bias: parseInt(cal.calibration_bias),
      sampleSize: cal.sample_size,
      rSquared: parseFloat(cal.r_squared) || null,
      lastCalibratedAt: cal.last_calibrated_at,
      confidence: Math.min(cal.sample_size / 20, 1),
      history: cal.calibration_history || []
    });
  } catch (error: any) {
    console.error('Get calibration error:', error);
    res.status(500).json({ error: 'Failed to get calibration' });
  }
});

/**
 * POST /api/voice/recalibrate
 * Force recalibration of hook scores based on accumulated feedback
 */
router.post('/recalibrate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await PersonalizationService.recalibrateHookScore(req.userId!);

    if (!result) {
      return res.status(400).json({
        error: 'Insufficient data',
        message: 'Need at least 5 published posts with engagement data to calibrate.'
      });
    }

    res.json({
      success: true,
      calibration: {
        factor: result.calibrationFactor,
        bias: result.calibrationBias,
        rSquared: result.rSquared,
        sampleSize: result.sampleSize
      }
    });
  } catch (error: any) {
    console.error('Recalibrate error:', error);
    res.status(500).json({ error: 'Failed to recalibrate' });
  }
});

/**
 * GET /api/voice/evolution-history
 * Get voice signature evolution history
 */
router.get('/evolution-history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const history = await PersonalizationService.getEvolutionHistory(req.userId!, 10);

    res.json({
      history: history.map(row => ({
        formal: row.formal,
        bold: row.bold,
        empathetic: row.empathetic,
        complexity: row.complexity,
        brevity: row.brevity,
        primaryTone: row.primaryTone,
        confidence: row.confidence,
        triggerReason: row.triggerReason,
        postsAnalyzed: row.samplePostsAnalyzed,
        deltas: {
          formal: row.deltaFormal || 0,
          bold: row.deltaBold || 0,
          empathetic: row.deltaEmpathetic || 0,
          complexity: row.deltaComplexity || 0,
          brevity: row.deltaBrevity || 0
        },
        createdAt: row.createdAt
      }))
    });
  } catch (error: any) {
    console.error('Get evolution history error:', error);
    res.status(500).json({ error: 'Failed to get evolution history' });
  }
});

/**
 * POST /api/voice/trigger-evolution
 * Manually trigger voice signature re-analysis
 */
router.post('/trigger-evolution', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await VoiceEvolutionService.triggerManualEvolution(req.userId!);

    if (!result.success) {
      return res.status(400).json({
        error: 'Evolution failed',
        message: result.message
      });
    }

    res.json({
      success: true,
      message: result.message,
      signature: result.signature
    });
  } catch (error: any) {
    console.error('Trigger evolution error:', error);
    res.status(500).json({ error: 'Failed to trigger evolution' });
  }
});

/**
 * GET /api/voice/success-patterns
 * Get user's learned success patterns from high-performing posts
 */
router.get('/success-patterns', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT pattern_type, pattern_value, occurrence_count,
              avg_engagement_score, avg_hook_score, success_rate
       FROM success_patterns
       WHERE user_id = $1 AND occurrence_count >= 2
       ORDER BY success_rate DESC, avg_engagement_score DESC
       LIMIT 20`,
      [req.userId]
    );

    res.json({
      patterns: result.rows.map(row => ({
        type: row.pattern_type,
        value: row.pattern_value,
        occurrences: row.occurrence_count,
        avgEngagement: parseFloat(row.avg_engagement_score) || 0,
        avgHookScore: parseFloat(row.avg_hook_score) || 0,
        successRate: parseFloat(row.success_rate) || 0
      }))
    });
  } catch (error: any) {
    console.error('Get success patterns error:', error);
    res.status(500).json({ error: 'Failed to get success patterns' });
  }
});

/**
 * POST /api/voice/analyze-patterns
 * Trigger success pattern analysis from user's posts
 */
router.post('/analyze-patterns', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const patterns = await PersonalizationService.analyzeSuccessPatterns(req.userId!);

    res.json({
      success: true,
      patternsFound: patterns.length,
      patterns: patterns.map(p => ({
        type: p.patternType,
        value: p.patternValue,
        occurrences: p.occurrenceCount,
        successRate: p.successRate
      }))
    });
  } catch (error: any) {
    console.error('Analyze patterns error:', error);
    res.status(500).json({ error: 'Failed to analyze patterns' });
  }
});

/**
 * GET /api/voice/personalization-context
 * Get full enhanced personalization context for debugging/display
 */
router.get('/personalization-context', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const context = await PersonalizationService.buildEnhancedContext(req.userId!);

    res.json({
      userId: context.userId,
      name: context.name,
      role: context.role,
      persona: context.persona,
      voiceSignature: context.voiceSignature,
      hookCalibration: context.hookCalibration,
      stylePreferences: context.stylePreferences,
      topSuccessPatterns: context.topSuccessPatterns,
      performanceSummary: context.performanceSummary,
      overallConfidence: context.overallConfidence
    });
  } catch (error: any) {
    console.error('Get personalization context error:', error);
    res.status(500).json({ error: 'Failed to get personalization context' });
  }
});

export default router;
