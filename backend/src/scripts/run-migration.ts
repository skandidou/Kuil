import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function runMigration() {
  try {
    console.log('🔄 Running database migration...');

    // Read migration file
    const migrationPath = join(__dirname, '../config/migrations/fix_missing_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Execute migration
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!');

    // Verify tables
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n📊 Database tables:');
    tablesResult.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    // Verify tone_calibrations columns
    const calibrationColumnsResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'tone_calibrations'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 tone_calibrations columns:');
    calibrationColumnsResult.rows.forEach((row) => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // Verify generated_posts has scheduled_at
    const scheduledAtResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'generated_posts' AND column_name = 'scheduled_at';
    `);

    if (scheduledAtResult.rows.length > 0) {
      console.log('\n✅ scheduled_at column exists in generated_posts');
    } else {
      console.log('\n❌ scheduled_at column missing in generated_posts');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
