import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase.co')
    ? { rejectUnauthorized: false }
    : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased for remote DB
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

export const query = async (text: string, params?: any[], userId?: string) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

/**
 * Execute a query with RLS user context
 * Sets the app.user_id session variable for Row Level Security policies
 */
export const queryWithUserContext = async (text: string, params: any[], userId: string) => {
  const client = await pool.connect();
  try {
    // Set user context for RLS policies
    await client.query('SET LOCAL app.user_id = $1', [userId]);

    // Execute the actual query
    const res = await client.query(text, params);
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);

  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!');
  }, 5000);

  client.release = () => {
    clearTimeout(timeout);
    return release();
  };

  return client;
};

/**
 * Run database migrations
 * Creates tables/columns if they don't exist
 */
export const runMigrations = async () => {
  console.log('🔄 Running database migrations...');

  try {
    // Migration 006: Analytics snapshots table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_snapshots (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        follower_count INT DEFAULT 0,
        connection_count INT DEFAULT 0,
        total_impressions BIGINT DEFAULT 0,
        total_members_reached BIGINT DEFAULT 0,
        total_reactions INT DEFAULT 0,
        total_comments INT DEFAULT 0,
        total_reshares INT DEFAULT 0,
        visibility_score INT DEFAULT 0,
        engagement_rate DECIMAL(5,2) DEFAULT 0.00,
        snapshot_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, snapshot_date)
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_user_date
      ON analytics_snapshots(user_id, snapshot_date DESC)
    `);

    // Migration 008: LinkedIn Analytics token columns
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS linkedin_analytics_token TEXT
    `);

    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS linkedin_analytics_token_expires_at TIMESTAMP
    `);

    console.log('✅ Database migrations completed');
  } catch (error) {
    console.error('❌ Migration error:', error);
    // Don't throw - let the app continue even if migrations fail
  }
};

export default pool;
