-- Migration: Add linkedin_post_id column to generated_posts
-- This column stores the LinkedIn post ID after publishing

ALTER TABLE generated_posts
ADD COLUMN IF NOT EXISTS linkedin_post_id VARCHAR(255);

-- Add retry_count and failure_reason if they don't exist
ALTER TABLE generated_posts
ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;

ALTER TABLE generated_posts
ADD COLUMN IF NOT EXISTS failure_reason TEXT;
