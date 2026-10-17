import { query, withTransaction } from '../db.js';
import { isInServiceArea } from '../config.js';
import { logAudit } from '../audit.js';

export type ShopCategory = 'repair_service' | 'salon_wellness' | 'food_beverage';
export type ShopStatus = 'draft' | 'live' | 'paused';
export type HoursStatus = 'unknown' | 'set';
export type ActionMode = 'whatsapp' | 'external_url' | 'phone_only';

export interface AdminShopRecord {
  id: string;
  slug: string;
  name: string;
  category: ShopCategory;
  description: string;
  address: string;
  locality_id: number;
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
  owner_id: string | null;
  status: ShopStatus;
  admin_locked: boolean;
  hours_status: HoursStatus;
  created_at: Date;
  updated_at: Date;
}

export interface AdminShopListItem {
  id: string;
  slug: string;
  name: string;
  category: ShopCategory;
  address: string;
  locality_id: number;
  locality_name: string;
  status: ShopStatus;
  admin_locked: boolean;
  hours_status: HoursStatus;
  is_sample_data: boolean;
  created_at: Date;
  updated_at: Date;
  owner_id: string | null;
  owner_username: string | null;
  owner_display_name: string | null;
  available_items_count: number;
  total_items_count: number;
}

export interface CreateAdminShopParams {
  name: string;
  slug: string;
  category: ShopCategory;
  description: string;
  address: string;
  locality_id: number;
  latitude: number;
  longitude: number;
  phone: string;
  whatsapp?: string | null;
  booking_url?: string | null;
  website_url?: string | null;
  action_mode: ActionMode;
  action_instructions?: string | null;
  is_sample_data: boolean;
  data_source_note?: string | null;
  owner_id?: string | null;
  actor: { id?: string | null; username: string };
}

export interface UpdateAdminShopParams {
  shopId: string;
  name?: string;
  slug?: string;
  category?: ShopCategory;
  description?: string;
  address?: string;
  locality_id?: number;
  latitude?: number;
  longitude?: number;
  phone?: string;
  whatsapp?: string | null;
  booking_url?: string | null;
  website_url?: string | null;
  action_mode?: ActionMode;
  action_instructions?: string | null;
  is_sample_data?: boolean;
  data_source_note?: string | null;
  owner_id?: string | null;
  actor: { id?: string | null; username: string };
}

const SLUG_REGEX = /^[a-z0-9-]{3,60}$/;
const PHONE_REGEX = /^\+91\d{10}$/;
const WHATSAPP_REGEX = /^\+91[6-9]\d{9}$/;
const URL_REGEX = /^https:\/\/\S+$/;

function validateShopFields(params: {
  name?: string;
  slug?: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  whatsapp?: string | null;
  booking_url?: string | null;
  website_url?: string | null;
  action_mode?: ActionMode;
  action_instructions?: string | null;
  is_sample_data?: boolean;
  data_source_note?: string | null;
}) {
  if (params.name !== undefined && (params.name.length < 2 || params.name.length > 80)) {
    throw new Error('Shop name must be between 2 and 80 characters.');
  }

  if (params.slug !== undefined && !SLUG_REGEX.test(params.slug)) {
    throw new Error(`Invalid slug '${params.slug}'. Slugs must match ^[a-z0-9-]{3,60}$.`);
  }

  if (params.description !== undefined && (params.description.length < 10 || params.description.length > 500)) {
    throw new Error('Description must be between 10 and 500 characters.');
  }

  if (params.address !== undefined && (params.address.length < 5 || params.address.length > 200)) {
    throw new Error('Address must be between 5 and 200 characters.');
  }

  if (params.latitude !== undefined && params.longitude !== undefined) {
    if (!isInServiceArea(params.latitude, params.longitude)) {
      throw new Error(`Coordinates outside Chennai service area (${params.latitude}, ${params.longitude}).`);
    }
  }

  if (params.phone !== undefined && !PHONE_REGEX.test(params.phone)) {
    throw new Error(`Invalid phone number '${params.phone}'. Expected Indian format +91XXXXXXXXXX.`);
  }

  if (params.whatsapp && !WHATSAPP_REGEX.test(params.whatsapp)) {
    throw new Error(`Invalid WhatsApp number '${params.whatsapp}'. Expected +91 followed by 10 digits starting with 6-9.`);
  }

  if (params.booking_url && !URL_REGEX.test(params.booking_url)) {
    throw new Error(`Invalid booking URL '${params.booking_url}'. Must begin with https://.`);
  }

  if (params.website_url && !URL_REGEX.test(params.website_url)) {
    throw new Error(`Invalid website URL '${params.website_url}'. Must begin with https://.`);
  }

  if (params.action_mode === 'whatsapp' && !params.whatsapp) {
    throw new Error('WhatsApp number is required when action mode is whatsapp.');
  }

  if (params.action_mode === 'external_url' && !params.booking_url) {
    throw new Error('Booking URL is required when action mode is external_url.');
  }

  if (params.action_instructions && params.action_instructions.length > 200) {
    throw new Error('Action instructions must be at most 200 characters.');
  }

  if (params.is_sample_data && !params.data_source_note) {
    throw new Error('data_source_note is required when is_sample_data is true.');
  }
}

