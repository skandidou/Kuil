import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { query } from '../config/database';
import { LinkedInService } from '../services/LinkedInService';
import { SchedulerService } from '../services/SchedulerService';
import { CacheService } from '../services/CacheService';

const router = Router();

// Constants for validation
const MAX_POST_LENGTH = 3000; // LinkedIn's character limit
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate that a string is a valid UUID
 */
function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * GET /api/posts/scheduled
 * Get user's scheduled posts
 */
router.get('/scheduled', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log(`📅 Fetching scheduled posts for user ${req.userId}...`);

    const result = await query(
      `SELECT id, content, scheduled_at, status, linkedin_profile,
              failure_reason, retry_count, published_at
       FROM generated_posts
       WHERE user_id = $1 AND (status = 'scheduled' OR status = 'draft' OR status = 'published' OR status = 'failed')
       ORDER BY scheduled_at ASC`,
      [req.userId]
    );

    const posts = result.rows.map((row) => ({
      id: row.id,
      content: row.content,
      scheduledAt: row.scheduled_at,
      status: row.status,
      linkedinProfile: row.linkedin_profile || true,
      likes: 0,
      comments: 0,
      failureReason: row.failure_reason,
      retryCount: row.retry_count,
      publishedAt: row.published_at,
      linkedinPostId: null,
    }));

    console.log(`✅ Found ${posts.length} posts (statuses: ${posts.map(p => p.status).join(', ')})`);

    res.json({ posts });
  } catch (error) {
    console.error('Get scheduled posts error:', error);
    res.status(500).json({ error: 'Failed to get scheduled posts' });
  }
});

/**
 * POST /api/posts/publish
 * Publish post to LinkedIn immediately
 */
router.post('/publish', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (content.length > MAX_POST_LENGTH) {
      return res.status(400).json({ error: `Content exceeds maximum length of ${MAX_POST_LENGTH} characters` });
    }

    console.log(`📤 Publishing post for user ${req.userId}...`);

    // Get user's LinkedIn credentials
    const userResult = await query(
      `SELECT linkedin_id, linkedin_access_token FROM users WHERE id = $1`,
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { linkedin_id, linkedin_access_token } = userResult.rows[0];

    // Publish to LinkedIn
    const linkedinPostId = await LinkedInService.publishPost(
      linkedin_id,
      linkedin_access_token,
      content
    );

    // Save to database with optional session tracking
    const { sessionId, sourceType, hookScore } = req.body;
    await query(
      `INSERT INTO generated_posts (user_id, content, linkedin_post_id, status, published_at, created_at, session_id, source_type, hook_score)
       VALUES ($1, $2, $3, 'published', NOW(), NOW(), $4, $5, $6)`,
      [req.userId, content, linkedinPostId, sessionId || null, sourceType || null, hookScore || null]
    );

    console.log(`✅ Post published: ${linkedinPostId}`);

    res.json({ success: true, linkedinPostId });
  } catch (error: any) {
    console.error('Publish post error:', error);

    const errorMessage = error.message || 'Failed to publish post';
    const lowercaseMessage = errorMessage.toLowerCase();

    // Check for LinkedIn duplicate error (business error, not retry-able)
    if (lowercaseMessage.includes('duplicate')) {
      return res.status(400).json({
        error: 'DUPLICATE_CONTENT',
        message: 'This content has already been posted to LinkedIn. Please modify your post.'
      });
    }

    // Auth errors - may need re-authentication
    if (lowercaseMessage.includes('unauthorized') ||
        lowercaseMessage.includes('forbidden') ||
        lowercaseMessage.includes('access token')) {
      return res.status(401).json({
        error: 'AUTH_ERROR',
        message: 'Authentication failed. Please sign in again.'
      });
    }

    // Rate limit errors
    if (lowercaseMessage.includes('rate limit') ||
        lowercaseMessage.includes('too many requests')) {
      return res.status(429).json({
        error: 'RATE_LIMIT',
        message: 'Too many requests. Please try again later.'
      });
    }

    // True server errors (5xx) - these CAN be retried by the client
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: errorMessage
    });
  }
});

