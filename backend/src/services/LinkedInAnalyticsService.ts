import axios, { AxiosError } from 'axios';
import { config } from '../config/env';
import { query } from '../config/database';
import { AuthService } from './AuthService';

// Types for LinkedIn Community Management API responses
interface PostAnalyticsElement {
  creatorPostAnalytics: {
    queryType: string;
    count: number;
  };
}

interface FollowerCountElement {
  memberFollowersCount: {
    followerCount: number;
  };
}

interface FollowerTrendElement {
  memberFollowersCount: {
    followerCount: number;
    dateRange: {
      start: { day: number; month: number; year: number };
      end: { day: number; month: number; year: number };
    };
  };
}

export interface AnalyticsSnapshot {
  id: string;
  userId: string;
  followerCount: number;
  connectionCount: number;
  totalImpressions: number;
  totalMembersReached: number;
  totalReactions: number;
  totalComments: number;
  totalReshares: number;
  visibilityScore: number;
  engagementRate: number;
  snapshotDate: Date;
}

export interface PostAnalytics {
  postUrn: string;
  impressions: number;
  membersReached: number;
  reactions: number;
  comments: number;
  reshares: number;
  engagementRate: number;
}

export class LinkedInAnalyticsService {
  private static readonly REST_API_URL = config.linkedinAnalytics.restApiUrl;
  private static readonly API_VERSION = config.linkedinAnalytics.apiVersion;

