import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/env';
import { query } from '../config/database';
import {
  CreateVoiceSignatureDTO,
  VoiceSignatureResponse,
} from '../models/VoiceSignature';
import { PostVariantResponse, GeneratePostResponse } from '../models/GeneratedPost';
import { PersonalizationService } from './PersonalizationService';
import {
  EnhancedUserContext,
  CalibrationContext,
  PatternContext,
} from '../models/PersonalizationModels';

const anthropic = new Anthropic({
  apiKey: config.claude.apiKey,
});

// Claude API configuration
const CLAUDE_TIMEOUT_MS = 120000; // 120 seconds (Claude Opus 4.5 needs more time for complex prompts)
const CLAUDE_FAST_TIMEOUT_MS = 30000; // 30 seconds for faster models
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000; // 1 second

// Model selection - use appropriate model for task complexity
const CLAUDE_OPUS = config.claude.model; // claude-opus-4-20250514 - for complex personalization
const CLAUDE_SONNET = 'claude-sonnet-4-20250514'; // For medium complexity tasks
const CLAUDE_HAIKU = 'claude-3-5-haiku-20241022'; // For simple/fast tasks

/**
 * Execute Claude call with timeout and retry logic
 * Implements exponential backoff: 1s, 2s, 4s
 */
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Claude ${operationName} timed out after ${CLAUDE_TIMEOUT_MS}ms`));
        }, CLAUDE_TIMEOUT_MS);
      });

      // Race between operation and timeout
      const result = await Promise.race([operation(), timeoutPromise]);
      return result;
    } catch (error: any) {
      lastError = error;
      const isRetryable =
        error.message?.includes('timed out') ||
        error.message?.includes('overloaded') ||
        error.message?.includes('529') ||
        error.message?.includes('503') ||
        error.message?.includes('429') ||
        error.status === 529 ||
        error.status === 503 ||
        error.status === 429;

      if (attempt < MAX_RETRIES && isRetryable) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`⚠️ [CLAUDE] ${operationName} attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error(`❌ [CLAUDE] ${operationName} failed after ${attempt} attempts:`, error.message);
        break;
      }
    }
  }

  throw lastError || new Error(`Claude ${operationName} failed`);
}

/**
 * Extract JSON from Claude response that may contain markdown formatting
 */
function extractJSON(text: string): string {
  // Try multiple patterns in order of specificity
  const patterns = [
    /```json\s*\n([\s\S]*?)\n```/,  // Standard: ```json\n{...}\n```
    /```\s*\n([\s\S]*?)\n```/,        // Generic: ```\n{...}\n```
    /\{[\s\S]*\}/                     // Raw JSON: {...}
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Return captured group if exists, otherwise full match
      return (match[1] || match[0]).trim();
    }
  }

  // No pattern matched, return trimmed original
  return text.trim();
}

/**
 * Type guard for generated post response
 */
interface GeneratedPostResponse {
  content: string;
  hookScore: number;
  suggestions: string[];
}

function isValidGeneratedPost(data: any): data is GeneratedPostResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.content === 'string' &&
    data.content.length > 0 &&
    typeof data.hookScore === 'number' &&
    data.hookScore >= 0 &&
    data.hookScore <= 100 &&
    Array.isArray(data.suggestions)
  );
}

export class ClaudeService {
  /**
   * Analyze user's LinkedIn posts and generate voice signature
   */
  static async analyzeVoiceSignature(
    userId: string,
    posts: string[]
  ): Promise<VoiceSignatureResponse> {
    try {
      const postsText = posts.slice(0, 30).join('\n\n---\n\n');

      const prompt = `You are an expert in analyzing LinkedIn writing styles. Analyze these LinkedIn posts and calculate a "voice signature" with 5 dimensions (scale 0-10):

**Dimensions:**
- FORMAL: How professional/formal vs casual/conversational the tone is (0=very casual, 10=very formal)
- BOLD: How direct/assertive vs gentle/reserved the communication style is (0=gentle, 10=bold)
- EMPATHETIC: How emotional/personal vs factual/detached the content is (0=detached, 10=empathetic)
- COMPLEXITY: Language complexity and technicality (0=simple, 10=complex/technical)
- BREVITY: How concise vs detailed/elaborate the writing is (0=very detailed, 10=very brief)

**Posts to analyze:**
${postsText}

Respond with ONLY a valid JSON object (no markdown, no code blocks) in this exact format:
{
  "formal": 7.5,
  "bold": 6.2,
  "empathetic": 8.1,
  "complexity": 5.4,
  "brevity": 6.8,
  "primaryTone": "Analytical Leader",
  "confidence": 0.85
}

The primaryTone should be a 2-3 word descriptor like "Analytical Leader", "Inspirational Mentor", "Pragmatic Expert", etc.
Confidence should be 0.0-1.0 representing analysis confidence.`;

      // Execute with timeout and retry
      const response = await executeWithRetry(async () => {
        const message = await anthropic.messages.create({
          model: config.claude.model,
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        });
        const textBlock = message.content.find(block => block.type === 'text');
        return textBlock ? textBlock.text : '';
      }, 'analyzeVoiceSignature');

      console.log('🤖 [CLAUDE] Raw response (first 200 chars):', response.substring(0, 200));

      // Parse JSON response
      const cleanedResponse = extractJSON(response);
      const analysis = JSON.parse(cleanedResponse);

      // Validate and save to database
      const voiceSignature: CreateVoiceSignatureDTO = {
        user_id: userId,
        formal: analysis.formal,
        bold: analysis.bold,
        empathetic: analysis.empathetic,
        complexity: analysis.complexity,
        brevity: analysis.brevity,
        primary_tone: analysis.primaryTone,
        confidence: analysis.confidence,
        sample_posts_analyzed: posts.length,
        analysis_source: 'claude',
      };

      // Upsert voice signature
      await query(
        `INSERT INTO voice_signatures
         (user_id, formal, bold, empathetic, complexity, brevity, primary_tone, confidence, sample_posts_analyzed, last_analyzed_at, analysis_source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10)
         ON CONFLICT (user_id)
         DO UPDATE SET
           formal = EXCLUDED.formal,
           bold = EXCLUDED.bold,
           empathetic = EXCLUDED.empathetic,
           complexity = EXCLUDED.complexity,
           brevity = EXCLUDED.brevity,
           primary_tone = EXCLUDED.primary_tone,
           confidence = EXCLUDED.confidence,
           sample_posts_analyzed = EXCLUDED.sample_posts_analyzed,
           last_analyzed_at = NOW(),
           updated_at = NOW()`,
        [
          voiceSignature.user_id,
          voiceSignature.formal,
          voiceSignature.bold,
          voiceSignature.empathetic,
          voiceSignature.complexity,
          voiceSignature.brevity,
          voiceSignature.primary_tone,
          voiceSignature.confidence,
          voiceSignature.sample_posts_analyzed,
          voiceSignature.analysis_source,
        ]
      );

      // Return formatted response
      return {
        formal: analysis.formal,
        bold: analysis.bold,
        empathetic: analysis.empathetic,
        complexity: analysis.complexity,
        brevity: analysis.brevity,
        primaryTone: analysis.primaryTone,
        confidence: analysis.confidence,
        lastAnalyzedAt: new Date().toISOString(),
        postsAnalyzed: posts.length,
      };
    } catch (error) {
      console.error('[CLAUDE] Voice analysis error:', error);
      throw new Error('Failed to analyze voice signature');
    }
  }

