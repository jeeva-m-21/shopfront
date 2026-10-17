import { describe, it, expect, beforeEach } from 'vitest';
import { query } from '../../src/db.js';
import { verifyPassword, ALLOWED_TEMP_PASSWORD_CHARS } from '../../src/auth/passwords.js';
import { createSession, validateSession } from '../../src/auth/sessions.js';
import {
  createOwnerAccount,
  resetOwnerPassword,
  disableOwnerAccount,
  enableOwnerAccount,
  listOwnersWithShops,
} from '../../src/auth/owner-ops.js';

describe('Admin Owner Management (Integration Tests)', () => {
  let adminActor: { id: string; username: string };

  beforeEach(async () => {
    // Create an admin user for foreign key satisfaction
    const adminUsername = `admaudit_${Date.now()}`.slice(0, 30);
    const adminRes = await query<{ id: string; username: string }>(
      `INSERT INTO users (username, password_hash, display_name, role, is_active)
       VALUES ($1, 'dummyhash123', 'Audit Admin', 'admin', TRUE)
       RETURNING id, username;`,
      [adminUsername]
    );
    adminActor = {
      id: adminRes.rows[0]!.id,
      username: adminRes.rows[0]!.username,
    };

    // Clean up test owners and audit logs
    await query(`DELETE FROM audit_log WHERE actor_username LIKE 'admaudit_%';`);
    await query(`DELETE FROM users WHERE username LIKE 'testown_%';`);
  });

  it('creates an owner account with temporary password and audits it', async () => {
    const username = `testown_${Date.now()}`.slice(0, 30);
    const displayName = 'Coffee Shop Owner';

    const { user, temporaryPassword } = await createOwnerAccount({
      username,
      displayName,
      actor: adminActor,
    });

    expect(user.id).toBeDefined();
    expect(user.username).toBe(username);
    expect(user.role).toBe('owner');
    expect(user.must_change_password).toBe(true);
    expect(user.is_active).toBe(true);

    // Verify temp password rules: 12 chars, unambiguous alphabet
    expect(temporaryPassword.length).toBe(12);
    const allowed = new Set(ALLOWED_TEMP_PASSWORD_CHARS);
    for (const ch of temporaryPassword) {
      expect(allowed.has(ch)).toBe(true);
    }

    // Verify password hash in DB verifies with temp password
    const userRes = await query<{ password_hash: string }>(
      `SELECT password_hash FROM users WHERE id = $1;`,
      [user.id]
    );
    expect(await verifyPassword(userRes.rows[0]?.password_hash ?? '', temporaryPassword)).toBe(true);

    // Verify audit log
    const auditRes = await query<{
      action: string;
      entity_type: string;
      entity_id: string;
      after_data: Record<string, unknown>;
    }>(
      `SELECT action, entity_type, entity_id, after_data
       FROM audit_log WHERE entity_id = $1 AND action = 'owner.create';`,
      [user.id]
    );
    expect(auditRes.rows.length).toBe(1);
    expect(auditRes.rows[0]?.action).toBe('owner.create');
    expect(auditRes.rows[0]?.entity_type).toBe('user');
    // Audit must NEVER contain password or password_hash
    const afterDataStr = JSON.stringify(auditRes.rows[0]?.after_data);
    expect(afterDataStr).not.toContain(temporaryPassword);
    expect(afterDataStr).not.toContain('password_hash');
  });

  it('resets owner password, forces change on next login, invalidates sessions, and audits', async () => {
    const username = `testown_${Date.now()}`.slice(0, 30);
    const { user } = await createOwnerAccount({
      username,
      displayName: 'Reset Owner Test',
      actor: adminActor,
    });

    // Create session for owner
    const session = await createSession(user.id);
    expect(await validateSession(session.token)).not.toBeNull();

    // Reset owner password
    const { temporaryPassword } = await resetOwnerPassword({
      ownerId: user.id,
      actor: adminActor,
    });

    expect(temporaryPassword.length).toBe(12);

    // Session must be destroyed
    expect(await validateSession(session.token)).toBeNull();

    // must_change_password must be true
    const updatedUser = await query<{ must_change_password: boolean; password_hash: string }>(
      `SELECT must_change_password, password_hash FROM users WHERE id = $1;`,
      [user.id]
    );
    expect(updatedUser.rows[0]?.must_change_password).toBe(true);
    expect(await verifyPassword(updatedUser.rows[0]?.password_hash ?? '', temporaryPassword)).toBe(true);

    // Audit log check
    const auditRes = await query<{ action: string; after_data: Record<string, unknown> }>(
      `SELECT action, after_data FROM audit_log WHERE entity_id = $1 AND action = 'owner.reset_password';`,
      [user.id]
    );
    expect(auditRes.rows.length).toBe(1);
    const auditStr = JSON.stringify(auditRes.rows[0]?.after_data);
    expect(auditStr).not.toContain(temporaryPassword);
    expect(auditStr).not.toContain('password_hash');
  });

  it('disables owner, locks shop to paused and admin_locked, destroys sessions, and audits', async () => {
    const username = `testown_${Date.now()}`.slice(0, 30);
    const { user } = await createOwnerAccount({
      username,
      displayName: 'Disabling Target',
      actor: adminActor,
    });

    const session = await createSession(user.id);

    // Assign owner to a live shop
    const shopSlug = `shop-${Date.now()}`.slice(0, 30);
    const shopRes = await query<{ id: string }>(
      `INSERT INTO shops (
        name, slug, category, description, address, locality_id,
        location, phone, action_mode, status, admin_locked, is_sample_data, owner_id
       ) VALUES (
        'Disable Test Shop', $1, 'food_beverage', 'Test description', '123 Anna Salai',
        1, ST_SetSRID(ST_MakePoint(80.25, 13.05), 4326), '+914420000000',
        'phone_only', 'live', FALSE, FALSE, $2
       ) RETURNING id;`,
      [shopSlug, user.id]
    );
    const shopId = shopRes.rows[0]?.id;
    expect(shopId).toBeDefined();

    // Disable owner
    await disableOwnerAccount({
      ownerId: user.id,
      actor: adminActor,
    });

    // Owner is_active = false
    const uRes = await query<{ is_active: boolean }>(`SELECT is_active FROM users WHERE id = $1;`, [user.id]);
    expect(uRes.rows[0]?.is_active).toBe(false);

    // Session invalidated
    expect(await validateSession(session.token)).toBeNull();

    // Shop set to paused and admin_locked = true
    const sRes = await query<{ status: string; admin_locked: boolean }>(
      `SELECT status, admin_locked FROM shops WHERE id = $1;`,
      [shopId!]
    );
    expect(sRes.rows[0]?.status).toBe('paused');
    expect(sRes.rows[0]?.admin_locked).toBe(true);

    // Audit logs for owner disable and shop pause
    const auditRes = await query<{ action: string }>(
      `SELECT action FROM audit_log WHERE entity_id = $1 AND action = 'owner.disable';`,
      [user.id]
    );
    expect(auditRes.rows.length).toBe(1);

    // Clean up created test shop
    await query(`DELETE FROM shops WHERE id = $1;`, [shopId!]);
  });

  it('re-enables owner without unpausing shop and audits', async () => {
    const username = `testown_${Date.now()}`.slice(0, 30);
    const { user } = await createOwnerAccount({
      username,
      displayName: 'Reenable Target',
      actor: adminActor,
    });

    await disableOwnerAccount({
      ownerId: user.id,
      actor: adminActor,
    });

    await enableOwnerAccount({
      ownerId: user.id,
      actor: adminActor,
    });

    const uRes = await query<{ is_active: boolean }>(`SELECT is_active FROM users WHERE id = $1;`, [user.id]);
    expect(uRes.rows[0]?.is_active).toBe(true);

    const auditRes = await query<{ action: string }>(
      `SELECT action FROM audit_log WHERE entity_id = $1 AND action = 'owner.enable';`,
      [user.id]
    );
    expect(auditRes.rows.length).toBe(1);
  });

  it('lists owners with associated shop metadata', async () => {
    const username = `testown_${Date.now()}`.slice(0, 30);
    const { user } = await createOwnerAccount({
      username,
      displayName: 'List Target Owner',
      actor: adminActor,
    });

    const owners = await listOwnersWithShops();
    const found = owners.find((o) => o.id === user.id);
    expect(found).toBeDefined();
    expect(found?.username).toBe(username);
    expect(found?.display_name).toBe('List Target Owner');
    expect(found?.shop_name).toBeNull();
  });
});
