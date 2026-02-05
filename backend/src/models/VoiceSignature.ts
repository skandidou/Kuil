export interface VoiceSignature {
  id: string;
  user_id: string;
  formal: number; // 0.0 - 10.0
  bold: number;
  empathetic: number;
  complexity: number;
  brevity: number;
  primary_tone: string;
  confidence: number; // 0.0 - 1.0
  sample_posts_analyzed: number;
  last_analyzed_at: Date | null;
  analysis_source: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateVoiceSignatureDTO {
  user_id: string;
  formal: number;
  bold: number;
  empathetic: number;
  complexity: number;
  brevity: number;
  primary_tone: string;
  confidence: number;
  sample_posts_analyzed: number;
  analysis_source?: string;
}

export interface UpdateVoiceSignatureDTO {
  formal?: number;
  bold?: number;
  empathetic?: number;
  complexity?: number;
  brevity?: number;
  primary_tone?: string;
  confidence?: number;
  sample_posts_analyzed?: number;
  last_analyzed_at?: Date;
}

// Response format for iOS
export interface VoiceSignatureResponse {
  formal: number;
  bold: number;
  empathetic: number;
  complexity: number;
  brevity: number;
  primaryTone: string;
  confidence: number;
  lastAnalyzedAt: string | null;
  postsAnalyzed: number;
}
