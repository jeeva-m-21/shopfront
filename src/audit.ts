import type pg from 'pg';
import { query } from './db.js';

export interface AuditLogEntry {
  actorId?: string | null;
  actorUsername: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  client?: pg.PoolClient;
}

function sanitizeAuditData(
  data?: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (!data) return null;
  const sanitized = { ...data };
  // Strictly redact any sensitive fields from audit logs
  delete sanitized.password;
  delete sanitized.password_hash;
  delete sanitized.temporary_password;
  delete sanitized.token;
  delete sanitized.token_hash;
  return sanitized;
}

/**
 * Inserts an entry into audit_log table.
 * Strips password hashes, secrets, and raw tokens.
 */
export async function logAudit({
  actorId,
  actorUsername,
  action,
  entityType,
  entityId,
  beforeData,
  afterData,
  client,
}: AuditLogEntry): Promise<void> {
  const cleanBefore = sanitizeAuditData(beforeData);
  const cleanAfter = sanitizeAuditData(afterData);

  const sql = `
    INSERT INTO audit_log (
      actor_id, actor_username, action, entity_type, entity_id, before_data, after_data
    ) VALUES ($1, $2, $3, $4, $5, $6, $7);
  `;
  const params = [
    actorId || null,
    actorUsername,
    action,
    entityType,
    entityId,
    cleanBefore ? JSON.stringify(cleanBefore) : null,
    cleanAfter ? JSON.stringify(cleanAfter) : null,
  ];

  if (client) {
    await client.query(sql, params);
  } else {
    await query(sql, params);
  }
}
