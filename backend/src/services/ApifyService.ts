import axios from 'axios';
import { config } from '../config/env';
import { query } from '../config/database';

/**
 * Apify Service for LinkedIn Posts Scraping
 * Uses Apify's LinkedIn Profile Posts Scraper (no cookies required)
 * Pricing: ~$1-2 per 1000 posts
 *
 * This allows the AI to analyze user's existing LinkedIn posts
 * to better adapt to their writing style.
 */

const APIFY_BASE_URL = 'https://api.apify.com/v2';
const LINKEDIN_POSTS_ACTOR = 'harvestapi/linkedin-profile-posts'; // $2 per 1k posts, no cookies
const APIFY_TIMEOUT_MS = 120000; // 2 minutes for scraping

// Apify harvestapi/linkedin-profile-posts response structure
interface ApifyLinkedInPost {
  type: string;
  id: string;
  linkedinUrl: string;
  content: string;  // The post text content
  postedAt: {
    timestamp: number;
    date: string;
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  // Legacy fields for backwards compatibility
  text?: string;
  postedAtTimestamp?: number;
  reactionCount?: number;
  commentCount?: number;
  shareCount?: number;
  likeCount?: number;
}

interface ScrapedPost {
  content: string;
  postedAt: Date;
  likes: number;
  comments: number;
  shares: number;
  linkedinPostUrl: string;
}

class ApifyServiceClass {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = config.apify?.apiKey;
  }