  /**
   * Get headers for LinkedIn REST API calls
   */
  private static getHeaders(accessToken: string) {
    return {
      Authorization: `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'Linkedin-Version': this.API_VERSION,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Handle LinkedIn API errors and detect scope issues
   */
  private static handleApiError(error: AxiosError, operation: string): never {
    const status = error.response?.status;
    const data = error.response?.data as any;

    console.error(`❌ LinkedIn ${operation} error:`, {
      status,
      data: data?.message || data,
    });

    // Check for scope/permission errors
    if (status === 403) {
      const errorMsg = data?.message || '';
      if (
        errorMsg.includes('scope') ||
        errorMsg.includes('permission') ||
        errorMsg.includes('unauthorized')
      ) {
        throw new Error('SCOPE_UPGRADE_REQUIRED');
      }
    }

    throw new Error(`Failed to ${operation}: ${data?.message || error.message}`);
  }

  /**
   * Get lifetime follower count for authenticated member
   * Endpoint: GET /rest/memberFollowersCount?q=me
   */
  static async getFollowerCount(accessToken: string): Promise<number> {
    try {
      const decryptedToken = AuthService.decryptToken(accessToken);

      const response = await axios.get<{ elements: FollowerCountElement[] }>(
        `${this.REST_API_URL}/memberFollowersCount?q=me`,
        { headers: this.getHeaders(decryptedToken) }
      );

      const element = response.data.elements?.[0];
      return element?.memberFollowersCount?.followerCount || 0;
    } catch (error: any) {
      if (error.message === 'SCOPE_UPGRADE_REQUIRED') throw error;
      this.handleApiError(error, 'get follower count');
    }
  }

  /**
   * Get follower trends over a date range
   * Endpoint: GET /rest/memberFollowersCount?q=dateRange
   */
  static async getFollowerTrends(
    accessToken: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ date: Date; count: number }[]> {
    try {
      const decryptedToken = AuthService.decryptToken(accessToken);

      const start = {
        day: startDate.getDate(),
        month: startDate.getMonth() + 1,
        year: startDate.getFullYear(),
      };
      const end = {
        day: endDate.getDate(),
        month: endDate.getMonth() + 1,
        year: endDate.getFullYear(),
      };

      const response = await axios.get<{ elements: FollowerTrendElement[] }>(
        `${this.REST_API_URL}/memberFollowersCount?q=dateRange&dateRange.start.day=${start.day}&dateRange.start.month=${start.month}&dateRange.start.year=${start.year}&dateRange.end.day=${end.day}&dateRange.end.month=${end.month}&dateRange.end.year=${end.year}`,
        { headers: this.getHeaders(decryptedToken) }
      );

      return (response.data.elements || []).map((el) => {
        const dr = el.memberFollowersCount.dateRange.end;
        return {
          date: new Date(dr.year, dr.month - 1, dr.day),
          count: el.memberFollowersCount.followerCount,
        };
      });
    } catch (error: any) {
      if (error.message === 'SCOPE_UPGRADE_REQUIRED') throw error;
      console.error('❌ Error fetching follower trends:', error.message);
      return []; // Return empty array on error, don't fail completely
    }
  }

  /**
   * Get aggregated post analytics for authenticated member
   * Endpoint: GET /rest/memberCreatorPostAnalytics?q=me
   * QueryTypes: IMPRESSION, MEMBERS_REACHED, RESHARE, REACTION, COMMENT
   */
  static async getAggregatedPostAnalytics(
    accessToken: string,
    queryType: 'IMPRESSION' | 'MEMBERS_REACHED' | 'RESHARE' | 'REACTION' | 'COMMENT'
  ): Promise<number> {
    try {
      const decryptedToken = AuthService.decryptToken(accessToken);

      const response = await axios.get<{ elements: PostAnalyticsElement[] }>(
        `${this.REST_API_URL}/memberCreatorPostAnalytics?q=me&queryType=${queryType}`,
        { headers: this.getHeaders(decryptedToken) }
      );

      const element = response.data.elements?.[0];
      return element?.creatorPostAnalytics?.count || 0;
    } catch (error: any) {
      if (error.message === 'SCOPE_UPGRADE_REQUIRED') throw error;
      console.error(`❌ Error fetching ${queryType} analytics:`, error.message);
      return 0; // Return 0 on error, don't fail completely
    }
  }

  /**
   * Get analytics for a specific post
   * Endpoint: GET /rest/memberCreatorPostAnalytics?q=entity&entity={postUrn}
   */
  static async getPostAnalytics(
    accessToken: string,
    postUrn: string
  ): Promise<PostAnalytics> {
    try {
      const decryptedToken = AuthService.decryptToken(accessToken);
      const encodedUrn = encodeURIComponent(postUrn);

      // Fetch all metrics for this post
      const metrics = ['IMPRESSION', 'MEMBERS_REACHED', 'RESHARE', 'REACTION', 'COMMENT'] as const;
      const results: Record<string, number> = {};

      for (const queryType of metrics) {
        try {
          const response = await axios.get<{ elements: PostAnalyticsElement[] }>(
            `${this.REST_API_URL}/memberCreatorPostAnalytics?q=entity&entity=${encodedUrn}&queryType=${queryType}`,
            { headers: this.getHeaders(decryptedToken) }
          );
          const element = response.data.elements?.[0];
          results[queryType] = element?.creatorPostAnalytics?.count || 0;
        } catch {
          results[queryType] = 0;
        }
      }

      const impressions = results.IMPRESSION || 0;
      const reactions = results.REACTION || 0;
      const comments = results.COMMENT || 0;
      const reshares = results.RESHARE || 0;

      // Calculate engagement rate: (reactions + comments + reshares) / impressions * 100
      const engagementRate =
        impressions > 0 ? ((reactions + comments + reshares) / impressions) * 100 : 0;

      return {
        postUrn,
        impressions,
        membersReached: results.MEMBERS_REACHED || 0,
        reactions,
        comments,
        reshares,
        engagementRate: Math.round(engagementRate * 100) / 100,
      };
    } catch (error: any) {
      if (error.message === 'SCOPE_UPGRADE_REQUIRED') throw error;
      console.error(`❌ Error fetching post analytics for ${postUrn}:`, error.message);
      return {
        postUrn,
        impressions: 0,
        membersReached: 0,
        reactions: 0,
        comments: 0,
        reshares: 0,
        engagementRate: 0,
      };
    }
  }

  /**
   * Get network size (1st degree connections)
   * Endpoint: GET /v2/connections?q=viewer&start=0&count=0
   * Note: This uses v2 API, not REST API
   */
  static async getNetworkSize(accessToken: string): Promise<number> {
    try {
      const decryptedToken = AuthService.decryptToken(accessToken);

      // The connections API returns total count in the response
      const response = await axios.get<{ _total: number }>(
        `${config.linkedin.apiUrl}/connections?q=viewer&start=0&count=0`,
        {
          headers: {
            Authorization: `Bearer ${decryptedToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      return response.data._total || 0;
    } catch (error: any) {
      if (error.message === 'SCOPE_UPGRADE_REQUIRED') throw error;
      console.error('❌ Error fetching network size:', error.message);
      return 0;
    }
  }

  /**
   * Fetch all analytics and create a snapshot
   * This is the main method to call for getting comprehensive analytics
   */
  static async fetchAndStoreAnalytics(
    userId: string,
    accessToken: string
  ): Promise<AnalyticsSnapshot> {
    console.log('📊 Fetching LinkedIn analytics for user:', userId);

    // Fetch all metrics in parallel for better performance
    const [
      followerCount,
      connectionCount,
      totalImpressions,
      totalMembersReached,
      totalReactions,
      totalComments,
      totalReshares,
    ] = await Promise.all([
      this.getFollowerCount(accessToken),
      this.getNetworkSize(accessToken),
      this.getAggregatedPostAnalytics(accessToken, 'IMPRESSION'),
      this.getAggregatedPostAnalytics(accessToken, 'MEMBERS_REACHED'),
      this.getAggregatedPostAnalytics(accessToken, 'REACTION'),
      this.getAggregatedPostAnalytics(accessToken, 'COMMENT'),
      this.getAggregatedPostAnalytics(accessToken, 'RESHARE'),
    ]);

    // Calculate visibility score
    const visibilityScore = this.calculateVisibilityScore({
      followerCount,
      totalImpressions,
      totalMembersReached,
      totalReactions,
      totalComments,
      totalReshares,
    });

    // Calculate engagement rate
    const engagementRate =
      totalImpressions > 0
        ? ((totalReactions + totalComments + totalReshares) / totalImpressions) * 100
        : 0;

    // Store snapshot in database
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const result = await query(
      `INSERT INTO analytics_snapshots (
        user_id, follower_count, connection_count,
        total_impressions, total_members_reached,
        total_reactions, total_comments, total_reshares,
        visibility_score, engagement_rate, snapshot_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (user_id, snapshot_date)
      DO UPDATE SET
        follower_count = EXCLUDED.follower_count,
        connection_count = EXCLUDED.connection_count,
        total_impressions = EXCLUDED.total_impressions,
        total_members_reached = EXCLUDED.total_members_reached,
        total_reactions = EXCLUDED.total_reactions,
        total_comments = EXCLUDED.total_comments,
        total_reshares = EXCLUDED.total_reshares,
        visibility_score = EXCLUDED.visibility_score,
        engagement_rate = EXCLUDED.engagement_rate
      RETURNING *`,
      [
        userId,
        followerCount,
        connectionCount,
        totalImpressions,
        totalMembersReached,
        totalReactions,
        totalComments,
        totalReshares,
        visibilityScore,
        Math.round(engagementRate * 100) / 100,
        today,
      ]
    );

    console.log('✅ Analytics snapshot stored:', {
      visibilityScore,
      followerCount,
      totalImpressions,
    });

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      followerCount: row.follower_count,
      connectionCount: row.connection_count,
      totalImpressions: parseInt(row.total_impressions),
      totalMembersReached: parseInt(row.total_members_reached),
      totalReactions: row.total_reactions,
      totalComments: row.total_comments,
      totalReshares: row.total_reshares,
      visibilityScore: row.visibility_score,
      engagementRate: parseFloat(row.engagement_rate),
      snapshotDate: row.snapshot_date,
    };
  }

