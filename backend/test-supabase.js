const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:TsegghdU95yLF6PF@db.lnmzpoaklsichtlxlbir.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('Success! Current time:', res.rows[0].now);
  }
  pool.end();
});
