'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { requireOwner, verifyCsrfOrigin } from '../../../auth/guards.js';
import { updateOwnerShopDetails } from '../../../owner/shop-ops.js';
import type { ActionMode } from '../../../admin/shop-ops.js';

export interface UpdateOwnerShopState {
  error?: string;
  success?: boolean;
}

export async function updateOwnerShopAction(
  _prevState: UpdateOwnerShopState | null,
  formData: FormData
): Promise<UpdateOwnerShopState> {
  const reqHeaders = await headers();
  verifyCsrfOrigin(reqHeaders);

  const { user } = await requireOwner('/owner/shop');

  const name = formData.get('name')?.toString() ?? '';
  const description = formData.get('description')?.toString() ?? '';
  const address = formData.get('address')?.toString() ?? '';
  const phone = formData.get('phone')?.toString() ?? '';
  const whatsapp = formData.get('whatsapp')?.toString() || null;
  const booking_url = formData.get('booking_url')?.toString() || null;
  const website_url = formData.get('website_url')?.toString() || null;
  const action_mode = (formData.get('action_mode')?.toString() ?? 'phone_only') as ActionMode;
  const action_instructions = formData.get('action_instructions')?.toString() || null;

  try {
    await updateOwnerShopDetails({
      ownerId: user.id,
      name,
      description,
      address,
      phone,
      whatsapp,
      booking_url,
      website_url,
      action_mode,
      action_instructions,
      actor: { id: user.id, username: user.username },
    });

    revalidatePath('/owner/shop');
    revalidatePath('/owner');

    return { success: true };
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }
    return {
      error: error instanceof Error ? error.message : 'Failed to update shop details',
    };
  }
}
