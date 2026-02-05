import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { query } from '../config/database';
import { LinkedInService } from '../services/LinkedInService';
import { ApifyService } from '../services/ApifyService';
import { linkedinPublishLimiter } from '../middleware/rate-limiters';

const router = Router();

/**
 * GET /api/linkedin/profile
 * Get user's LinkedIn profile
 */
router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userResult = await query(
      `SELECT linkedin_id, name, email, profile_picture, headline FROM users WHERE id = $1`,
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    res.json({
      linkedinId: user.linkedin_id,
      name: user.name,
      email: user.email,
      profilePicture: user.profile_picture,
      headline: user.headline,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * GET /api/linkedin/posts
 * Fetch user's LinkedIn posts
 */
router.get('/posts', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Get user with tokens
    const userResult = await query(
      `SELECT linkedin_id, linkedin_access_token FROM users WHERE id = $1`,
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    if (!user.linkedin_access_token) {
      return res.status(400).json({ error: 'LinkedIn not connected' });
    }

    // Fetch posts from LinkedIn API
    const posts = await LinkedInService.getUserPosts(
      user.linkedin_id,
      user.linkedin_access_token
    );

    // Cache posts in database
    await LinkedInService.cacheUserPosts(req.userId!, posts);

    // Return posts from database
    const cachedPosts = await query(
      `SELECT linkedin_post_id, content, likes, comments, shares, impressions, posted_at
       FROM linkedin_posts
       WHERE user_id = $1
       ORDER BY posted_at DESC
       LIMIT 50`,
      [req.userId]
    );

    res.json({
      posts: cachedPosts.rows.map((post) => ({
        id: post.linkedin_post_id,
        content: post.content,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        impressions: post.impressions,
        postedAt: post.posted_at,
      })),
    });
  } catch (error) {
    console.error('Fetch posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

/**
 * POST /api/linkedin/publish
 * Publish a new post to LinkedIn
 * Rate limited to 10 posts/hour to prevent spam and abuse
 */
router.post('/publish', linkedinPublishLimiter, authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Get user with tokens
    const userResult = await query(
      `SELECT linkedin_id, linkedin_access_token FROM users WHERE id = $1`,
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    if (!user.linkedin_access_token) {
      return res.status(400).json({ error: 'LinkedIn not connected' });
    }

    // Publish to LinkedIn
    const postId = await LinkedInService.publishPost(
      user.linkedin_id,
      user.linkedin_access_token,
      content
    );

    // Update generated post status if this was a generated post
    if (req.body.generatedPostId) {
      await query(
        `UPDATE generated_posts
         SET status = 'published', published_post_id = $1, published_at = NOW()
         WHERE id = $2 AND user_id = $3`,
        [postId, req.body.generatedPostId, req.userId]
      );
    }

    res.json({
      success: true,
      postId,
      message: 'Post published successfully',
    });
  } catch (error) {
    console.error('Publish post error:', error);
    res.status(500).json({ error: 'Failed to publish post' });
  }
});

/**
 * POST /api/linkedin/sync-posts
 * Sync user's LinkedIn posts using Apify scraper
 * This allows AI to analyze writing style from existing posts
 */
router.post('/sync-posts', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { profileUrl } = req.body;

    console.log(`🔄 Syncing LinkedIn posts for user ${req.userId}...`);

    // Check if Apify is configured
    if (!ApifyService.isConfigured()) {
      return res.status(503).json({
        error: 'Post scraping not available',
        message: 'LinkedIn post analysis is not currently configured',
      });
    }

    // Get or use provided profile URL
    let linkedinProfileUrl = profileUrl;

    if (!linkedinProfileUrl) {
      // Try to get from user's LinkedIn ID
      const userResult = await query(
        `SELECT linkedin_id FROM users WHERE id = $1`,
        [req.userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const linkedinId = userResult.rows[0].linkedin_id;
      if (linkedinId) {
        linkedinProfileUrl = `https://www.linkedin.com/in/${linkedinId}`;
      }
    }

    if (!linkedinProfileUrl) {
      return res.status(400).json({
        error: 'Profile URL required',
        message: 'Please provide your LinkedIn profile URL',
      });
    }

    // Scrape posts using Apify
    const postsCount = await ApifyService.syncUserPosts(req.userId!, linkedinProfileUrl);

    console.log(`✅ Scraped and synced ${postsCount} LinkedIn posts`);

    res.json({
      success: true,
      postsCount,
      message: postsCount > 0
        ? `Successfully analyzed ${postsCount} posts from your LinkedIn profile`
        : 'No posts found on your LinkedIn profile',
    });
  } catch (error) {
    console.error('Sync posts error:', error);
    res.status(500).json({ error: 'Failed to sync posts' });
  }
});

/**
 * GET /api/linkedin/posts-status
 * Check if user has synced LinkedIn posts for voice analysis
 */
router.get('/posts-status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT COUNT(*) as count, MAX(fetched_at) as last_synced
       FROM linkedin_posts WHERE user_id = $1`,
      [req.userId]
    );

    const count = parseInt(result.rows[0].count || '0', 10);
    const lastSynced = result.rows[0].last_synced;

    res.json({
      hasPosts: count > 0,
      postsCount: count,
      lastSynced,
      canAnalyze: count >= 5, // Need at least 5 posts for good voice analysis
    });
  } catch (error) {
    console.error('Posts status error:', error);
    res.status(500).json({ error: 'Failed to get posts status' });
  }
});

export default router;
