-- Migration 005: Add Row Level Security (RLS) Policies
-- This migration implements defense-in-depth security by enforcing user isolation at the database layer
-- Even if application-level JWT validation is bypassed, the database will prevent unauthorized access

-- ====================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ====================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tone_calibrations ENABLE ROW LEVEL SECURITY;

-- ====================================
-- CREATE RLS POLICIES
-- ====================================

-- USERS TABLE
-- Policy: Users can only access their own user record
CREATE POLICY "users_isolation_policy" ON users
  FOR ALL
  USING (id = current_setting('app.user_id', true)::uuid);

-- VOICE SIGNATURES TABLE
-- Policy: Users can only access their own voice signature
CREATE POLICY "voice_signatures_isolation_policy" ON voice_signatures
  FOR ALL
  USING (user_id = current_setting('app.user_id', true)::uuid);

-- LINKEDIN POSTS TABLE
-- Policy: Users can only access their own cached LinkedIn posts
CREATE POLICY "linkedin_posts_isolation_policy" ON linkedin_posts
  FOR ALL
  USING (user_id = current_setting('app.user_id', true)::uuid);

-- GENERATED POSTS TABLE
-- Policy: Users can only access their own generated posts
CREATE POLICY "generated_posts_isolation_policy" ON generated_posts
  FOR ALL
  USING (user_id = current_setting('app.user_id', true)::uuid);

-- TONE CALIBRATIONS TABLE
-- Policy: Users can only access their own tone calibration
CREATE POLICY "tone_calibrations_isolation_policy" ON tone_calibrations
  FOR ALL
  USING (user_id = current_setting('app.user_id', true)::uuid);

-- ====================================
-- GRANT SERVICE ROLE BYPASS
-- ====================================
-- The backend uses a service role that should bypass RLS
-- This is configured at the connection level, not here

-- ====================================
-- TABLE COMMENTS FOR DOCUMENTATION
-- ====================================

COMMENT ON POLICY "users_isolation_policy" ON users IS
  'Enforces user can only access their own record. Backend sets app.user_id from JWT.';

COMMENT ON POLICY "voice_signatures_isolation_policy" ON voice_signatures IS
  'Enforces user can only access their own voice signature.';

COMMENT ON POLICY "linkedin_posts_isolation_policy" ON linkedin_posts IS
  'Enforces user can only access their own cached LinkedIn posts.';

COMMENT ON POLICY "generated_posts_isolation_policy" ON generated_posts IS
  'Enforces user can only access their own generated posts.';

COMMENT ON POLICY "tone_calibrations_isolation_policy" ON tone_calibrations IS
  'Enforces user can only access their own tone calibration.';
