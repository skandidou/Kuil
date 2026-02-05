-- Migration: Add linkedin_profile column to generated_posts table
-- This column was defined in schema.sql but missing from production database

ALTER TABLE generated_posts
ADD COLUMN IF NOT EXISTS linkedin_profile BOOLEAN DEFAULT TRUE;
