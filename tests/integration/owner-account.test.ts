import { describe, it, expect, beforeEach } from 'vitest';
import { query } from '../../src/db.js';
import {
  changeOwnerPasswordSelfService,
} from '../../src/owner/account-ops.js';
import {
  pauseOwnerShop,
  resumeOwnerShop,
} from '../../src/owner/shop-ops.js';
import {
  createAdminShop,
  makeShopLive,
  pauseShop as adminPauseShop,
} from '../../src/admin/shop-ops.js';
import { createSession, validateSession } from '../../src/auth/sessions.js';
import { hashPassword, verifyPassword } from '../../src/auth/passwords.js';

describe('Owner Account & Listing Status (Integration Tests)', () => {
  let adminActor: { id: string; username: string };
  let ownerUser: { id: string; username: string };
  const initialPassword = 'InitialValidPass1';

  beforeEach(async () => {
    const ts = Date.now();
    const adminRes = await query<{ id: string; username: string }>(
      `INSERT INTO users (username, password_hash, display_name, role, is_active)
       VALUES ($1, 'dummyhash', 'Admin Actor', 'admin', TRUE)
       RETURNING id, username;`,
      [`ownacc_adm_${ts}`.slice(0, 30)]
    );
    adminActor = adminRes.rows[0]!;

    const initialHash = await hashPassword(initialPassword);
    const ownerRes = await query<{ id: string; username: string }>(
      `INSERT INTO users (username, password_hash, display_name, role, is_active, must_change_password)
       VALUES ($1, $2, 'Owner SelfService', 'owner', TRUE, FALSE)
       RETURNING id, username;`,
      [`ownacc_o1_${ts}`.slice(0, 30), initialHash]
    );
    ownerUser = ownerRes.rows[0]!;

    await query(`DELETE FROM shops WHERE slug LIKE 'ownacc-test-%';`);
  });

  it('O8: changes password self-service, revoking other sessions while preserving current session', async () => {
    // Create 2 sessions: session1 (current), session2 (other device)
    const session1 = await createSession(ownerUser.id);
    const session2 = await createSession(ownerUser.id);

    // Verify both are valid initially
    expect(await validateSession(session1.token)).not.toBeNull();
    expect(await validateSession(session2.token)).not.toBeNull();

    // 1. Rejects wrong current password
    await expect(
      changeOwnerPasswordSelfService({
        userId: ownerUser.id,
        currentPassword: 'WrongPassword123',
        newPassword: 'BrandNewValidPass2',
        confirmPassword: 'BrandNewValidPass2',
        currentSessionToken: session1.token,
      })
    ).rejects.toThrow('Current password is incorrect.');

    // 2. Rejects same password
    await expect(
      changeOwnerPasswordSelfService({
        userId: ownerUser.id,
        currentPassword: initialPassword,
        newPassword: initialPassword,
        confirmPassword: initialPassword,
        currentSessionToken: session1.token,
      })
    ).rejects.toThrow('New password must be different from current password.');

    // 3. Rejects mismatched confirmation
    await expect(
      changeOwnerPasswordSelfService({
        userId: ownerUser.id,
        currentPassword: initialPassword,
        newPassword: 'BrandNewValidPass2',
        confirmPassword: 'MismatchNewPassword3',
        currentSessionToken: session1.token,
      })
    ).rejects.toThrow('New passwords do not match.');

    // 4. Successful password change
    await changeOwnerPasswordSelfService({
      userId: ownerUser.id,
      currentPassword: initialPassword,
      newPassword: 'BrandNewValidPass2',
      confirmPassword: 'BrandNewValidPass2',
      currentSessionToken: session1.token,
    });

    // Verify hash changed and verifies new password
    const userRes = await query<{ password_hash: string }>(
      `SELECT password_hash FROM users WHERE id = $1;`,
      [ownerUser.id]
    );
    expect(await verifyPassword(userRes.rows[0]!.password_hash, 'BrandNewValidPass2')).toBe(true);

    // Session 1 remains active; Session 2 is terminated
    expect(await validateSession(session1.token)).not.toBeNull();
    expect(await validateSession(session2.token)).toBeNull();

    // Audit log written
    const auditRes = await query<{ action: string; entity_type: string }>(
      `SELECT action, entity_type FROM audit_log WHERE entity_id = $1 AND action = 'user.password_change';`,
      [ownerUser.id]
    );
    expect(auditRes.rows.length).toBe(1);
  });

  it('O7: owner can pause listing (sets paused, admin_locked = false)', async () => {
    const slug = `ownacc-test-1-${Date.now()}`.slice(0, 30);
    const shop = await createAdminShop({
      name: 'Adyar Quick Cuts',
      slug,
      category: 'salon_wellness',
      description: 'Barber and styling salon in Adyar.',
      address: '70 Gandhi Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424413331',
      action_mode: 'phone_only',
      is_sample_data: false,
      owner_id: ownerUser.id,
      actor: adminActor,
    });

    // Add 1 available item and make live
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available, sort_order)
       VALUES ($1, 'Haircuts', 'Standard Cut', 'service', 'fixed', 200, TRUE, 0);`,
      [shop.id]
    );
    await makeShopLive({ shopId: shop.id, actor: adminActor });

    // Owner pauses listing
    const pausedShop = await pauseOwnerShop(ownerUser.id, ownerUser);
    expect(pausedShop.status).toBe('paused');
    expect(pausedShop.admin_locked).toBe(false);

    // Verify audit log
    const auditRes = await query<{ action: string; entity_type: string }>(
      `SELECT action, entity_type FROM audit_log WHERE entity_id = $1 AND action = 'shop.pause';`,
      [shop.id]
    );
    expect(auditRes.rows.length).toBe(1);
  });

  it('O7: owner resume is blocked if admin_locked = true or if 0 available items', async () => {
    const slug = `ownacc-test-2-${Date.now()}`.slice(0, 30);
    const shop = await createAdminShop({
      name: 'Adyar Quick Fix Pro',
      slug,
      category: 'repair_service',
      description: 'Mobile repairs and glass replacements in Adyar.',
      address: '75 Gandhi Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424413332',
      action_mode: 'phone_only',
      is_sample_data: false,
      owner_id: ownerUser.id,
      actor: adminActor,
    });

    // 1. When paused by admin, admin_locked is TRUE -> Owner resume must be blocked
    await adminPauseShop({ shopId: shop.id, actor: adminActor });

    await expect(
      resumeOwnerShop(ownerUser.id, ownerUser)
    ).rejects.toThrow(/admin/i);

    // 2. Clear admin lock, but with 0 available items -> Owner resume blocked with exact PRD message
    await query(`UPDATE shops SET admin_locked = FALSE, status = 'paused' WHERE id = $1;`, [shop.id]);

    await expect(
      resumeOwnerShop(ownerUser.id, ownerUser)
    ).rejects.toThrow('Add at least one available menu item first');

    // 3. Add 1 available item -> Owner resume succeeds
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available, sort_order)
       VALUES ($1, 'Repairs', 'Battery Fix', 'service', 'fixed', 1500, TRUE, 0);`,
      [shop.id]
    );

    const resumedShop = await resumeOwnerShop(ownerUser.id, ownerUser);
    expect(resumedShop.status).toBe('live');
    expect(resumedShop.admin_locked).toBe(false);
  });
});
