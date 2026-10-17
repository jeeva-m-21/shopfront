import { describe, it, expect, beforeEach } from 'vitest';
import { query } from '../../src/db.js';
import {
  getSearchLogs,
  exportSearchLogsCsv,
  getAuditLogs,
} from '../../src/admin/telemetry-ops.js';

describe('Admin Telemetry & Audit Logs (Integration Tests)', () => {
  beforeEach(async () => {
    // Clear test telemetry rows
    await query(`DELETE FROM search_logs WHERE query_text LIKE 'testquery_%';`);
  });

  it('aggregates search logs telemetry with summary strip (query count, rerank rate, fallback rate, p50, p95)', async () => {
    // Insert 10 synthetic telemetry records
    for (let i = 1; i <= 10; i++) {
      const isReranked = i <= 6; // 60% reranked
      const fallbackReason = i > 8 ? 'timeout' : null; // 20% fallback
      const totalMs = 100 + i * 20; // 120ms to 300ms

      await query(
        `INSERT INTO search_logs (
          channel, tool, query_text, candidate_count, result_count,
          reranked, fallback_reason, total_ms, stage1_ms
         ) VALUES ($1, 'find_shops', $2, 10, 5, $3, $4, $5, 50);`,
        [i % 2 === 0 ? 'mcp' : 'web', `testquery_${i}`, isReranked, fallbackReason, totalMs]
      );
    }

    const { logs, summary } = await getSearchLogs({
      tool: 'find_shops',
    });

    expect(logs.length).toBeGreaterThanOrEqual(10);
    expect(summary.queryCount).toBeGreaterThanOrEqual(10);
    expect(summary.rerankRate).toBeGreaterThanOrEqual(0);
    expect(summary.fallbackRate).toBeGreaterThanOrEqual(0);
    expect(summary.p50TotalMs).toBeGreaterThan(0);
    expect(summary.p95TotalMs).toBeGreaterThanOrEqual(summary.p50TotalMs);
  });

  it('filters search logs by channel and fallback_only', async () => {
    await query(
      `INSERT INTO search_logs (channel, tool, query_text, total_ms, reranked, fallback_reason)
       VALUES ('mcp', 'find_shops', 'testquery_mcp_fb', 150, FALSE, 'circuit_open');`
    );
    await query(
      `INSERT INTO search_logs (channel, tool, query_text, total_ms, reranked)
       VALUES ('web', 'find_shops', 'testquery_web_ok', 140, TRUE);`
    );

    const mcpFallbackOnly = await getSearchLogs({
      channel: 'mcp',
      fallbackOnly: true,
    });

    const mcpRow = mcpFallbackOnly.logs.find((l) => l.query_text === 'testquery_mcp_fb');
    expect(mcpRow).toBeDefined();
    expect(mcpRow?.channel).toBe('mcp');
    expect(mcpRow?.fallback_reason).toBe('circuit_open');

    const webRow = mcpFallbackOnly.logs.find((l) => l.query_text === 'testquery_web_ok');
    expect(webRow).toBeUndefined();
  });

  it('exports search logs to CSV format with proper header columns', async () => {
    await query(
      `INSERT INTO search_logs (channel, tool, query_text, total_ms, reranked)
       VALUES ('mcp', 'find_shops', 'testquery_csv_1', 180, TRUE);`
    );

    const csv = await exportSearchLogsCsv({
      tool: 'find_shops',
    });

    expect(csv).toContain('id,created_at,channel,tool,query_text,locality_id,category,result_count,reranked,fallback_reason,error_code,total_ms');
    expect(csv).toContain('testquery_csv_1');
    expect(csv).toContain('mcp');
  });

  it('retrieves and filters audit logs with JSON diffs', async () => {
    const actor = `actor_${Date.now()}`.slice(0, 30);
    const entityId = 'shop-123';

    await query(
      `INSERT INTO audit_log (actor_username, action, entity_type, entity_id, before_data, after_data)
       VALUES ($1, 'shop.update', 'shop', $2, '{"status":"draft"}'::jsonb, '{"status":"live"}'::jsonb);`,
      [actor, entityId]
    );

    const logs = await getAuditLogs({
      actorUsername: actor,
      entityType: 'shop',
    });

    expect(logs.length).toBe(1);
    expect(logs[0]?.actor_username).toBe(actor);
    expect(logs[0]?.action).toBe('shop.update');
    expect(logs[0]?.before_data).toEqual({ status: 'draft' });
    expect(logs[0]?.after_data).toEqual({ status: 'live' });
  });
});
