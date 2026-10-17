import { query } from '../db.js';
import { logAudit } from '../audit.js';
import type { ShopCategory, ShopStatus, HoursStatus, ActionMode } from '../admin/shop-ops.js';

export class ShopNotFoundError extends Error {
  readonly status = 404;
  constructor(message = 'Shop not found') {
    super(message);
    this.name = 'ShopNotFoundError';
  }
}

export interface OwnerShopRecord {
  id: string;
  slug: string;
  name: string;
  category: ShopCategory;
  description: string;
  address: string;
  locality_id: number;
  locality_name: string;
  latitude: number;
  longitude: number;
  phone: string;
  whatsapp: string | null;
  booking_url: string | null;
  website_url: string | null;
  action_mode: ActionMode;
  action_instructions: string | null;
  is_sample_data: boolean;
  data_source_note: string | null;
  owner_id: string;
  status: ShopStatus;
  admin_locked: boolean;
  hours_status: HoursStatus;
  created_at: Date;
  updated_at: Date;
}

export interface OwnerDashboardBanners {
  showUnknownHoursBanner: boolean;
  showDraftBanner: boolean;
  showAdminLockedBanner: boolean;
}

export interface OwnerDashboardData {
  shop: OwnerShopRecord;
  available_items_count: number;
  total_items_count: number;
  latest_item_updated_at: Date | null;
  menu_updated_text: string;
  banners: OwnerDashboardBanners;
}

export interface UpdateOwnerShopParams {
  ownerId: string;
  requestedShopId?: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  whatsapp?: string | null;
  booking_url?: string | null;
  website_url?: string | null;
  action_mode: ActionMode;
  action_instructions?: string | null;
  actor: { id: string; username: string };
}

const PHONE_REGEX = /^\+91\d{10}$/;
const WHATSAPP_REGEX = /^\+91[6-9]\d{9}$/;
const URL_REGEX = /^https:\/\/\S+$/;

export function formatMenuUpdatedDate(date: Date | null | undefined): string {
  if (!date) return 'No menu items yet';
  const d = new Date(date);
  const formatted = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
  return `Menu updated on ${formatted}`;
}

function validateOwnerShopFields(params: {
  name: string;
  description: string;
  address: string;
  phone: string;
  whatsapp?: string | null;
  booking_url?: string | null;
  website_url?: string | null;
  action_mode: ActionMode;
  action_instructions?: string | null;
}) {
  if (params.name.length < 2 || params.name.length > 80) {
    throw new Error('Shop name must be between 2 and 80 characters.');
  }

  if (params.description.length < 10 || params.description.length > 500) {
    throw new Error('Description must be between 10 and 500 characters.');
  }

  if (params.address.length < 5 || params.address.length > 200) {
    throw new Error('Address must be between 5 and 200 characters.');
  }

  if (!PHONE_REGEX.test(params.phone)) {
    throw new Error(`Invalid phone number '${params.phone}'. Expected Indian format +91XXXXXXXXXX.`);
  }

  const trimmedWhatsapp = params.whatsapp ? params.whatsapp.trim() : null;
  if (trimmedWhatsapp && !WHATSAPP_REGEX.test(trimmedWhatsapp)) {
    throw new Error(`Invalid WhatsApp number '${trimmedWhatsapp}'. Expected +91 followed by 10 digits starting with 6-9.`);
  }

  const trimmedBooking = params.booking_url ? params.booking_url.trim() : null;
  if (trimmedBooking && !URL_REGEX.test(trimmedBooking)) {
    throw new Error(`Invalid booking URL '${trimmedBooking}'. Must begin with https://.`);
  }

  const trimmedWebsite = params.website_url ? params.website_url.trim() : null;
  if (trimmedWebsite && !URL_REGEX.test(trimmedWebsite)) {
    throw new Error(`Invalid website URL '${trimmedWebsite}'. Must begin with https://.`);
  }

  if (params.action_mode === 'whatsapp' && !trimmedWhatsapp) {
    throw new Error('WhatsApp number is required when action mode is whatsapp.');
  }

  if (params.action_mode === 'external_url' && !trimmedBooking) {
    throw new Error('Booking URL is required when action mode is external_url.');
  }

  if (params.action_instructions && params.action_instructions.length > 200) {
    throw new Error('Action instructions must be at most 200 characters.');
  }
}

interface RawShopRow {
  id: string;
  slug: string;
  name: string;
  category: ShopCategory;
  description: string;
  address: string;
  locality_id: number;
  locality_name: string;
  latitude: number;
  longitude: number;
  phone: string;
  whatsapp: string | null;
  booking_url: string | null;
  website_url: string | null;
  action_mode: ActionMode;
  action_instructions: string | null;
  is_sample_data: boolean;
  data_source_note: string | null;
  owner_id: string;
  status: ShopStatus;
  admin_locked: boolean;
  hours_status: HoursStatus;
  created_at: Date;
  updated_at: Date;
}