  /**
   * Generate post variants based on topic and voice signature
   */
  static async generatePostVariants(
    userId: string,
    topic: string
  ): Promise<GeneratePostResponse> {
    try {
      // Fetch user's voice signature
      const signatureResult = await query(
        `SELECT * FROM voice_signatures WHERE user_id = $1`,
        [userId]
      );

      if (signatureResult.rows.length === 0) {
        throw new Error('Voice signature not found. Please analyze your profile first.');
      }

      const signature = signatureResult.rows[0];

      const prompt = `You are a LinkedIn content creation expert. Generate 3 post variations on this topic:

**Topic:** "${topic}"

**Match this voice signature:**
- Formality: ${signature.formal}/10 (${signature.formal > 7 ? 'professional' : signature.formal > 4 ? 'balanced' : 'casual'})
- Boldness: ${signature.bold}/10 (${signature.bold > 7 ? 'assertive' : signature.bold > 4 ? 'balanced' : 'gentle'})
- Empathy: ${signature.empathetic}/10 (${signature.empathetic > 7 ? 'personal' : signature.empathetic > 4 ? 'balanced' : 'factual'})
- Complexity: ${signature.complexity}/10 (${signature.complexity > 7 ? 'technical' : signature.complexity > 4 ? 'moderate' : 'simple'})
- Brevity: ${signature.brevity}/10 (${signature.brevity > 7 ? 'concise' : signature.brevity > 4 ? 'moderate' : 'detailed'})
- Primary Tone: ${signature.primary_tone}

**Requirements:**
- Generate 3 distinct variations
- Each should match the user's voice signature
- Include a strong hook (first 1-2 lines)
- 100-300 words each
- LinkedIn best practices (emojis optional, line breaks for readability)
- Assign a hook score (0-100) based on attention-grabbing power

Respond with ONLY a valid JSON object (no markdown, no code blocks):
{
  "variants": [
    { "content": "Post 1 content here...", "hookScore": 85 },
    { "content": "Post 2 content here...", "hookScore": 78 },
    { "content": "Post 3 content here...", "hookScore": 92 }
  ]
}`;

      // Execute with timeout and retry
      const response = await executeWithRetry(async () => {
        const message = await anthropic.messages.create({
          model: config.claude.model,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        });
        const textBlock = message.content.find(block => block.type === 'text');
        return textBlock ? textBlock.text : '';
      }, 'generatePostVariants');

      // Parse JSON response
      const cleanedResponse = extractJSON(response);
      const generated = JSON.parse(cleanedResponse);

      // Save variants to database
      for (let i = 0; i < generated.variants.length; i++) {
        const variant = generated.variants[i];
        await query(
          `INSERT INTO generated_posts (user_id, topic, variant_number, content, hook_score, status)
           VALUES ($1, $2, $3, $4, $5, 'draft')`,
          [userId, topic, i + 1, variant.content, variant.hookScore]
        );
      }

      return {
        variants: generated.variants.map((v: any) => ({
          content: v.content,
          hookScore: v.hookScore,
        })),
      };
    } catch (error) {
      console.error('[CLAUDE] Post generation error:', error);
      throw new Error('Failed to generate post variants');
    }
  }

