import fs from 'fs';
import { fileURLToPath } from 'url';
import { query, closePool } from '../src/db.js';
import { getConfig } from '../src/config.js';
import { logger } from '../src/logger.js';

if (typeof process.loadEnvFile === 'function' && fs.existsSync('.env')) {
  try {
    process.loadEnvFile('.env');
  } catch {
    // Ignore error if already loaded
  }
}

/**
 * Purges search_logs older than retentionDays (default: config.LOG_RETENTION_DAYS).
 * Audit logs are kept indefinitely and never purged.
 */
export async function purgeOldSearchLogs(retentionDays?: number): Promise<number> {
  const config = getConfig();
  const days = retentionDays ?? config.LOG_RETENTION_DAYS;

  const res = await query(
    `DELETE FROM search_logs
     WHERE created_at < NOW() - ($1 * INTERVAL '1 day');`,
    [days]
  );

  const deletedCount = res.rowCount ?? 0;
  logger.info(
    {
      route: 'scripts/purge-logs',
      deleted_count: deletedCount,
      retention_days: days,
    },
    `Purged ${deletedCount} search logs older than ${days} days`
  );

  return deletedCount;
}

async function main() {
  try {
    const deletedCount = await purgeOldSearchLogs();
    console.log(`Successfully purged ${deletedCount} stale search log entries.`);
  } catch (err) {
    console.error('Failed to purge stale search logs:', err);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

// Execute main if run directly
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  void main();
}