function mapShopRow(row: RawShopRow): OwnerShopRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    description: row.description,
    address: row.address,
    locality_id: row.locality_id,
    locality_name: row.locality_name,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    phone: row.phone,
    whatsapp: row.whatsapp,
    booking_url: row.booking_url,
    website_url: row.website_url,
    action_mode: row.action_mode,
    action_instructions: row.action_instructions,
    is_sample_data: row.is_sample_data,
    data_source_note: row.data_source_note,
    owner_id: row.owner_id,
    status: row.status,
    admin_locked: row.admin_locked,
    hours_status: row.hours_status,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

export async function getOwnerDashboard(ownerId: string): Promise<OwnerDashboardData | null> {
  const result = await query<RawShopRow & {
    available_items_count: number;
    total_items_count: number;
    latest_item_updated_at: Date | null;
  }>(
    `SELECT 
       s.id, s.slug, s.name, s.category, s.description, s.address,
       s.locality_id, l.name as locality_name,
       ST_Y(s.location::geometry) as latitude,
       ST_X(s.location::geometry) as longitude,
       s.phone, s.whatsapp, s.booking_url, s.website_url,
       s.action_mode, s.action_instructions,
       s.is_sample_data, s.data_source_note,
       s.owner_id, s.status, s.admin_locked, s.hours_status,
       s.created_at, s.updated_at,
       COALESCE((SELECT COUNT(*)::int FROM catalog_items ci WHERE ci.shop_id = s.id AND ci.available = TRUE), 0) as available_items_count,
       COALESCE((SELECT COUNT(*)::int FROM catalog_items ci WHERE ci.shop_id = s.id), 0) as total_items_count,
       (SELECT MAX(ci.updated_at) FROM catalog_items ci WHERE ci.shop_id = s.id) as latest_item_updated_at
     FROM shops s
     JOIN localities l ON l.id = s.locality_id
     WHERE s.owner_id = $1`,
    [ownerId]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const shop = mapShopRow(row);
  const availableItems = Number(row.available_items_count);
  const totalItems = Number(row.total_items_count);
  const latestItemUpdatedAt = row.latest_item_updated_at ? new Date(row.latest_item_updated_at) : null;

  return {
    shop,
    available_items_count: availableItems,
    total_items_count: totalItems,
    latest_item_updated_at: latestItemUpdatedAt,
    menu_updated_text: formatMenuUpdatedDate(latestItemUpdatedAt),
    banners: {
      showUnknownHoursBanner: shop.hours_status === 'unknown',
      showDraftBanner: shop.status === 'draft',
      showAdminLockedBanner: shop.admin_locked === true,
    },
  };
}

export async function getOwnerShop(ownerId: string, requestedShopId?: string): Promise<OwnerShopRecord> {
  const result = await query<RawShopRow>(
    `SELECT 
       s.id, s.slug, s.name, s.category, s.description, s.address,
       s.locality_id, l.name as locality_name,
       ST_Y(s.location::geometry) as latitude,
       ST_X(s.location::geometry) as longitude,
       s.phone, s.whatsapp, s.booking_url, s.website_url,
       s.action_mode, s.action_instructions,
       s.is_sample_data, s.data_source_note,
       s.owner_id, s.status, s.admin_locked, s.hours_status,
       s.created_at, s.updated_at
     FROM shops s
     JOIN localities l ON l.id = s.locality_id
     WHERE s.owner_id = $1`,
    [ownerId]
  );

  const row = result.rows[0];
  if (!row) {
    throw new ShopNotFoundError();
  }

  if (requestedShopId && requestedShopId !== row.id) {
    throw new ShopNotFoundError();
  }

  return mapShopRow(row);
}

export async function updateOwnerShopDetails(params: UpdateOwnerShopParams): Promise<OwnerShopRecord> {
  validateOwnerShopFields(params);

  // IDOR Guard: Verify ownership strictly by owner_id
  const currentShop = await getOwnerShop(params.ownerId, params.requestedShopId);

  const trimmedWhatsapp = params.whatsapp ? params.whatsapp.trim() : null;
  const trimmedBooking = params.booking_url ? params.booking_url.trim() : null;
  const trimmedWebsite = params.website_url ? params.website_url.trim() : null;
  const trimmedInstructions = params.action_instructions ? params.action_instructions.trim() : null;

  const result = await query<RawShopRow>(
    `UPDATE shops
     SET name = $1,
         description = $2,
         address = $3,
         phone = $4,
         whatsapp = $5,
         booking_url = $6,
         website_url = $7,
         action_mode = $8,
         action_instructions = $9,
         updated_at = now()
     WHERE id = $10 AND owner_id = $11
     RETURNING 
       id, slug, name, category, description, address,
       locality_id,
       (SELECT name FROM localities WHERE id = shops.locality_id) as locality_name,
       ST_Y(location::geometry) as latitude,
       ST_X(location::geometry) as longitude,
       phone, whatsapp, booking_url, website_url,
       action_mode, action_instructions,
       is_sample_data, data_source_note,
       owner_id, status, admin_locked, hours_status,
       created_at, updated_at`,
    [
      params.name.trim(),
      params.description.trim(),
      params.address.trim(),
      params.phone.trim(),
      trimmedWhatsapp,
      trimmedBooking,
      trimmedWebsite,
      params.action_mode,
      trimmedInstructions,
      currentShop.id,
      params.ownerId,
    ]
  );

  const updatedRow = result.rows[0];
  if (!updatedRow) {
    throw new ShopNotFoundError();
  }

  const updatedShop = mapShopRow(updatedRow);

  // Log audit trail
  await logAudit({
    actorId: params.actor.id,
    actorUsername: params.actor.username,
    action: 'shop.update',
    entityType: 'shop',
    entityId: updatedShop.id,
    beforeData: {
      name: currentShop.name,
      description: currentShop.description,
      address: currentShop.address,
      phone: currentShop.phone,
      whatsapp: currentShop.whatsapp,
      booking_url: currentShop.booking_url,
      website_url: currentShop.website_url,
      action_mode: currentShop.action_mode,
      action_instructions: currentShop.action_instructions,
    },
    afterData: {
      name: updatedShop.name,
      description: updatedShop.description,
      address: updatedShop.address,
      phone: updatedShop.phone,
      whatsapp: updatedShop.whatsapp,
      booking_url: updatedShop.booking_url,
      website_url: updatedShop.website_url,
      action_mode: updatedShop.action_mode,
      action_instructions: updatedShop.action_instructions,
    },
  });

  return updatedShop;
}

/**
 * Owner pauses their own live listing (PRD Section 7.1, 9, O7).
 * Sets status = 'paused', admin_locked = FALSE.
 */
export async function pauseOwnerShop(
  ownerId: string,
  actor: { id: string; username: string }
): Promise<OwnerShopRecord> {
  const shop = await getOwnerShop(ownerId);

  if (shop.status !== 'live') {
    throw new Error('Only live listings can be paused.');
  }

  const result = await query<RawShopRow>(
    `UPDATE shops
     SET status = 'paused',
         admin_locked = FALSE,
         updated_at = now()
     WHERE id = $1 AND owner_id = $2
     RETURNING 
       id, slug, name, category, description, address,
       locality_id,
       (SELECT name FROM localities WHERE id = shops.locality_id) as locality_name,
       ST_Y(location::geometry) as latitude,
       ST_X(location::geometry) as longitude,
       phone, whatsapp, booking_url, website_url,
       action_mode, action_instructions,
       is_sample_data, data_source_note,
       owner_id, status, admin_locked, hours_status,
       created_at, updated_at;`,
    [shop.id, ownerId]
  );

  const updatedShop = mapShopRow(result.rows[0]!);

  await logAudit({
    actorId: actor.id,
    actorUsername: actor.username,
    action: 'shop.pause',
    entityType: 'shop',
    entityId: updatedShop.id,
    beforeData: { status: shop.status, admin_locked: shop.admin_locked },
    afterData: { status: updatedShop.status, admin_locked: updatedShop.admin_locked },
  });

  return updatedShop;
}

/**
 * Owner resumes their own paused listing (PRD Section 7.1, 9, O7).
 * Blocked if admin_locked = TRUE or if available items count < 1.
 * Sets status = 'live'.
 */
export async function resumeOwnerShop(
  ownerId: string,
  actor: { id: string; username: string }
): Promise<OwnerShopRecord> {
  const shop = await getOwnerShop(ownerId);

  if (shop.admin_locked) {
    throw new Error('This listing was paused by admin and cannot be resumed by owner.');
  }

  if (shop.status !== 'paused') {
    throw new Error('Only paused listings can be resumed.');
  }

  // Check invariant: at least 1 available item
  const countRes = await query<{ count: string }>(
    `SELECT COUNT(*)::int as count FROM catalog_items WHERE shop_id = $1 AND available = TRUE;`,
    [shop.id]
  );
  const availableCount = Number(countRes.rows[0]?.count ?? 0);
  if (availableCount < 1) {
    throw new Error('Add at least one available menu item first');
  }

  const result = await query<RawShopRow>(
    `UPDATE shops
     SET status = 'live',
         updated_at = now()
     WHERE id = $1 AND owner_id = $2
     RETURNING 
       id, slug, name, category, description, address,
       locality_id,
       (SELECT name FROM localities WHERE id = shops.locality_id) as locality_name,
       ST_Y(location::geometry) as latitude,
       ST_X(location::geometry) as longitude,
       phone, whatsapp, booking_url, website_url,
       action_mode, action_instructions,
       is_sample_data, data_source_note,
       owner_id, status, admin_locked, hours_status,
       created_at, updated_at;`,
    [shop.id, ownerId]
  );

  const updatedShop = mapShopRow(result.rows[0]!);

  await logAudit({
    actorId: actor.id,
    actorUsername: actor.username,
    action: 'shop.resume',
    entityType: 'shop',
    entityId: updatedShop.id,
    beforeData: { status: shop.status },
    afterData: { status: updatedShop.status },
  });

  return updatedShop;
}

