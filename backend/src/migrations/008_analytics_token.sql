-- Migration: 008_analytics_token.sql
-- Description: Add LinkedIn Analytics token columns for Community Management API (separate OAuth app)

ALTER TABLE users
ADD COLUMN IF NOT EXISTS linkedin_analytics_token TEXT,
ADD COLUMN IF NOT EXISTS linkedin_analytics_token_expires_at TIMESTAMP;
