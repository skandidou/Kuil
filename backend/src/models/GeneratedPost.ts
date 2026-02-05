export interface GeneratedPost {
  id: string;
  user_id: string;
  topic: string;
  variant_number: number;
  content: string;
  hook_score: number;
  status: 'draft' | 'scheduled' | 'published';
  published_post_id: string | null;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateGeneratedPostDTO {
  user_id: string;
  topic: string;
  variant_number: number;
  content: string;
  hook_score: number;
  status?: 'draft' | 'scheduled' | 'published';
}

// Response format for iOS
export interface PostVariantResponse {
  content: string;
  hookScore: number;
}

export interface GeneratePostResponse {
  variants: PostVariantResponse[];
}
