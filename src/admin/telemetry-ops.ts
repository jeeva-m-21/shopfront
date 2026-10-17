import { query } from '../db.js';

export interface SearchLogRecord {
  id: string;
  channel: 'mcp' | 'web';
  tool: string;
  query_text: string | null;
  locality_id: number | null;
  category: string | null;
  shop_id: string | null;
  candidate_count: number | null;
  result_count: number | null;
  reranked: boolean;
  jev_model: string | null;
  fallback_reason: string | null;
  error_code: string | null;
  stage1_ms: number | null;
  jev_ms: number | null;
  total_ms: number;
  created_at: Date;
}

export interface SearchLogSummary {
  queryCount: number;
  rerankRate: number;
  fallbackRate: number;
  p50TotalMs: number;
  p95TotalMs: number;
}

export interface SearchLogFilters {
  channel?: 'mcp' | 'web';
  tool?: string;
  fallbackOnly?: boolean;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

export interface AuditLogRecord {
  id: string;
  actor_id: string | null;
  actor_username: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  created_at: Date;
}

export interface AuditLogFilters {
  actorUsername?: string;
  entityType?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

function buildSearchWhereClause(filters: SearchLogFilters): {
  whereClause: string;
  params: unknown[];
} {
  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (filters.channel) {
    conditions.push(`channel = $${paramIdx++}`);
    params.push(filters.channel);
  }

  if (filters.tool) {
    conditions.push(`tool = $${paramIdx++}`);
    params.push(filters.tool);
  }

  if (filters.fallbackOnly) {
    conditions.push('fallback_reason IS NOT NULL');
  }

  if (filters.fromDate) {
    conditions.push(`created_at >= $${paramIdx++}::timestamptz`);
    params.push(filters.fromDate);
  }

  if (filters.toDate) {
    conditions.push(`created_at <= $${paramIdx++}::timestamptz`);
    params.push(filters.toDate);
  }

  return {
    whereClause: conditions.join(' AND '),
    params,
  };
}

/**
 * Retrieves search and tool telemetry logs with summary metrics.
 */
export async function getSearchLogs(
  filters: SearchLogFilters = {}
): Promise<{ logs: SearchLogRecord[]; summary: SearchLogSummary }> {
  const { whereClause, params } = buildSearchWhereClause(filters);
  const limit = filters.limit ?? 100;

  const logsQuery = `
    SELECT 
      id::text, channel, tool, query_text, locality_id, category, shop_id::text,
      candidate_count, result_count, reranked, jev_model, fallback_reason,
      error_code, stage1_ms, jev_ms, total_ms, created_at
    FROM search_logs
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${params.length + 1};
  `;

  const logsRes = await query<SearchLogRecord>(logsQuery, [...params, limit]);

  const summaryQuery = `
    SELECT
      COUNT(*)::integer AS query_count,
      COALESCE(ROUND(AVG(CASE WHEN reranked THEN 1.0 ELSE 0.0 END) * 100, 1)::float, 0.0) AS rerank_rate,
      COALESCE(ROUND(AVG(CASE WHEN fallback_reason IS NOT NULL THEN 1.0 ELSE 0.0 END) * 100, 1)::float, 0.0) AS fallback_rate,
      COALESCE(ROUND(percentile_cont(0.5) WITHIN GROUP (ORDER BY total_ms) FILTER (WHERE tool = 'find_shops'))::integer, 0) AS p50_total_ms,
      COALESCE(ROUND(percentile_cont(0.95) WITHIN GROUP (ORDER BY total_ms) FILTER (WHERE tool = 'find_shops'))::integer, 0) AS p95_total_ms
    FROM search_logs
    WHERE ${whereClause};
  `;

  const summaryRes = await query<{
    query_count: number;
    rerank_rate: number;
    fallback_rate: number;
    p50_total_ms: number;
    p95_total_ms: number;
  }>(summaryQuery, params);

  const summaryRow = summaryRes.rows[0];

  return {
    logs: logsRes.rows,
    summary: {
      queryCount: summaryRow?.query_count ?? 0,
      rerankRate: summaryRow?.rerank_rate ?? 0,
      fallbackRate: summaryRow?.fallback_rate ?? 0,
      p50TotalMs: summaryRow?.p50_total_ms ?? 0,
      p95TotalMs: summaryRow?.p95_total_ms ?? 0,
    },
  };
}

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exports filtered search logs as CSV string.
 */
export async function exportSearchLogsCsv(
  filters: SearchLogFilters = {}
): Promise<string> {
  const { whereClause, params } = buildSearchWhereClause(filters);
  const limit = filters.limit ?? 5000;

  const sql = `
    SELECT 
      id::text, created_at, channel, tool, query_text, locality_id, category,
      result_count, reranked, fallback_reason, error_code, total_ms
    FROM search_logs
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${params.length + 1};
  `;

  const res = await query<Record<string, unknown>>(sql, [...params, limit]);

  const headers = [
    'id',
    'created_at',
    'channel',
    'tool',
    'query_text',
    'locality_id',
    'category',
    'result_count',
    'reranked',
    'fallback_reason',
    'error_code',
    'total_ms',
  ];

  const rows = [headers.join(',')];

  for (const row of res.rows) {
    const line = headers.map((h) => escapeCsvField(row[h])).join(',');
    rows.push(line);
  }

  return rows.join('\n');
}

/**
 * Retrieves audit logs with optional filters, sorted newest first.
 */
export async function getAuditLogs(
  filters: AuditLogFilters = {}
): Promise<AuditLogRecord[]> {
  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (filters.actorUsername) {
    conditions.push(`actor_username = $${paramIdx++}`);
    params.push(filters.actorUsername.trim());
  }

  if (filters.entityType) {
    conditions.push(`entity_type = $${paramIdx++}`);
    params.push(filters.entityType.trim());
  }

  if (filters.fromDate) {
    conditions.push(`created_at >= $${paramIdx++}::timestamptz`);
    params.push(filters.fromDate);
  }

  if (filters.toDate) {
    conditions.push(`created_at <= $${paramIdx++}::timestamptz`);
    params.push(filters.toDate);
  }

  const limit = filters.limit ?? 100;

  const sql = `
    SELECT 
      id::text, actor_id::text, actor_username, action, entity_type, entity_id,
      before_data, after_data, created_at
    FROM audit_log
    WHERE ${conditions.join(' AND ')}
    ORDER BY created_at DESC
    LIMIT $${paramIdx};
  `;

  const res = await query<AuditLogRecord>(sql, [...params, limit]);
  return res.rows;
}
