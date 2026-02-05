import axios from 'axios';
import { config } from '../config/env';
import { query } from '../config/database';
import { AuthService } from './AuthService';
import { CreateLinkedInPostDTO, LinkedInPostAPIResponse } from '../models/LinkedInPost';

export class LinkedInService {
  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }> {
    try {
      const response = await axios.post(
        config.linkedin.tokenUrl,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: config.linkedin.clientId,
          client_secret: config.linkedin.clientSecret,
          redirect_uri: config.linkedin.redirectUri,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('LinkedIn token exchange error:', error.response?.data || error.message);
      throw new Error('Failed to exchange authorization code');
    }
  }

  /**
   * Get user profile from LinkedIn API using OpenID Connect
   */
  static async getUserProfile(accessToken: string): Promise<{
    sub: string;
    name: string;
    given_name: string;
    family_name: string;
    email: string;
    picture?: string;
    email_verified?: boolean;
  }> {
    try {
      const response = await axios.get(config.linkedin.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Log only non-sensitive fields
      console.log('✅ LinkedIn userinfo response:', { sub: response.data.sub, name: response.data.name });
      return response.data;
    } catch (error: any) {
      console.error('❌ LinkedIn profile fetch error:', error.response?.data || error.message);
      throw new Error('Failed to fetch LinkedIn profile');
    }
  }

  /**
   * Get user email from LinkedIn API
   */
  static async getUserEmail(accessToken: string): Promise<string | null> {
    try {
      const response = await axios.get(
        `${config.linkedin.apiUrl}/emailAddress?q=members&projection=(elements*(handle~))`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data.elements?.[0]?.['handle~']?.emailAddress || null;
    } catch (error) {
      console.error('LinkedIn email fetch error:', error);
      return null;
    }
  }

  /**
   * Get user's LinkedIn posts (up to 50)
   */
  static async getUserPosts(userId: string, accessToken: string): Promise<LinkedInPostAPIResponse[]> {
    try {
      // Decrypt token
      const decryptedToken = AuthService.decryptToken(accessToken);

      // Fetch posts from LinkedIn API
      const response = await axios.get(
        `${config.linkedin.apiUrl}/ugcPosts?q=authors&authors=List(urn:li:person:${userId})&count=50&sortBy=LAST_MODIFIED`,
        {
          headers: {
            Authorization: `Bearer ${decryptedToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      return response.data.elements || [];
    } catch (error: any) {
      console.error('LinkedIn posts fetch error:', error.response?.data || error.message);
      throw new Error('Failed to fetch LinkedIn posts');
    }
  }

  /**
   * Publish a new post to LinkedIn
   * Uses ugcPosts API for "Share on LinkedIn" product (non-versioned API)
   */
  static async publishPost(
    linkedinUserId: string,
    accessToken: string,
    content: string
  ): Promise<string> {
    try {
      const decryptedToken = AuthService.decryptToken(accessToken);

      // ugcPosts API format for "Share on LinkedIn" product
      const postData = {
        author: `urn:li:person:${linkedinUserId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      console.log('📤 Publishing to LinkedIn with ugcPosts API...', { userId: linkedinUserId });

      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        postData,
        {
          headers: {
            Authorization: `Bearer ${decryptedToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          },
        }
      );

      // Extract post ID from response
      const postId = response.data?.id || 'unknown';
      console.log('✅ LinkedIn post published:', postId);
      return postId;
    } catch (error: any) {
      console.error('❌ LinkedIn publish error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      // Provide more specific error messages
      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || 'Failed to publish post to LinkedIn';
      throw new Error(errorMessage);
    }
  }

  /**
   * Save posts to database cache using batch insert for better performance
   */
  static async cacheUserPosts(
    userId: string,
    posts: LinkedInPostAPIResponse[]
  ): Promise<void> {
    if (posts.length === 0) return;

    try {
      // Batch insert for better performance (instead of N individual queries)
      const BATCH_SIZE = 10;

      for (let i = 0; i < posts.length; i += BATCH_SIZE) {
        const batch = posts.slice(i, i + BATCH_SIZE);
        const values: any[] = [];
        const placeholders: string[] = [];

        batch.forEach((post, index) => {
          const offset = index * 8;
          placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`);

          values.push(
            userId,
            post.id,
            post.commentary || '',
            post.socialDetail?.totalSocialActivityCounts?.numLikes || 0,
            post.socialDetail?.totalSocialActivityCounts?.numComments || 0,
            post.socialDetail?.totalSocialActivityCounts?.numShares || 0,
            post.socialDetail?.totalSocialActivityCounts?.numViews || 0,
            new Date(post.created.time)
          );
        });

        await query(
          `INSERT INTO linkedin_posts (user_id, linkedin_post_id, content, likes, comments, shares, impressions, posted_at)
           VALUES ${placeholders.join(', ')}
           ON CONFLICT (user_id, linkedin_post_id)
           DO UPDATE SET
             likes = EXCLUDED.likes,
             comments = EXCLUDED.comments,
             shares = EXCLUDED.shares,
             impressions = EXCLUDED.impressions,
             fetched_at = NOW()`,
          values
        );
      }
    } catch (error) {
      console.error('Error caching LinkedIn posts:', error);
      throw error;
    }
  }
}