  /**
   * Generate a single post based on prompt and source type
   * Uses complete user profile for maximum personalization
   */
  static async generatePost(
    userId: string,
    prompt: string,
    sourceType: string
  ): Promise<{ content: string; hookScore: number; suggestions: string[] }> {
    try {
      // Fetch user profile with voice signature, calibration preferences, AND topic interests
      const userResult = await query(
        `SELECT name, headline, topic_preferences FROM users WHERE id = $1`,
        [userId]
      );

      const voiceResult = await query(
        `SELECT formal, bold, empathetic, complexity, brevity, primary_tone, confidence
         FROM voice_signatures WHERE user_id = $1`,
        [userId]
      );

      const calibrationResult = await query(
        `SELECT preferences FROM tone_calibrations WHERE user_id = $1`,
        [userId]
      );

      // Try to get role and persona separately (columns may not exist)
      let userRole = 'Professional';
      let userPersona = 'Practitioner'; // Default persona
      try {
        const extraResult = await query(`SELECT role, persona FROM users WHERE id = $1`, [userId]);
        if (extraResult.rows.length > 0) {
          if (extraResult.rows[0].role) userRole = extraResult.rows[0].role;
          if (extraResult.rows[0].persona) userPersona = extraResult.rows[0].persona;
        }
      } catch (e) {
        // columns don't exist, use defaults
        console.log('ℹ️ Role/persona columns not found, using defaults');
      }

      const user = userResult.rows[0] || {};
      const voice = voiceResult.rows[0] || {};
      const calibration = calibrationResult.rows[0] || {};

      // Analyze calibration preferences to extract style hints
      let styleHints = '';
      if (calibration.preferences && Array.isArray(calibration.preferences)) {
        const toneLabels = [
          'ANALYTICAL', 'INSPIRATIONAL', 'CONVERSATIONAL', 'AUTHORITATIVE',
          'EMPATHETIC', 'DATA-DRIVEN', 'STORYTELLING', 'DIRECT',
          'THOUGHTFUL', 'BOLD', 'HUMBLE', 'VISIONARY'
        ];
        const likedStyles = toneLabels.filter((_, i) => calibration.preferences[i] === true);
        const dislikedStyles = toneLabels.filter((_, i) => calibration.preferences[i] === false);

        if (likedStyles.length > 0) {
          styleHints += `Preferred styles: ${likedStyles.join(', ')}. `;
        }
        if (dislikedStyles.length > 0) {
          styleHints += `Avoid styles: ${dislikedStyles.join(', ')}.`;
        }
      }

      const userProfile = {
        name: user.name,
        headline: user.headline,
        role: userRole,
        persona: userPersona,
        formal: voice.formal,
        bold: voice.bold,
        empathetic: voice.empathetic,
        complexity: voice.complexity,
        brevity: voice.brevity,
        primary_tone: voice.primary_tone,
        confidence: voice.confidence,
        styleHints: styleHints,
        topicInterests: user.topic_preferences || [] // User's selected topics from onboarding
      };

      // ============================================
      // PROMPT CACHING OPTIMIZATION
      // Split prompt into cacheable sections:
      // 1. Static instructions (same for all users) - CACHED
      // 2. User context (stable per user) - CACHED per user
      // 3. Request details (changes each call) - NOT cached
      // ============================================

      // SECTION 1: Static instructions (CACHEABLE - same for everyone)
      const staticInstructions = `You are an elite LinkedIn ghostwriter powered by Claude Opus 4.5. Create highly personalized, world-class posts.

**REQUIREMENTS:**
- Write a compelling LinkedIn post (150-300 words)
- MUST have a strong hook in the first 1-2 lines (pattern interrupt, bold statement, or intriguing question)
- Use line breaks for readability
- Match the user's voice signature EXACTLY
- End with engagement driver (question, call-to-action, or thought-provoker)
- Calculate hook score (0-100) based on attention-grabbing power
- Provide 2 specific suggestions to improve engagement

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "content": "The generated post content...",
  "hookScore": 85,
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}`;

      // SECTION 2: User context (CACHEABLE - stable per user, refreshes every 5 min)
      const personaStyle = userProfile?.persona === 'Visionary'
        ? '- Write with a VISIONARY lens: Focus on future trends, bold predictions, industry disruption, transformative ideas, big-picture thinking. Be provocative and forward-looking.'
        : userProfile?.persona === 'Practitioner'
        ? '- Write with a PRACTITIONER lens: Focus on actionable insights, data-backed claims, tactical advice, proven methodologies, concrete examples. Be analytical and practical.'
        : '- Write with a STORYTELLER lens: Focus on personal anecdotes, emotional connection, vulnerability, human experiences, relatable moments. Be authentic and engaging.';

      const roleGuidance = userProfile?.role === 'Founder' ? '- Focus on startup lessons, founder journey, building in public, leadership insights'
        : userProfile?.role === 'Job Seeker' ? '- Focus on career growth, skills showcase, industry insights, professional development'
        : userProfile?.role === 'Creator' ? '- Focus on thought leadership, unique perspectives, engaging storytelling, viral potential'
        : userProfile?.role === 'Freelancer' ? '- Focus on expertise showcase, client wins, industry knowledge, value proposition'
        : userProfile?.role === 'Executive' ? '- Focus on leadership lessons, strategic thinking, industry trends, team building'
        : '- Focus on professional insights and thought leadership';

      const userContext = `**USER PROFILE:**
- Name: ${userProfile?.name || 'Professional'}
- Professional Role: ${userProfile?.role || 'LinkedIn User'}
- Headline: ${userProfile?.headline || 'Building great things'}
- Content Persona: ${userProfile?.persona || 'Practitioner'}

**PERSONA STYLE (adapt content approach based on this):**
${personaStyle}

**VOICE SIGNATURE (match this writing style precisely):**
- Formality: ${userProfile?.formal || 5}/10 (${(userProfile?.formal || 5) > 7 ? 'very professional/corporate' : (userProfile?.formal || 5) > 4 ? 'balanced professional' : 'casual/approachable'})
- Boldness: ${userProfile?.bold || 5}/10 (${(userProfile?.bold || 5) > 7 ? 'direct, assertive, opinionated' : (userProfile?.bold || 5) > 4 ? 'balanced confidence' : 'humble, gentle, suggestive'})
- Empathy: ${userProfile?.empathetic || 5}/10 (${(userProfile?.empathetic || 5) > 7 ? 'emotional, personal stories, vulnerable' : (userProfile?.empathetic || 5) > 4 ? 'balanced warmth' : 'factual, data-driven, objective'})
- Complexity: ${userProfile?.complexity || 5}/10 (${(userProfile?.complexity || 5) > 7 ? 'technical jargon, sophisticated vocabulary' : (userProfile?.complexity || 5) > 4 ? 'moderate complexity' : 'simple, accessible language'})
- Brevity: ${userProfile?.brevity || 5}/10 (${(userProfile?.brevity || 5) > 7 ? 'very concise, punchy' : (userProfile?.brevity || 5) > 4 ? 'moderate length' : 'detailed, thorough explanations'})
- Primary Tone: ${userProfile?.primary_tone || 'Professional'}
${userProfile?.styleHints ? `\n**CALIBRATED PREFERENCES:** ${userProfile.styleHints}` : ''}

**USER TOPIC INTERESTS (incorporate these themes when relevant):**
${userProfile?.topicInterests && userProfile.topicInterests.length > 0
  ? userProfile.topicInterests.join(', ')
  : 'General professional content'}

**ROLE-SPECIFIC GUIDANCE:**
${roleGuidance}`;

      // SECTION 3: Request details (NOT cached - changes each call)
      const sourceTypeInstruction = sourceType === 'From Link' ? 'Create a post sharing insights from this link with personal perspective'
        : sourceType === 'From CV' ? 'Extract a career insight or lesson from this experience'
        : sourceType === 'Daily Spark' ? 'Create a trending, timely post on this topic'
        : 'Transform this idea into engaging LinkedIn content';

      const requestPrompt = `**CONTENT REQUEST:**
- Topic/Idea: "${prompt}"
- Source Type: ${sourceType}
- ${sourceTypeInstruction}

Now generate the LinkedIn post following all requirements above.`;

      // Execute with timeout, retry, and PROMPT CACHING
      const responseText = await executeWithRetry(async () => {
        const message = await anthropic.messages.create({
          model: config.claude.model,
          max_tokens: 4096,
          // Use system array with cache_control for prompt caching
          system: [
            {
              type: 'text',
              text: staticInstructions,
              cache_control: { type: 'ephemeral' } // Cache for 5 min
            },
            {
              type: 'text',
              text: userContext,
              cache_control: { type: 'ephemeral' } // Cache per-user for 5 min
            }
          ],
          messages: [{ role: 'user', content: requestPrompt }],
        });

        // Log token usage for monitoring cache efficiency
        const usage = message.usage as any;
        console.log(`📊 [CLAUDE] generatePost token usage:`, {
          input_tokens: usage.input_tokens,
          output_tokens: usage.output_tokens,
          cache_read: usage.cache_read_input_tokens || 0,
          cache_write: usage.cache_creation_input_tokens || 0,
        });
        if (usage.cache_read_input_tokens > 0) {
          const savingsPercent = Math.round((usage.cache_read_input_tokens / (usage.cache_read_input_tokens + usage.input_tokens + (usage.cache_creation_input_tokens || 0))) * 90);
          console.log(`💰 [CLAUDE] Cache hit! ~${savingsPercent}% token savings`);
        }

        const textBlock = message.content.find(block => block.type === 'text');
        return textBlock ? textBlock.text : '';
      }, 'generatePost');

      // Enhanced logging for debugging
      console.log('🤖 [CLAUDE] Raw response:', responseText);

      // Extract JSON using robust helper
      const cleanedResponse = extractJSON(responseText);
      console.log('🧹 Cleaned JSON string:', cleanedResponse.substring(0, 200));

      // Parse JSON with better error handling
      let generated: any;
      try {
        generated = JSON.parse(cleanedResponse);
      } catch (parseError: any) {
        console.error('❌ JSON parse error:', {
          error: parseError,
          rawResponse: responseText.substring(0, 500),
          cleanedResponse: cleanedResponse.substring(0, 500)
        });
        throw new Error(`Failed to parse Claude JSON response: ${parseError.message}`);
      }

      // Validate structure
      if (!isValidGeneratedPost(generated)) {
        console.error('❌ Invalid response structure:', {
          received: generated,
          expected: 'GeneratedPostResponse with content, hookScore, suggestions'
        });
        throw new Error('Claude returned invalid response structure');
      }

      console.log('✅ [CLAUDE] Post generated successfully, hook score:', generated.hookScore);

      return {
        content: generated.content,
        hookScore: generated.hookScore,
        suggestions: generated.suggestions,
      };
    } catch (error: any) {
      console.error('❌ [CLAUDE] Post generation error:', {
        message: error.message,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 3) // First 3 lines of stack
      });
      throw new Error(`Failed to generate post: ${error.message}`);
    }
  }

  /**
   * ENHANCED: Generate post with full personalization context
   * Uses PersonalizationService for comprehensive user context including:
   * - Voice signature with caching
   * - Calibrated hook scores
   * - Success patterns from high-performing posts
   * - Few-shot examples from top performers
   */
  static async generatePostEnhanced(
    userId: string,
    prompt: string,
    sourceType: string
  ): Promise<{ content: string; hookScore: number; calibratedHookScore: number; suggestions: string[]; sessionId: string }> {
    try {
      // Get enhanced context from PersonalizationService (includes caching)
      const context = await PersonalizationService.buildEnhancedContext(userId);

      // Generate unique session ID for variant tracking
      const sessionId = `gen_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Build prompt sections for caching
      const { staticSection, userContextSection, requestSection } = this.buildEnhancedPromptSections(context, prompt, sourceType);

      // Execute with timeout, retry, and PROMPT CACHING
      const responseText = await executeWithRetry(async () => {
        const message = await anthropic.messages.create({
          model: config.claude.model,
          max_tokens: 4096,
          // Use system array with cache_control for prompt caching
          system: [
            {
              type: 'text',
              text: staticSection,
              cache_control: { type: 'ephemeral' } // Cache static instructions
            },
            {
              type: 'text',
              text: userContextSection,
              cache_control: { type: 'ephemeral' } // Cache user context per-user
            }
          ],
          messages: [{ role: 'user', content: requestSection }],
        });

        // Log token usage for monitoring cache efficiency
        const usage = message.usage as any;
        console.log(`📊 [CLAUDE] generatePostEnhanced token usage:`, {
          input_tokens: usage.input_tokens,
          output_tokens: usage.output_tokens,
          cache_read: usage.cache_read_input_tokens || 0,
          cache_write: usage.cache_creation_input_tokens || 0,
        });
        if (usage.cache_read_input_tokens > 0) {
          const savingsPercent = Math.round((usage.cache_read_input_tokens / (usage.cache_read_input_tokens + usage.input_tokens + (usage.cache_creation_input_tokens || 0))) * 90);
          console.log(`💰 [CLAUDE] Cache hit! ~${savingsPercent}% token savings`);
        }

        const textBlock = message.content.find(block => block.type === 'text');
        return textBlock ? textBlock.text : '';
      }, 'generatePostEnhanced');

      // Parse response
      const cleanedResponse = extractJSON(responseText);
      const generated = JSON.parse(cleanedResponse);

      // Validate structure
      if (!isValidGeneratedPost(generated)) {
        throw new Error('Claude returned invalid response structure');
      }

      // Apply calibration to hook score
      const calibratedHookScore = PersonalizationService.applyCalibratedScore(
        generated.hookScore,
        context.hookCalibration
      );

      console.log('✅ [CLAUDE] Enhanced post generated', {
        rawHookScore: generated.hookScore,
        calibratedHookScore,
        calibrationFactor: context.hookCalibration.factor,
        sessionId
      });

      return {
        content: generated.content,
        hookScore: generated.hookScore,
        calibratedHookScore,
        suggestions: generated.suggestions,
        sessionId
      };
    } catch (error: any) {
      console.error('❌ [CLAUDE] Enhanced post generation error:', error.message);
      throw new Error(`Failed to generate post: ${error.message}`);
    }
  }

  /**
   * Build enhanced prompt SECTIONS for caching optimization
   * Separates static, user context, and request sections
   */
  private static buildEnhancedPromptSections(
    context: EnhancedUserContext,
    prompt: string,
    sourceType: string
  ): { staticSection: string; userContextSection: string; requestSection: string } {
    // Style preferences
    const lengthGuide: Record<string, string> = {
      short: '100-200 words, punchy and scannable',
      medium: '200-350 words, balanced depth',
      long: '350-500 words, comprehensive'
    };

    const emojiGuide: Record<string, string> = {
      none: 'NO emojis',
      minimal: '0-1 emojis maximum',
      moderate: '2-4 emojis strategically placed',
      heavy: '5+ emojis for visual appeal'
    };

    // SECTION 1: Static instructions (CACHEABLE - same for all users)
    const staticSection = `You are an elite LinkedIn ghostwriter powered by Claude Opus 4.5. Create highly personalized, world-class posts.

**REQUIREMENTS:**
- Write a compelling LinkedIn post matching the length preference
- MUST have a strong hook in the first 1-2 lines (use proven patterns if available)
- Match the user's voice signature EXACTLY
- End with engagement driver (question, call-to-action, or thought-provoker)
- Calculate hook score (0-100) based on attention-grabbing power
- Provide 2 specific suggestions to improve engagement

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "content": "The generated post content...",
  "hookScore": 85,
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}`;

    // Build success patterns section
    const patternsSection = context.topSuccessPatterns.length > 0
      ? `**PROVEN SUCCESS PATTERNS (from your top-performing posts):**
${context.topSuccessPatterns.map((p: PatternContext) => `- ${p.type}: "${p.value}" (${(p.successRate * 100).toFixed(0)}% success rate)`).join('\n')}`
      : '';

    // Build few-shot examples from high performers (truncated for token efficiency)
    const examplesSection = context.topPerformingPosts.length > 0
      ? `**YOUR TOP-PERFORMING POSTS (for reference style):**
${context.topPerformingPosts.slice(0, 2).map((p, i) =>
  `Example ${i + 1} (Engagement: ${p.engagementScore}):\n"${p.content.substring(0, 300)}${p.content.length > 300 ? '...' : ''}"`
).join('\n\n')}`
      : '';

    // SECTION 2: User context (CACHEABLE per user - stable unless profile changes)
    const userContextSection = `**USER PROFILE:**
- Name: ${context.name}
- Professional Role: ${context.role}
- Headline: ${context.headline}
- Content Persona: ${context.persona}
- Topic Interests: ${context.topicPreferences.join(', ') || 'General professional content'}

**VOICE SIGNATURE (match this writing style precisely):**
- Formality: ${context.voiceSignature.formal}/10 (${context.voiceSignature.formal > 7 ? 'very professional/corporate' : context.voiceSignature.formal > 4 ? 'balanced professional' : 'casual/approachable'})
- Boldness: ${context.voiceSignature.bold}/10 (${context.voiceSignature.bold > 7 ? 'direct, assertive, opinionated' : context.voiceSignature.bold > 4 ? 'balanced confidence' : 'humble, gentle, suggestive'})
- Empathy: ${context.voiceSignature.empathetic}/10 (${context.voiceSignature.empathetic > 7 ? 'emotional, personal stories, vulnerable' : context.voiceSignature.empathetic > 4 ? 'balanced warmth' : 'factual, data-driven, objective'})
- Complexity: ${context.voiceSignature.complexity}/10 (${context.voiceSignature.complexity > 7 ? 'technical jargon, sophisticated vocabulary' : context.voiceSignature.complexity > 4 ? 'moderate complexity' : 'simple, accessible language'})
- Brevity: ${context.voiceSignature.brevity}/10 (${context.voiceSignature.brevity > 7 ? 'very concise, punchy' : context.voiceSignature.brevity > 4 ? 'moderate length' : 'detailed, thorough explanations'})
- Primary Tone: ${context.voiceSignature.primaryTone}

**STYLE PREFERENCES:**
- Length: ${lengthGuide[context.stylePreferences.preferredLength] || lengthGuide.medium}
- Emoji usage: ${emojiGuide[context.stylePreferences.emojiUsage] || emojiGuide.moderate}

${patternsSection}

${examplesSection}

**PERFORMANCE CONTEXT:**
- Your average engagement rate: ${(context.performanceSummary.avgEngagementRate * 100).toFixed(2)}%
- Your average hook score: ${context.performanceSummary.avgHookScore.toFixed(0)}
- Total published posts: ${context.performanceSummary.totalPublishedPosts}`;

    // SECTION 3: Request (NOT cached - changes each call)
    const requestSection = `**CONTENT REQUEST:**
- Topic/Idea: "${prompt}"
- Source Type: ${sourceType}

Now generate the LinkedIn post following all requirements above.`;

    return { staticSection, userContextSection, requestSection };
  }

  /**
   * Build enhanced prompt with all personalization context (LEGACY - kept for compatibility)
   * Includes success patterns, few-shot examples, and calibrated scoring
   */
  private static buildEnhancedPrompt(
    context: EnhancedUserContext,
    prompt: string,
    sourceType: string
  ): string {
    // Build success patterns section
    const patternsSection = context.topSuccessPatterns.length > 0
      ? `**PROVEN SUCCESS PATTERNS (from your top-performing posts):**
${context.topSuccessPatterns.map((p: PatternContext) => `- ${p.type}: "${p.value}" (${(p.successRate * 100).toFixed(0)}% success rate)`).join('\n')}`
      : '';

    // Build few-shot examples from high performers
    const examplesSection = context.topPerformingPosts.length > 0
      ? `**YOUR TOP-PERFORMING POSTS (for reference style):**
${context.topPerformingPosts.slice(0, 2).map((p, i) =>
  `Example ${i + 1} (Engagement: ${p.engagementScore}):\n"${p.content.substring(0, 300)}${p.content.length > 300 ? '...' : ''}"`
).join('\n\n')}`
      : '';

    // Style preferences
    const lengthGuide: Record<string, string> = {
      short: '100-200 words, punchy and scannable',
      medium: '200-350 words, balanced depth',
      long: '350-500 words, comprehensive'
    };

    const emojiGuide: Record<string, string> = {
      none: 'NO emojis',
      minimal: '0-1 emojis maximum',
      moderate: '2-4 emojis strategically placed',
      heavy: '5+ emojis for visual appeal'
    };

    return `You are an elite LinkedIn ghostwriter powered by Claude Opus 4.5. Create a highly personalized, world-class post.

**USER PROFILE:**
- Name: ${context.name}
- Professional Role: ${context.role}
- Headline: ${context.headline}
- Content Persona: ${context.persona}
- Topic Interests: ${context.topicPreferences.join(', ') || 'General professional content'}

**VOICE SIGNATURE (match this writing style precisely):**
- Formality: ${context.voiceSignature.formal}/10 (${context.voiceSignature.formal > 7 ? 'very professional/corporate' : context.voiceSignature.formal > 4 ? 'balanced professional' : 'casual/approachable'})
- Boldness: ${context.voiceSignature.bold}/10 (${context.voiceSignature.bold > 7 ? 'direct, assertive, opinionated' : context.voiceSignature.bold > 4 ? 'balanced confidence' : 'humble, gentle, suggestive'})
- Empathy: ${context.voiceSignature.empathetic}/10 (${context.voiceSignature.empathetic > 7 ? 'emotional, personal stories, vulnerable' : context.voiceSignature.empathetic > 4 ? 'balanced warmth' : 'factual, data-driven, objective'})
- Complexity: ${context.voiceSignature.complexity}/10 (${context.voiceSignature.complexity > 7 ? 'technical jargon, sophisticated vocabulary' : context.voiceSignature.complexity > 4 ? 'moderate complexity' : 'simple, accessible language'})
- Brevity: ${context.voiceSignature.brevity}/10 (${context.voiceSignature.brevity > 7 ? 'very concise, punchy' : context.voiceSignature.brevity > 4 ? 'moderate length' : 'detailed, thorough explanations'})
- Primary Tone: ${context.voiceSignature.primaryTone}

**STYLE PREFERENCES:**
- Length: ${lengthGuide[context.stylePreferences.preferredLength] || lengthGuide.medium}
- Emoji usage: ${emojiGuide[context.stylePreferences.emojiUsage] || emojiGuide.moderate}

${patternsSection}

${examplesSection}

**PERFORMANCE CONTEXT:**
- Your average engagement rate: ${(context.performanceSummary.avgEngagementRate * 100).toFixed(2)}%
- Your average hook score: ${context.performanceSummary.avgHookScore.toFixed(0)}
- Total published posts: ${context.performanceSummary.totalPublishedPosts}

**CONTENT REQUEST:**
- Topic/Idea: "${prompt}"
- Source Type: ${sourceType}

**REQUIREMENTS:**
- Write a compelling LinkedIn post matching the length preference above
- MUST have a strong hook in the first 1-2 lines (use proven patterns if available)
- Match the user's voice signature EXACTLY
- End with engagement driver (question, call-to-action, or thought-provoker)
- Calculate hook score (0-100) based on attention-grabbing power
- Provide 2 specific suggestions to improve engagement

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "content": "The generated post content...",
  "hookScore": 85,
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}`;
  }

  /**
   * Generate sample posts for tone calibration
   * Returns array of {tone, content} objects for the iOS app
   */
  static async generateCalibrationPosts(count: number = 12): Promise<Array<{tone: string, content: string}>> {
    try {
      // Define 12 distinct tones for full calibration
      const toneLabels = [
        'Analytical',
        'Inspirational',
        'Conversational',
        'Authoritative',
        'Empathetic',
        'Data-driven',
        'Storytelling',
        'Direct',
        'Thoughtful',
        'Bold',
        'Humble',
        'Visionary'
      ];

      const tonesToGenerate = toneLabels.slice(0, Math.min(count, 12));

      const prompt = `You are a LinkedIn content expert. Generate ${tonesToGenerate.length} diverse sample LinkedIn posts with these SPECIFIC tones for tone calibration.