/**
 * POST /api/posts/schedule
 * Schedule post for later
 */
router.post('/schedule', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { content, scheduledAt } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (content.length > MAX_POST_LENGTH) {
      return res.status(400).json({ error: `Content exceeds maximum length of ${MAX_POST_LENGTH} characters` });
    }

    if (!scheduledAt) {
      return res.status(400).json({ error: 'Scheduled time is required' });
    }

    console.log(`📅 Scheduling post for user ${req.userId}...`);

    // Get user's LinkedIn credentials for queue
    const userResult = await query(
      `SELECT linkedin_id, linkedin_access_token FROM users WHERE id = $1`,
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { linkedin_id, linkedin_access_token } = userResult.rows[0];

    // Save to database with scheduled status and optional session tracking
    const { sessionId, sourceType, hookScore } = req.body;
    const result = await query(
      `INSERT INTO generated_posts (user_id, content, scheduled_at, status, created_at, session_id, source_type, hook_score)
       VALUES ($1, $2, $3, 'scheduled', NOW(), $4, $5, $6)
       RETURNING id, scheduled_at`,
      [req.userId, content, scheduledAt, sessionId || null, sourceType || null, hookScore || null]
    );

    const scheduledPost = result.rows[0];

    // Add to Redis queue for persistent scheduling
    await SchedulerService.schedulePost(
      scheduledPost.id,
      req.userId!,
      content,
      linkedin_id,
      linkedin_access_token,
      new Date(scheduledAt)
    );

    console.log(`✅ Post scheduled for: ${scheduledPost.scheduled_at}`);

    res.json({ success: true, postId: scheduledPost.id, scheduledAt: scheduledPost.scheduled_at });
  } catch (error: any) {
    console.error('Schedule post error:', error);

    const errorMessage = error.message || 'Failed to schedule post';

    // Database constraint errors (like duplicate) should be 400
    if (errorMessage.includes('duplicate') ||
        errorMessage.includes('unique constraint')) {
      return res.status(400).json({
        error: 'DUPLICATE_SCHEDULE',
        message: 'This post is already scheduled.'
      });
    }

    res.status(500).json({
      error: 'SERVER_ERROR',
      message: errorMessage
    });
  }
});

/**
 * GET /api/posts/optimal-time
 * Suggest optimal posting time using AI analysis
 */
