'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '../../../auth/guards.js';
import {
  createAdminShop,
  updateAdminShop,
  makeShopLive,
  pauseShop,
  deleteShop,
  type ShopCategory,
  type ActionMode,
} from '../../../admin/shop-ops.js';

export interface ShopActionState {
  error?: string;
  success?: boolean;
}

export async function createShopAction(
  _prevState: ShopActionState | null,
  formData: FormData
): Promise<ShopActionState> {
  const { user } = await requireAdmin();

  try {
    const name = formData.get('name')?.toString() ?? '';
    const slug = formData.get('slug')?.toString() ?? '';
    const category = formData.get('category')?.toString() as ShopCategory;
    const description = formData.get('description')?.toString() ?? '';
    const address = formData.get('address')?.toString() ?? '';
    const localityId = parseInt(formData.get('locality_id')?.toString() ?? '1', 10);
    const latitude = parseFloat(formData.get('latitude')?.toString() ?? '13.0');
    const longitude = parseFloat(formData.get('longitude')?.toString() ?? '80.2');
    const phone = formData.get('phone')?.toString() ?? '';
    const whatsapp = formData.get('whatsapp')?.toString() || null;
    const bookingUrl = formData.get('booking_url')?.toString() || null;
    const websiteUrl = formData.get('website_url')?.toString() || null;
    const actionMode = formData.get('action_mode')?.toString() as ActionMode;
    const actionInstructions = formData.get('action_instructions')?.toString() || null;
    const isSampleData = formData.get('is_sample_data') === 'true';
    const dataSourceNote = formData.get('data_source_note')?.toString() || null;
    const ownerId = formData.get('owner_id')?.toString() || null;

    const shop = await createAdminShop({
      name,
      slug,
      category,
      description,
      address,
      locality_id: localityId,
      latitude,
      longitude,
      phone,
      whatsapp,
      booking_url: bookingUrl,
      website_url: websiteUrl,
      action_mode: actionMode,
      action_instructions: actionInstructions,
      is_sample_data: isSampleData,
      data_source_note: dataSourceNote,
      owner_id: ownerId,
      actor: { id: user.id, username: user.username },
    });

    revalidatePath('/admin/shops');
    redirect(`/admin/shops/${shop.id}`);
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) {
      // Next.js redirect throw
      throw error;
    }
    return {
      error: error instanceof Error ? error.message : 'Failed to create shop',
    };
  }
}

export async function updateShopAction(
  shopId: string,
  _prevState: ShopActionState | null,
  formData: FormData
): Promise<ShopActionState> {
  const { user } = await requireAdmin();

  try {
    const name = formData.get('name')?.toString();
    const slug = formData.get('slug')?.toString();
    const category = formData.get('category') as ShopCategory | null;
    const description = formData.get('description')?.toString();
    const address = formData.get('address')?.toString();
    const localityId = formData.get('locality_id')
      ? parseInt(formData.get('locality_id')!.toString(), 10)
      : undefined;
    const latitude = formData.get('latitude')
      ? parseFloat(formData.get('latitude')!.toString())
      : undefined;
    const longitude = formData.get('longitude')
      ? parseFloat(formData.get('longitude')!.toString())
      : undefined;
    const phone = formData.get('phone')?.toString();
    const whatsapp = formData.get('whatsapp')?.toString() || null;
    const bookingUrl = formData.get('booking_url')?.toString() || null;
    const websiteUrl = formData.get('website_url')?.toString() || null;
    const actionMode = formData.get('action_mode') as ActionMode | null;
    const actionInstructions = formData.get('action_instructions')?.toString() || null;
    const isSampleData = formData.get('is_sample_data')
      ? formData.get('is_sample_data') === 'true'
      : undefined;
    const dataSourceNote = formData.get('data_source_note')?.toString() || null;
    const ownerId = formData.get('owner_id')?.toString() || null;

    await updateAdminShop({
      shopId,
      name,
      slug,
      category: category || undefined,
      description,
      address,
      locality_id: localityId,
      latitude,
      longitude,
      phone,
      whatsapp,
      booking_url: bookingUrl,
      website_url: websiteUrl,
      action_mode: actionMode || undefined,
      action_instructions: actionInstructions,
      is_sample_data: isSampleData,
      data_source_note: dataSourceNote,
      owner_id: ownerId,
      actor: { id: user.id, username: user.username },
    });

    revalidatePath('/admin/shops');
    revalidatePath(`/admin/shops/${shopId}`);
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to update shop',
    };
  }
}

export async function makeShopLiveAction(shopId: string): Promise<{ success: boolean; error?: string }> {
  const { user } = await requireAdmin();
  try {
    await makeShopLive({
      shopId,
      actor: { id: user.id, username: user.username },
    });
    revalidatePath('/admin/shops');
    revalidatePath(`/admin/shops/${shopId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to make shop live' };
  }
}

export async function pauseShopAction(shopId: string): Promise<{ success: boolean; error?: string }> {
  const { user } = await requireAdmin();
  try {
    await pauseShop({
      shopId,
      actor: { id: user.id, username: user.username },
    });
    revalidatePath('/admin/shops');
    revalidatePath(`/admin/shops/${shopId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to pause shop' };
  }
}

export async function deleteShopAction(
  shopId: string,
  confirmationSlug: string
): Promise<{ success: boolean; error?: string }> {
  const { user } = await requireAdmin();
  try {
    await deleteShop({
      shopId,
      confirmationSlug,
      actor: { id: user.id, username: user.username },
    });
    revalidatePath('/admin/shops');
    redirect('/admin/shops');
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete shop' };
  }
}
