-- Add fields for scheduled post publishing
ALTER TABLE generated_posts
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;

-- Add topic preferences to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS topic_preferences TEXT[];

-- Create index for efficient scheduler queries
-- Partial index for scheduled posts (without NOW() predicate which is not IMMUTABLE)
CREATE INDEX IF NOT EXISTS idx_generated_posts_scheduler
ON generated_posts(scheduled_at, status)
WHERE status = 'scheduled';

-- Comment the tables for documentation
COMMENT ON COLUMN generated_posts.failure_reason IS 'Error message if scheduled post failed to publish';
COMMENT ON COLUMN generated_posts.retry_count IS 'Number of times we attempted to publish this scheduled post';
COMMENT ON COLUMN users.topic_preferences IS 'Top topics extracted from user LinkedIn history for AI personalization';