router.get('/optimal-time', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Check cache first (6h TTL)
    const optimalTimeCacheKey = `optimal-time:${req.userId}`;
    const cachedResult = await CacheService.get<{ suggestedTime: string; reason: string }>(optimalTimeCacheKey);
    if (cachedResult) {
      console.log(`✅ [CACHE HIT] Optimal time for user ${req.userId}`);
      return res.json(cachedResult);
    }

    console.log(`🤖 Calculating optimal posting time for user ${req.userId}...`);

    // Get user's post performance history
    const performanceResult = await query(
      `SELECT
        EXTRACT(HOUR FROM posted_at) as hour,
        EXTRACT(DOW FROM posted_at) as day_of_week,
        AVG(likes + comments * 2) as avg_engagement,
        COUNT(*) as post_count
       FROM linkedin_posts
       WHERE user_id = $1 AND posted_at IS NOT NULL
       GROUP BY hour, day_of_week
       ORDER BY avg_engagement DESC
       LIMIT 5`,
      [req.userId]
    );

    // Get user's headline/industry for AI context
    const userResult = await query(
      `SELECT headline FROM users WHERE id = $1`,
      [req.userId]
    );

    // Try to get role separately
    let userRole = 'Professional';
    try {
      const roleResult = await query(`SELECT role FROM users WHERE id = $1`, [req.userId]);
      if (roleResult.rows.length > 0 && roleResult.rows[0].role) {
        userRole = roleResult.rows[0].role;
      }
    } catch (e) {
      // role column doesn't exist
    }

    const userHeadline = userResult.rows[0]?.headline || '';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // If user has posting history, use it for AI-enhanced analysis
    if (performanceResult.rows.length > 0) {
      const topPerformingSlots = performanceResult.rows.map((row: any) => ({
        hour: parseInt(row.hour),
        dayOfWeek: parseInt(row.day_of_week),
        avgEngagement: parseFloat(row.avg_engagement),
        postCount: parseInt(row.post_count)
      }));

      // Use AI to analyze and provide smart recommendation
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `You are a LinkedIn engagement expert. Analyze this user's posting data and suggest the BEST time to post.

**User Profile:**
- Role: ${userRole}
- Headline: ${userHeadline || 'Not specified'}

**User's Top Performing Time Slots (based on engagement):**
${topPerformingSlots.map((slot: any, i: number) =>
  `${i + 1}. ${days[slot.dayOfWeek]} at ${slot.hour}:00 - Avg engagement: ${slot.avgEngagement.toFixed(1)}, Posts: ${slot.postCount}`
).join('\n')}

**LinkedIn Best Practices:**
- B2B content performs best: Tuesday-Thursday, 8-10 AM or 12 PM
- General engagement peaks: Tuesday 9 AM, Wednesday 12 PM
- Avoid weekends for business content
- Early morning (7-8 AM) catches commuters

Based on the user's actual data AND LinkedIn best practices, suggest the optimal posting time.

Respond with ONLY valid JSON:
{
  "suggestedTime": "9:00 AM",
  "suggestedDay": "Tuesday",
  "reason": "A personalized explanation combining user data with best practices (2-3 sentences max)"
}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const aiAnalysis = JSON.parse(cleaned);

        console.log(`✅ AI optimal time: ${aiAnalysis.suggestedDay} ${aiAnalysis.suggestedTime}`);

        const optimalResult = {
          suggestedTime: `${aiAnalysis.suggestedDay} at ${aiAnalysis.suggestedTime}`,
          reason: aiAnalysis.reason
        };
        // Cache for 6 hours (21600000 ms)
        await CacheService.set(optimalTimeCacheKey, optimalResult, 21600000);
        return res.json(optimalResult);
      } catch (aiError) {
        console.error('AI analysis failed, falling back to data-based recommendation:', aiError);
        // Fall back to simple data-based recommendation
        const best = topPerformingSlots[0];
        const period = best.hour >= 12 ? 'PM' : 'AM';
        const displayHour = best.hour % 12 || 12;

        const fallbackResult = {
          suggestedTime: `${days[best.dayOfWeek]} at ${displayHour}:00 ${period}`,
          reason: `Your posts on ${days[best.dayOfWeek]} at this time average ${best.avgEngagement.toFixed(0)} engagement points`
        };
        // Cache data-based fallback for 6 hours
        await CacheService.set(optimalTimeCacheKey, fallbackResult, 21600000);
        return res.json(fallbackResult);
      }
    }

    // No user data - use AI with LinkedIn best practices only
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `You are a LinkedIn engagement expert. A ${userRole} with headline "${userHeadline || 'Professional'}" wants to know the best time to post on LinkedIn.

They have NO posting history yet, so base your recommendation purely on:
- LinkedIn algorithm best practices
- Their professional role/industry
- Current day of week: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}

Respond with ONLY valid JSON:
{
  "suggestedTime": "10:00 AM",
  "suggestedDay": "Tuesday",
  "reason": "A brief, personalized explanation (2 sentences max)"
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const aiAnalysis = JSON.parse(cleaned);

      console.log(`✅ AI optimal time (no history): ${aiAnalysis.suggestedDay} ${aiAnalysis.suggestedTime}`);

      const noHistoryResult = {
        suggestedTime: `${aiAnalysis.suggestedDay} at ${aiAnalysis.suggestedTime}`,
        reason: aiAnalysis.reason
      };
      // Cache for 6 hours
      await CacheService.set(optimalTimeCacheKey, noHistoryResult, 21600000);
      res.json(noHistoryResult);
    } catch (aiError) {
      console.error('AI fallback failed:', aiError);
      // Ultimate fallback - NOT cached (generic, and we want to retry AI next time)
      res.json({
        suggestedTime: 'Tuesday at 10:00 AM',
        reason: 'Based on LinkedIn best practices for maximum professional engagement'
      });
    }
  } catch (error) {
    console.error('Optimal time calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate optimal time' });
  }
});

