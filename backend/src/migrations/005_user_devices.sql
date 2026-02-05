-- Migration: Create user_devices table for push notifications
-- Run this migration on your database

-- Table for storing device tokens (FCM)
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fcm_token TEXT NOT NULL UNIQUE,
    platform VARCHAR(20) DEFAULT 'ios',
    os_version VARCHAR(20),
    app_version VARCHAR(20),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_user_devices_fcm_token ON user_devices(fcm_token);

-- Add notification preferences to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "post_published": true,
    "post_failed": true,
    "scheduled_reminder": true,
    "token_expiring": true,
    "weekly_summary": true
}'::jsonb;

-- Add token_expires_at to users for tracking LinkedIn token expiry
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_token_expires_at TIMESTAMP WITH TIME ZONE;

COMMENT ON TABLE user_devices IS 'Stores FCM device tokens for push notifications';
COMMENT ON COLUMN user_devices.fcm_token IS 'Firebase Cloud Messaging token';
COMMENT ON COLUMN user_devices.platform IS 'Device platform (ios, android)';