**Generate one post for EACH of these tones (in order):**
${tonesToGenerate.map((t, i) => `${i + 1}. ${t}`).join('\n')}

**Requirements:**
- Each post 80-150 words
- Strong hook that matches the tone
- Make each tone distinctly different
- Professional yet varied styles
- Posts should feel authentic and engaging

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "posts": [
    {"tone": "Analytical", "content": "Post content here..."},
    {"tone": "Inspirational", "content": "Post content here..."},
    ...and so on for all ${tonesToGenerate.length} posts
  ]
}`;

      // Execute with timeout and retry
      const response = await executeWithRetry(async () => {
        const message = await anthropic.messages.create({
          model: config.claude.model,
          max_tokens: 8192,
          messages: [{ role: 'user', content: prompt }],
        });
        const textBlock = message.content.find(block => block.type === 'text');
        return textBlock ? textBlock.text : '';
      }, 'generateCalibrationPosts');

      console.log('🤖 [CLAUDE] Calibration response (first 300 chars):', response.substring(0, 300));

      const cleanedResponse = extractJSON(response);
      const generated = JSON.parse(cleanedResponse);

      // Handle both old format (string[]) and new format ({tone, content}[])
      if (generated.posts && Array.isArray(generated.posts)) {
        // Check if it's already in the correct format
        if (generated.posts[0] && typeof generated.posts[0] === 'object' && generated.posts[0].content) {
          console.log(`✅ [CLAUDE] Generated ${generated.posts.length} calibration posts with tone metadata`);
          return generated.posts;
        }
        // Convert old string[] format to new format
        return generated.posts.map((content: string, index: number) => ({
          tone: tonesToGenerate[index] || 'Professional',
          content: content
        }));
      }

      return [];
    } catch (error: any) {
      console.error('❌ [CLAUDE] Calibration posts error:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      throw new Error(`Failed to generate calibration posts: ${error.message}`);
    }
  }

  /**
   * Calculate hook score for post content
   */
  static async calculateHookScore(content: string): Promise<{ score: number; suggestion?: string }> {
    try {
      const prompt = `You are a LinkedIn engagement expert. Analyze this post and calculate its "hook score" (0-100) based on:

