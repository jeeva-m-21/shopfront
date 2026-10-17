import { query } from '../db.js';
import type { ShopCategory } from './stage1.js';

export interface SearchLogRecord {
  channel: 'mcp' | 'web';
  tool: string;
  query_text?: string | null;
  locality_id?: number | null;
  category?: ShopCategory | null;
  shop_id?: string | null;
  candidate_count?: number | null;
  result_count?: number | null;
  reranked?: boolean;
  jev_model?: string | null;
  fallback_reason?: string | null;
  error_code?: string | null;
  stage1_ms?: number | null;
  jev_ms?: number | null;
  total_ms: number;
}

export async function writeSearchLog(record: SearchLogRecord): Promise<void> {
  try {
    await query(
      `INSERT INTO search_logs (
        channel, tool, query_text, locality_id, category,
        shop_id, candidate_count, result_count, reranked,
        jev_model, fallback_reason, error_code, stage1_ms,
        jev_ms, total_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15);`,
      [
        record.channel,
        record.tool,
        record.query_text ?? null,
        record.locality_id ?? null,
        record.category ?? null,
        record.shop_id ?? null,
        record.candidate_count ?? null,
        record.result_count ?? null,
        record.reranked ?? false,
        record.jev_model ?? null,
        record.fallback_reason ?? null,
        record.error_code ?? null,
        record.stage1_ms ?? null,
        record.jev_ms ?? null,
        Math.max(0, Math.round(record.total_ms)),
      ]
    );
  } catch (err) {
    console.error('[telemetry] Failed to write search_logs:', err);
  }
}