/**
 * Creates a new shop in 'draft' status with 'unknown' hours status.
 */
export async function createAdminShop(
  params: CreateAdminShopParams
): Promise<AdminShopRecord> {
  validateShopFields(params);

  const result = await query<AdminShopRecord>(
    `INSERT INTO shops (
       name, slug, category, description, address, locality_id,
       location, phone, whatsapp, booking_url, website_url,
       action_mode, action_instructions, is_sample_data, data_source_note,
       owner_id, status, admin_locked, hours_status
     ) VALUES (
       $1, $2, $3, $4, $5, $6,
       ST_SetSRID(ST_MakePoint($7, $8), 4326),
       $9, $10, $11, $12,
       $13, $14, $15, $16,
       $17, 'draft', FALSE, 'unknown'
     ) RETURNING 
       id, slug, name, category, description, address, locality_id,
       ST_Y(location::geometry) AS latitude, ST_X(location::geometry) AS longitude,
       phone, whatsapp, booking_url, website_url, action_mode, action_instructions,
       is_sample_data, data_source_note, owner_id, status, admin_locked, hours_status,
       created_at, updated_at;`,
    [
      params.name.trim(),
      params.slug.trim().toLowerCase(),
      params.category,
      params.description.trim(),
      params.address.trim(),
      params.locality_id,
      params.longitude, // PostGIS ST_MakePoint(lng, lat)
      params.latitude,
      params.phone.trim(),
      params.whatsapp?.trim() || null,
      params.booking_url?.trim() || null,
      params.website_url?.trim() || null,
      params.action_mode,
      params.action_instructions?.trim() || null,
      params.is_sample_data,
      params.data_source_note?.trim() || null,
      params.owner_id || null,
    ]
  );

  const shop = result.rows[0];
  if (!shop) {
    throw new Error('Failed to create shop record.');
  }

  await logAudit({
    actorId: params.actor.id,
    actorUsername: params.actor.username,
    action: 'shop.create',
    entityType: 'shop',
    entityId: shop.id,
    afterData: {
      id: shop.id,
      slug: shop.slug,
      name: shop.name,
      status: shop.status,
      category: shop.category,
    },
  });

  return shop;
}

/**
 * Updates shop metadata in a transaction with row lock and audit logging.
 */
