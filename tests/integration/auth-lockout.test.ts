import { describe, it, expect, beforeEach } from 'vitest';
import { query } from '../../src/db.js';
import { hashPassword } from '../../src/auth/passwords.js';
import {
  isLockedOut,
  recordLoginAttempt,
  authenticateUser,
  LOCKOUT_THRESHOLD,
  LOCKOUT_WINDOW_MINUTES,
} from '../../src/auth/lockout.js';

describe('Auth Lockout & Login Flow (Integration Tests)', () => {
  const testAdminUser = `adm_${Date.now()}`;
  const testOwnerUser = `own_${Date.now()}`;
  const testInactiveUser = `ina_${Date.now()}`;
  const testPassword = 'Password123!';

  beforeEach(async () => {
    // Clear login attempts for our test users
    await query(
      `DELETE FROM login_attempts WHERE username LIKE 'u_%' OR username LIKE 'adm_%' OR username LIKE 'own_%' OR username LIKE 'ina_%';`
    );
  });

  it('correctly tracks failed attempts and triggers lockout at 5 failures', async () => {
    const username = `u_lock_${Date.now()}`;

    // Fresh user is not locked out
    expect(await isLockedOut(username)).toBe(false);

    // Record 4 failed attempts
    for (let i = 0; i < 4; i++) {
      await recordLoginAttempt(username, false);
      expect(await isLockedOut(username)).toBe(false);
    }

    // 5th failed attempt triggers lockout
    await recordLoginAttempt(username, false);
    expect(await isLockedOut(username)).toBe(true);

    // Successful attempt does not count towards lockout
    const successfulUser = `u_succ_${Date.now()}`;
    await recordLoginAttempt(successfulUser, true);
    await recordLoginAttempt(successfulUser, true);
    expect(await isLockedOut(successfulUser)).toBe(false);
  });

  it('does not count failed attempts older than 15 minutes towards lockout', async () => {
    const username = `u_old_${Date.now()}`;

    // Insert 5 attempts older than 16 minutes
    for (let i = 0; i < 5; i++) {
      await query(
        `INSERT INTO login_attempts (username, succeeded, created_at)
         VALUES ($1, FALSE, now() - INTERVAL '16 minutes');`,
        [username]
      );
    }

    // Should not be locked out because window is 15 minutes
    expect(await isLockedOut(username)).toBe(false);
  });

  it('rejects unknown username with constant-time probe and records failed attempt', async () => {
    const unknownUser = 'non_existent_user_' + Date.now();

    const result = await authenticateUser(unknownUser, 'WrongPassword123');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid username or password');
    }

    // Attempt was recorded in DB
    const res = await query<{ count: string }>(
      `SELECT COUNT(*) FROM login_attempts WHERE username = $1 AND succeeded = FALSE;`,
      [unknownUser]
    );
    expect(parseInt(res.rows[0]?.count ?? '0', 10)).toBe(1);
  });

  it('authenticates active admin with correct password, logs attempt and creates session', async () => {
    const hashedPassword = await hashPassword(testPassword);
    const userRes = await query<{ id: string; username: string; role: string }>(
      `INSERT INTO users (username, password_hash, display_name, role, is_active)
       VALUES ($1, $2, $3, 'admin', TRUE)
       RETURNING id, username, role;`,
      [testAdminUser, hashedPassword, 'Test Admin']
    );
    const userId = userRes.rows[0]?.id;
    expect(userId).toBeDefined();

    const result = await authenticateUser(testAdminUser, testPassword);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user.id).toBe(userId);
      expect(result.user.role).toBe('admin');
      expect(result.redirectUrl).toBe('/admin');
      expect(result.token).toBeDefined();

      // Verify last_login_at was updated
      const updatedUser = await query<{ last_login_at: Date }>(
        `SELECT last_login_at FROM users WHERE id = $1;`,
        [userId!]
      );
      expect(updatedUser.rows[0]?.last_login_at).not.toBeNull();
    }

    // Verify successful login attempt was logged
    const attemptRes = await query<{ succeeded: boolean }>(
      `SELECT succeeded FROM login_attempts WHERE username = $1 ORDER BY id DESC LIMIT 1;`,
      [testAdminUser]
    );
    expect(attemptRes.rows[0]?.succeeded).toBe(true);
  });

  it('authenticates active owner and routes to /owner', async () => {
    const hashedPassword = await hashPassword(testPassword);
    await query(
      `INSERT INTO users (username, password_hash, display_name, role, is_active)
       VALUES ($1, $2, $3, 'owner', TRUE)
       RETURNING id;`,
      [testOwnerUser, hashedPassword, 'Test Owner']
    );

    const result = await authenticateUser(testOwnerUser, testPassword);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user.role).toBe('owner');
      expect(result.redirectUrl).toBe('/owner');
    }
  });

  it('rejects wrong password for existing user and records failure', async () => {
    const result = await authenticateUser(testAdminUser, 'WrongPassword123');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid username or password');
    }

    const res = await query<{ count: string }>(
      `SELECT COUNT(*) FROM login_attempts WHERE username = $1 AND succeeded = FALSE;`,
      [testAdminUser]
    );
    expect(parseInt(res.rows[0]?.count ?? '0', 10)).toBe(1);
  });

  it('rejects inactive user with exact message only after verifying password', async () => {
    const hashedPassword = await hashPassword(testPassword);
    await query(
      `INSERT INTO users (username, password_hash, display_name, role, is_active)
       VALUES ($1, $2, $3, 'owner', FALSE);`,
      [testInactiveUser, hashedPassword, 'Inactive Owner']
    );

    // Wrong password should give standard error, not reveal inactivity
    const wrongRes = await authenticateUser(testInactiveUser, 'WrongPassword');
    expect(wrongRes.success).toBe(false);
    if (!wrongRes.success) {
      expect(wrongRes.error).toBe('Invalid username or password');
    }

    // Correct password reveals inactive account message
    const correctRes = await authenticateUser(testInactiveUser, testPassword);
    expect(correctRes.success).toBe(false);
    if (!correctRes.success) {
      expect(correctRes.error).toBe('This account is inactive. Contact the admin.');
    }
  });

  it('triggers lockout after 5 failures and rejects without adding more login_attempts', async () => {
    const targetUser = `u_trig_${Date.now()}`;

    // 5 failures
    for (let i = 0; i < 5; i++) {
      const res = await authenticateUser(targetUser, 'Wrong123');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe('Invalid username or password');
      }
    }

    // 6th attempt should be locked out
    const lockedRes = await authenticateUser(targetUser, 'EvenIfPasswordIsWhatever');
    expect(lockedRes.success).toBe(false);
    if (!lockedRes.success) {
      expect(lockedRes.error).toBe('Too many attempts. Try again in 15 minutes.');
    }

    // Verify that login_attempts still has exactly 5 rows (not 6)
    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) FROM login_attempts WHERE username = $1;`,
      [targetUser]
    );
    expect(parseInt(countRes.rows[0]?.count ?? '0', 10)).toBe(5);
  });
});