**Hook criteria:**
- Attention-grabbing first line
- Emotional appeal
- Curiosity/intrigue
- Relevance to audience
- Clarity and brevity

**Post to analyze:**
"${content}"

Provide a score and ONE brief suggestion to improve the hook.

Respond with ONLY valid JSON:
{
  "score": 85,
  "suggestion": "Make the first line more specific and actionable"
}`;

      // Execute with timeout and retry - use HAIKU for this simple task (3-5x faster)
      const response = await executeWithRetry(async () => {
        const message = await anthropic.messages.create({
          model: CLAUDE_HAIKU, // Fast model for simple scoring
          max_tokens: 512,
          messages: [{ role: 'user', content: prompt }],
        });
        const textBlock = message.content.find(block => block.type === 'text');
        return textBlock ? textBlock.text : '';
      }, 'calculateHookScore');

      console.log('🤖 [HAIKU] Hook score response (first 200 chars):', response.substring(0, 200));

      const cleanedResponse = extractJSON(response);
      const analysis = JSON.parse(cleanedResponse);

      return {
        score: analysis.score || 0,
        suggestion: analysis.suggestion,
      };
    } catch (error: any) {
      console.error('❌ [CLAUDE] Hook score error:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      throw new Error(`Failed to calculate hook score: ${error.message}`);
    }
  }

  /**
   * Improve post content with AI suggestions
   */
  static async improvePost(
    userId: string,
    content: string
  ): Promise<{ content: string; hookScore: number; suggestions: string[] }> {
    try {
      // Fetch user's voice signature
      const signatureResult = await query(
        `SELECT * FROM voice_signatures WHERE user_id = $1`,
        [userId]
      );

      const signature = signatureResult.rows.length > 0 ? signatureResult.rows[0] : null;

      let prompt = `You are a LinkedIn content optimization expert. Improve this post while maintaining its core message:

