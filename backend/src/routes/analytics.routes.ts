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

    const analyticsToken = userResult.rows[0]?.linkedin_analytics_token;
    const analyticsTokenExpiry = userResult.rows[0]?.linkedin_analytics_token_expires_at;

    // Variables for analytics data
    let visibilityScore = 0;
    let scoreChange = 0;
    let followerCount = 0;
    let totalImpressions = 0;
    let totalReactions = 0;
    let totalComments = 0;
    let totalReshares = 0;
    let analyticsConnected = false;

    // Try to get real LinkedIn data if token exists
    if (analyticsToken && (!analyticsTokenExpiry || new Date(analyticsTokenExpiry) > new Date())) {
      console.log('📊 Analytics token found, testing LinkedIn API...');
      console.log('📊 Token (encrypted preview):', analyticsToken.substring(0, 50) + '...');

      try {
        // Fetch data from LinkedIn API with error tracking
        const apiErrors: string[] = [];

        const [followers, impressions, reactions, comments, reshares] = await Promise.all([
          LinkedInAnalyticsService.getFollowerCount(analyticsToken).catch((e) => {
            apiErrors.push(`followers: ${e.message}`);
            console.error('❌ getFollowerCount failed:', e.message);
            return 0;
          }),
          LinkedInAnalyticsService.getAggregatedPostAnalytics(analyticsToken, 'IMPRESSION').catch((e) => {
            apiErrors.push(`impressions: ${e.message}`);
            console.error('❌ getImpression failed:', e.message);
            return 0;
          }),
          LinkedInAnalyticsService.getAggregatedPostAnalytics(analyticsToken, 'REACTION').catch((e) => {
            console.error('❌ getReaction failed:', e.message);
            return 0;
          }),
          LinkedInAnalyticsService.getAggregatedPostAnalytics(analyticsToken, 'COMMENT').catch((e) => {
            console.error('❌ getComment failed:', e.message);
            return 0;
          }),
          LinkedInAnalyticsService.getAggregatedPostAnalytics(analyticsToken, 'RESHARE').catch((e) => {
            console.error('❌ getReshare failed:', e.message);
            return 0;
          }),
        ]);

        // Only mark as connected if we got SOME data or no critical errors
        if (apiErrors.length > 0 && followers === 0 && impressions === 0) {
          console.log('⚠️ LinkedIn API calls failed, marking as NOT connected');
          console.log('⚠️ Errors:', apiErrors);
          analyticsConnected = false;
        } else {
          analyticsConnected = true;
          followerCount = followers;
          totalImpressions = impressions;
          totalReactions = reactions;
          totalComments = comments;
          totalReshares = reshares;

          // Calculate visibility score with balanced formula
          // New users (3 followers, 2K impressions) = ~15-20
          // Growing creators (500 followers, 50K impressions) = ~50
          // Established creators (5000+ followers, 500K+ impressions) = ~85-100
          const followerScore = Math.min(30, Math.log10(Math.max(followerCount, 1) + 1) * 10);
          const impressionScore = Math.min(30, Math.log10(Math.max(totalImpressions, 1) + 1) * 8);
          const reactionScore = Math.min(20, Math.log10(Math.max(totalReactions, 1) + 1) * 7);
          const commentScore = Math.min(15, Math.log10(Math.max(totalComments, 1) + 1) * 8);
          const reshareScore = Math.min(5, Math.log10(Math.max(totalReshares, 1) + 1) * 5);

          visibilityScore = Math.min(100,
            Math.round(followerScore + impressionScore + reactionScore + commentScore + reshareScore)
          );

          console.log(`📊 Visibility breakdown: followers=${followerScore.toFixed(1)}, impressions=${impressionScore.toFixed(1)}, reactions=${reactionScore.toFixed(1)}, comments=${commentScore.toFixed(1)}, reshares=${reshareScore.toFixed(1)} = ${visibilityScore}`);

          console.log(`✅ LinkedIn data: followers=${followerCount}, impressions=${totalImpressions}, reactions=${totalReactions}`);
        }
      } catch (error: any) {
        console.error('❌ LinkedIn API global error:', error.message);
        analyticsConnected = false;
      }
    }

    // Fallback: Get stats from local database
    const postsStatsResult = await query(
      `SELECT COUNT(*) as total_posts FROM generated_posts WHERE user_id = $1 AND status = 'published'`,
      [req.userId]
    );
    const localPosts = parseInt(postsStatsResult.rows[0]?.total_posts || '0');

    // If no LinkedIn data, use local posts for basic score
    if (visibilityScore === 0 && localPosts > 0) {
      visibilityScore = Math.min(100, localPosts * 5);
    }

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

    const totalEngagement = totalReactions + totalComments + totalReshares;

    const analytics = {
      // Analytics connection status
      analyticsConnected,

      // LinkedIn API data (real if connected, 0 otherwise)
      visibilityScore,
      scoreChange,
      followerCount,
      connectionCount: 0,
      totalImpressions,
      totalMembersReached: 0,
      totalReactions,
      totalComments,
      totalReshares,
      engagementRate: totalImpressions > 0 ? Math.round((totalEngagement / totalImpressions) * 100 * 100) / 100 : 0,

      // Post counts from local DB
      totalPosts: localPosts,
      publishedPosts,
      draftPosts: totalGeneratedPosts - publishedPosts,
      totalEngagement,
      totalLikes: totalReactions,
      totalShares: totalReshares,
      avgHookScore,

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
      message: !analyticsConnected ? 'Connectez LinkedIn Analytics pour voir vos vraies stats' : (localPosts === 0 ? 'Publiez des posts pour voir vos statistiques' : null),
    };

    console.log(`✅ Analytics fetched: connected=${analyticsConnected}, visibility=${visibilityScore}, followers=${followerCount}, impressions=${totalImpressions}`);

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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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

    console.log('🤖 Calling Gemini API...');
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    console.log('🤖 Gemini raw response (first 500 chars):', responseText.substring(0, 500));

    // Parse response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('❌ No valid JSON array in Gemini response');
      throw new Error('No valid JSON in AI response');
    }

    const insights = JSON.parse(jsonMatch[0]);

    // Validate insights structure
    if (!Array.isArray(insights) || insights.length === 0) {
      console.error('❌ Invalid insights format:', insights);
      throw new Error('Invalid insights format');
    }

    console.log(`✅ Generated ${insights.length} personalized AI insights`);

    res.json({ insights });
  } catch (error: any) {
    console.error('❌ Generate insights error:', {
      message: error.message,
      name: error.name,
      status: error.status,
      stack: error.stack?.substring(0, 300),
    });

    // Return a simple fallback insight when AI fails
    // We can't access context here as it may not be defined if error occurred early
    const fallbackInsights = [
      {
        icon: 'lightbulb.fill',
        text: 'Continuez à publier régulièrement pour débloquer des insights personnalisés basés sur vos performances LinkedIn.',
      },
    ];

    console.log(`⚠️ Using fallback insight due to Gemini error`);
    res.json({ insights: fallbackInsights });
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

/**
 * GET /api/analytics/best-times
 * Get best times to post based on user's historical engagement data
 * Returns a heatmap (7 days x 24 hours) with engagement scores
 */
router.get('/best-times', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log(`📅 Fetching best posting times for user ${req.userId}...`);

    // Get user's posts with engagement data by day/hour
    const postsResult = await query(
      `SELECT
        EXTRACT(DOW FROM posted_at) as day_of_week,
        EXTRACT(HOUR FROM posted_at) as hour,
        AVG(COALESCE(likes, 0) + COALESCE(comments, 0) * 2 + COALESCE(shares, 0) * 3) as avg_engagement,
        COUNT(*) as post_count
       FROM linkedin_posts
       WHERE user_id = $1 AND posted_at IS NOT NULL
       GROUP BY day_of_week, hour
       ORDER BY avg_engagement DESC`,
      [req.userId]
    );

    // Also check generated_posts that were published
    const generatedResult = await query(
      `SELECT
        EXTRACT(DOW FROM published_at) as day_of_week,
        EXTRACT(HOUR FROM published_at) as hour,
        COUNT(*) as post_count
       FROM generated_posts
       WHERE user_id = $1 AND status = 'published' AND published_at IS NOT NULL
       GROUP BY day_of_week, hour`,
      [req.userId]
    );

    // Create a 7x24 heatmap matrix (days x hours)
    // Initialize with zeros
    const heatmapData: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));

    // Fill with user's actual data
    let hasUserData = false;
    for (const row of postsResult.rows) {
      const day = parseInt(row.day_of_week);
      const hour = parseInt(row.hour);
      const engagement = parseFloat(row.avg_engagement) || 0;
      if (day >= 0 && day < 7 && hour >= 0 && hour < 24) {
        heatmapData[day][hour] = Math.round(engagement * 10); // Scale for visibility
        hasUserData = true;
      }
    }

    // If not enough user data, use LinkedIn best practices defaults
    // These are based on general LinkedIn engagement research
    if (!hasUserData || postsResult.rows.length < 3) {
      console.log('📅 Using LinkedIn defaults (not enough user data)');

      // Default best times based on LinkedIn research:
      // Best days: Tuesday, Wednesday, Thursday
      // Best hours: 7-8am, 12pm, 5-6pm (business hours)
      const defaultBestTimes = [
        // Tuesday (day=2) - Best day
        { day: 2, hour: 8, score: 100 },
        { day: 2, hour: 12, score: 95 },
        { day: 2, hour: 17, score: 90 },
        // Wednesday (day=3)
        { day: 3, hour: 9, score: 88 },
        { day: 3, hour: 12, score: 85 },
        { day: 3, hour: 18, score: 80 },
        // Thursday (day=4)
        { day: 4, hour: 8, score: 82 },
        { day: 4, hour: 12, score: 78 },
        { day: 4, hour: 17, score: 75 },
        // Monday (day=1)
        { day: 1, hour: 8, score: 70 },
        { day: 1, hour: 12, score: 68 },
        // Friday (day=5)
        { day: 5, hour: 9, score: 60 },
        { day: 5, hour: 12, score: 55 },
        // Weekend - lower engagement
        { day: 0, hour: 10, score: 30 }, // Sunday
        { day: 6, hour: 11, score: 35 }, // Saturday
      ];

      for (const slot of defaultBestTimes) {
        heatmapData[slot.day][slot.hour] = slot.score;
        // Add some adjacent hours with lower scores for smoother visualization
        if (slot.hour > 0) heatmapData[slot.day][slot.hour - 1] = Math.round(slot.score * 0.6);
        if (slot.hour < 23) heatmapData[slot.day][slot.hour + 1] = Math.round(slot.score * 0.6);
      }
    }

    // Normalize heatmap to 0-100 scale
    const maxValue = Math.max(...heatmapData.flat());
    if (maxValue > 0) {
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          heatmapData[day][hour] = Math.round((heatmapData[day][hour] / maxValue) * 100);
        }
      }
    }

    // Get top 5 slots for quick display
    const allSlots: { day: number; hour: number; score: number }[] = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        if (heatmapData[day][hour] > 0) {
          allSlots.push({ day, hour, score: heatmapData[day][hour] });
        }
      }
    }
    const topSlots = allSlots.sort((a, b) => b.score - a.score).slice(0, 5);

    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    console.log(`✅ Best times calculated: ${topSlots.length} top slots, data source: ${hasUserData ? 'user_data' : 'linkedin_defaults'}`);

    res.json({
      heatmap: heatmapData,
      topSlots: topSlots.map(slot => ({
        dayOfWeek: slot.day,
        dayName: dayNames[slot.day],
        hour: slot.hour,
        hourFormatted: `${slot.hour}:00`,
        score: slot.score,
      })),
      dataSource: hasUserData && postsResult.rows.length >= 3 ? 'user_data' : 'linkedin_defaults',
      totalPostsAnalyzed: postsResult.rows.length + generatedResult.rows.length,
    });
  } catch (error) {
    console.error('Best times error:', error);
    res.status(500).json({ error: 'Failed to fetch best posting times' });
  }
});

export default router;
