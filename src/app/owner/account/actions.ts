'use server';

import { headers, cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { requireOwner, assertCsrfOrigin } from '../../../auth/guards.js';
import { SESSION_COOKIE_NAME } from '../../../auth/sessions.js';
import { changeOwnerPasswordSelfService } from '../../../owner/account-ops.js';
import { pauseOwnerShop, resumeOwnerShop } from '../../../owner/shop-ops.js';

export interface ChangePasswordFormState {
  error?: string;
  success?: boolean;
}

export async function changeOwnerPasswordAction(
  _prevState: ChangePasswordFormState | null,
  formData: FormData
): Promise<ChangePasswordFormState> {
  const reqHeaders = await headers();
  assertCsrfOrigin(reqHeaders);

  const { user } = await requireOwner('/owner/account');
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return { error: 'Session expired. Please log in again.' };
  }

  const currentPassword = formData.get('current_password')?.toString() ?? '';
  const newPassword = formData.get('new_password')?.toString() ?? '';
  const confirmPassword = formData.get('confirm_password')?.toString() ?? '';

  try {
    await changeOwnerPasswordSelfService({
      userId: user.id,
      currentPassword,
      newPassword,
      confirmPassword,
      currentSessionToken: token,
    });

    return { success: true };
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }
    return {
      error: error instanceof Error ? error.message : 'Failed to update password',
    };
  }
}

export async function pauseListingAction(): Promise<{ success: boolean; error?: string }> {
  const reqHeaders = await headers();
  assertCsrfOrigin(reqHeaders);

  const { user } = await requireOwner('/owner/account');

  try {
    await pauseOwnerShop(user.id, {
      id: user.id,
      username: user.username,
    });

    revalidatePath('/owner/account');
    revalidatePath('/owner');
    revalidatePath('/owner/shop');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to pause listing',
    };
  }
}

export async function resumeListingAction(): Promise<{ success: boolean; error?: string }> {
  const reqHeaders = await headers();
  assertCsrfOrigin(reqHeaders);

  const { user } = await requireOwner('/owner/account');

  try {
    await resumeOwnerShop(user.id, {
      id: user.id,
      username: user.username,
    });

    revalidatePath('/owner/account');
    revalidatePath('/owner');
    revalidatePath('/owner/shop');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resume listing',
    };
  }
}
