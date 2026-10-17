'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authenticateUser } from '../../auth/lockout.js';
import { SESSION_COOKIE_NAME } from '../../auth/sessions.js';

export interface LoginActionState {
  error?: string;
}

export async function loginAction(
  _prevState: LoginActionState | null,
  formData: FormData
): Promise<LoginActionState> {
  const username = formData.get('username')?.toString() ?? '';
  const password = formData.get('password')?.toString() ?? '';

  if (!username || !password) {
    return { error: 'Invalid username or password' };
  }

  const result = await authenticateUser(username, password);

  if (!result.success) {
    return { error: result.error };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: result.expiresAt,
  });

  redirect(result.redirectUrl);
}
