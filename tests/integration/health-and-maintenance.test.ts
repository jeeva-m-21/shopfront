import { describe, it, expect, beforeEach, vi } from 'vitest';
import { query } from '@/db';
import { GET } from '@/app/api/health/route';
import { purgeOldSearchLogs } from '../../scripts/purge-logs';

describe('Health Check & Maintenance (SPRINT-6.3)', () => {
  describe('GET /api/health', () => {
    it('returns HTTP 200 with { status: "ok" } when database is reachable', async () => {
      const response = await GET();
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({ status: 'ok' });
    });

    it('returns HTTP 503 with { status: "error" } when database check fails', async () => {
      // Mock db query to simulate database failure
      const dbModule = await import('@/db');
      const spy = vi.spyOn(dbModule, 'query').mockRejectedValueOnce(new Error('Connection lost'));

      const response = await GET();
      expect(response.status).toBe(503);

      const data = await response.json();
      expect(data).toHaveProperty('status', 'error');
      expect(data).toHaveProperty('error');

      spy.mockRestore();
    });
  });

  describe('scripts/purge-logs.ts', () => {
    beforeEach(async () => {
      // Clean up test search logs
      await query(`DELETE FROM search_logs WHERE query_text LIKE 'test_purge_%';`);
    });

    it('deletes search_logs older than retention days and preserves recent logs', async () => {
      // Insert an old log (e.g. 95 days old)
      const oldQuery = `test_purge_old_${Date.now()}`;
      await query(
        `INSERT INTO search_logs (
          channel, tool, query_text, total_ms, created_at
        ) VALUES (
          'web', 'find_shops', $1, 100, NOW() - INTERVAL '95 days'
        );`,
        [oldQuery]
      );

      // Insert a fresh log (e.g. 5 days old)
      const freshQuery = `test_purge_fresh_${Date.now()}`;
      await query(
        `INSERT INTO search_logs (
          channel, tool, query_text, total_ms, created_at
        ) VALUES (
          'web', 'find_shops', $1, 100, NOW() - INTERVAL '5 days'
        );`,
        [freshQuery]
      );

      // Verify both exist before purge
      const beforeRes = await query<{ query_text: string }>(
        `SELECT query_text FROM search_logs WHERE query_text IN ($1, $2);`,
        [oldQuery, freshQuery]
      );
      expect(beforeRes.rows.length).toBe(2);

      // Execute purge with default retention (90 days)
      const deletedCount = await purgeOldSearchLogs();
      expect(deletedCount).toBeGreaterThanOrEqual(1);

      // Verify old log is deleted and fresh log remains
      const afterRes = await query<{ query_text: string }>(
        `SELECT query_text FROM search_logs WHERE query_text IN ($1, $2);`,
        [oldQuery, freshQuery]
      );
      expect(afterRes.rows.length).toBe(1);
      expect(afterRes.rows[0]?.query_text).toBe(freshQuery);
    });

    it('preserves audit_logs indefinitely (audit logs are never purged)', async () => {
      const ts = Date.now();
      // Insert old audit log
      await query(
        `INSERT INTO audit_log (
          actor_id, actor_username, action, entity_type, entity_id, created_at
        ) VALUES (
          NULL, 'system', $1, 'shop', 'test-id', NOW() - INTERVAL '150 days'
        );`,
        [`test_audit_purge_${ts}`]
      );

      // Run purge
      await purgeOldSearchLogs();

      // Check audit log still exists
      const auditRes = await query<{ action: string }>(
        `SELECT action FROM audit_log WHERE action = $1;`,
        [`test_audit_purge_${ts}`]
      );
      expect(auditRes.rows.length).toBe(1);

      // Clean up test audit log
      await query(`DELETE FROM audit_log WHERE action = $1;`, [`test_audit_purge_${ts}`]);
    });
  });
});
