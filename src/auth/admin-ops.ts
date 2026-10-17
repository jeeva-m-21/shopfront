import { query } from '../db.js';
import { hashPassword, verifyPassword, validatePasswordComplexity } from './passwords.js';
import { deleteAllUserSessions } from './sessions.js';

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

export interface CreateAdminParams {
  username: string;
  password: string;
  displayName: string;
}

export interface ResetAdminPasswordParams {
  username: string;
  newPassword: string;
}

/**
 * Creates a new active administrator account.
 */
export async function createAdminUser(
  params: CreateAdminParams
): Promise<{ id: string; username: string }> {
  const username = params.username.trim().toLowerCase();
  const displayName = params.displayName.trim();
  const password = params.password;

  if (!USERNAME_REGEX.test(username)) {
    throw new Error(
      `Username must match ^[a-z0-9_]{3,30}$, received: '${username}'`
    );
  }

  if (displayName.length < 2 || displayName.length > 80) {
    throw new Error('Display name must be between 2 and 80 characters.');
  }

  const complexity = validatePasswordComplexity(password, username);
  if (!complexity.valid) {
    throw new Error(`Password validation failed: ${complexity.error}`);
  }

  const passwordHash = await hashPassword(password);

  const result = await query<{ id: string; username: string }>(
    `INSERT INTO users (username, password_hash, display_name, role, must_change_password, is_active)
     VALUES ($1, $2, $3, 'admin', FALSE, TRUE)
     RETURNING id, username;`,
    [username, passwordHash, displayName]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('Failed to create admin user row.');
  }

  return { id: row.id, username: row.username };
}

/**
 * Resets the password for an existing admin and invalidates all existing sessions.
 */
export async function resetAdminPassword(
  params: ResetAdminPasswordParams
): Promise<void> {
  const username = params.username.trim().toLowerCase();
  const newPassword = params.newPassword;

  const result = await query<{ id: string; password_hash: string }>(
    `SELECT id, password_hash FROM users WHERE username = $1 AND role = 'admin';`,
    [username]
  );

  const user = result.rows[0];
  if (!user) {
    throw new Error(`Admin user '${username}' not found.`);
  }

  const complexity = validatePasswordComplexity(newPassword, username);
  if (!complexity.valid) {
    throw new Error(`Password validation failed: ${complexity.error}`);
  }

  // Check against previous password hash
  const isSameAsOld = await verifyPassword(user.password_hash, newPassword);
  if (isSameAsOld) {
    throw new Error('New password cannot be the same as the previous password.');
  }

  const newHash = await hashPassword(newPassword);

  await query(`UPDATE users SET password_hash = $1 WHERE id = $2;`, [
    newHash,
    user.id,
  ]);

  // Invalidate all existing sessions per PRD Section 13.1
  await deleteAllUserSessions(user.id);
}
