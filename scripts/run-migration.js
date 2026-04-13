const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;
const sqlFile = process.argv[2];

if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

if (!sqlFile) {
  console.error('Usage: node run-migration.js <sql-file>');
  process.exit(1);
}

const sql = fs.readFileSync(path.resolve(sqlFile), 'utf8');

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    await client.connect();
    console.log('Connected to Supabase');
    await client.query(sql);
    console.log('Migration applied successfully');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