/**
 * POST /api/posts/:id/publish-now
 * Manually trigger publication of a scheduled post (for debugging/testing)
 */
router.post('/:id/publish-now', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const postId = req.params.id;
    console.log(`🚀 Manually publishing post ${postId} for user ${req.userId}...`);

    // Get the post and verify ownership
    const postResult = await query(
      `SELECT gp.id, gp.content, gp.status, u.linkedin_id, u.linkedin_access_token
       FROM generated_posts gp
       JOIN users u ON gp.user_id = u.id
       WHERE gp.id = $1 AND gp.user_id = $2`,
      [postId, req.userId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = postResult.rows[0];

    if (post.status === 'published') {
      return res.status(400).json({ error: 'Post already published' });
    }

    // Publish to LinkedIn
    const linkedinPostId = await LinkedInService.publishPost(
      post.linkedin_id,
      post.linkedin_access_token,
      post.content
    );

    // Update status
    await query(
      `UPDATE generated_posts
       SET status = 'published',
           linkedin_post_id = $1,
           published_at = NOW(),
           failure_reason = NULL,
           retry_count = 0
       WHERE id = $2`,
      [linkedinPostId, postId]
    );

    console.log(`✅ Post ${postId} published manually: ${linkedinPostId}`);

    res.json({
      success: true,
      linkedinPostId,
      message: 'Post published successfully'
    });
  } catch (error: any) {
    console.error('Manual publish error:', error);

    const errorMessage = error.message || 'Failed to publish post';
    const postId = req.params.id;

    // Check if this is a "duplicate" error - means the post was actually published!
    if (errorMessage.toLowerCase().includes('duplicate')) {
      const urnMatch = errorMessage.match(/urn:li:share:(\d+)/);
      const linkedinPostId = urnMatch ? urnMatch[0] : null;

      console.log(`ℹ️ Post ${postId} was already published (duplicate): ${linkedinPostId}`);

      await query(
        `UPDATE generated_posts
         SET status = 'published',
             published_at = NOW(),
             linkedin_post_id = $1,
             failure_reason = NULL
         WHERE id = $2`,
        [linkedinPostId, postId]
      );

      return res.json({
        success: true,
        linkedinPostId,
        message: 'Post was already published on LinkedIn'
      });
    }

    // Update post with failure reason
    await query(
      `UPDATE generated_posts
       SET failure_reason = $1,
           retry_count = COALESCE(retry_count, 0) + 1
       WHERE id = $2`,
      [errorMessage, postId]
    );

    res.status(500).json({
      error: 'Failed to publish post',
      message: errorMessage
    });
  }
});

