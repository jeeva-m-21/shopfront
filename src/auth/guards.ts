import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { validateSession, SESSION_COOKIE_NAME, type SessionValidationResult } from './sessions.js';
import { getConfig } from '../config.js';

/**
 * Enforces admin authentication on page or server action requests.
 * Redirects unauthenticated, non-admin, or inactive accounts to /login.
 */
export async function requireAdmin(): Promise<SessionValidationResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    redirect('/login');
  }

  const sessionResult = await validateSession(token);
  if (!sessionResult) {
    redirect('/login');
  }

  const { user } = sessionResult;
  if (user.role !== 'admin' || !user.is_active) {
    redirect('/login');
  }

  return sessionResult;
}

/**
 * Enforces owner authentication on page or server action requests.
 * Redirects unauthenticated, non-owner, or inactive accounts to /login.
 * If must_change_password is TRUE and current route is not /owner/change-password,
 * redirects to /owner/change-password.
 */
export async function requireOwner(currentPath?: string): Promise<SessionValidationResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    redirect('/login');
  }

  const sessionResult = await validateSession(token);
  if (!sessionResult) {
    redirect('/login');
  }

  const { user } = sessionResult;
  if (user.role !== 'owner' || !user.is_active) {
    redirect('/login');
  }

  if (user.must_change_password && currentPath !== '/owner/change-password') {
    redirect('/owner/change-password');
  }

  return sessionResult;
}

export class CsrfValidationError extends Error {
  readonly status = 403;
  constructor(message = 'CSRF origin validation failed: Origin header missing or mismatched.') {
    super(message);
    this.name = 'CsrfValidationError';
  }
}

/**
 * Verifies that the Origin header host matches APP_BASE_URL for CSRF protection (PRD Section 13.3).
 */
export function verifyCsrfOrigin(
  headers: Headers,
  expectedBaseUrl?: string
): boolean {
  const origin = headers.get('origin');
  if (!origin) {
    return false;
  }

  const baseUrl = expectedBaseUrl || getConfig().APP_BASE_URL;

  try {
    const originUrl = new URL(origin);
    const targetUrl = new URL(baseUrl);
    return originUrl.host === targetUrl.host;
  } catch {
    return false;
  }
}

/**
 * Asserts that the Origin header matches APP_BASE_URL for CSRF protection.
 * Throws CsrfValidationError if origin is missing or mismatched.
 */
export function assertCsrfOrigin(
  headers: Headers,
  expectedBaseUrl?: string
): void {
  if (!verifyCsrfOrigin(headers, expectedBaseUrl)) {
    throw new CsrfValidationError();
  }
}

