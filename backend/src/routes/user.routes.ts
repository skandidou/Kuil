import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { query } from '../config/database';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';
import { LinkedInService } from '../services/LinkedInService';
import { Logger } from '../services/LoggerService';

const router = Router();

/**
 * GET /api/user/profile
 * Get full user profile with voice signature
 */
router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Get user data
    const userResult = await query(
      `SELECT id, linkedin_id, name, email, profile_picture, headline, persona, role, topic_preferences, created_at, last_login_at
       FROM users
       WHERE id = $1`,
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get voice signature if exists
    const signatureResult = await query(
      `SELECT formal, bold, empathetic, complexity, brevity, primary_tone, confidence, last_analyzed_at, sample_posts_analyzed
       FROM voice_signatures
       WHERE user_id = $1`,
      [req.userId]
    );

    // Ensure numeric types (PostgreSQL NUMERIC can return strings)
    const voiceSignature = signatureResult.rows.length > 0
      ? {
          formal: parseFloat(signatureResult.rows[0].formal) || 0,
          bold: parseFloat(signatureResult.rows[0].bold) || 0,
          empathetic: parseFloat(signatureResult.rows[0].empathetic) || 0,
          complexity: parseFloat(signatureResult.rows[0].complexity) || 0,
          brevity: parseFloat(signatureResult.rows[0].brevity) || 0,
          primaryTone: signatureResult.rows[0].primary_tone,
          confidence: parseFloat(signatureResult.rows[0].confidence) || 0,
          lastAnalyzedAt: signatureResult.rows[0].last_analyzed_at,
          postsAnalyzed: parseInt(signatureResult.rows[0].sample_posts_analyzed) || 0,
        }
      : null;

    // Get topic preferences if exist
    const topicPreferences = user.topic_preferences || [];

    // Get persona and role
    const persona = user.persona || null;
    const role = user.role || null;

    // Get calibration preferences
    const calibrationResult = await query(
      `SELECT preferences FROM tone_calibrations WHERE user_id = $1`,
      [req.userId]
    );
    const calibrationPreferences = calibrationResult.rows.length > 0
      ? calibrationResult.rows[0].preferences
      : null;

    res.json({
      id: user.id,
      linkedinId: user.linkedin_id,
      name: user.name,
      email: user.email,
      profilePicture: user.profile_picture,
      headline: user.headline,
      persona,
      role,
      calibrationPreferences,
      topicPreferences,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
      voiceSignature,
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

/**
 * GET /api/user/stats
 * Get user statistics
 */
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Get total posts cached
    const postsCount = await query(
      `SELECT COUNT(*) as count FROM linkedin_posts WHERE user_id = $1`,
      [req.userId]
    );

    // Get total posts generated
    const generatedCount = await query(
      `SELECT COUNT(*) as count FROM generated_posts WHERE user_id = $1`,
      [req.userId]
    );

    // Get published posts
    const publishedCount = await query(
      `SELECT COUNT(*) as count FROM generated_posts WHERE user_id = $1 AND status = 'published'`,
      [req.userId]
    );

    // Get average hook score
    const avgHookScore = await query(
      `SELECT AVG(hook_score) as average FROM generated_posts WHERE user_id = $1`,
      [req.userId]
    );

    // Calculate visibility score (0-100) based on LinkedIn posts
    const totalPosts = parseInt(postsCount.rows[0].count);
    let visibilityScore = 0;
    let networkPercentile = 0;

    if (totalPosts >= 1) {  // More forgiving threshold - show score even with 1 post
      // Get LinkedIn engagement stats
      const engagementStats = await query(
        `SELECT
          COALESCE(SUM(likes), 0) as total_likes,
          COALESCE(SUM(comments), 0) as total_comments,
          COALESCE(SUM(shares), 0) as total_shares,
          COALESCE(SUM(impressions), 0) as total_impressions
         FROM linkedin_posts
         WHERE user_id = $1`,
        [req.userId]
      );

      const likes = parseInt(engagementStats.rows[0].total_likes);
      const comments = parseInt(engagementStats.rows[0].total_comments);
      const shares = parseInt(engagementStats.rows[0].total_shares);
      const impressions = parseInt(engagementStats.rows[0].total_impressions);

      // Calculate engagement rate per post
      const avgLikesPerPost = totalPosts > 0 ? likes / totalPosts : 0;
      const avgCommentsPerPost = totalPosts > 0 ? comments / totalPosts : 0;
      const avgSharesPerPost = totalPosts > 0 ? shares / totalPosts : 0;

      // Weighted score (0-100)
      const postFrequencyScore = Math.min(totalPosts * 5, 30);  // Up to 30 points
      const likesScore = Math.min(avgLikesPerPost * 2, 25);     // Up to 25 points
      const commentsScore = Math.min(avgCommentsPerPost * 5, 25); // Up to 25 points
      const sharesScore = Math.min(avgSharesPerPost * 10, 20);  // Up to 20 points

      visibilityScore = Math.min(
        Math.round(postFrequencyScore + likesScore + commentsScore + sharesScore),
        100
      );

      // Network percentile (for now, use same as score - in future compare with other users)
      networkPercentile = visibilityScore;
    }

    res.json({
      totalPosts,
      generatedPosts: parseInt(generatedCount.rows[0].count),
      publishedPosts: parseInt(publishedCount.rows[0].count),
      averageHookScore: avgHookScore.rows[0].average
        ? Math.round(parseFloat(avgHookScore.rows[0].average))
        : 0,
      visibilityScore,
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get user stats' });
  }
});

/**
 * POST /api/user/update-role
 * Update user's role
 */
router.post('/update-role', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;

    if (!role || role.trim().length === 0) {
      return res.status(400).json({ error: 'Role is required' });
    }

    console.log(`💾 Updating user role to: ${role}`);

    // Add role column to users table (if not exists, backend will handle)
    await query(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2`,
      [role, req.userId]
    );

    console.log(`✅ User role updated successfully`);

    res.json({ success: true });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

/**
 * POST /api/user/update-persona
 * Update user's persona (Visionary, Practitioner, Storyteller)
 */
router.post('/update-persona', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { persona } = req.body;

    const validPersonas = ['Visionary', 'Practitioner', 'Storyteller'];
    if (!persona || !validPersonas.includes(persona)) {
      return res.status(400).json({
        error: 'Invalid persona',
        message: `Persona must be one of: ${validPersonas.join(', ')}`
      });
    }

    console.log(`💾 Updating user persona to: ${persona}`);

    // Update persona in users table
    await query(
      `UPDATE users SET persona = $1, updated_at = NOW() WHERE id = $2`,
      [persona, req.userId]
    );

    console.log(`✅ User persona updated successfully`);

    res.json({ success: true, persona });
  } catch (error) {
    console.error('Update user persona error:', error);
    res.status(500).json({ error: 'Failed to update user persona' });
  }
});

/**
 * GET /api/user/activity
 * Get user's recent activity (posts published, engagement, scheduled reminders)
 */
router.get('/activity', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log(`📋 Fetching user activity for ${req.userId}...`);

    // Get recent published posts (last 7 days)
    const recentPostsResult = await query(
      `SELECT id, content, status, published_at
       FROM generated_posts
       WHERE user_id = $1 AND status = 'published' AND published_at >= NOW() - INTERVAL '7 days'
       ORDER BY published_at DESC
       LIMIT 5`,
      [req.userId]
    );

    const recentPosts = recentPostsResult.rows.map((post) => ({
      type: 'post_published',
      title: 'Post Published',
      description: `Your post "${post.content.substring(0, 50)}..." was published`,
      timestamp: post.published_at,
      icon: 'doc.badge.plus',
      iconColor: 'successGreen',
    }));

    // Skip engagement query since likes/comments columns don't exist in generated_posts
    const recentEngagement: any[] = [];

    // Get upcoming scheduled posts (next 7 days, starting from now)
    const upcomingPostsResult = await query(
      `SELECT id, content, scheduled_at
       FROM generated_posts
       WHERE user_id = $1 AND status = 'scheduled'
         AND scheduled_at >= NOW()
         AND scheduled_at <= NOW() + INTERVAL '7 days'
       ORDER BY scheduled_at ASC
       LIMIT 3`,
      [req.userId]
    );

    const upcomingPosts = upcomingPostsResult.rows.map((post) => ({
      type: 'scheduled_reminder',
      title: 'Go Live Reminder',
      description: `"${post.content.substring(0, 50)}..." goes live soon`,
      timestamp: post.scheduled_at,
      icon: 'clock.fill',
      iconColor: 'orange',
      actionable: true,
    }));

    // Weekly summary (calculate weekly stats)
    const weeklyStatsResult = await query(
      `SELECT COUNT(*) as posts_count
       FROM generated_posts
       WHERE user_id = $1 AND status = 'published'
         AND published_at >= NOW() - INTERVAL '7 days'`,
      [req.userId]
    );

    const weeklyStats = weeklyStatsResult.rows[0];
    const postsCount = parseInt(weeklyStats.posts_count || '0', 10);
    const totalEngagement = 0; // likes/comments columns don't exist in generated_posts

    let weeklySummary = null;
    if (postsCount > 0 || totalEngagement > 0) {
      weeklySummary = {
        type: 'weekly_summary',
        title: 'WEEKLY SUMMARY',
        description: `${postsCount} posts published with ${totalEngagement} total engagement this week`,
        timestamp: new Date().toISOString(),
        icon: 'chart.line.uptrend.xyaxis',
        iconColor: 'appPrimary',
        isHighlighted: true,
      };
    }

    // Combine all activities and sort by timestamp
    const allActivities = [
      ...recentPosts,
      ...recentEngagement,
      ...upcomingPosts,
      weeklySummary,
    ].filter(Boolean).sort((a: any, b: any) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    console.log(`✅ Found ${allActivities.length} activity items`);

    res.json({
      activities: allActivities,
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ error: 'Failed to get user activity' });
  }
});

/**
 * POST /api/user/update-topics
 * Update user's topic preferences (manual selection from onboarding)
 */
router.post('/update-topics', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { topics } = req.body;

    if (!topics || !Array.isArray(topics)) {
      return res.status(400).json({ error: 'Topics array is required' });
    }

    if (topics.length < 3 || topics.length > 10) {
      return res.status(400).json({
        error: 'Invalid topics count',
        message: 'Please select between 3 and 10 topics'
      });
    }

    // Validate topics are strings
    const validTopics = topics.filter((t) => typeof t === 'string' && t.length > 0);
    if (validTopics.length !== topics.length) {
      return res.status(400).json({ error: 'All topics must be non-empty strings' });
    }

    console.log(`💾 Updating topic preferences for user ${req.userId}:`, validTopics);

    // Save to database
    await query(
      `UPDATE users SET topic_preferences = $1, updated_at = NOW() WHERE id = $2`,
      [validTopics, req.userId]
    );

    console.log(`✅ Topic preferences updated successfully`);

    res.json({ success: true, topics: validTopics });
  } catch (error: any) {
    console.error('Update topics error:', error);
    res.status(500).json({ error: 'Failed to update topics', message: error.message });
  }
});

/**
 * POST /api/user/analyze-topics
 * Analyze user's LinkedIn post history to extract dominant topics
 */
router.post('/analyze-topics', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log(`🔍 Analyzing topics for user ${req.userId}...`);

    // Get user's LinkedIn credentials
    const userResult = await query(
      `SELECT linkedin_id, linkedin_access_token FROM users WHERE id = $1`,
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { linkedin_id, linkedin_access_token } = userResult.rows[0];

    // Fetch user's LinkedIn posts
    const linkedInPosts = await LinkedInService.getUserPosts(linkedin_id, linkedin_access_token);

    if (linkedInPosts.length === 0) {
      return res.status(400).json({
        error: 'No posts found',
        message: 'You need to have some LinkedIn posts for topic analysis.'
      });
    }

    // Extract content from posts (up to 50 most recent)
    const postsToAnalyze = linkedInPosts.slice(0, 50);
    const postsText = postsToAnalyze
      .map((post, i) => `Post ${i + 1}: ${post.commentary}`)
      .join('\n\n');

    // Use Gemini to analyze topics
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Analyze these LinkedIn posts and extract the top 5 recurring topics or themes.
Return ONLY a JSON array of topic strings, nothing else.

Examples of good topics: "AI & Machine Learning", "Startup Fundraising", "B2B SaaS", "Product Management", "Remote Work"

Posts:
${postsText}

Return format: ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Parse the JSON response
    let topics: string[];
    try {
      // Extract JSON array from response (handle markdown code blocks)
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      topics = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', response);
      // Fallback to empty array
      topics = [];
    }

    // Validate and clean topics
    topics = topics
      .filter((topic) => typeof topic === 'string' && topic.length > 0)
      .slice(0, 5); // Ensure max 5 topics

    console.log(`✅ Extracted topics:`, topics);

    // Save to database
    await query(
      `UPDATE users SET topic_preferences = $1, updated_at = NOW() WHERE id = $2`,
      [topics, req.userId]
    );

    res.json({ topics });
  } catch (error: any) {
    console.error('Analyze topics error:', error);
    res.status(500).json({ error: 'Failed to analyze topics', message: error.message });
  }
});

/**
 * GET /api/user/export-data
 * Export all user data (GDPR compliance)
 */
router.get('/export-data', authenticate, async (req: AuthRequest, res: Response) => {
  const correlationId = Logger.generateCorrelationId();
  const logger = Logger.withContext({ correlationId, userId: req.userId });

  try {
    logger.info('USER', 'Data export requested');

    // Get user profile
    const userResult = await query(
      `SELECT id, linkedin_id, name, email, profile_picture, headline, persona, role, topic_preferences, created_at, updated_at, last_login_at
       FROM users WHERE id = $1`,
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get voice signature
    const voiceResult = await query(
      `SELECT formal, bold, empathetic, complexity, brevity, primary_tone, confidence, sample_posts_analyzed, last_analyzed_at, analysis_source
       FROM voice_signatures WHERE user_id = $1`,
      [req.userId]
    );

    // Get tone calibrations
    const calibrationResult = await query(
      `SELECT preferences, sample_posts, created_at, updated_at
       FROM tone_calibrations WHERE user_id = $1`,
      [req.userId]
    );

    // Get LinkedIn posts (cached)
    const linkedinPostsResult = await query(
      `SELECT linkedin_post_id, content, likes, comments, shares, impressions, posted_at, fetched_at
       FROM linkedin_posts WHERE user_id = $1
       ORDER BY posted_at DESC`,
      [req.userId]
    );

    // Get generated posts
    const generatedPostsResult = await query(
      `SELECT topic, content, hook_score, status, scheduled_at, published_at, created_at, updated_at
       FROM generated_posts WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.userId]
    );

    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: '1.0',
      user: {
        id: user.id,
        linkedinId: user.linkedin_id,
        name: user.name,
        email: user.email,
        profilePicture: user.profile_picture,
        headline: user.headline,
        persona: user.persona,
        role: user.role,
        topicPreferences: user.topic_preferences,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLoginAt: user.last_login_at,
      },
      voiceSignature: voiceResult.rows.length > 0 ? {
        formal: parseFloat(voiceResult.rows[0].formal),
        bold: parseFloat(voiceResult.rows[0].bold),
        empathetic: parseFloat(voiceResult.rows[0].empathetic),
        complexity: parseFloat(voiceResult.rows[0].complexity),
        brevity: parseFloat(voiceResult.rows[0].brevity),
        primaryTone: voiceResult.rows[0].primary_tone,
        confidence: parseFloat(voiceResult.rows[0].confidence),
        postsAnalyzed: voiceResult.rows[0].sample_posts_analyzed,
        lastAnalyzedAt: voiceResult.rows[0].last_analyzed_at,
        analysisSource: voiceResult.rows[0].analysis_source,
      } : null,
      toneCalibration: calibrationResult.rows.length > 0 ? {
        preferences: calibrationResult.rows[0].preferences,
        samplePosts: calibrationResult.rows[0].sample_posts,
        createdAt: calibrationResult.rows[0].created_at,
        updatedAt: calibrationResult.rows[0].updated_at,
      } : null,
      linkedinPosts: linkedinPostsResult.rows.map((post) => ({
        linkedinPostId: post.linkedin_post_id,
        content: post.content,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        impressions: post.impressions,
        postedAt: post.posted_at,
        fetchedAt: post.fetched_at,
      })),
      generatedPosts: generatedPostsResult.rows.map((post) => ({
        topic: post.topic,
        content: post.content,
        hookScore: post.hook_score,
        status: post.status,
        scheduledAt: post.scheduled_at,
        publishedAt: post.published_at,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
      })),
      dataSummary: {
        totalLinkedinPosts: linkedinPostsResult.rows.length,
        totalGeneratedPosts: generatedPostsResult.rows.length,
        hasVoiceSignature: voiceResult.rows.length > 0,
        hasToneCalibration: calibrationResult.rows.length > 0,
      },
    };

    logger.info('USER', 'Data export completed', {
      linkedinPosts: linkedinPostsResult.rows.length,
      generatedPosts: generatedPostsResult.rows.length,
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="kuil-data-export-${new Date().toISOString().split('T')[0]}.json"`);

    res.json(exportData);
  } catch (error: any) {
    logger.error('USER', 'Data export failed', {}, error);
    res.status(500).json({ error: 'Failed to export user data' });
  }
});

/**
 * DELETE /api/user/account
 * Delete user account and all associated data (GDPR compliance)
 */
router.delete('/account', authenticate, async (req: AuthRequest, res: Response) => {
  const correlationId = Logger.generateCorrelationId();
  const logger = Logger.withContext({ correlationId, userId: req.userId });

  try {
    logger.info('USER', 'Account deletion requested');

    // Verify user exists
    const userCheck = await query(
      `SELECT id, name, email FROM users WHERE id = $1`,
      [req.userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userCheck.rows[0];

    // Delete all user data (cascading via foreign keys handles related tables)
    // But we explicitly delete for clarity and logging

    // 1. Delete tone calibrations
    const calibrationDelete = await query(
      `DELETE FROM tone_calibrations WHERE user_id = $1`,
      [req.userId]
    );
    logger.info('USER', `Deleted ${calibrationDelete.rowCount} tone calibrations`);

    // 2. Delete voice signatures
    const voiceDelete = await query(
      `DELETE FROM voice_signatures WHERE user_id = $1`,
      [req.userId]
    );
    logger.info('USER', `Deleted ${voiceDelete.rowCount} voice signatures`);

    // 3. Delete LinkedIn posts cache
    const linkedinDelete = await query(
      `DELETE FROM linkedin_posts WHERE user_id = $1`,
      [req.userId]
    );
    logger.info('USER', `Deleted ${linkedinDelete.rowCount} cached LinkedIn posts`);

    // 4. Delete generated posts
    const generatedDelete = await query(
      `DELETE FROM generated_posts WHERE user_id = $1`,
      [req.userId]
    );
    logger.info('USER', `Deleted ${generatedDelete.rowCount} generated posts`);

    // 5. Finally delete the user
    await query(
      `DELETE FROM users WHERE id = $1`,
      [req.userId]
    );

    logger.info('USER', 'Account deleted successfully', {
      userName: user.name,
      userEmail: user.email,
    });

    res.json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted.',
      deletedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('USER', 'Account deletion failed', {}, error);
    res.status(500).json({ error: 'Failed to delete account. Please contact support.' });
  }
});

/**
 * POST /api/user/request-data-deletion
 * Request data deletion (alternative flow - sends confirmation)
 */
router.post('/request-data-deletion', authenticate, async (req: AuthRequest, res: Response) => {
  const correlationId = Logger.generateCorrelationId();
  const logger = Logger.withContext({ correlationId, userId: req.userId });

  try {
    logger.info('USER', 'Data deletion request received');

    // Get user info for confirmation
    const userResult = await query(
      `SELECT name, email FROM users WHERE id = $1`,
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // In a production system, you might:
    // 1. Send a confirmation email
    // 2. Schedule deletion after a grace period
    // 3. Create an audit log entry

    res.json({
      success: true,
      message: 'To permanently delete your account, use DELETE /api/user/account. This action cannot be undone.',
      warning: 'All your data including generated posts, voice signature, and LinkedIn cache will be permanently deleted.',
    });
  } catch (error: any) {
    logger.error('USER', 'Data deletion request failed', {}, error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

export default router;