/**
 * PUT /api/posts/:id
 * Update a scheduled post (content and/or scheduled time)
 */
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const postId = req.params.id;
    const { content, scheduledAt } = req.body;

    console.log(`✏️ Updating post ${postId} for user ${req.userId}...`);

    // Verify ownership and get current status
    const postResult = await query(
      `SELECT id, status FROM generated_posts WHERE id = $1 AND user_id = $2`,
      [postId, req.userId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = postResult.rows[0];

    // Only allow editing scheduled or draft posts
    if (post.status === 'published') {
      return res.status(400).json({ error: 'Cannot edit a published post' });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (content !== undefined) {
      updates.push(`content = $${paramIndex}`);
      values.push(content);
      paramIndex++;
    }

    if (scheduledAt !== undefined) {
      updates.push(`scheduled_at = $${paramIndex}`);
      values.push(scheduledAt);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Reset to scheduled status if it was failed
    if (post.status === 'failed') {
      updates.push(`status = 'scheduled'`);
      updates.push(`failure_reason = NULL`);
      updates.push(`retry_count = 0`);
    }

    updates.push(`updated_at = NOW()`);
    values.push(postId);
    values.push(req.userId);

    const result = await query(
      `UPDATE generated_posts
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
       RETURNING id, content, scheduled_at, status`,
      values
    );

    // Update Redis queue if scheduled time changed
    if (scheduledAt !== undefined && result.rows[0].status === 'scheduled') {
      await SchedulerService.reschedulePost(postId, new Date(scheduledAt));
    }

    console.log(`✅ Post ${postId} updated`);

    res.json({
      success: true,
      post: {
        id: result.rows[0].id,
        content: result.rows[0].content,
        scheduledAt: result.rows[0].scheduled_at,
        status: result.rows[0].status
      }
    });
  } catch (error: any) {
    console.error('Update post error:', error);
    res.status(500).json({
      error: 'Failed to update post',
      message: error.message || 'Unknown error'
    });
  }
});

/**
 * POST /api/posts/bulk-delete
 * Delete multiple scheduled or failed posts at once
 */
router.post('/bulk-delete', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { postIds } = req.body;

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({ error: 'postIds array is required' });
    }

    // Validate all postIds are valid UUIDs to prevent SQL injection
    if (!postIds.every((id: string) => typeof id === 'string' && isValidUUID(id))) {
      return res.status(400).json({ error: 'Invalid post ID format' });
    }

    console.log(`🗑️ Bulk deleting ${postIds.length} posts for user ${req.userId}...`);

    // Verify ownership and filter out published posts
    const postsResult = await query(
      `SELECT id, status FROM generated_posts
       WHERE id = ANY($1) AND user_id = $2`,
      [postIds, req.userId]
    );

    const validPostIds = postsResult.rows
      .filter((post: any) => post.status !== 'published')
      .map((post: any) => post.id);

    const skippedCount = postIds.length - validPostIds.length;

    if (validPostIds.length === 0) {
      return res.status(400).json({
        error: 'No posts to delete',
        message: 'All selected posts are either published or not found'
      });
    }

    // Delete the posts
    const deleteResult = await query(
      `DELETE FROM generated_posts
       WHERE id = ANY($1) AND user_id = $2
       RETURNING id`,
      [validPostIds, req.userId]
    );

    console.log(`✅ Bulk deleted ${deleteResult.rowCount} posts`);

    res.json({
      success: true,
      deletedCount: deleteResult.rowCount,
      skippedCount: skippedCount,
      message: `Successfully deleted ${deleteResult.rowCount} posts${skippedCount > 0 ? ` (${skippedCount} published posts skipped)` : ''}`
    });
  } catch (error: any) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      error: 'Failed to delete posts',
      message: error.message || 'Unknown error'
    });
  }
});

/**
 * DELETE /api/posts/:id
 * Delete a scheduled or failed post
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const postId = req.params.id;

    console.log(`🗑️ Deleting post ${postId} for user ${req.userId}...`);

    // Verify ownership and get current status
    const postResult = await query(
      `SELECT id, status FROM generated_posts WHERE id = $1 AND user_id = $2`,
      [postId, req.userId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = postResult.rows[0];

    // Don't allow deleting published posts
    if (post.status === 'published') {
      return res.status(400).json({ error: 'Cannot delete a published post' });
    }

    // Remove from Redis queue if scheduled
    if (post.status === 'scheduled') {
      await SchedulerService.unschedulePost(postId);
    }

    // Delete the post from database
    await query(
      `DELETE FROM generated_posts WHERE id = $1 AND user_id = $2`,
      [postId, req.userId]
    );

    console.log(`✅ Post ${postId} deleted`);

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error: any) {
    console.error('Delete post error:', error);
    res.status(500).json({
      error: 'Failed to delete post',
      message: error.message || 'Unknown error'
    });
  }
});

/**
 * POST /api/posts/trigger-scheduler
 * Manually trigger the scheduler to process pending posts (admin/debug endpoint)
 */
router.post('/trigger-scheduler', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log(`🔄 Manually triggering scheduler for user ${req.userId}...`);

    // Trigger the scheduler
    await SchedulerService.processScheduledPosts();

    res.json({
      success: true,
      message: 'Scheduler triggered successfully'
    });
  } catch (error) {
    console.error('Trigger scheduler error:', error);
    res.status(500).json({ error: 'Failed to trigger scheduler' });
  }
});

