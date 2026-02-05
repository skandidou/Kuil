import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { query } from '../config/database';
import { LinkedInAnalyticsService } from '../services/LinkedInAnalyticsService';

const router = Router();

/**
 * GET /api/analytics
 * Get user analytics - uses LinkedIn Community Management API (separate OAuth app)
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log(`📊 Fetching analytics for user ${req.userId}...`);

    // Get user's LinkedIn Analytics token (Community Management API)
    const userResult = await query(
      `SELECT linkedin_analytics_token, linkedin_analytics_token_expires_at FROM users WHERE id = $1`,
      [req.userId]
    );

    // LinkedIn Community Management API requires special approval
    // For now, we'll use data from published posts instead
    // TODO: Enable when LinkedIn approves the app for member analytics scopes

    // Get stats from published posts in our database
    const postsStatsResult = await query(
      `SELECT
        COUNT(*) as total_posts,
        COALESCE(SUM(likes), 0) as total_likes,
        COALESCE(SUM(comments), 0) as total_comments
       FROM generated_posts
       WHERE user_id = $1 AND status = 'published'`,
      [req.userId]
    );

    const linkedinPostsResult = await query(
      `SELECT
        COUNT(*) as total_posts,
        COALESCE(SUM(likes), 0) as total_likes,
        COALESCE(SUM(comments), 0) as total_comments,
        COALESCE(SUM(shares), 0) as total_shares,
        COALESCE(SUM(impressions), 0) as total_impressions
       FROM linkedin_posts
       WHERE user_id = $1`,
      [req.userId]
    );

    const postsStats = postsStatsResult.rows[0];
    const linkedinStats = linkedinPostsResult.rows[0];

    // Calculate a basic visibility score based on available data
    const totalPosts = parseInt(postsStats.total_posts || '0') + parseInt(linkedinStats.total_posts || '0');
    const totalEngagement = parseInt(linkedinStats.total_likes || '0') +
                           parseInt(linkedinStats.total_comments || '0') +
                           parseInt(linkedinStats.total_shares || '0');
    const totalImpressions = parseInt(linkedinStats.total_impressions || '0');

    // Simple visibility score based on posts and engagement
    let visibilityScore = 0;
    if (totalPosts > 0) {
      visibilityScore = Math.min(100, totalPosts * 5 + totalEngagement * 2);
    }

    const scoreChange = 0; // No historical data yet

    // Get generated posts count
    const generatedCountResult = await query(
      `SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published
       FROM generated_posts
       WHERE user_id = $1`,
      [req.userId]
    );
    const generatedCount = generatedCountResult.rows[0];
    const totalGeneratedPosts = parseInt(generatedCount.total || '0', 10);
    const publishedPosts = parseInt(generatedCount.published || '0', 10);

    // Get average hook score
    const hookScoreResult = await query(
      `SELECT AVG(hook_score) as avg_score
       FROM generated_posts
       WHERE user_id = $1 AND hook_score IS NOT NULL`,
      [req.userId]
    );
    const avgHookScore = Math.round(parseFloat(hookScoreResult.rows[0]?.avg_score || '0'));

    // Get top LinkedIn posts for display (from cache)
    const topPostsResult = await query(
      `SELECT
        id,
        content,
        likes,
        comments,
        shares,
        impressions,
        posted_at
       FROM linkedin_posts
       WHERE user_id = $1
       ORDER BY (likes + comments * 2 + shares * 3) DESC
       LIMIT 10`,
      [req.userId]
    );

    const analytics = {
      // Analytics connection status - always true since we use local data
      analyticsConnected: true,

      // Calculated from local data
      visibilityScore,
      scoreChange,
      followerCount: 0, // Would need LinkedIn API approval
      connectionCount: 0, // Would need LinkedIn API approval
      totalImpressions,
      totalMembersReached: 0,
      totalReactions: parseInt(linkedinStats.total_likes || '0'),
      totalComments: parseInt(linkedinStats.total_comments || '0'),
      totalReshares: parseInt(linkedinStats.total_shares || '0'),
      engagementRate: totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0,

      // Post counts
      totalPosts,
      publishedPosts: parseInt(postsStats.total_posts || '0'),
      draftPosts: 0,
      totalEngagement,
      totalLikes: parseInt(linkedinStats.total_likes || '0'),
      totalShares: parseInt(linkedinStats.total_shares || '0'),
      avgHookScore: 0,

      // Top posts from linkedin_posts table
      topPosts: topPostsResult.rows.map((post) => ({
        id: post.id,
        title: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
        likes: post.likes || 0,
        comments: post.comments || 0,
        impressions: post.impressions || 0,
        postedAt: post.posted_at,
      })),

      // Metadata
      lastUpdated: new Date().toISOString(),
      message: totalPosts === 0 ? 'Publiez des posts pour voir vos statistiques' : null,
    };

    console.log(`✅ Analytics fetched: visibility=${visibilityScore}, posts=${totalPosts}, impressions=${totalImpressions}`);

    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * GET /api/analytics/followers
 * Get follower statistics and trends
 */