  /**
   * Check if Apify is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Extract LinkedIn username from profile URL
   * e.g., "https://www.linkedin.com/in/satyanadella" -> "satyanadella"
   * Handles URLs with query params like ?utm_source=...
   */
  private extractUsername(profileUrl: string): string | null {
    const match = profileUrl.match(/linkedin\.com\/in\/([^\/\?#]+)/);
    const username = match ? match[1] : null;
    console.log(`[APIFY] Extracted username: ${username} from URL: ${profileUrl}`);
    return username;
  }

  /**
   * Clean LinkedIn profile URL (remove tracking params)
   */
  private cleanProfileUrl(profileUrl: string): string {
    const username = this.extractUsername(profileUrl);
    if (username) {
      return `https://www.linkedin.com/in/${username}`;
    }
    return profileUrl;
  }

  /**
   * Scrape posts from a LinkedIn profile using Apify
   * @param linkedinProfileUrl - The LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)
   * @param maxPosts - Maximum number of posts to scrape (default: 30)
   */
  async scrapeProfilePosts(linkedinProfileUrl: string, maxPosts: number = 30): Promise<ScrapedPost[]> {
    if (!this.apiKey) {
      console.log('[APIFY] API key not configured, skipping scrape');
      return [];
    }

    const username = this.extractUsername(linkedinProfileUrl);
    if (!username) {
      console.error('[APIFY] Invalid LinkedIn profile URL:', linkedinProfileUrl);
      return [];
    }

    // Clean the URL to remove tracking params
    const cleanUrl = this.cleanProfileUrl(linkedinProfileUrl);
    console.log(`[APIFY] Scraping posts for LinkedIn profile: ${username} (clean URL: ${cleanUrl})...`);

    try {
      // Prepare input - use both profileUrls AND profilePublicIdentifiers for better compatibility
      // harvestapi/linkedin-profile-posts accepts these parameters:
      // - profileUrls: array of LinkedIn profile URLs
      // - profilePublicIdentifiers: array of usernames (without https://...)
      // - maxPosts: maximum posts per profile
      const input = {
        profileUrls: [cleanUrl],
        profilePublicIdentifiers: [username],
        maxPosts,
        includeQuotePosts: true, // Include shared posts with comments
        includeArticles: true, // Include LinkedIn articles
        includeRepostedPosts: true, // Include reposts
      };
      console.log(`[APIFY] Actor: ${LINKEDIN_POSTS_ACTOR}`);
      console.log(`[APIFY] Actor input:`, JSON.stringify(input));

      // Start the actor run
      const runResponse = await axios.post(
        `${APIFY_BASE_URL}/acts/${LINKEDIN_POSTS_ACTOR}/runs`,
        input,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: APIFY_TIMEOUT_MS,
        }
      );

      const runId = runResponse.data.data.id;
      console.log(`[APIFY] Actor run started: ${runId}`);

      // Wait for the run to complete
      let status = 'RUNNING';
      let attempts = 0;
      const maxAttempts = 60; // 2 minutes max wait

      while (status === 'RUNNING' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

        const statusResponse = await axios.get(
          `${APIFY_BASE_URL}/actor-runs/${runId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
            },
          }
        );

        status = statusResponse.data.data.status;
        attempts++;
      }

      if (status !== 'SUCCEEDED') {
        console.error(`[APIFY] Actor run failed with status: ${status} after ${attempts} attempts`);
        // Try to get error details from the run
        try {
          const runDetails = await axios.get(
            `${APIFY_BASE_URL}/actor-runs/${runId}`,
            {
              headers: { 'Authorization': `Bearer ${this.apiKey}` },
            }
          );
          console.error(`[APIFY] Run details:`, JSON.stringify(runDetails.data.data));
        } catch (e) {
          // Ignore
        }
        return [];
      }

      console.log(`[APIFY] Actor run succeeded after ${attempts} attempts, fetching results...`);

      // Get the results
      const resultsResponse = await axios.get(
        `${APIFY_BASE_URL}/actor-runs/${runId}/dataset/items`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      const rawData = resultsResponse.data;
      console.log(`[APIFY] Raw response type: ${typeof rawData}, isArray: ${Array.isArray(rawData)}`);
      console.log(`[APIFY] Raw response length: ${Array.isArray(rawData) ? rawData.length : 'N/A'}`);

      // Log first item for debugging
      if (Array.isArray(rawData) && rawData.length > 0) {
        console.log(`[APIFY] First item keys:`, Object.keys(rawData[0]));
        console.log(`[APIFY] First item sample:`, JSON.stringify(rawData[0]).substring(0, 500));
      } else {
        console.log(`[APIFY] No posts returned. Raw data:`, JSON.stringify(rawData).substring(0, 500));
      }

      const posts: ApifyLinkedInPost[] = rawData;

      // Log all post types for debugging
      const postTypes = posts.map(p => p.type);
      console.log(`[APIFY] Post types found:`, [...new Set(postTypes)]);

      // Transform to our format - handle new harvestapi structure
      // Be very permissive with post types - accept everything that has content
      // The actor may return different type values depending on version
      const validPostTypes = ['post', 'POSTED', 'POST', 'article', 'ARTICLE', 'share', 'SHARE', 'original', 'ORIGINAL', undefined, null, ''];

      return posts
        .filter(post => {
          // Filter posts only (not comments/reactions)
          const postContent = post.content || post.text || (post as any).commentary || (post as any).message;
          const postType = post.type?.toLowerCase?.() || '';

          // Reject only explicitly non-post types
          const isRejectedType = postType === 'comment' || postType === 'reaction' || postType === 'like';
          const hasContent = postContent && postContent.length > 10;

          if (isRejectedType) {
            console.log(`[APIFY] Skipping - rejected type: ${post.type}`);
          }
          if (!hasContent) {
            console.log(`[APIFY] Skipping post - no content. Keys: ${Object.keys(post).join(', ')}`);
          }
          return !isRejectedType && hasContent;
        })
        .map(post => {
          // Get content from any possible field (actors vary in naming)
          const content = post.content || post.text || (post as any).commentary || (post as any).message || (post as any).body || '';

          // Get timestamp from any possible field
          const timestamp = post.postedAt?.timestamp || post.postedAtTimestamp ||
            (post as any).createdAt || (post as any).created_at || (post as any).publishedAt;
          const postedAt = timestamp
            ? new Date(typeof timestamp === 'number' ? timestamp : timestamp)
            : new Date(post.postedAt?.date || Date.now());

          // Get engagement from either new nested structure or legacy flat fields
          const likes = post.engagement?.likes || post.likeCount || post.reactionCount ||
            (post as any).numLikes || (post as any).reactions || 0;
          const comments = post.engagement?.comments || post.commentCount ||
            (post as any).numComments || 0;
          const shares = post.engagement?.shares || post.shareCount ||
            (post as any).numShares || (post as any).reposts || 0;

          // Get URL from any possible field
          const linkedinPostUrl = post.linkedinUrl || (post as any).postUrl ||
            (post as any).url || (post as any).link || post.id || '';

          console.log(`[APIFY] Mapped post: ${content.substring(0, 50)}... | likes: ${likes}`);

          return {
            content,
            postedAt,
            likes,
            comments,
            shares,
            linkedinPostUrl,
          };
        });

    } catch (error: any) {
      console.error('[APIFY] Scraping error:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Scrape and save posts for a user
   * This is called when a user wants to sync their LinkedIn posts
   */
  async syncUserPosts(userId: string, linkedinProfileUrl: string): Promise<number> {
    if (!this.isConfigured()) {
      console.log('[APIFY] Service not configured, skipping sync');
      return 0;
    }

    console.log(`[APIFY] Syncing posts for user ${userId}...`);

    try {
      const posts = await this.scrapeProfilePosts(linkedinProfileUrl, 50);

      if (posts.length === 0) {
        console.log('[APIFY] No posts found to sync');
        return 0;
      }

      let syncedCount = 0;

      for (const post of posts) {
        try {
          // Upsert post to database
          await query(
            `INSERT INTO linkedin_posts
             (user_id, linkedin_post_id, content, likes, comments, shares, posted_at, fetched_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
             ON CONFLICT (user_id, linkedin_post_id)
             DO UPDATE SET
               content = EXCLUDED.content,
               likes = EXCLUDED.likes,
               comments = EXCLUDED.comments,
               shares = EXCLUDED.shares,
               fetched_at = NOW()`,
            [
              userId,
              post.linkedinPostUrl, // Use URL as unique ID
              post.content,
              post.likes,
              post.comments,
              post.shares,
              post.postedAt,
            ]
          );
          syncedCount++;
        } catch (dbError: any) {
          console.error('[APIFY] Error saving post:', dbError.message);
        }
      }

      console.log(`[APIFY] Synced ${syncedCount} posts for user ${userId}`);
      return syncedCount;

    } catch (error: any) {
      console.error('[APIFY] Sync error:', error.message);
      return 0;
    }
  }

  /**
   * Get scraped posts content for voice analysis
   * Returns just the text content of posts for AI analysis
   */
  async getPostsForVoiceAnalysis(userId: string): Promise<string[]> {
    try {
      const result = await query(
        `SELECT content FROM linkedin_posts
         WHERE user_id = $1 AND content IS NOT NULL AND LENGTH(content) > 50
         ORDER BY posted_at DESC
         LIMIT 20`,
        [userId]
      );

      return result.rows.map(row => row.content);
    } catch (error: any) {
      console.error('[APIFY] Error getting posts for analysis:', error.message);
      return [];
    }
  }
}

// Export singleton instance
export const ApifyService = new ApifyServiceClass();