export async function updateAdminShop(
  params: UpdateAdminShopParams
): Promise<AdminShopRecord> {
  validateShopFields(params);

  return withTransaction(async (client) => {
    const prevRes = await client.query<AdminShopRecord>(
      `SELECT 
         id, slug, name, category, description, address, locality_id,
         ST_Y(location::geometry) AS latitude, ST_X(location::geometry) AS longitude,
         phone, whatsapp, booking_url, website_url, action_mode, action_instructions,
         is_sample_data, data_source_note, owner_id, status, admin_locked, hours_status
       FROM shops WHERE id = $1 FOR UPDATE;`,
      [params.shopId]
    );

    const prev = prevRes.rows[0];
    if (!prev) {
      throw new Error(`Shop with ID '${params.shopId}' not found.`);
    }

    const updated = {
      name: params.name !== undefined ? params.name.trim() : prev.name,
      slug: params.slug !== undefined ? params.slug.trim().toLowerCase() : prev.slug,
      category: params.category ?? prev.category,
      description: params.description !== undefined ? params.description.trim() : prev.description,
      address: params.address !== undefined ? params.address.trim() : prev.address,
      locality_id: params.locality_id ?? prev.locality_id,
      latitude: params.latitude ?? prev.latitude,
      longitude: params.longitude ?? prev.longitude,
      phone: params.phone !== undefined ? params.phone.trim() : prev.phone,
      whatsapp: params.whatsapp !== undefined ? (params.whatsapp?.trim() || null) : prev.whatsapp,
      booking_url: params.booking_url !== undefined ? (params.booking_url?.trim() || null) : prev.booking_url,
      website_url: params.website_url !== undefined ? (params.website_url?.trim() || null) : prev.website_url,
      action_mode: params.action_mode ?? prev.action_mode,
      action_instructions:
        params.action_instructions !== undefined
          ? (params.action_instructions?.trim() || null)
          : prev.action_instructions,
      is_sample_data: params.is_sample_data !== undefined ? params.is_sample_data : prev.is_sample_data,
      data_source_note:
        params.data_source_note !== undefined
          ? (params.data_source_note?.trim() || null)
          : prev.data_source_note,
      owner_id: params.owner_id !== undefined ? (params.owner_id || null) : prev.owner_id,
    };

    validateShopFields(updated);

    const res = await client.query<AdminShopRecord>(
      `UPDATE shops
       SET name = $1,
           slug = $2,
           category = $3,
           description = $4,
           address = $5,
           locality_id = $6,
           location = ST_SetSRID(ST_MakePoint($7, $8), 4326),
           phone = $9,
           whatsapp = $10,
           booking_url = $11,
           website_url = $12,
           action_mode = $13,
           action_instructions = $14,
           is_sample_data = $15,
           data_source_note = $16,
           owner_id = $17
       WHERE id = $18
       RETURNING 
         id, slug, name, category, description, address, locality_id,
         ST_Y(location::geometry) AS latitude, ST_X(location::geometry) AS longitude,
         phone, whatsapp, booking_url, website_url, action_mode, action_instructions,
         is_sample_data, data_source_note, owner_id, status, admin_locked, hours_status,
         created_at, updated_at;`,
      [
        updated.name,
        updated.slug,
        updated.category,
        updated.description,
        updated.address,
        updated.locality_id,
        updated.longitude,
        updated.latitude,
        updated.phone,
        updated.whatsapp,
        updated.booking_url,
        updated.website_url,
        updated.action_mode,
        updated.action_instructions,
        updated.is_sample_data,
        updated.data_source_note,
        updated.owner_id,
        params.shopId,
      ]
    );

    const updatedShop = res.rows[0]!;

    await logAudit({
      actorId: params.actor.id,
      actorUsername: params.actor.username,
      action: 'shop.update',
      entityType: 'shop',
      entityId: params.shopId,
      beforeData: prev as unknown as Record<string, unknown>,
      afterData: updatedShop as unknown as Record<string, unknown>,
      client,
    });

    return updatedShop;
  });
}

/**
 * Transitions shop to 'live' status.
 * Enforces invariant: shop must have at least 1 available catalog item (PRD A5.1).
 */
export async function makeShopLive(params: {
  shopId: string;
  actor: { id?: string | null; username: string };
}): Promise<AdminShopRecord> {
  return withTransaction(async (client) => {
    const shopRes = await client.query<AdminShopRecord>(
      `SELECT * FROM shops WHERE id = $1 FOR UPDATE;`,
      [params.shopId]
    );

    const shop = shopRes.rows[0];
    if (!shop) {
      throw new Error(`Shop with ID '${params.shopId}' not found.`);
    }

    const itemsCountRes = await client.query<{ count: string }>(
      `SELECT COUNT(*) FROM catalog_items WHERE shop_id = $1 AND available = TRUE;`,
      [params.shopId]
    );

    const availableCount = parseInt(itemsCountRes.rows[0]?.count ?? '0', 10);
    if (availableCount < 1) {
      throw new Error('Add at least one available menu item first');
    }

    const updateRes = await client.query<AdminShopRecord>(
      `UPDATE shops
       SET status = 'live', admin_locked = FALSE
       WHERE id = $1
       RETURNING 
         id, slug, name, category, description, address, locality_id,
         ST_Y(location::geometry) AS latitude, ST_X(location::geometry) AS longitude,
         phone, whatsapp, booking_url, website_url, action_mode, action_instructions,
         is_sample_data, data_source_note, owner_id, status, admin_locked, hours_status,
         created_at, updated_at;`,
      [params.shopId]
    );

    const liveShop = updateRes.rows[0]!;

    await logAudit({
      actorId: params.actor.id,
      actorUsername: params.actor.username,
      action: 'shop.make_live',
      entityType: 'shop',
      entityId: params.shopId,
      beforeData: { status: shop.status, admin_locked: shop.admin_locked },
      afterData: { status: 'live', admin_locked: false },
      client,
    });

    return liveShop;
  });
}

/**
 * Transitions shop to 'paused' status and sets admin_locked = TRUE (PRD A5.2).
 */
