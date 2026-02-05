-- Migration: 006_analytics_snapshots.sql
-- Description: Create analytics_snapshots table for tracking historical LinkedIn analytics

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

-- Index for fast retrieval of recent snapshots
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_user_date
ON analytics_snapshots(user_id, snapshot_date DESC);
