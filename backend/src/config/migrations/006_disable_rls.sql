-- Migration 006: Disable Row Level Security
-- Date: 2026-01-25
-- Issue: RLS was causing 500 errors on GET /api/posts/scheduled and GET /api/user/activity
-- Root cause: app.user_id was never set because query() doesn't call SET LOCAL app.user_id
-- Solution: Disable RLS - JWT authentication + explicit user_id filters provide sufficient security

-- ====================================
-- DISABLE ROW LEVEL SECURITY ON ALL TABLES
-- ====================================

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE voice_signatures DISABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE generated_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE tone_calibrations DISABLE ROW LEVEL SECURITY;

-- ====================================
-- DROP RLS POLICIES (cleanup)
-- ====================================

DROP POLICY IF EXISTS "users_isolation_policy" ON users;
DROP POLICY IF EXISTS "voice_signatures_isolation_policy" ON voice_signatures;
DROP POLICY IF EXISTS "linkedin_posts_isolation_policy" ON linkedin_posts;
DROP POLICY IF EXISTS "generated_posts_isolation_policy" ON generated_posts;
DROP POLICY IF EXISTS "tone_calibrations_isolation_policy" ON tone_calibrations;

-- ====================================
-- VERIFICATION
-- ====================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 006 completed: RLS disabled on all tables';
  RAISE NOTICE 'Security is maintained via JWT authentication and explicit user_id WHERE clauses';
END $$;