**Original post:**
"${content}"`;

      if (signature) {
        prompt += `

**Match this voice signature:**
- Formality: ${signature.formal}/10
- Boldness: ${signature.bold}/10
- Empathy: ${signature.empathetic}/10
- Complexity: ${signature.complexity}/10
- Brevity: ${signature.brevity}/10
- Primary Tone: ${signature.primary_tone}`;
      }

      prompt += `

**Improvements to make:**
- Stronger hook
- Better structure
- More engaging language
- LinkedIn best practices
- Calculate hook score

Respond with ONLY valid JSON:
{
  "content": "Improved post content...",
  "hookScore": 92,
  "suggestions": ["What was changed and why"]
}`;

      // Execute with timeout and retry - use SONNET for medium complexity (2x faster)
      const response = await executeWithRetry(async () => {
        const message = await anthropic.messages.create({
          model: CLAUDE_SONNET, // Sonnet for medium complexity tasks
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        });
        const textBlock = message.content.find(block => block.type === 'text');
        return textBlock ? textBlock.text : '';
      }, 'improvePost');

      console.log('🤖 [SONNET] Improve post response received');

      const cleanedResponse = extractJSON(response);
      const improved = JSON.parse(cleanedResponse);

      return {
        content: improved.content,
        hookScore: improved.hookScore || 0,
        suggestions: improved.suggestions || [],
      };
    } catch (error) {
      console.error('[SONNET] Improve post error:', error);
      throw new Error('Failed to improve post');
    }
  }

  /**
   * Generate daily AI post ideas based on current trends
   */
  static async generateDailySpark(userId: string): Promise<Array<{
    title: string;
    description: string;
    trend: string;
    engagementPotential: number;
  }>> {
    try {
      // Get user's voice signature for personalization
      const signatureResult = await query(
        `SELECT primary_tone, formal, bold, empathetic FROM voice_signatures WHERE user_id = $1`,
        [userId]
      );

      // Get user's headline (role column may not exist)
      const userResult = await query(
        `SELECT headline FROM users WHERE id = $1`,
        [userId]
      );

      // Try to get role separately (column may not exist)
      let userRole = 'Professional';
      try {
        const roleResult = await query(`SELECT role FROM users WHERE id = $1`, [userId]);
        if (roleResult.rows.length > 0 && roleResult.rows[0].role) {
          userRole = roleResult.rows[0].role;
        }
      } catch (e) {
        // role column doesn't exist, use default
      }

      const userInfo = userResult.rows[0]
        ? { ...userResult.rows[0], role: userRole }
        : { headline: '', role: userRole };
      const voiceInfo = signatureResult.rows[0] || {};

      const currentDate = new Date().toISOString().split('T')[0];

      const prompt = `You are a LinkedIn content strategist. Generate 3 high-engagement post ideas for TODAY (${currentDate}) based on current trends and the user's profile.

