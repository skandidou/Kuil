export interface LinkedInPost {
  id: string;
  user_id: string;
  linkedin_post_id: string;
  content: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  posted_at: Date | null;
  fetched_at: Date;
  created_at: Date;
}

export interface CreateLinkedInPostDTO {
  user_id: string;
  linkedin_post_id: string;
  content: string;
  likes?: number;
  comments?: number;
  shares?: number;
  impressions?: number;
  posted_at?: Date;
}

// LinkedIn API response types
export interface LinkedInPostAPIResponse {
  id: string;
  author: string;
  commentary: string;
  created: {
    time: number;
  };
  socialDetail?: {
    totalSocialActivityCounts?: {
      numLikes?: number;
      numComments?: number;
      numShares?: number;
      numViews?: number;
    };
  };
}
