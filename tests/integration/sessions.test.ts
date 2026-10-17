import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { query, closePool } from '@/db';
import {
  createSession,
  validateSession,
  deleteSession,
  deleteAllUserSessions,
  hashSessionToken,
} from '@/auth/sessions';

describe('Sessions Auth Module (Integration Tests)', () => {
  let testUserId: string;
  const testUsername = `sess_user_${Date.now()}`;

  beforeAll(async () => {
    const res = await query<{ id: string }>(
      `INSERT INTO users (username, display_name, role, password_hash)
       VALUES ($1, 'Session Test User', 'owner', 'hash')
       RETURNING id;`,
      [testUsername]
    );
    testUserId = res.rows[0]!.id;
  });

  afterAll(async () => {
    await query('DELETE FROM users WHERE id = $1;', [testUserId]);
    await closePool();
  });

  it('hashes session tokens deterministically via SHA-256', () => {
    const token = 'sample_token_value';
    const hash = hashSessionToken(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashSessionToken(token)).toBe(hash);
  });

  it('creates, validates, and manages session lifecycle', async () => {
    const { token, expiresAt } = await createSession(testUserId, 7);
    expect(token).toBeTruthy();
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

    // Validate active session
    const validated = await validateSession(token);
    expect(validated).not.toBeNull();
    expect(validated?.user.id).toBe(testUserId);
    expect(validated?.user.username).toBe(testUsername);
    expect(validated?.user.role).toBe('owner');

    // Delete single session
    await deleteSession(token);
    const afterDelete = await validateSession(token);
    expect(afterDelete).toBeNull();
  });

  it('rejects invalid or expired tokens', async () => {
    expect(await validateSession('completely_invalid_token')).toBeNull();

    // Create expired session
    const { token } = await createSession(testUserId, -1); // 1 day in the past
    expect(await validateSession(token)).toBeNull();
    await deleteSession(token);
  });

  it('deletes all sessions for user except current session', async () => {
    const s1 = await createSession(testUserId);
    const s2 = await createSession(testUserId);
    const s3 = await createSession(testUserId);

    expect(await validateSession(s1.token)).not.toBeNull();
    expect(await validateSession(s2.token)).not.toBeNull();
    expect(await validateSession(s3.token)).not.toBeNull();

    // Delete all except s3
    await deleteAllUserSessions(testUserId, s3.token);

    expect(await validateSession(s1.token)).toBeNull();
    expect(await validateSession(s2.token)).toBeNull();
    expect(await validateSession(s3.token)).not.toBeNull();

    // Clean up
    await deleteSession(s3.token);
  });
});
