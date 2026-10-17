import argon2 from 'argon2';
import crypto from 'crypto';

/**
 * Unambiguous 58-character alphabet per PRD Section 8 (A2.3).
 * Excludes confusing glyphs: 0, O, 1, I, l.
 */
export const ALLOWED_TEMP_PASSWORD_CHARS =
  'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

let dummyHashPromise: Promise<string> | null = null;

async function getDummyHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = argon2.hash('__shopfront_dummy_timing_probe__', {
      type: argon2.argon2id,
    });
  }
  return dummyHashPromise;
}

/**
 * Hashes a plaintext password using Argon2id.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
  });
}

/**
 * Verifies a plaintext password against an Argon2id hash.
 */
export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

/**
 * Performs a dummy Argon2id verification for constant-time timing equalization
 * when an unknown username is probed (PRD Section 13.1, Architecture 7.1).
 */
export async function verifyDummyPassword(password: string): Promise<boolean> {
  const dummyHash = await getDummyHash();
  try {
    await argon2.verify(dummyHash, password);
  } catch {
    // Ignore error
  }
  return false;
}

/**
 * Generates a 12-character temporary password using CSPRNG per PRD Section 8 (A2.3).
 */
export function generateTemporaryPassword(): string {
  const chars = ALLOWED_TEMP_PASSWORD_CHARS;
  const len = 12;
  let password = '';
  for (let i = 0; i < len; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    password += chars[randomIndex];
  }
  return password;
}

export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates password complexity per PRD Section 9 (O1.3):
 * - 8–128 characters
 * - At least one letter and at least one digit
 * - Not equal to username
 * - Not equal to previous password
 */
export function validatePasswordComplexity(
  password: string,
  username?: string,
  previousPassword?: string
): PasswordValidationResult {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long.' };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password must be at most 128 characters long.' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one digit.' };
  }
  if (username && password.toLowerCase() === username.toLowerCase()) {
    return { valid: false, error: 'Password cannot be identical to username.' };
  }
  if (previousPassword && password === previousPassword) {
    return { valid: false, error: 'Password cannot be identical to the previous password.' };
  }
  return { valid: true };
}
