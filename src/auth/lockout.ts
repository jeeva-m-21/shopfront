import { query } from '../db.js';
import { verifyPassword, verifyDummyPassword } from './passwords.js';
import { createSession, type AuthUser } from './sessions.js';

export const LOCKOUT_THRESHOLD = 5;
export const LOCKOUT_WINDOW_MINUTES = 15;

export type AuthResult =
  | {
      success: true;
      user: AuthUser;
      token: string;
      expiresAt: Date;
      redirectUrl: string;
    }
  | {
      success: false;
      error: string;
      lockedOut?: boolean;
    };

/**
 * Checks if a username is locked out based on failed login attempts
 * within the sliding window (5 failures in 15 minutes).
 */
export async function isLockedOut(username: string): Promise<boolean> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) FROM login_attempts
     WHERE username = $1
       AND succeeded = FALSE
       AND created_at > now() - ($2 || ' minutes')::INTERVAL;`,
    [username, LOCKOUT_WINDOW_MINUTES.toString()]
  );

  const failedCount = parseInt(result.rows[0]?.count ?? '0', 10);
  return failedCount >= LOCKOUT_THRESHOLD;
}

/**
 * Records a login attempt (succeeded or failed) in login_attempts table.
 */
export async function recordLoginAttempt(
  username: string,
  succeeded: boolean
): Promise<void> {
  await query(
    `INSERT INTO login_attempts (username, succeeded)
     VALUES ($1, $2);`,
    [username, succeeded]
  );
}

/**
 * Authenticates a user with constant-time timing equalization,
 * sliding-window lockout enforcement, and session creation.
 * Follows PRD Section 13.1, Architecture 7.1.
 */
export async function authenticateUser(
  username: string,
  password: string
): Promise<AuthResult> {
  const normalizedUsername = username.trim().toLowerCase();

  // 1. Check lockout status
  const locked = await isLockedOut(normalizedUsername);
  if (locked) {
    // Does not record a new attempt when already locked out
    return {
      success: false,
      error: 'Too many attempts. Try again in 15 minutes.',
      lockedOut: true,
    };
  }

  // 2. Query user by username
  const userResult = await query<{
    id: string;
    username: string;
    password_hash: string;
    display_name: string;
    role: 'admin' | 'owner';
    must_change_password: boolean;
    is_active: boolean;
  }>(
    `SELECT id, username, password_hash, display_name, role, must_change_password, is_active
     FROM users
     WHERE username = $1;`,
    [normalizedUsername]
  );

  const user = userResult.rows[0];

  // 3. User does not exist: run dummy argon2 verify for timing equalization
  if (!user) {
    await verifyDummyPassword(password);
    await recordLoginAttempt(normalizedUsername, false);
    return {
      success: false,
      error: 'Invalid username or password',
    };
  }

  // 4. User exists: verify password against argon2id hash
  const passwordValid = await verifyPassword(user.password_hash, password);
  if (!passwordValid) {
    await recordLoginAttempt(normalizedUsername, false);
    return {
      success: false,
      error: 'Invalid username or password',
    };
  }

  // 5. Account inactive check (evaluated ONLY after password verification to prevent probing)
  if (!user.is_active) {
    return {
      success: false,
      error: 'This account is inactive. Contact the admin.',
    };
  }

  // 6. Successful login
  await recordLoginAttempt(normalizedUsername, true);

  await query(
    `UPDATE users SET last_login_at = now() WHERE id = $1;`,
    [user.id]
  );

  const { token, expiresAt } = await createSession(user.id);

  const authUser: AuthUser = {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    role: user.role,
    must_change_password: user.must_change_password,
    is_active: user.is_active,
  };

  const redirectUrl = user.role === 'admin' ? '/admin' : '/owner';

  return {
    success: true,
    user: authUser,
    token,
    expiresAt,
    redirectUrl,
  };
}
