-- Migration: 008_ai_optimization_schema.sql
-- Purpose: Add tables and columns for AI optimization, feedback loops, and personalization
-- Date: 2025-01-29

-- ============================================
-- NEW TABLES
-- ============================================

-- 1. Post Selection Tracking
-- Tracks which AI-generated variant users select and their edit patterns
CREATE TABLE IF NOT EXISTS post_selections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  generated_post_id UUID REFERENCES generated_posts(id) ON DELETE SET NULL,

  -- Selection context
  session_id VARCHAR(100), -- Groups variants from same generation request
  selected_variant_number INT, -- Which variant (1, 2, 3) was chosen
  total_variants INT DEFAULT 3,

  -- AI-generated scores at creation time
  original_hook_score INT CHECK (original_hook_score >= 0 AND original_hook_score <= 100),
  original_content TEXT NOT NULL,

  -- User modifications
  final_content TEXT, -- Content after user edits (null if no edits)
  edit_distance INT DEFAULT 0, -- Levenshtein distance (character changes)
  edit_percentage DECIMAL(5,2) DEFAULT 0, -- Percentage of content changed
  was_edited BOOLEAN DEFAULT FALSE,

  -- Timing metrics
  time_to_select_ms INT, -- How long user took to choose variant
  selection_at TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Engagement Feedback
-- Links actual LinkedIn performance to generated posts for calibration
CREATE TABLE IF NOT EXISTS engagement_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  generated_post_id UUID REFERENCES generated_posts(id) ON DELETE SET NULL,
  linkedin_post_id VARCHAR(255),

  -- Engagement metrics at capture time
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  impressions INT DEFAULT 0,

  -- Calculated metrics
  engagement_rate DECIMAL(8,4), -- (likes + comments*2 + shares*3) / impressions

  -- AI prediction comparison
  predicted_hook_score INT, -- Hook score at generation time
  actual_engagement_score INT, -- Calculated from real engagement metrics
  score_delta INT, -- actual - predicted (positive = AI underestimated)

  -- Timing
  hours_since_publish INT, -- When metrics were captured (24h, 48h, etc.)
  captured_at TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW(),

  -- Only one feedback entry per post per time window
  UNIQUE(generated_post_id, hours_since_publish)
);

-- 3. Hook Score Calibration
-- Per-user calibration factors for hook score predictions
CREATE TABLE IF NOT EXISTS hook_calibrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Calibration factors: calibrated = raw * factor + bias
  calibration_factor DECIMAL(5,3) DEFAULT 1.0 CHECK (calibration_factor >= 0.5 AND calibration_factor <= 1.5),
  calibration_bias INT DEFAULT 0 CHECK (calibration_bias >= -20 AND calibration_bias <= 20),

  -- Calibration quality metrics
  sample_size INT DEFAULT 0, -- Number of posts used for calibration
  r_squared DECIMAL(5,4), -- Correlation coefficient (0.0-1.0)

  -- Metadata
  last_calibrated_at TIMESTAMP,
  calibration_method VARCHAR(50) DEFAULT 'linear_regression',

  -- Historical calibration data for trend analysis
  calibration_history JSONB DEFAULT '[]',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Voice Signature History
-- Tracks evolution of user's voice signature over time
CREATE TABLE IF NOT EXISTS voice_signature_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Snapshot of voice signature at this point in time
  formal DECIMAL(3,1) CHECK (formal >= 0 AND formal <= 10),
  bold DECIMAL(3,1) CHECK (bold >= 0 AND bold <= 10),
  empathetic DECIMAL(3,1) CHECK (empathetic >= 0 AND empathetic <= 10),
  complexity DECIMAL(3,1) CHECK (complexity >= 0 AND complexity <= 10),
  brevity DECIMAL(3,1) CHECK (brevity >= 0 AND brevity <= 10),
  primary_tone VARCHAR(100),
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),

  -- What triggered this snapshot
  trigger_reason VARCHAR(100), -- 'initial', 'periodic', 'manual', 'threshold', 'calibration'
  sample_posts_analyzed INT,
  analysis_source VARCHAR(50),

  -- Change from previous snapshot (null for first snapshot)
  delta_formal DECIMAL(4,2),
  delta_bold DECIMAL(4,2),
  delta_empathetic DECIMAL(4,2),
  delta_complexity DECIMAL(4,2),
  delta_brevity DECIMAL(4,2),

  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Success Patterns
-- Learned patterns from high-performing posts
CREATE TABLE IF NOT EXISTS success_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Pattern identification
  pattern_type VARCHAR(100) NOT NULL, -- 'hook_style', 'topic', 'length', 'structure', 'emoji_usage', 'posting_time'
  pattern_value TEXT NOT NULL, -- The specific pattern value

  -- Performance metrics
  occurrence_count INT DEFAULT 0,
  avg_engagement_score DECIMAL(8,2),
  avg_hook_score DECIMAL(5,2),
  success_rate DECIMAL(5,4) CHECK (success_rate >= 0 AND success_rate <= 1), -- % of posts above average

  -- Statistical confidence
  statistical_significance DECIMAL(5,4),

  -- Example posts demonstrating this pattern
  example_post_ids UUID[],

  last_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  -- One entry per user per pattern type/value combo
  UNIQUE(user_id, pattern_type, pattern_value)
);

