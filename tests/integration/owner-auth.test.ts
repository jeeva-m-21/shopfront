import { describe, it, expect, beforeEach } from 'vitest';
import { query } from '../../src/db.js';
import { createOwnerAccount } from '../../src/auth/owner-ops.js';
import { createSession, validateSession } from '../../src/auth/sessions.js';
import { verifyPassword } from '../../src/auth/passwords.js';
import { forceChangeOwnerPassword } from '../../src/owner/account-ops.js';

describe('Owner Forced Password Change (Integration Tests)', () => {
  let adminActor: { id: string; username: string };

  beforeEach(async () => {
    const adminUsername = `admchg_${Date.now()}`.slice(0, 30);
    const adminRes = await query<{ id: string; username: string }>(
      `INSERT INTO users (username, password_hash, display_name, role, is_active)
       VALUES ($1, 'dummyhash', 'Owner Guard Admin', 'admin', TRUE)
       RETURNING id, username;`,
      [adminUsername]
    );
    adminActor = {
      id: adminRes.rows[0]!.id,
      username: adminRes.rows[0]!.username,
    };

    await query(`DELETE FROM users WHERE username LIKE 'ownchg_%';`);
  });

  it('rejects mismatched confirmation password', async () => {
    const username = `ownchg_${Date.now()}`.slice(0, 30);
    const { user } = await createOwnerAccount({
      username,
      displayName: 'Password Change Owner',
      actor: adminActor,
    });

    const session = await createSession(user.id);

    await expect(
      forceChangeOwnerPassword({
        userId: user.id,
        newPassword: 'BrandNewPassword123!',
        confirmPassword: 'MismatchPassword456!',
        currentSessionToken: session.token,
      })
    ).rejects.toThrow('Passwords do not match.');
  });

  it('rejects new password that is identical to the temporary/previous password', async () => {
    const username = `ownchg_${Date.now()}`.slice(0, 30);
    const { user, temporaryPassword } = await createOwnerAccount({
      username,
      displayName: 'Password Change Owner',
      actor: adminActor,
    });

    const session = await createSession(user.id);

    await expect(
      forceChangeOwnerPassword({
        userId: user.id,
        newPassword: temporaryPassword,
        confirmPassword: temporaryPassword,
        currentSessionToken: session.token,
      })
    ).rejects.toThrow('New password cannot be identical to the previous password.');
  });

  it('rejects new password that violates complexity rules', async () => {
    const username = `ownchg_${Date.now()}`.slice(0, 30);
    const { user } = await createOwnerAccount({
      username,
      displayName: 'Password Change Owner',
      actor: adminActor,
    });

    const session = await createSession(user.id);

    // Missing digit
    await expect(
      forceChangeOwnerPassword({
        userId: user.id,
        newPassword: 'NoDigitsAllowedHere!',
        confirmPassword: 'NoDigitsAllowedHere!',
        currentSessionToken: session.token,
      })
    ).rejects.toThrow(/Password validation failed/);

    // Equal to username
    await expect(
      forceChangeOwnerPassword({
        userId: user.id,
        newPassword: username,
        confirmPassword: username,
        currentSessionToken: session.token,
      })
    ).rejects.toThrow(/Password validation failed/);
  });

  it('successfully updates password, clears must_change_password, preserves current session and terminates other sessions', async () => {
    const username = `ownchg_${Date.now()}`.slice(0, 30);
    const { user } = await createOwnerAccount({
      username,
      displayName: 'Password Change Owner',
      actor: adminActor,
    });

    // Create current session and an alternate old session
    const currentSession = await createSession(user.id);
    const alternateSession = await createSession(user.id);

    expect(await validateSession(currentSession.token)).not.toBeNull();
    expect(await validateSession(alternateSession.token)).not.toBeNull();

    const newPassword = 'SecureBrandNewPassword99!';

    await forceChangeOwnerPassword({
      userId: user.id,
      newPassword,
      confirmPassword: newPassword,
      currentSessionToken: currentSession.token,
    });

    // Check DB record
    const userRes = await query<{ must_change_password: boolean; password_hash: string }>(
      `SELECT must_change_password, password_hash FROM users WHERE id = $1;`,
      [user.id]
    );

    expect(userRes.rows[0]?.must_change_password).toBe(false);
    expect(await verifyPassword(userRes.rows[0]?.password_hash ?? '', newPassword)).toBe(true);

    // Current session is still active
    expect(await validateSession(currentSession.token)).not.toBeNull();

    // Alternate session must be terminated
    expect(await validateSession(alternateSession.token)).toBeNull();

    // Audit log written
    const auditRes = await query<{ action: string }>(
      `SELECT action FROM audit_log WHERE entity_id = $1 AND action = 'owner.change_password';`,
      [user.id]
    );
    expect(auditRes.rows.length).toBe(1);
  });
});
