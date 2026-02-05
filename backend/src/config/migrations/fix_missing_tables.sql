-- Migration: Fix missing tables and columns
-- Date: 2026-01-17
-- Description: Add tone_calibrations table and ensure scheduled_at column exists

-- Create tone_calibrations table if it doesn't exist
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

-- Create index for tone_calibrations
CREATE INDEX IF NOT EXISTS idx_tone_calibrations_user_id ON tone_calibrations(user_id);

-- Add scheduled_at column to generated_posts if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_posts' AND column_name = 'scheduled_at'
  ) THEN
    ALTER TABLE generated_posts ADD COLUMN scheduled_at TIMESTAMP;
  END IF;
END $$;

-- Create index for scheduled posts if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_generated_posts_scheduled
  ON generated_posts(scheduled_at)
  WHERE status = 'scheduled';

-- Verify tables exist
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully';
  RAISE NOTICE 'tone_calibrations table: %',
    (SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tone_calibrations'));
  RAISE NOTICE 'scheduled_at column: %',
    (SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_posts' AND column_name = 'scheduled_at'));
END $$;