-- ============================================
-- COLUMN ADDITIONS TO EXISTING TABLES
-- ============================================

-- Add columns to generated_posts for tracking
ALTER TABLE generated_posts
ADD COLUMN IF NOT EXISTS session_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS source_type VARCHAR(50), -- 'From Idea', 'From Link', 'Daily Spark', 'From CV'
ADD COLUMN IF NOT EXISTS generation_model VARCHAR(100), -- 'claude-opus-4', 'claude-sonnet-4', 'claude-haiku-3.5'
ADD COLUMN IF NOT EXISTS prompt_context JSONB, -- Snapshot of context used for generation
ADD COLUMN IF NOT EXISTS calibrated_hook_score INT CHECK (calibrated_hook_score >= 0 AND calibrated_hook_score <= 100);

-- Add columns to voice_signatures for evolution tracking
ALTER TABLE voice_signatures
ADD COLUMN IF NOT EXISTS evolution_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS last_evolution_check TIMESTAMP,
ADD COLUMN IF NOT EXISTS posts_since_last_evolution INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS evolution_threshold INT DEFAULT 10;

-- Add columns to users for personalization settings
ALTER TABLE users
ADD COLUMN IF NOT EXISTS personalization_level VARCHAR(20) DEFAULT 'balanced', -- 'minimal', 'balanced', 'aggressive'
ADD COLUMN IF NOT EXISTS preferred_post_length VARCHAR(20) DEFAULT 'medium', -- 'short', 'medium', 'long'
ADD COLUMN IF NOT EXISTS emoji_preference VARCHAR(20) DEFAULT 'moderate', -- 'none', 'minimal', 'moderate', 'heavy'
ADD COLUMN IF NOT EXISTS topic_preferences TEXT[];

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Post selections indexes
CREATE INDEX IF NOT EXISTS idx_post_selections_user_id ON post_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_post_selections_session ON post_selections(session_id);
CREATE INDEX IF NOT EXISTS idx_post_selections_created ON post_selections(created_at DESC);

-- Engagement feedback indexes
CREATE INDEX IF NOT EXISTS idx_engagement_feedback_user_id ON engagement_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_feedback_post ON engagement_feedback(generated_post_id);
CREATE INDEX IF NOT EXISTS idx_engagement_feedback_captured ON engagement_feedback(captured_at DESC);

-- Voice signature history indexes
CREATE INDEX IF NOT EXISTS idx_voice_history_user ON voice_signature_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_history_trigger ON voice_signature_history(trigger_reason);

-- Success patterns indexes
CREATE INDEX IF NOT EXISTS idx_success_patterns_user ON success_patterns(user_id, pattern_type);
CREATE INDEX IF NOT EXISTS idx_success_patterns_success_rate ON success_patterns(user_id, success_rate DESC);

-- Generated posts session index
CREATE INDEX IF NOT EXISTS idx_generated_posts_session ON generated_posts(session_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_generated_posts_user_status_created
ON generated_posts(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_linkedin_posts_user_engagement
ON linkedin_posts(user_id, (likes + comments * 2 + shares * 3) DESC);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Hook calibrations trigger
DROP TRIGGER IF EXISTS update_hook_calibrations_updated_at ON hook_calibrations;
CREATE TRIGGER update_hook_calibrations_updated_at
  BEFORE UPDATE ON hook_calibrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE post_selections IS 'Tracks which AI-generated variant users select and their editing patterns';
COMMENT ON TABLE engagement_feedback IS 'Links actual LinkedIn engagement to predicted hook scores for calibration';
COMMENT ON TABLE hook_calibrations IS 'Per-user calibration factors for more accurate hook score predictions';
COMMENT ON TABLE voice_signature_history IS 'Historical snapshots of voice signature evolution over time';
COMMENT ON TABLE success_patterns IS 'Learned patterns from high-performing content for each user';

COMMENT ON COLUMN hook_calibrations.calibration_factor IS 'Multiplier for hook scores (1.0 = no adjustment, <1.0 = AI optimistic, >1.0 = AI pessimistic)';
COMMENT ON COLUMN hook_calibrations.calibration_bias IS 'Additive adjustment for hook scores (-20 to +20)';
COMMENT ON COLUMN voice_signatures.evolution_threshold IS 'Number of new posts before triggering re-analysis';
COMMENT ON COLUMN success_patterns.success_rate IS 'Percentage of posts with this pattern that performed above user average';
