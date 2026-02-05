import { readFileSync } from 'fs';
import { join } from 'path';
import pool from './database';

async function runMigration() {
  console.log('🚀 Starting database migration...');

  try {
    const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');

    await pool.query(schemaSQL);

    console.log('✅ Database migration completed successfully!');
    console.log('');
    console.log('Tables created:');
    console.log('  - users');
    console.log('  - voice_signatures');
    console.log('  - linkedin_posts');
    console.log('  - generated_posts');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
