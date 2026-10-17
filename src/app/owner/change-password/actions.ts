'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireOwner, assertCsrfOrigin } from '../../../auth/guards.js';
import { SESSION_COOKIE_NAME } from '../../../auth/sessions.js';
import { forceChangeOwnerPassword } from '../../../owner/account-ops.js';

export interface ChangePasswordState {
  error?: string;
  success?: boolean;
}

export async function changePasswordAction(
  _prevState: ChangePasswordState | null,
  formData: FormData
): Promise<ChangePasswordState> {
  const reqHeaders = await headers();
  assertCsrfOrigin(reqHeaders);

  const { user } = await requireOwner('/owner/change-password');
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    redirect('/login');
  }

  const newPassword = formData.get('new_password')?.toString() ?? '';
  const confirmPassword = formData.get('confirm_password')?.toString() ?? '';

  try {
    await forceChangeOwnerPassword({
      userId: user.id,
      newPassword,
      confirmPassword,
      currentSessionToken: token,
    });

    redirect('/owner');
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }
    return {
      error: error instanceof Error ? error.message : 'Failed to update password',
    };
  }
}
