import fs from 'fs';
import path from 'path';
import pg from 'pg';

if (typeof process.loadEnvFile === 'function' && fs.existsSync('.env')) {
  try {
    process.loadEnvFile('.env');
  } catch {
    // Ignore error if already loaded
  }
}

import { getConfig } from '../src/config.js';

async function runMigrations() {
  const config = getConfig();
  const pool = new pg.Pool({ connectionString: config.DATABASE_URL });

  const client = await pool.connect();
  try {
    console.log('[migrate] Connecting to database...');
    
    // Ensure migration tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version    TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // Fetch applied migrations
    const { rows: appliedRows } = await client.query<{ version: string }>(
      'SELECT version FROM schema_migrations ORDER BY version ASC;'
    );
    const appliedVersions = new Set(appliedRows.map((r) => r.version));

    // Read migrations directory
    const migrationsDir = path.resolve(process.cwd(), 'db/migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('[migrate] No migrations directory found.');
      return;
    }

    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    let appliedCount = 0;
    for (const file of migrationFiles) {
      if (appliedVersions.has(file)) {
        continue;
      }

      console.log(`[migrate] Applying migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      await client.query('BEGIN;');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1);', [file]);
        await client.query('COMMIT;');
        console.log(`[migrate] Successfully applied: ${file}`);
        appliedCount++;
      } catch (err) {
        await client.query('ROLLBACK;');
        console.error(`[migrate] Migration failed: ${file}`);
        throw err;
      }
    }

    if (appliedCount === 0) {
      console.log('[migrate] Database is up to date. No pending migrations.');
    } else {
      console.log(`[migrate] Applied ${appliedCount} migration(s) successfully.`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error('[migrate] Error running migrations:', err);
  process.exit(1);
});
