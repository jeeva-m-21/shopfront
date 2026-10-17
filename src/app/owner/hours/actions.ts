'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { requireOwner, verifyCsrfOrigin } from '../../../auth/guards.js';
import {
  saveOwnerWeeklyHours,
  addOwnerClosure,
  removeOwnerClosure,
} from '../../../owner/hours-ops.js';
import type { ShopHourInterval } from '../../../domain/hours.js';

export async function saveWeeklyHoursAction(
  intervals: ShopHourInterval[]
): Promise<{ success: boolean; error?: string }> {
  const reqHeaders = await headers();
  verifyCsrfOrigin(reqHeaders);

  const { user } = await requireOwner('/owner/hours');

  try {
    await saveOwnerWeeklyHours({
      ownerId: user.id,
      intervals,
      actor: { id: user.id, username: user.username },
    });

    revalidatePath('/owner/hours');
    revalidatePath('/owner');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save weekly hours',
    };
  }
}

export async function addClosureAction(
  closed_on: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const reqHeaders = await headers();
  verifyCsrfOrigin(reqHeaders);

  const { user } = await requireOwner('/owner/hours');

  try {
    await addOwnerClosure({
      ownerId: user.id,
      closed_on,
      reason,
      actor: { id: user.id, username: user.username },
    });

    revalidatePath('/owner/hours');
    revalidatePath('/owner');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add closure',
    };
  }
}

export async function removeClosureAction(
  closureId: string
): Promise<{ success: boolean; error?: string }> {
  const reqHeaders = await headers();
  verifyCsrfOrigin(reqHeaders);

  const { user } = await requireOwner('/owner/hours');

  try {
    await removeOwnerClosure({
      ownerId: user.id,
      closureId,
      actor: { id: user.id, username: user.username },
    });

    revalidatePath('/owner/hours');
    revalidatePath('/owner');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove closure',
    };
  }
}