**User Profile:**
- Role: ${userInfo.role || 'Professional'}
- Headline: ${userInfo.headline || 'LinkedIn User'}
- Tone: ${voiceInfo.primary_tone || 'Professional'}
- Communication Style: ${voiceInfo.bold > 5 ? 'Bold' : 'Gentle'}, ${voiceInfo.formal > 5 ? 'Formal' : 'Casual'}

**Requirements:**
- Ideas should be relevant to current news, trends, or timely topics
- Each idea should have HIGH engagement potential (viral-worthy)
- Match the user's professional role and communication style
- Be specific and actionable, not generic
- Focus on LinkedIn best practices (storytelling, data, personal insights)

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "ideas": [
    {
      "title": "Short catchy title for the post idea",
      "description": "Brief description of what the post would be about (1-2 sentences)",
      "trend": "The current trend or topic this relates to",
      "engagementPotential": 85
    }
  ]
}

The engagementPotential should be 60-100 representing predicted engagement.`;

      // Execute with timeout and retry - use SONNET for idea generation (2x faster)
      const response = await executeWithRetry(async () => {
        const message = await anthropic.messages.create({
          model: CLAUDE_SONNET, // Sonnet for medium complexity tasks
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        });
        const textBlock = message.content.find(block => block.type === 'text');
        return textBlock ? textBlock.text : '';
      }, 'generateDailySpark');

      console.log('🤖 [SONNET] Daily spark ideas generated');

      const cleanedResponse = extractJSON(response);
      const parsed = JSON.parse(cleanedResponse);

      return parsed.ideas || [];
    } catch (error) {
      console.error('[CLAUDE] Daily spark error:', error);

      // Fallback ideas if AI fails
      return [
        {
          title: 'Share a lesson from your biggest career challenge',
          description: 'People connect with authentic stories of overcoming obstacles. Share what you learned.',
          trend: 'Authenticity in professional content',
          engagementPotential: 75,
        },
        {
          title: 'Hot take on industry changes',
          description: 'Share your perspective on recent developments in your field with data to back it up.',
          trend: 'Thought leadership',
          engagementPotential: 80,
        },
        {
          title: 'Behind-the-scenes of your daily work',
          description: 'Give your network insight into your day-to-day professional life.',
          trend: 'Transparency and relatability',
          engagementPotential: 70,
        },
      ];
    }
  }

  /**
   * Generate 2 quick daily inspirations for home screen (personalized by topics)
   */
  static async generateDailyInspirations(userId: string, topicPreferences?: string[]): Promise<Array<{
    badge: string;
    title: string;
    subtitle: string;
    imageUrl: string;
  }>> {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);

      // Build personalization context
      let personalizationHint = '';
      if (topicPreferences && topicPreferences.length > 0) {
        personalizationHint = `\n\n**PERSONALIZATION:** This user frequently posts about: ${topicPreferences.join(', ')}. Try to include at least 1 inspiration related to these topics.`;
      }

      const prompt = `You are a LinkedIn content curator. Generate 2 ultra-short, catchy post inspirations for TODAY (${currentDate}) based on real current events and trending topics.