  /**
   * Calculate visibility score based on real LinkedIn data
   * Score is 0-100 based on weighted metrics
   */
  private static calculateVisibilityScore(metrics: {
    followerCount: number;
    totalImpressions: number;
    totalMembersReached: number;
    totalReactions: number;
    totalComments: number;
    totalReshares: number;
  }): number {
    const {
      followerCount,
      totalImpressions,
      totalMembersReached,
      totalReactions,
      totalComments,
      totalReshares,
    } = metrics;

    // Weights for each metric
    const weights = {
      impressions: 0.25, // How many saw your content
      membersReached: 0.20, // Unique viewers
      reactions: 0.15, // Engagement: reactions
      comments: 0.20, // Engagement: comments (higher weight - shows quality)
      reshares: 0.10, // Viral potential
      followers: 0.10, // Audience size
    };

    // Normalize each metric (0-100 scale)
    // These thresholds can be adjusted based on typical LinkedIn performance
    const impressionScore = Math.min((totalImpressions / 10000) * 100, 100);
    const reachScore = Math.min((totalMembersReached / 5000) * 100, 100);
    const reactionScore = Math.min((totalReactions / 500) * 100, 100);
    const commentScore = Math.min((totalComments / 100) * 100, 100);
    const reshareScore = Math.min((totalReshares / 50) * 100, 100);
    const followerScore = Math.min((followerCount / 1000) * 100, 100);

    const score =
      impressionScore * weights.impressions +
      reachScore * weights.membersReached +
      reactionScore * weights.reactions +
      commentScore * weights.comments +
      reshareScore * weights.reshares +
      followerScore * weights.followers;

    return Math.round(score);
  }

  /**
   * Get score change compared to previous snapshot
   */
  static async getScoreChange(userId: string): Promise<number> {
    const result = await query(
      `SELECT visibility_score, snapshot_date
       FROM analytics_snapshots
       WHERE user_id = $1
       ORDER BY snapshot_date DESC
       LIMIT 2`,
      [userId]
    );

    if (result.rows.length < 2) {
      return 0; // Not enough data for comparison
    }

    const current = result.rows[0].visibility_score;
    const previous = result.rows[1].visibility_score;

    return current - previous;
  }

  /**
   * Get the most recent snapshot for a user
   */
  static async getLatestSnapshot(userId: string): Promise<AnalyticsSnapshot | null> {
    const result = await query(
      `SELECT * FROM analytics_snapshots
       WHERE user_id = $1
       ORDER BY snapshot_date DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      followerCount: row.follower_count,
      connectionCount: row.connection_count,
      totalImpressions: parseInt(row.total_impressions),
      totalMembersReached: parseInt(row.total_members_reached),
      totalReactions: row.total_reactions,
      totalComments: row.total_comments,
      totalReshares: row.total_reshares,
      visibilityScore: row.visibility_score,
      engagementRate: parseFloat(row.engagement_rate),
      snapshotDate: row.snapshot_date,
    };
  }

  /**
   * Check if snapshot is fresh (less than 1 hour old)
   */
  static async isSnapshotFresh(userId: string, maxAgeMinutes = 60): Promise<boolean> {
    const result = await query(
      `SELECT created_at FROM analytics_snapshots
       WHERE user_id = $1 AND snapshot_date = CURRENT_DATE
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const createdAt = new Date(result.rows[0].created_at);
    const now = new Date();
    const ageMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

    return ageMinutes < maxAgeMinutes;
  }
}
