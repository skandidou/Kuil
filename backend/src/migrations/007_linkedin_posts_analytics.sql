-- Migration: 007_linkedin_posts_analytics.sql
-- Description: Add analytics columns to linkedin_posts table for Community Management API data

ALTER TABLE linkedin_posts
ADD COLUMN IF NOT EXISTS members_reached INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_rate DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS analytics_fetched_at TIMESTAMP;
