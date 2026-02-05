-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  linkedin_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  profile_picture TEXT,
  headline VARCHAR(500),
  role VARCHAR(100), -- User's professional role (Founder, Job Seeker, Creator, etc.)
  persona VARCHAR(100), -- User's communication persona (Visionary, Practitioner, Storyteller)

  -- Encrypted LinkedIn tokens (OAuth app - for login & posting)
  linkedin_access_token TEXT,
  linkedin_refresh_token TEXT,
  token_expires_at TIMESTAMP,

  -- Encrypted LinkedIn Analytics tokens (Community Management API - for analytics)
  linkedin_analytics_token TEXT,
  linkedin_analytics_token_expires_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

-- Voice Signatures table
CREATE TABLE IF NOT EXISTS voice_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Pentagon dimensions (0.0 - 10.0)
  formal DECIMAL(3,1) CHECK (formal >= 0 AND formal <= 10),
  bold DECIMAL(3,1) CHECK (bold >= 0 AND bold <= 10),
  empathetic DECIMAL(3,1) CHECK (empathetic >= 0 AND empathetic <= 10),
  complexity DECIMAL(3,1) CHECK (complexity >= 0 AND complexity <= 10),
  brevity DECIMAL(3,1) CHECK (brevity >= 0 AND brevity <= 10),

  -- Primary tone classification
  primary_tone VARCHAR(100),
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),

  -- Analysis metadata
  sample_posts_analyzed INT DEFAULT 0,
  last_analyzed_at TIMESTAMP,
  analysis_source VARCHAR(50) DEFAULT 'gemini',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id)
);

-- LinkedIn Posts cache table
CREATE TABLE IF NOT EXISTS linkedin_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- LinkedIn data
  linkedin_post_id VARCHAR(255) UNIQUE,
  content TEXT NOT NULL,

  -- Engagement metrics
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  impressions INT DEFAULT 0,

  -- Community Management API analytics
  members_reached INT DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0.00,
  analytics_fetched_at TIMESTAMP,

  -- Timestamps
  posted_at TIMESTAMP,
  fetched_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),

  -- Prevent duplicates
  UNIQUE(user_id, linkedin_post_id)
);

-- Analytics Snapshots table (for tracking historical metrics)
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Follower metrics
  follower_count INT DEFAULT 0,
  connection_count INT DEFAULT 0,

  -- Aggregated post metrics
  total_impressions BIGINT DEFAULT 0,
  total_members_reached BIGINT DEFAULT 0,
  total_reactions INT DEFAULT 0,
  total_comments INT DEFAULT 0,
  total_reshares INT DEFAULT 0,

  -- Calculated scores
  visibility_score INT DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0.00,

  -- Metadata
  snapshot_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, snapshot_date)
);

-- Generated Posts table (posts created by Gemini)
CREATE TABLE IF NOT EXISTS generated_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Content
  topic VARCHAR(500),
  variant_number INT,
  content TEXT NOT NULL,
  hook_score INT CHECK (hook_score >= 0 AND hook_score <= 100),

  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, published
  linkedin_post_id VARCHAR(255), -- LinkedIn post ID after publishing
  linkedin_profile BOOLEAN DEFAULT TRUE, -- Posted to personal profile
  scheduled_at TIMESTAMP, -- When the post is scheduled for
  published_at TIMESTAMP, -- When the post was published

  -- Engagement (for published posts)
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tone Calibrations table (user preferences from swipe calibration)
CREATE TABLE IF NOT EXISTS tone_calibrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Calibration data
  preferences JSONB NOT NULL, -- Array of boolean preferences [true, false, true, ...]
  sample_posts JSONB, -- Sample posts shown during calibration

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_linkedin_id ON users(linkedin_id);
CREATE INDEX IF NOT EXISTS idx_voice_signatures_user_id ON voice_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_user_id ON linkedin_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_posts_user_id ON generated_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_posts_scheduled ON generated_posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_tone_calibrations_user_id ON tone_calibrations(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_posts_status ON generated_posts(status);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_user_date ON analytics_snapshots(user_id, snapshot_date DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_signatures_updated_at BEFORE UPDATE ON voice_signatures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_posts_updated_at BEFORE UPDATE ON generated_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development (optional)
-- This will be skipped in production
DO $$
BEGIN
  IF (SELECT current_setting('server_version_num')::int >= 120000) THEN
    -- Development seed data
    INSERT INTO users (linkedin_id, name, email, headline)
    VALUES ('dev_user_1', 'Dev User', 'dev@example.com', 'Software Engineer')
    ON CONFLICT (linkedin_id) DO NOTHING;
  END IF;
END $$;
