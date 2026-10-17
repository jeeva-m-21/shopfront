import fs from 'fs';
import path from 'path';
import pg from 'pg';

if (typeof process.loadEnvFile === 'function' && fs.existsSync('.env')) {
  try {
    process.loadEnvFile('.env');
  } catch {
    // Ignore error
  }
}

import { getConfig, SERVICE_AREA } from '../src/config.js';

async function seedLocalities() {
  const config = getConfig();
  const pool = new pg.Pool({ connectionString: config.DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log('[seed:localities] Connecting to database...');
    const seedPath = path.resolve(process.cwd(), 'db/seeds/localities.sql');
    if (!fs.existsSync(seedPath)) {
      throw new Error(`Seed file not found: ${seedPath}`);
    }

    const sql = fs.readFileSync(seedPath, 'utf-8');
    await client.query('BEGIN;');
    await client.query(sql);
    await client.query('COMMIT;');

    const { rows } = await client.query<{
      id: number;
      name: string;
      aliases: string[];
      lat: number;
      lng: number;
    }>(`
      SELECT
        id,
        name,
        aliases,
        ST_Y(center::geometry) AS lat,
        ST_X(center::geometry) AS lng
      FROM localities
      ORDER BY id ASC;
    `);

    console.log(`[seed:localities] Successfully seeded ${rows.length} localities.`);
    if (rows.length !== 32) {
      throw new Error(`Expected exactly 32 localities, found ${rows.length}`);
    }

    // Verify all centroids fall within Chennai service area
    for (const row of rows) {
      if (
        row.lat < SERVICE_AREA.MIN_LAT ||
        row.lat > SERVICE_AREA.MAX_LAT ||
        row.lng < SERVICE_AREA.MIN_LNG ||
        row.lng > SERVICE_AREA.MAX_LNG
      ) {
        throw new Error(
          `Locality "${row.name}" coordinate (${row.lat}, ${row.lng}) falls outside Chennai service area!`
        );
      }
    }

    console.log('[seed:localities] All 32 localities verified within Chennai bounding box.');
  } catch (err) {
    await client.query('ROLLBACK;').catch(() => {});
    console.error('[seed:localities] Seeding failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedLocalities();
