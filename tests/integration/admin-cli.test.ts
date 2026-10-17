import { describe, it, expect, beforeEach } from 'vitest';
import { query } from '../../src/db.js';
import { verifyPassword } from '../../src/auth/passwords.js';
import { createSession, validateSession } from '../../src/auth/sessions.js';
import { createAdminUser, resetAdminPassword } from '../../src/auth/admin-ops.js';

describe('Admin CLI Operations (Integration Tests)', () => {
  beforeEach(async () => {
    await query(`DELETE FROM users WHERE username LIKE 'admtest_%';`);
  });

  it('creates an admin account with valid credentials', async () => {
    const username = `admtest_${Date.now()}`.slice(0, 30);
    const password = 'StrongPassword123!';
    const displayName = 'Super Admin';

    const result = await createAdminUser({
      username,
      password,
      displayName,
    });

    expect(result.id).toBeDefined();
    expect(result.username).toBe(username);

    // Verify DB row
    const userRes = await query<{
      role: string;
      display_name: string;
      is_active: boolean;
      must_change_password: boolean;
      password_hash: string;
    }>(
      `SELECT role, display_name, is_active, must_change_password, password_hash
       FROM users WHERE id = $1;`,
      [result.id]
    );

    expect(userRes.rows[0]?.role).toBe('admin');
    expect(userRes.rows[0]?.display_name).toBe(displayName);
    expect(userRes.rows[0]?.is_active).toBe(true);
    expect(userRes.rows[0]?.must_change_password).toBe(false);

    // Verify password hash
    const isValid = await verifyPassword(userRes.rows[0]?.password_hash ?? '', password);
    expect(isValid).toBe(true);
  });

  it('rejects invalid username formatting', async () => {
    await expect(
      createAdminUser({
        username: 'INVALID-NAME!',
        password: 'Password123!',
        displayName: 'Invalid User',
      })
    ).rejects.toThrow(/Username must match \^\[a-z0-9_\]\{3,30\}\$/);
  });

  it('rejects weak password that fails complexity rules', async () => {
    const username = `admtest_${Date.now()}`.slice(0, 30);

    // Missing digit
    await expect(
      createAdminUser({
        username,
        password: 'NoDigitsHere!',
        displayName: 'Test Admin',
      })
    ).rejects.toThrow();

    // Equals username
    await expect(
      createAdminUser({
        username,
        password: username,
        displayName: 'Test Admin',
      })
    ).rejects.toThrow();
  });

  it('resets admin password and invalidates all existing sessions', async () => {
    const username = `admtest_${Date.now()}`.slice(0, 30);
    const oldPassword = 'OldPassword123!';
    const newPassword = 'NewPassword456!';

    const admin = await createAdminUser({
      username,
      password: oldPassword,
      displayName: 'Reset Target',
    });

    // Create 2 active sessions for this admin
    const s1 = await createSession(admin.id);
    const s2 = await createSession(admin.id);

    expect(await validateSession(s1.token)).not.toBeNull();
    expect(await validateSession(s2.token)).not.toBeNull();

    // Reset password
    await resetAdminPassword({
      username,
      newPassword,
    });

    // Both sessions must now be deleted/invalidated
    expect(await validateSession(s1.token)).toBeNull();
    expect(await validateSession(s2.token)).toBeNull();

    // User should verify with new password and reject old password
    const userRes = await query<{ password_hash: string }>(
      `SELECT password_hash FROM users WHERE id = $1;`,
      [admin.id]
    );

    expect(await verifyPassword(userRes.rows[0]?.password_hash ?? '', newPassword)).toBe(true);
    expect(await verifyPassword(userRes.rows[0]?.password_hash ?? '', oldPassword)).toBe(false);
  });

  it('rejects resetting password to the same previous password', async () => {
    const username = `admtest_${Date.now()}`.slice(0, 30);
    const password = 'OldPassword123!';

    await createAdminUser({
      username,
      password,
      displayName: 'Reset Target',
    });

    await expect(
      resetAdminPassword({
        username,
        newPassword: password,
      })
    ).rejects.toThrow(/New password cannot be the same as the previous password/);
  });

  it('rejects resetting non-existent admin or non-admin user', async () => {
    await expect(
      resetAdminPassword({
        username: 'non_existent_admin_123',
        newPassword: 'NewPassword123!',
      })
    ).rejects.toThrow(/Admin user 'non_existent_admin_123' not found/);
  });
});
