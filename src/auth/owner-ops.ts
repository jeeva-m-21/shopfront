import { query, withTransaction } from '../db.js';
import {
  hashPassword,
  generateTemporaryPassword,
} from './passwords.js';
import { deleteAllUserSessions, type AuthUser } from './sessions.js';
import { logAudit } from '../audit.js';

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

export interface ActorContext {
  id?: string | null;
  username: string;
}

export interface CreateOwnerParams {
  username: string;
  displayName: string;
  actor: ActorContext;
}

export interface ResetOwnerPasswordParams {
  ownerId: string;
  actor: ActorContext;
}

export interface ToggleOwnerStatusParams {
  ownerId: string;
  actor: ActorContext;
}

export interface OwnerWithShop {
  id: string;
  username: string;
  display_name: string;
  is_active: boolean;
  must_change_password: boolean;
  created_at: Date;
  shop_id: string | null;
  shop_name: string | null;
  shop_slug: string | null;
  shop_status: string | null;
}

/**
 * Creates an owner account with an unambiguous 12-char temporary password,
 * marks must_change_password = TRUE, and logs an audit record.
 */
export async function createOwnerAccount(
  params: CreateOwnerParams
): Promise<{ user: AuthUser; temporaryPassword: string }> {
  const username = params.username.trim().toLowerCase();
  const displayName = params.displayName.trim();

  if (!USERNAME_REGEX.test(username)) {
    throw new Error(
      `Username must match ^[a-z0-9_]{3,30}$, received: '${username}'`
    );
  }

  if (displayName.length < 2 || displayName.length > 80) {
    throw new Error('Display name must be between 2 and 80 characters.');
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const result = await query<{
    id: string;
    username: string;
    display_name: string;
    role: 'owner';
    must_change_password: boolean;
    is_active: boolean;
  }>(
    `INSERT INTO users (username, password_hash, display_name, role, must_change_password, is_active)
     VALUES ($1, $2, $3, 'owner', TRUE, TRUE)
     RETURNING id, username, display_name, role, must_change_password, is_active;`,
    [username, passwordHash, displayName]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('Failed to create owner user row.');
  }

  await logAudit({
    actorId: params.actor.id,
    actorUsername: params.actor.username,
    action: 'owner.create',
    entityType: 'user',
    entityId: row.id,
    afterData: {
      id: row.id,
      username: row.username,
      display_name: row.display_name,
      role: row.role,
      is_active: row.is_active,
      must_change_password: row.must_change_password,
    },
  });

  return {
    user: row,
    temporaryPassword,
  };
}

/**
 * Resets an owner password with a newly generated temporary password,
 * sets must_change_password = TRUE, terminates all active sessions, and logs an audit record.
 */
export async function resetOwnerPassword(
  params: ResetOwnerPasswordParams
): Promise<{ temporaryPassword: string }> {
  const temporaryPassword = generateTemporaryPassword();
  const newHash = await hashPassword(temporaryPassword);

  const userRes = await query<{ id: string; username: string; role: string }>(
    `SELECT id, username, role FROM users WHERE id = $1 AND role = 'owner';`,
    [params.ownerId]
  );

  const user = userRes.rows[0];
  if (!user) {
    throw new Error(`Owner with ID '${params.ownerId}' not found.`);
  }

  await query(
    `UPDATE users
     SET password_hash = $1, must_change_password = TRUE
     WHERE id = $2;`,
    [newHash, user.id]
  );

  // Terminate all sessions
  await deleteAllUserSessions(user.id);

  await logAudit({
    actorId: params.actor.id,
    actorUsername: params.actor.username,
    action: 'owner.reset_password',
    entityType: 'user',
    entityId: user.id,
    afterData: {
      must_change_password: true,
    },
  });

  return { temporaryPassword };
}

/**
 * Disables an owner account:
 * - is_active = FALSE
 * - terminates all active sessions
 * - sets owner's shop (if any) to status = 'paused' and admin_locked = TRUE
 * - audits the operation
 */
export async function disableOwnerAccount(
  params: ToggleOwnerStatusParams
): Promise<void> {
  await withTransaction(async (client) => {
    const userRes = await client.query<{ id: string; username: string; is_active: boolean }>(
      `SELECT id, username, is_active FROM users WHERE id = $1 AND role = 'owner' FOR UPDATE;`,
      [params.ownerId]
    );

    const user = userRes.rows[0];
    if (!user) {
      throw new Error(`Owner with ID '${params.ownerId}' not found.`);
    }

    await client.query(`UPDATE users SET is_active = FALSE WHERE id = $1;`, [user.id]);

    // Check if owner owns a shop
    const shopRes = await client.query<{ id: string; status: string; admin_locked: boolean }>(
      `SELECT id, status, admin_locked FROM shops WHERE owner_id = $1 FOR UPDATE;`,
      [user.id]
    );

    const shop = shopRes.rows[0];
    if (shop) {
      await client.query(
        `UPDATE shops SET status = 'paused', admin_locked = TRUE WHERE id = $1;`,
        [shop.id]
      );

      await logAudit({
        actorId: params.actor.id,
        actorUsername: params.actor.username,
        action: 'shop.pause',
        entityType: 'shop',
        entityId: shop.id,
        beforeData: { status: shop.status, admin_locked: shop.admin_locked },
        afterData: { status: 'paused', admin_locked: true, reason: 'owner_disabled' },
        client,
      });
    }

    await logAudit({
      actorId: params.actor.id,
      actorUsername: params.actor.username,
      action: 'owner.disable',
      entityType: 'user',
      entityId: user.id,
      beforeData: { is_active: user.is_active },
      afterData: { is_active: false },
      client,
    });
  });

  // Delete all sessions for the disabled user
  await deleteAllUserSessions(params.ownerId);
}

/**
 * Re-enables an owner account:
 * - is_active = TRUE
 * - shop remains paused per PRD Section 7.2
 * - audits the operation
 */
export async function enableOwnerAccount(
  params: ToggleOwnerStatusParams
): Promise<void> {
  const userRes = await query<{ id: string; is_active: boolean }>(
    `SELECT id, is_active FROM users WHERE id = $1 AND role = 'owner';`,
    [params.ownerId]
  );

  const user = userRes.rows[0];
  if (!user) {
    throw new Error(`Owner with ID '${params.ownerId}' not found.`);
  }

  await query(`UPDATE users SET is_active = TRUE WHERE id = $1;`, [user.id]);

  await logAudit({
    actorId: params.actor.id,
    actorUsername: params.actor.username,
    action: 'owner.enable',
    entityType: 'user',
    entityId: user.id,
    beforeData: { is_active: user.is_active },
    afterData: { is_active: true },
  });
}

/**
 * Lists all owners with joined shop details.
 */
export async function listOwnersWithShops(): Promise<OwnerWithShop[]> {
  const result = await query<OwnerWithShop>(
    `SELECT 
       u.id,
       u.username,
       u.display_name,
       u.is_active,
       u.must_change_password,
       u.created_at,
       s.id AS shop_id,
       s.name AS shop_name,
       s.slug AS shop_slug,
       s.status::text AS shop_status
     FROM users u
     LEFT JOIN shops s ON s.owner_id = u.id
     WHERE u.role = 'owner'
     ORDER BY u.created_at DESC;`
  );

  return result.rows;
}
