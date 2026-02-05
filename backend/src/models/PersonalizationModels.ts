/**
 * PersonalizationModels.ts
 * TypeScript interfaces for AI optimization, feedback loops, and personalization
 */

// ============================================
// POST SELECTION TRACKING
// ============================================

/**
 * Tracks which AI-generated variant users select and their edit patterns
 */
export interface PostSelection {
  id: string;
  userId: string;
  generatedPostId: string | null;
  sessionId: string;
  selectedVariantNumber: number;
  totalVariants: number;
  originalHookScore: number;
  originalContent: string;
  finalContent: string | null;
  editDistance: number;
  editPercentage: number;
  wasEdited: boolean;
  timeToSelectMs: number | null;
  selectionAt: Date;
  createdAt: Date;
}

/**
 * DTO for creating a new post selection record
 */
export interface CreatePostSelectionDTO {
  userId: string;
  generatedPostId?: string;
  sessionId: string;
  selectedVariantNumber: number;
  totalVariants?: number;
  originalHookScore: number;
  originalContent: string;
  finalContent?: string;
  timeToSelectMs?: number;
}

// ============================================
// ENGAGEMENT FEEDBACK
// ============================================

/**
 * Links actual LinkedIn engagement to predicted hook scores for calibration
 */
export interface EngagementFeedback {
  id: string;
  userId: string;
  generatedPostId: string | null;
  linkedinPostId: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  engagementRate: number;
  predictedHookScore: number;
  actualEngagementScore: number;
  scoreDelta: number;
  hoursSincePublish: number;
  capturedAt: Date;
  createdAt: Date;
}

/**
 * DTO for recording engagement feedback
 */
export interface RecordEngagementDTO {
  userId: string;
  generatedPostId: string;
  linkedinPostId: string;
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
  };
  predictedHookScore: number;
  hoursSincePublish: number;
}

// ============================================
// HOOK SCORE CALIBRATION
// ============================================

/**
 * Per-user calibration factors for hook score predictions
 */
export interface HookCalibration {
  id: string;
  userId: string;
  calibrationFactor: number; // Multiplier (0.5 - 1.5)
  calibrationBias: number;   // Additive adjustment (-20 to +20)
  sampleSize: number;
  rSquared: number | null;
  lastCalibratedAt: Date | null;
  calibrationMethod: 'linear_regression' | 'bayesian' | 'moving_average';
  calibrationHistory: CalibrationHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Historical calibration entry for trend analysis
 */
export interface CalibrationHistoryEntry {
  calibratedAt: string;
  factor: number;
  bias: number;
  sampleSize: number;
  rSquared: number;
}

/**
 * Simplified calibration data for context building
 */
export interface CalibrationContext {
  factor: number;
  bias: number;
  confidence: number; // 0-1 based on sample size and r-squared
}

// ============================================
// VOICE SIGNATURE EVOLUTION
// ============================================

/**
 * Historical snapshot of voice signature
 */
export interface VoiceSignatureSnapshot {
  id: string;
  userId: string;
  formal: number;
  bold: number;
  empathetic: number;
  complexity: number;
  brevity: number;
  primaryTone: string;
  confidence: number;
  triggerReason: 'initial' | 'periodic' | 'manual' | 'threshold' | 'calibration';
  samplePostsAnalyzed: number;
  analysisSource: string;
  deltaFormal: number | null;
  deltaBold: number | null;
  deltaEmpathetic: number | null;
  deltaComplexity: number | null;
  deltaBrevity: number | null;
  createdAt: Date;
}

/**
 * Voice evolution status
 */
export interface VoiceEvolutionStatus {
  evolutionEnabled: boolean;
  lastEvolutionCheck: Date | null;
  postsSinceLastEvolution: number;
  evolutionThreshold: number;
  shouldEvolve: boolean;
  reason?: string;
}

// ============================================
// SUCCESS PATTERNS
// ============================================

/**
 * Learned pattern from high-performing posts
 */
export interface SuccessPattern {
  id: string;
  userId: string;
  patternType: PatternType;
  patternValue: string;
  occurrenceCount: number;
  avgEngagementScore: number;
  avgHookScore: number;
  successRate: number; // 0-1
  statisticalSignificance: number | null;
  examplePostIds: string[];
  lastUpdatedAt: Date | null;
  createdAt: Date;
}

/**
 * Types of patterns we detect
 */
export type PatternType =
  | 'hook_style'    // question, number, personal, short_punchy, exclamation, statement
  | 'topic'         // leadership, career, tech, etc.
  | 'length'        // short, medium, long
  | 'structure'     // numbered_list, bullet_list, multi_paragraph, flowing_prose
  | 'emoji_usage'   // none, minimal, moderate, heavy
  | 'posting_time'; // morning, afternoon, evening

/**
 * Simplified pattern for context building
 */
export interface PatternContext {
  type: PatternType;
  value: string;
  successRate: number;
}

// ============================================
// ENHANCED USER CONTEXT
// ============================================

/**
 * Comprehensive user context for AI generation
 * Combines all personalization layers
 */
export interface EnhancedUserContext {
  // Core profile
  userId: string;
  name: string;
  headline: string;
  role: string;
  persona: string;
  topicPreferences: string[];