export async function pauseShop(params: {
  shopId: string;
  actor: { id?: string | null; username: string };
}): Promise<AdminShopRecord> {
  return withTransaction(async (client) => {
    const shopRes = await client.query<AdminShopRecord>(
      `SELECT * FROM shops WHERE id = $1 FOR UPDATE;`,
      [params.shopId]
    );

    const shop = shopRes.rows[0];
    if (!shop) {
      throw new Error(`Shop with ID '${params.shopId}' not found.`);
    }

    const updateRes = await client.query<AdminShopRecord>(
      `UPDATE shops
       SET status = 'paused', admin_locked = TRUE
       WHERE id = $1
       RETURNING 
         id, slug, name, category, description, address, locality_id,
         ST_Y(location::geometry) AS latitude, ST_X(location::geometry) AS longitude,
         phone, whatsapp, booking_url, website_url, action_mode, action_instructions,
         is_sample_data, data_source_note, owner_id, status, admin_locked, hours_status,
         created_at, updated_at;`,
      [params.shopId]
    );

    const pausedShop = updateRes.rows[0]!;

    await logAudit({
      actorId: params.actor.id,
      actorUsername: params.actor.username,
      action: 'shop.pause',
      entityType: 'shop',
      entityId: params.shopId,
      beforeData: { status: shop.status, admin_locked: shop.admin_locked },
      afterData: { status: 'paused', admin_locked: true },
      client,
    });

    return pausedShop;
  });
}

/**
 * Permanently deletes shop with slug confirmation (PRD A5.3).
 */
export async function deleteShop(params: {
  shopId: string;
  confirmationSlug: string;
  actor: { id?: string | null; username: string };
}): Promise<void> {
  await withTransaction(async (client) => {
    const shopRes = await client.query<AdminShopRecord>(
      `SELECT id, slug, name FROM shops WHERE id = $1 FOR UPDATE;`,
      [params.shopId]
    );

    const shop = shopRes.rows[0];
    if (!shop) {
      throw new Error(`Shop with ID '${params.shopId}' not found.`);
    }

    if (shop.slug !== params.confirmationSlug.trim().toLowerCase()) {
      throw new Error(
        `Shop slug confirmation mismatch: expected '${shop.slug}', received '${params.confirmationSlug}'`
      );
    }

    await client.query(`DELETE FROM shops WHERE id = $1;`, [params.shopId]);

    await logAudit({
      actorId: params.actor.id,
      actorUsername: params.actor.username,
      action: 'shop.delete',
      entityType: 'shop',
      entityId: params.shopId,
      beforeData: { id: shop.id, slug: shop.slug, name: shop.name },
      client,
    });
  });
}

/**
 * Lists shops for admin dashboard with localities, owners, and catalog stats.
 */
export async function listAdminShops(): Promise<AdminShopListItem[]> {
  const result = await query<{
    id: string;
    slug: string;
    name: string;
    category: ShopCategory;
    address: string;
    locality_id: number;
    locality_name: string;
    status: ShopStatus;
    admin_locked: boolean;
    hours_status: HoursStatus;
    is_sample_data: boolean;
    created_at: Date;
    updated_at: Date;
    owner_id: string | null;
    owner_username: string | null;
    owner_display_name: string | null;
    available_items_count: string;
    total_items_count: string;
  }>(
    `SELECT 
       s.id, s.slug, s.name, s.category, s.address, s.locality_id,
       l.name AS locality_name,
       s.status, s.admin_locked, s.hours_status, s.is_sample_data,
       s.created_at, s.updated_at,
       u.id AS owner_id, u.username AS owner_username, u.display_name AS owner_display_name,
       COUNT(c.id) FILTER (WHERE c.available = TRUE) AS available_items_count,
       COUNT(c.id) AS total_items_count
     FROM shops s
     JOIN localities l ON l.id = s.locality_id
     LEFT JOIN users u ON u.id = s.owner_id
     LEFT JOIN catalog_items c ON c.shop_id = s.id
     GROUP BY s.id, l.name, u.id, u.username, u.display_name
     ORDER BY s.updated_at DESC;`
  );

  return result.rows.map((r) => ({
    ...r,
    available_items_count: parseInt(r.available_items_count, 10),
    total_items_count: parseInt(r.total_items_count, 10),
  }));
}

/**
 * Fetches single shop record by ID for admin detail and editing views.
 */
export async function getAdminShopById(shopId: string): Promise<AdminShopRecord | null> {
  const result = await query<AdminShopRecord>(
    `SELECT 
       id, slug, name, category, description, address, locality_id,
       ST_Y(location::geometry) AS latitude, ST_X(location::geometry) AS longitude,
       phone, whatsapp, booking_url, website_url, action_mode, action_instructions,
       is_sample_data, data_source_note, owner_id, status, admin_locked, hours_status,
       created_at, updated_at
     FROM shops
     WHERE id = $1;`,
    [shopId]
  );

  return result.rows[0] || null;
}
