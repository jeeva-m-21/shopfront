import crypto from 'crypto';
import { query } from '../db.js';

export const SESSION_COOKIE_NAME = 'sf_session';

export interface AuthUser {
  id: string;
  username: string;
  display_name: string;
  role: 'admin' | 'owner';
  must_change_password: boolean;
  is_active: boolean;
}

export interface AuthSession {
  token_hash: string;
  user_id: string;
  expires_at: Date;
  created_at: Date;
}

export interface SessionValidationResult {
  user: AuthUser;
  session: AuthSession;
}

/**
 * Computes deterministic SHA-256 hex hash of session token.
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Creates a new session token, hashes it via SHA-256, and stores in database.
 */
export async function createSession(
  userId: string,
  durationDays = 7
): Promise<{ token: string; expiresAt: Date }> {
  // 32-byte CSPRNG token per PRD Section 13.1
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  await query(
    `INSERT INTO sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3);`,
    [tokenHash, userId, expiresAt]
  );

  return { token, expiresAt };
}

/**
 * Validates a plaintext session token against hashed database sessions.
 * Returns user and session metadata if active, or null if expired/invalid.
 */
export async function validateSession(
  token: string
): Promise<SessionValidationResult | null> {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const tokenHash = hashSessionToken(token);
  const res = await query<{
    user_id: string;
    username: string;
    display_name: string;
    role: 'admin' | 'owner';
    must_change_password: boolean;
    is_active: boolean;
    token_hash: string;
    session_created_at: Date;
    session_expires_at: Date;
  }>(
    `SELECT
       u.id AS user_id,
       u.username,
       u.display_name,
       u.role,
       u.must_change_password,
       u.is_active,
       s.token_hash,
       s.created_at AS session_created_at,
       s.expires_at AS session_expires_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1
       AND s.expires_at > now()
       AND u.is_active = TRUE;`,
    [tokenHash]
  );

  const row = res.rows[0];
  if (!row) {
    return null;
  }

  return {
    user: {
      id: row.user_id,
      username: row.username,
      display_name: row.display_name,
      role: row.role,
      must_change_password: row.must_change_password,
      is_active: row.is_active,
    },
    session: {
      token_hash: row.token_hash,
      user_id: row.user_id,
      created_at: row.session_created_at,
      expires_at: row.session_expires_at,
    },
  };
}

/**
 * Deletes a single session by plaintext token.
 */
export async function deleteSession(token: string): Promise<void> {
  const tokenHash = hashSessionToken(token);
  await query('DELETE FROM sessions WHERE token_hash = $1;', [tokenHash]);
}

/**
 * Revokes all sessions for a user, optionally retaining a current session token.
 */
export async function deleteAllUserSessions(
  userId: string,
  exceptToken?: string
): Promise<void> {
  if (exceptToken) {
    const exceptHash = hashSessionToken(exceptToken);
    await query(
      'DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2;',
      [userId, exceptHash]
    );
  } else {
    await query('DELETE FROM sessions WHERE user_id = $1;', [userId]);
  }
}
