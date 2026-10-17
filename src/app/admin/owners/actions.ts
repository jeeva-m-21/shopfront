'use server';

import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireAdmin, assertCsrfOrigin } from '../../../auth/guards.js';
import { deleteSession, SESSION_COOKIE_NAME } from '../../../auth/sessions.js';
import {
  createOwnerAccount,
  resetOwnerPassword,
  disableOwnerAccount,
  enableOwnerAccount,
} from '../../../auth/owner-ops.js';

export interface CreateOwnerActionState {
  error?: string;
  success?: boolean;
  temporaryPassword?: string;
  username?: string;
}

export async function createOwnerAction(
  _prevState: CreateOwnerActionState | null,
  formData: FormData
): Promise<CreateOwnerActionState> {
  const reqHeaders = await headers();
  assertCsrfOrigin(reqHeaders);

  const { user } = await requireAdmin();

  const username = formData.get('username')?.toString() ?? '';
  const displayName = formData.get('display_name')?.toString() ?? '';

  try {
    const result = await createOwnerAccount({
      username,
      displayName,
      actor: { id: user.id, username: user.username },
    });

    revalidatePath('/admin/owners');
    return {
      success: true,
      temporaryPassword: result.temporaryPassword,
      username: result.user.username,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to create owner account',
    };
  }
}

export async function resetOwnerPasswordAction(
  ownerId: string
): Promise<{ temporaryPassword?: string; error?: string }> {
  const reqHeaders = await headers();
  assertCsrfOrigin(reqHeaders);

  const { user } = await requireAdmin();

  try {
    const result = await resetOwnerPassword({
      ownerId,
      actor: { id: user.id, username: user.username },
    });
    revalidatePath('/admin/owners');
    return { temporaryPassword: result.temporaryPassword };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to reset password' };
  }
}

export async function toggleOwnerStatusAction(
  ownerId: string,
  targetStatus: 'enable' | 'disable'
): Promise<{ success: boolean; error?: string }> {
  const reqHeaders = await headers();
  assertCsrfOrigin(reqHeaders);

  const { user } = await requireAdmin();

  try {
    if (targetStatus === 'disable') {
      await disableOwnerAccount({
        ownerId,
        actor: { id: user.id, username: user.username },
      });
    } else {
      await enableOwnerAccount({
        ownerId,
        actor: { id: user.id, username: user.username },
      });
    }
    revalidatePath('/admin/owners');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Operation failed' };
  }
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await deleteSession(token);
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
  redirect('/login');
}