router.get('/followers', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log(`👥 Fetching follower analytics for user ${req.userId}...`);

    // Get user's LinkedIn Analytics token
    const userResult = await query(
      `SELECT linkedin_analytics_token FROM users WHERE id = $1`,
      [req.userId]
    );

    if (!userResult.rows[0]?.linkedin_analytics_token) {
      return res.status(403).json({ error: 'ANALYTICS_NOT_CONNECTED', message: 'Please connect LinkedIn Analytics' });
    }

    const accessToken = userResult.rows[0].linkedin_analytics_token;

    try {
      // Get current follower count
      const followerCount = await LinkedInAnalyticsService.getFollowerCount(accessToken);

      // Get follower trends for the last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const trends = await LinkedInAnalyticsService.getFollowerTrends(accessToken, startDate, endDate);

      // Calculate change from previous period
      const previousSnapshot = await query(
        `SELECT follower_count FROM analytics_snapshots
         WHERE user_id = $1
         ORDER BY snapshot_date DESC
         OFFSET 1 LIMIT 1`,
        [req.userId]
      );

      const previousCount = previousSnapshot.rows[0]?.follower_count || followerCount;
      const change = followerCount - previousCount;
      const changePercent = previousCount > 0 ? (change / previousCount) * 100 : 0;

      res.json({
        currentCount: followerCount,
        previousCount,
        change,
        changePercent: Math.round(changePercent * 100) / 100,
        trends: trends.map((t) => ({
          date: t.date.toISOString().split('T')[0],
          count: t.count,
        })),
      });
    } catch (error: any) {
      if (error.message === 'SCOPE_UPGRADE_REQUIRED') {
        return res.status(403).json({
          error: 'SCOPE_UPGRADE_REQUIRED',
          message: 'Please reconnect your LinkedIn account to access follower analytics',
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Get follower analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch follower analytics' });
  }
});

/**
 * GET /api/analytics/network
 * Get network size (1st degree connections)
 */
router.get('/network', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log(`🔗 Fetching network size for user ${req.userId}...`);

    // Get user's LinkedIn Analytics token
    const userResult = await query(
      `SELECT linkedin_analytics_token FROM users WHERE id = $1`,
      [req.userId]
    );

    if (!userResult.rows[0]?.linkedin_analytics_token) {
      return res.status(403).json({ error: 'ANALYTICS_NOT_CONNECTED', message: 'Please connect LinkedIn Analytics' });
    }

    const accessToken = userResult.rows[0].linkedin_analytics_token;

    try {
      const connectionCount = await LinkedInAnalyticsService.getNetworkSize(accessToken);

      res.json({
        connectionCount,
      });
    } catch (error: any) {
      if (error.message === 'SCOPE_UPGRADE_REQUIRED') {
        return res.status(403).json({
          error: 'SCOPE_UPGRADE_REQUIRED',
          message: 'Please reconnect your LinkedIn account to access network data',
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Get network size error:', error);
    res.status(500).json({ error: 'Failed to fetch network size' });
  }
});

/**
 * POST /api/analytics/sync
 * Force refresh analytics from LinkedIn API
 */
router.post('/sync', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log(`🔄 Force syncing analytics for user ${req.userId}...`);

    // Get user's LinkedIn Analytics token
    const userResult = await query(
      `SELECT linkedin_analytics_token FROM users WHERE id = $1`,
      [req.userId]
    );

    if (!userResult.rows[0]?.linkedin_analytics_token) {
      return res.status(403).json({ error: 'ANALYTICS_NOT_CONNECTED', message: 'Please connect LinkedIn Analytics' });
    }

    const accessToken = userResult.rows[0].linkedin_analytics_token;

    try {
      const snapshot = await LinkedInAnalyticsService.fetchAndStoreAnalytics(
        req.userId!,
        accessToken
      );

      res.json({
        success: true,
        snapshot: {
          visibilityScore: snapshot.visibilityScore,
          followerCount: snapshot.followerCount,
          connectionCount: snapshot.connectionCount,
          totalImpressions: snapshot.totalImpressions,
          engagementRate: snapshot.engagementRate,
          snapshotDate: snapshot.snapshotDate,
        },
      });
    } catch (error: any) {
      if (error.message === 'SCOPE_UPGRADE_REQUIRED') {
        return res.status(403).json({
          error: 'SCOPE_UPGRADE_REQUIRED',
          message: 'Please reconnect your LinkedIn account to sync analytics',
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Sync analytics error:', error);
    res.status(500).json({ error: 'Failed to sync analytics' });
  }
});

/**
 * GET /api/analytics/engagement-trends
 * Get engagement trends over time
 */
router.get('/engagement-trends', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log(`📈 Fetching engagement trends for user ${req.userId}...`);

    const trendsResult = await query(
      `SELECT
        DATE_TRUNC('day', published_at) as date,
        COUNT(*) as posts_count,
        SUM(likes) as total_likes,
        SUM(comments) as total_comments
       FROM generated_posts
       WHERE user_id = $1 AND status = 'published' AND published_at IS NOT NULL
       GROUP BY DATE_TRUNC('day', published_at)
       ORDER BY date DESC
       LIMIT 30`,
      [req.userId]
    );

    const trends = trendsResult.rows.map((row) => ({
      date: row.date,
      postsCount: parseInt(row.posts_count, 10),
      likes: parseInt(row.total_likes || '0', 10),
      comments: parseInt(row.total_comments || '0', 10),
      engagement: parseInt(row.total_likes || '0', 10) + parseInt(row.total_comments || '0', 10),
    }));

    res.json({ trends });
  } catch (error) {
    console.error('Get engagement trends error:', error);
    res.status(500).json({ error: 'Failed to fetch engagement trends' });
  }
});

/**
 * GET /api/analytics/top-posts
 * Get top performing posts
 */
router.get('/top-posts', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log(`🏆 Fetching top posts for user ${req.userId}...`);

    const topPostsResult = await query(
      `SELECT
        id,
        content,
        hook_score,
        likes,
        comments,
        (likes + comments * 2) as engagement_score,
        published_at
       FROM generated_posts
       WHERE user_id = $1 AND status = 'published'
       ORDER BY (likes + comments * 2) DESC
       LIMIT 10`,
      [req.userId]
    );

    const topPosts = topPostsResult.rows.map((post) => ({
      id: post.id,
      content: post.content,
      hookScore: post.hook_score,
      likes: post.likes,
      comments: post.comments,
      engagementScore: parseInt(post.engagement_score, 10),
      publishedAt: post.published_at,
    }));

    res.json({ topPosts });
  } catch (error) {
    console.error('Get top posts error:', error);
    res.status(500).json({ error: 'Failed to fetch top posts' });
  }
});

/**
 * GET /api/analytics/insights
 * Generate AI-powered insights based on user's actual data - NEVER hardcoded
 */
router.get('/insights', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log(`💡 Generating AI insights for user ${req.userId}...`);

    // Gather ALL user data for analysis
    const [postsResult, linkedinPostsResult, linkedinStatsResult, voiceResult, userResult] = await Promise.all([
      query(
        `SELECT content, hook_score, status, scheduled_at, published_at, created_at
         FROM generated_posts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
        [req.userId]
      ),
      query(
        `SELECT content, likes, comments, shares, impressions, posted_at
         FROM linkedin_posts WHERE user_id = $1 ORDER BY posted_at DESC LIMIT 20`,
        [req.userId]
      ),
      // Get aggregated LinkedIn stats
      query(
        `SELECT
          COUNT(*) as total_posts,
          COALESCE(SUM(likes), 0) as total_likes,
          COALESCE(SUM(comments), 0) as total_comments,
          COALESCE(SUM(shares), 0) as total_shares,
          COALESCE(SUM(impressions), 0) as total_impressions
         FROM linkedin_posts WHERE user_id = $1`,
        [req.userId]
      ),
      query(
        `SELECT primary_tone, formal, bold, empathetic, complexity, brevity, confidence
         FROM voice_signatures WHERE user_id = $1`,
        [req.userId]
      ),
      query(
        `SELECT name, role, headline, created_at FROM users WHERE id = $1`,
        [req.userId]
      ),
    ]);

    const posts = postsResult.rows;
    const linkedinPosts = linkedinPostsResult.rows;
    const linkedinStats = linkedinStatsResult.rows[0];
    const voiceSignature = voiceResult.rows[0];
    const user = userResult.rows[0];

    console.log(`📊 Insights data: ${posts.length} generated posts, ${linkedinPosts.length} LinkedIn posts, ${linkedinStats?.total_impressions || 0} impressions`);

    // Build comprehensive context for AI
    const context: any = {
      user: {
        name: user?.name,
        role: user?.role,
        headline: user?.headline,
        daysSinceJoined: user?.created_at
          ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      },
      voiceSignature: voiceSignature ? {
        primaryTone: voiceSignature.primary_tone,
        formal: voiceSignature.formal,
        bold: voiceSignature.bold,
        empathetic: voiceSignature.empathetic,
        complexity: voiceSignature.complexity,
        brevity: voiceSignature.brevity,
        confidence: voiceSignature.confidence,
      } : null,
      generatedPosts: {
        total: posts.length,
        published: posts.filter(p => p.status === 'published').length,
        scheduled: posts.filter(p => p.status === 'scheduled').length,
        drafts: posts.filter(p => p.status === 'draft').length,
        failed: posts.filter(p => p.status === 'failed').length,
        avgHookScore: posts.filter(p => p.hook_score).length > 0
          ? Math.round(posts.filter(p => p.hook_score).reduce((sum, p) => sum + p.hook_score, 0) / posts.filter(p => p.hook_score).length)
          : null,
        recentPosts: posts.slice(0, 5).map(p => ({
          content: p.content?.substring(0, 150),
          hookScore: p.hook_score,
          status: p.status,
        })),
      },
      linkedinPosts: {
        total: parseInt(linkedinStats?.total_posts || '0', 10),
        totalLikes: parseInt(linkedinStats?.total_likes || '0', 10),
        totalComments: parseInt(linkedinStats?.total_comments || '0', 10),
        totalShares: parseInt(linkedinStats?.total_shares || '0', 10),
        totalImpressions: parseInt(linkedinStats?.total_impressions || '0', 10),
        avgEngagement: linkedinPosts.length > 0
          ? Math.round(linkedinPosts.reduce((sum, p) => sum + (p.likes || 0) + (p.comments || 0), 0) / linkedinPosts.length)
          : null,
        avgImpressionsPerPost: linkedinPosts.length > 0
          ? Math.round(parseInt(linkedinStats?.total_impressions || '0', 10) / linkedinPosts.length)
          : null,
        topPost: linkedinPosts.length > 0
          ? linkedinPosts.sort((a, b) => ((b.likes || 0) + (b.comments || 0)) - ((a.likes || 0) + (a.comments || 0)))[0]
          : null,
        recentPosts: linkedinPosts.slice(0, 5).map(p => ({
          content: p.content?.substring(0, 100),
          likes: p.likes || 0,
          comments: p.comments || 0,
          impressions: p.impressions || 0,
        })),
      },
    };

    // Use Gemini to generate personalized insights
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const { config } = await import('../config/env');

    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a LinkedIn growth expert analyzing a user's REAL performance data. Generate 3 personalized, actionable insights in French.

USER DATA:
${JSON.stringify(context, null, 2)}

RULES:
1. ONLY use data provided above - NEVER invent or make up statistics
2. Reference SPECIFIC numbers from their data (impressions, likes, posts count, etc.)
3. Be direct and actionable - tell them exactly what to do next
4. If they have impressions data, analyze their reach and engagement rate
5. Keep each insight to 1-2 sentences max
6. Use **bold** for key metrics and actions
7. Write in French

EXAMPLES OF GOOD INSIGHTS:
- "Avec **1300+ impressions** sur vos posts, votre contenu touche une audience solide. Publiez **2-3 fois par semaine** pour maximiser cette portée."
- "Votre taux d'engagement de **X%** est au-dessus de la moyenne LinkedIn. Continuez à créer du contenu qui génère des **commentaires**."
- "Vous avez **5 posts publiés** - les créateurs LinkedIn qui publient régulièrement voient 3x plus de visibilité."

Return ONLY a valid JSON array:
[
  {"icon": "bolt.fill", "text": "Your insight in French referencing their actual data"},
  {"icon": "chart.line.uptrend.xyaxis", "text": "Another data-driven insight in French"},
  {"icon": "lightbulb.fill", "text": "Third actionable recommendation in French"}
]

ICON OPTIONS: bolt.fill, chart.line.uptrend.xyaxis, lightbulb.fill, flame.fill, calendar, person.fill`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in AI response');
    }

    const insights = JSON.parse(jsonMatch[0]);

    // Validate insights structure
    if (!Array.isArray(insights) || insights.length === 0) {
      throw new Error('Invalid insights format');
    }

    console.log(`✅ Generated ${insights.length} personalized AI insights`);

    res.json({ insights });
  } catch (error: any) {
    console.error('Generate insights error:', error.message);

    // Instead of returning an error, return empty insights
    // The frontend should handle this gracefully
    res.json({ insights: [] });
  }
});

/**
 * POST /api/analytics/track-share
 * Track when a user shares a post (for viral growth metrics)
 * This helps measure viral coefficient and identify shareable content
 */
router.post('/track-share', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { postId, platform } = req.body;

    // Log share event (in production, this would go to analytics DB or event stream)
    console.log('📊 Share tracked:', {
      userId: req.userId,
      postId,
      platform, // 'instagram', 'twitter', 'linkedin', 'copy', 'image'
      timestamp: new Date().toISOString(),
    });

    // Future: Store in shares table for viral coefficient analysis
    // This enables tracking:
    // - Which content types are most shareable
    // - Which platforms drive the most shares
    // - Viral coefficient (shares per user)
    // - Attribution tracking (shares -> new signups)

    res.json({ success: true });
  } catch (error) {
    console.error('Track share error:', error);
    res.status(500).json({ error: 'Failed to track share' });
  }
});

export default router;