/**
 * GET /api/posts/scheduler-status
 * Get scheduler queue status (for monitoring/debugging)
 */
router.get('/scheduler-status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const status = await SchedulerService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Scheduler status error:', error);
    res.status(500).json({ error: 'Failed to get scheduler status' });
  }
});

/**
 * POST /api/posts/fix-duplicate-failures
 * Fix posts marked as 'failed' due to duplicate error (they were actually published)
 */
router.post('/fix-duplicate-failures', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log(`🔧 Fixing duplicate failure posts for user ${req.userId}...`);

    // Find all failed posts with "duplicate" in failure_reason
    const failedPosts = await query(
      `SELECT id, failure_reason
       FROM generated_posts
       WHERE user_id = $1
         AND status = 'failed'
         AND failure_reason ILIKE '%duplicate%'`,
      [req.userId]
    );

    if (failedPosts.rows.length === 0) {
      return res.json({
        success: true,
        fixedCount: 0,
        message: 'No posts to fix'
      });
    }

    let fixedCount = 0;
    for (const post of failedPosts.rows) {
      // Extract LinkedIn post ID from error message
      const urnMatch = post.failure_reason?.match(/urn:li:share:(\d+)/);
      const linkedinPostId = urnMatch ? urnMatch[0] : null;

      // Mark as published
      await query(
        `UPDATE generated_posts
         SET status = 'published',
             published_at = COALESCE(published_at, NOW()),
             linkedin_post_id = $1,
             failure_reason = NULL
         WHERE id = $2`,
        [linkedinPostId, post.id]
      );

      fixedCount++;
      console.log(`✅ Fixed post ${post.id} → published (${linkedinPostId})`);
    }

    console.log(`🔧 Fixed ${fixedCount} posts`);

    res.json({
      success: true,
      fixedCount,
      message: `Fixed ${fixedCount} post(s) that were incorrectly marked as failed`
    });
  } catch (error: any) {
    console.error('Fix duplicate failures error:', error);
    res.status(500).json({
      error: 'Failed to fix posts',
      message: error.message || 'Unknown error'
    });
  }
});

/**
 * GET /api/analytics
 * Get user analytics and top posts
 */
router.get('/analytics', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log(`📊 Fetching analytics for user ${req.userId}...`);

    // Get user stats
    const statsResult = await query(
      `SELECT
        COUNT(*) as total_posts,
        COALESCE(SUM(likes), 0) as total_likes,
        COALESCE(SUM(comments), 0) as total_comments,
        COALESCE(SUM(impressions), 0) as total_impressions
       FROM linkedin_posts
       WHERE user_id = $1`,
      [req.userId]
    );

    const stats = statsResult.rows[0];
    const totalPosts = parseInt(stats.total_posts);

    // Calculate visibility score (0-100)
    // Only calculate if user has at least 3 posts
    let visibilityScore = 0;
    if (totalPosts >= 3) {
      visibilityScore = Math.min(
        100,
        Math.round(
          (totalPosts * 10 +
            parseInt(stats.total_likes) / 10 +
            parseInt(stats.total_comments) / 5) /
            3
        )
      );
    }

    // Get top posts
    const topPostsResult = await query(
      `SELECT id, content, likes, comments, posted_at
       FROM linkedin_posts
       WHERE user_id = $1
       ORDER BY (likes + comments * 2) DESC
       LIMIT 5`,
      [req.userId]
    );

    const topPosts = topPostsResult.rows.map((row) => ({
      id: row.id,
      title: row.content.substring(0, 50) + '...',
      likes: row.likes || 0,
      comments: row.comments || 0,
      postedAt: row.posted_at,
    }));

    // Calculate score change (mock for now - in production, compare with previous period)
    const scoreChange = 0;

    console.log(`✅ Analytics loaded: visibility ${visibilityScore}`);

    res.json({
      visibilityScore,
      scoreChange,
      topPosts,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

export default router;
