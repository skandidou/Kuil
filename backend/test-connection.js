const { Pool } = require('pg');

const connectionString = 'postgresql://postgres.lnmzpoaklsichtlxlbir:TsegghdU95yLF6PF@aws-1-eu-west-2.pooler.supabase.com:5432/postgres';

console.log('🔍 Testing Supabase connection...');

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW() as current_time, version() as pg_version', (err, res) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Connection successful!');
    console.log('📅 Current time:', res.rows[0].current_time);
    console.log('🐘 PostgreSQL version:', res.rows[0].pg_version.split(' ')[0]);
  }
  pool.end();
});