  // Voice signature
  voiceSignature: VoiceSignatureContext;

  // Calibration
  hookCalibration: CalibrationContext;

  // Style preferences
  stylePreferences: StylePreferences;

  // Learned patterns (top 5)
  topSuccessPatterns: PatternContext[];

  // Few-shot examples from high performers
  topPerformingPosts: PerformingPostExample[];

  // Historical performance summary
  performanceSummary: PerformanceSummary;

  // Context confidence score
  overallConfidence: number;
}

/**
 * Voice signature for context building
 */
export interface VoiceSignatureContext {
  formal: number;
  bold: number;
  empathetic: number;
  complexity: number;
  brevity: number;
  primaryTone: string;
  confidence: number;
}

/**
 * User style preferences
 */
export interface StylePreferences {
  preferredLength: 'short' | 'medium' | 'long';
  emojiUsage: 'none' | 'minimal' | 'moderate' | 'heavy';
  personalizationLevel: 'minimal' | 'balanced' | 'aggressive';
}

/**
 * High-performing post example for few-shot learning
 */
export interface PerformingPostExample {
  content: string;
  hookScore: number;
  engagementScore: number;
}

/**
 * Historical performance summary
 */
export interface PerformanceSummary {
  avgEngagementRate: number;
  avgHookScore: number;
  totalPublishedPosts: number;
  topPerformingTopics: string[];
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Response for calibration endpoint
 */
export interface CalibrationResponse {
  calibrated: boolean;
  factor: number;
  bias: number;
  sampleSize?: number;
  rSquared?: number;
  lastCalibratedAt?: string | null;
  confidence: number;
  message?: string;
  history?: CalibrationHistoryEntry[];
}

/**
 * Response for evolution history endpoint
 */
export interface EvolutionHistoryResponse {
  history: Array<{
    formal: number;
    bold: number;
    empathetic: number;
    complexity: number;
    brevity: number;
    primaryTone: string;
    confidence: number;
    triggerReason: string;
    postsAnalyzed: number;
    deltas: {
      formal: number;
      bold: number;
      empathetic: number;
      complexity: number;
      brevity: number;
    };
    createdAt: string;
  }>;
}

/**
 * Response for success patterns endpoint
 */
export interface SuccessPatternsResponse {
  patterns: Array<{
    type: string;
    value: string;
    occurrences: number;
    avgEngagement: number;
    avgHookScore: number;
    successRate: number;
  }>;
}

/**
 * Response for analyze patterns endpoint
 */
export interface AnalyzePatternsResponse {
  success: boolean;
  patternsFound: number;
  patterns: Array<{
    type: string;
    value: string;
    occurrences: number;
    successRate: number;
  }>;
}

// ============================================
// INTERNAL TYPES
// ============================================

/**
 * Linear regression result
 */
export interface LinearRegressionResult {
  factor: number;
  bias: number;
  rSquared: number;
}

/**
 * Data point for calibration
 */
export interface CalibrationDataPoint {
  predicted: number;
  actual: number;
}

/**
 * Post analysis for pattern detection
 */
export interface PostAnalysisData {
  content: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  hookScore: number | null;
}

// ============================================
// GENERATION CONTEXT TYPES
// ============================================

/**
 * Extended generation response with calibration
 */
export interface EnhancedGenerationResponse {
  content: string;
  hookScore: number;
  calibratedHookScore: number;
  suggestions: string[];
  sessionId: string;
  promptContextSnapshot?: Record<string, unknown>;
}

/**
 * Generation request with context
 */
export interface EnhancedGenerationRequest {
  topic: string;
  sourceType: string;
  persona?: string;
  role?: string;
  voiceSignature?: VoiceSignatureContext;
  calibrationPreferences?: boolean[];
}
