import { query } from '../db.js';
import {
  hashPassword,
  verifyPassword,
  validatePasswordComplexity,
} from '../auth/passwords.js';
import { deleteAllUserSessions } from '../auth/sessions.js';
import { logAudit } from '../audit.js';

export interface ForceChangeOwnerPasswordParams {
  userId: string;
  newPassword: string;
  confirmPassword: string;
  currentSessionToken: string;
}

/**
 * Executes forced password change on first login for an owner (PRD Section 9, O1).
 * Validates complexity, verifies that new password is not identical to current temporary password,
 * sets must_change_password = FALSE, and revokes all other sessions.
 */
export async function forceChangeOwnerPassword({
  userId,
  newPassword,
  confirmPassword,
  currentSessionToken,
}: ForceChangeOwnerPasswordParams): Promise<void> {
  if (newPassword !== confirmPassword) {
    throw new Error('Passwords do not match.');
  }

  const userRes = await query<{
    id: string;
    username: string;
    password_hash: string;
    role: string;
    must_change_password: boolean;
    is_active: boolean;
  }>(
    `SELECT id, username, password_hash, role, must_change_password, is_active
     FROM users WHERE id = $1;`,
    [userId]
  );

  const user = userRes.rows[0];
  if (!user || !user.is_active || user.role !== 'owner') {
    throw new Error('Owner account not found or inactive.');
  }

  const complexity = validatePasswordComplexity(newPassword, user.username);
  if (!complexity.valid) {
    throw new Error(`Password validation failed: ${complexity.error}`);
  }

  const isSame = await verifyPassword(user.password_hash, newPassword);
  if (isSame) {
    throw new Error('New password cannot be identical to the previous password.');
  }

  const newHash = await hashPassword(newPassword);

  await query(
    `UPDATE users
     SET password_hash = $1, must_change_password = FALSE
     WHERE id = $2;`,
    [newHash, user.id]
  );

  // Invalidate all other sessions of this user except currentSessionToken (PRD O1.4)
  await deleteAllUserSessions(user.id, currentSessionToken);

  // Log audit
  await logAudit({
    actorId: user.id,
    actorUsername: user.username,
    action: 'owner.change_password',
    entityType: 'user',
    entityId: user.id,
    afterData: { must_change_password: false },
  });
}