**Requirements:**
- Each inspiration should be based on actual news, trends, or timely topics from the last 48 hours
- Keep titles under 60 characters - punchy and attention-grabbing
- Subtitles should explain the trend context briefly
- No generic advice - be specific to current events
- Focus on topics with viral potential
- For imageKeyword: provide a simple 1-2 word search term for finding a relevant stock photo (e.g., "technology", "business meeting", "startup office", "AI robot", "leadership")${personalizationHint}

Respond with ONLY valid JSON (no markdown):
{
  "inspirations": [
    {
      "badge": "TECH TREND",
      "title": "Short punchy title based on real current event",
      "subtitle": "Brief context about why it's trending now",
      "imageKeyword": "technology"
    }
  ]
}

Badge options: "TECH TREND", "BUSINESS", "AI NEWS", "LEADERSHIP", "STARTUP", "CAREER"`;

      // Execute with timeout and retry - use HAIKU for this simple task (3-5x faster)
      const response = await executeWithRetry(async () => {
        const message = await anthropic.messages.create({
          model: CLAUDE_HAIKU, // Fast model for simple inspiration generation
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        });
        const textBlock = message.content.find(block => block.type === 'text');
        return textBlock ? textBlock.text : '';
      }, 'generateInspirations');

      console.log('🤖 [HAIKU] Daily inspirations generated');

      const cleanedResponse = extractJSON(response);
      const parsed = JSON.parse(cleanedResponse);

      // Add image URLs to inspirations using Picsum (reliable Lorem Ipsum for images)
      // Picsum provides random high-quality images that change based on seed
      const inspirations = (parsed.inspirations || []).map((insp: any, index: number) => {
        // Use dayOfYear + index to get different images each day but consistent within the day
        const seed = dayOfYear * 100 + index;
        return {
          badge: insp.badge,
          title: insp.title,
          subtitle: insp.subtitle,
          // Picsum: https://picsum.photos/seed/{seed}/width/height
          imageUrl: `https://picsum.photos/seed/${seed}/560/280`,
        };
      });

      return inspirations;
    } catch (error) {
      console.error('[HAIKU] Inspirations error:', error);

      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);

      // Fallback inspirations with images using Picsum
      return [
        {
          badge: 'TRENDING',
          title: 'What top founders are saying about 2026 priorities',
          subtitle: 'Based on recent CEO interviews',
          imageUrl: `https://picsum.photos/seed/${dayOfYear * 100}/560/280`,
        },
        {
          badge: 'AI NEWS',
          title: 'Why enterprise AI adoption just hit 68%',
          subtitle: 'New McKinsey report',
          imageUrl: `https://picsum.photos/seed/${dayOfYear * 100 + 1}/560/280`,
        },
      ];
    }
  }
}
