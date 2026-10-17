import pg from 'pg';
import { getConfig } from './config.js';

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    const config = getConfig();
    pool = new pg.Pool({
      connectionString: config.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('[db] Unexpected error on idle client:', err);
    });
  }
  return pool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const p = getPool();
  return p.query<T>(text, params);
}

export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query('BEGIN;');
    const result = await fn(client);
    await client.query('COMMIT;');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK;');
    } catch (rollbackError) {
      console.error('[db] Failed to rollback transaction:', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function withStatementTimeout<T>(
  timeoutMs: number,
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const p = getPool();
  const client = await p.connect();
  try {
    const safeTimeout = Math.max(1, Math.floor(timeoutMs));
    await client.query('BEGIN;');
    await client.query(`SET LOCAL statement_timeout = ${safeTimeout};`);
    const result = await fn(client);
    await client.query('COMMIT;');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK;');
    } catch {
      // ignore rollback failure
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
