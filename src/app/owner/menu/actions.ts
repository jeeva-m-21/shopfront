'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { requireOwner, assertCsrfOrigin } from '../../../auth/guards.js';
import {
  createOwnerMenuItem,
  updateOwnerMenuItem,
  toggleOwnerMenuItemAvailable,
  deleteOwnerMenuItem,
  type ItemKind,
  type DietType,
} from '../../../owner/menu-ops.js';
import type { PriceType } from '../../../domain/pricing.js';

export interface MenuItemActionState {
  error?: string;
  success?: boolean;
}

export async function createMenuItemAction(
  _prevState: MenuItemActionState | null,
  formData: FormData
): Promise<MenuItemActionState> {
  const reqHeaders = await headers();
  assertCsrfOrigin(reqHeaders);

  const { user } = await requireOwner('/owner/menu');

  const group_name = formData.get('group_name')?.toString() ?? '';
  const name = formData.get('name')?.toString() ?? '';
  const description = formData.get('description')?.toString() || null;
  const kind = (formData.get('kind')?.toString() ?? 'product') as ItemKind;
  const price_type = (formData.get('price_type')?.toString() ?? 'fixed') as PriceType;

  const priceRaw = formData.get('price_inr')?.toString();
  const price_inr = priceRaw && priceRaw.trim() !== '' ? parseInt(priceRaw, 10) : null;

  const priceMaxRaw = formData.get('price_max_inr')?.toString();
  const price_max_inr = priceMaxRaw && priceMaxRaw.trim() !== '' ? parseInt(priceMaxRaw, 10) : null;

  const durationRaw = formData.get('duration_min')?.toString();
  const duration_min = durationRaw && durationRaw.trim() !== '' ? parseInt(durationRaw, 10) : null;

  const dietRaw = formData.get('diet')?.toString();
  const diet = (dietRaw && dietRaw.trim() !== '' ? dietRaw : null) as DietType | null;

  const tagsRaw = formData.get('tags')?.toString() ?? '';
  const tags = tagsRaw
    ? tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    : [];

  const available = formData.get('available') === 'on' || formData.get('available') === 'true';

  const sortOrderRaw = formData.get('sort_order')?.toString();
  const sort_order = sortOrderRaw && sortOrderRaw.trim() !== '' ? parseInt(sortOrderRaw, 10) : 0;

  try {
    await createOwnerMenuItem({
      ownerId: user.id,
      group_name,
      name,
      description,
      kind,
      price_type,
      price_inr,
      price_max_inr,
      duration_min,
      diet,
      tags,
      available,
      sort_order,
      actor: { id: user.id, username: user.username },
    });

    revalidatePath('/owner/menu');
    revalidatePath('/owner');

    return { success: true };
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }
    return {
      error: error instanceof Error ? error.message : 'Failed to create item',
    };
  }
}

export async function updateMenuItemAction(
  _prevState: MenuItemActionState | null,
  formData: FormData
): Promise<MenuItemActionState> {
  const reqHeaders = await headers();
  assertCsrfOrigin(reqHeaders);

  const { user } = await requireOwner('/owner/menu');

  const itemId = formData.get('itemId')?.toString() ?? '';
  const group_name = formData.get('group_name')?.toString() ?? '';
  const name = formData.get('name')?.toString() ?? '';
  const description = formData.get('description')?.toString() || null;
  const kind = (formData.get('kind')?.toString() ?? 'product') as ItemKind;
  const price_type = (formData.get('price_type')?.toString() ?? 'fixed') as PriceType;

  const priceRaw = formData.get('price_inr')?.toString();
  const price_inr = priceRaw && priceRaw.trim() !== '' ? parseInt(priceRaw, 10) : null;

  const priceMaxRaw = formData.get('price_max_inr')?.toString();
  const price_max_inr = priceMaxRaw && priceMaxRaw.trim() !== '' ? parseInt(priceMaxRaw, 10) : null;

  const durationRaw = formData.get('duration_min')?.toString();
  const duration_min = durationRaw && durationRaw.trim() !== '' ? parseInt(durationRaw, 10) : null;

  const dietRaw = formData.get('diet')?.toString();
  const diet = (dietRaw && dietRaw.trim() !== '' ? dietRaw : null) as DietType | null;

  const tagsRaw = formData.get('tags')?.toString() ?? '';
  const tags = tagsRaw
    ? tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    : [];

  const available = formData.get('available') === 'on' || formData.get('available') === 'true';

  const sortOrderRaw = formData.get('sort_order')?.toString();
  const sort_order = sortOrderRaw && sortOrderRaw.trim() !== '' ? parseInt(sortOrderRaw, 10) : 0;

  try {
    await updateOwnerMenuItem({
      ownerId: user.id,
      itemId,
      group_name,
      name,
      description,
      kind,
      price_type,
      price_inr,
      price_max_inr,
      duration_min,
      diet,
      tags,
      available,
      sort_order,
      actor: { id: user.id, username: user.username },
    });

    revalidatePath('/owner/menu');
    revalidatePath('/owner');

    return { success: true };
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }
    return {
      error: error instanceof Error ? error.message : 'Failed to update item',
    };
  }
}

export async function toggleMenuItemAvailableAction(
  itemId: string,
  available: boolean
): Promise<{ success: boolean; error?: string }> {
  const reqHeaders = await headers();
  assertCsrfOrigin(reqHeaders);

  const { user } = await requireOwner('/owner/menu');

  try {
    await toggleOwnerMenuItemAvailable(user.id, itemId, available, {
      id: user.id,
      username: user.username,
    });

    revalidatePath('/owner/menu');
    revalidatePath('/owner');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle availability',
    };
  }
}

export async function deleteMenuItemAction(
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  const reqHeaders = await headers();
  assertCsrfOrigin(reqHeaders);

  const { user } = await requireOwner('/owner/menu');

  try {
    await deleteOwnerMenuItem(user.id, itemId, {
      id: user.id,
      username: user.username,
    });

    revalidatePath('/owner/menu');
    revalidatePath('/owner');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete item',
    };
  }
}
