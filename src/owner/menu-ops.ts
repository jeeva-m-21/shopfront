import { query } from '../db.js';
import { logAudit } from '../audit.js';
import { getOwnerShop } from './shop-ops.js';
import type { PriceType } from '../domain/pricing.js';

export type ItemKind = 'product' | 'service';
export type DietType = 'veg' | 'non_veg' | 'vegan' | 'egg';

export class ItemNotFoundError extends Error {
  readonly status = 404;
  constructor(message = 'Item not found') {
    super(message);
    this.name = 'ItemNotFoundError';
  }
}

export interface CatalogItemRecord {
  id: string;
  shop_id: string;
  group_name: string;
  name: string;
  description: string | null;
  kind: ItemKind;
  price_type: PriceType;
  price_inr: number | null;
  price_max_inr: number | null;
  duration_min: number | null;
  diet: DietType | null;
  tags: string[];
  available: boolean;
  sort_order: number;
  search_text: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateOwnerMenuItemParams {
  ownerId: string;
  group_name: string;
  name: string;
  description?: string | null;
  kind: ItemKind;
  price_type: PriceType;
  price_inr?: number | null;
  price_max_inr?: number | null;
  duration_min?: number | null;
  diet?: DietType | null;
  tags?: string[];
  available?: boolean;
  sort_order?: number;
  actor: { id: string; username: string };
}

export interface UpdateOwnerMenuItemParams {
  ownerId: string;
  itemId: string;
  group_name: string;
  name: string;
  description?: string | null;
  kind: ItemKind;
  price_type: PriceType;
  price_inr?: number | null;
  price_max_inr?: number | null;
  duration_min?: number | null;
  diet?: DietType | null;
  tags?: string[];
  available?: boolean;
  sort_order?: number;
  actor: { id: string; username: string };
}

function normalizeAndValidateItem(
  params: {
    group_name: string;
    name: string;
    description?: string | null;
    kind: ItemKind;
    price_type: PriceType;
    price_inr?: number | null;
    price_max_inr?: number | null;
    duration_min?: number | null;
    diet?: DietType | null;
    tags?: string[];
  },
  shopCategory: string
): {
  group_name: string;
  name: string;
  description: string | null;
  kind: ItemKind;
  price_type: PriceType;
  price_inr: number | null;
  price_max_inr: number | null;
  duration_min: number | null;
  diet: DietType | null;
  tags: string[];
} {
  const group_name = params.group_name.trim();
  if (group_name.length < 2 || group_name.length > 50) {
    throw new Error('Group name must be between 2 and 50 characters.');
  }

  const name = params.name.trim();
  if (name.length < 2 || name.length > 80) {
    throw new Error('Item name must be between 2 and 80 characters.');
  }

  const description = params.description ? params.description.trim() : null;
  if (description && description.length > 300) {
    throw new Error('Description must be at most 300 characters.');
  }

  if (params.kind !== 'product' && params.kind !== 'service') {
    throw new Error(`Invalid item kind '${params.kind}'.`);
  }

  // Price validation
  let price_inr: number | null = null;
  let price_max_inr: number | null = null;

  switch (params.price_type) {
    case 'on_request':
      price_inr = null;
      price_max_inr = null;
      break;

    case 'fixed':
    case 'starting_from':
      if (params.price_inr == null || !Number.isInteger(params.price_inr) || params.price_inr < 0 || params.price_inr > 1000000) {
        throw new Error('Price must be an integer between 0 and 1,000,000 INR.');
      }
      price_inr = params.price_inr;
      price_max_inr = null;
      break;

    case 'range':
      if (params.price_inr == null || !Number.isInteger(params.price_inr) || params.price_inr < 0 || params.price_inr > 1000000) {
        throw new Error('Price must be an integer between 0 and 1,000,000 INR.');
      }
      if (params.price_max_inr == null || !Number.isInteger(params.price_max_inr) || params.price_max_inr < params.price_inr || params.price_max_inr > 1000000) {
        throw new Error('Maximum price must be an integer greater than or equal to price and at most 1,000,000 INR.');
      }
      price_inr = params.price_inr;
      price_max_inr = params.price_max_inr;
      break;

    default:
      throw new Error(`Invalid price type '${String(params.price_type)}'.`);
  }

  // Duration validation
  let duration_min: number | null = null;
  if (params.duration_min != null) {
    if (params.kind !== 'service') {
      throw new Error('Duration may only be set for service items.');
    }
    if (!Number.isInteger(params.duration_min) || params.duration_min < 5 || params.duration_min > 480) {
      throw new Error('Duration must be between 5 and 480 minutes.');
    }
    duration_min = params.duration_min;
  }

  // Diet validation
  let diet: DietType | null = null;
  if (params.diet) {
    if (shopCategory !== 'food_beverage') {
      throw new Error('Diet may only be set for food and beverage items.');
    }
    const validDiets: DietType[] = ['veg', 'non_veg', 'vegan', 'egg'];
    if (!validDiets.includes(params.diet)) {
      throw new Error(`Invalid diet type '${params.diet}'.`);
    }
    diet = params.diet;
  }

  // Tags validation
  let tags: string[] = [];
  if (params.tags && Array.isArray(params.tags)) {
    tags = params.tags
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    if (tags.length > 10) {
      throw new Error('At most 10 tags are allowed.');
    }

    for (const tag of tags) {
      if (tag.length > 30) {
        throw new Error(`Tag '${tag}' exceeds 30 characters limit.`);
      }
    }
  }

  return {
    group_name,
    name,
    description,
    kind: params.kind,
    price_type: params.price_type,
    price_inr,
    price_max_inr,
    duration_min,
    diet,
    tags,
  };
}

interface RawCatalogItemRow {
  id: string;
  shop_id: string;
  group_name: string;
  name: string;
  description: string | null;
  kind: ItemKind;
  price_type: PriceType;
  price_inr: number | null;
  price_max_inr: number | null;
  duration_min: number | null;
  diet: DietType | null;
  tags: string[];
  available: boolean;
  sort_order: number;
  search_text: string;
  created_at: Date;
  updated_at: Date;
}

function mapItemRow(row: RawCatalogItemRow): CatalogItemRecord {
  return {
    id: row.id,
    shop_id: row.shop_id,
    group_name: row.group_name,
    name: row.name,
    description: row.description,
    kind: row.kind,
    price_type: row.price_type,
    price_inr: row.price_inr,
    price_max_inr: row.price_max_inr,
    duration_min: row.duration_min,
    diet: row.diet,
    tags: row.tags ?? [],
    available: row.available,
    sort_order: Number(row.sort_order),
    search_text: row.search_text,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

export async function listOwnerMenuItems(ownerId: string) {
  const shop = await getOwnerShop(ownerId);

  const result = await query<RawCatalogItemRow>(
    `SELECT 
       id, shop_id, group_name, name, description, kind,
       price_type, price_inr, price_max_inr, duration_min, diet,
       tags, available, sort_order, search_text, created_at, updated_at
     FROM catalog_items
     WHERE shop_id = $1
     ORDER BY group_name ASC, sort_order ASC, name ASC;`,
    [shop.id]
  );

  return {
    shop,
    items: result.rows.map(mapItemRow),
  };
}

export async function createOwnerMenuItem(params: CreateOwnerMenuItemParams): Promise<CatalogItemRecord> {
  const shop = await getOwnerShop(params.ownerId);

  // Check 100-item ceiling
  const countRes = await query<{ count: string }>(
    `SELECT COUNT(*)::int as count FROM catalog_items WHERE shop_id = $1;`,
    [shop.id]
  );
  const currentCount = Number(countRes.rows[0]?.count ?? 0);
  if (currentCount >= 100) {
    throw new Error('Menu limit reached (100 items)');
  }

  const normalized = normalizeAndValidateItem(params, shop.category);
  const available = params.available ?? true;
  const sort_order = params.sort_order ?? 0;

  const result = await query<RawCatalogItemRow>(
    `INSERT INTO catalog_items (
       shop_id, group_name, name, description, kind,
       price_type, price_inr, price_max_inr, duration_min,
       diet, tags, available, sort_order
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING 
       id, shop_id, group_name, name, description, kind,
       price_type, price_inr, price_max_inr, duration_min, diet,
       tags, available, sort_order, search_text, created_at, updated_at;`,
    [
      shop.id,
      normalized.group_name,
      normalized.name,
      normalized.description,
      normalized.kind,
      normalized.price_type,
      normalized.price_inr,
      normalized.price_max_inr,
      normalized.duration_min,
      normalized.diet,
      normalized.tags,
      available,
      sort_order,
    ]
  );

  const row = result.rows[0]!;
  const createdItem = mapItemRow(row);

  await logAudit({
    actorId: params.actor.id,
    actorUsername: params.actor.username,
    action: 'item.create',
    entityType: 'catalog_item',
    entityId: createdItem.id,
    afterData: {
      name: createdItem.name,
      group_name: createdItem.group_name,
      kind: createdItem.kind,
      price_type: createdItem.price_type,
      price_inr: createdItem.price_inr,
      available: createdItem.available,
    },
  });

  return createdItem;
}

export async function updateOwnerMenuItem(params: UpdateOwnerMenuItemParams): Promise<CatalogItemRecord> {
  const shop = await getOwnerShop(params.ownerId);

  // Check item exists for this shop
  const existingRes = await query<RawCatalogItemRow>(
    `SELECT * FROM catalog_items WHERE id = $1 AND shop_id = $2;`,
    [params.itemId, shop.id]
  );

  const existingRow = existingRes.rows[0];
  if (!existingRow) {
    throw new ItemNotFoundError();
  }

  const currentItem = mapItemRow(existingRow);
  const normalized = normalizeAndValidateItem(params, shop.category);
  const targetAvailable = params.available ?? currentItem.available;

  // D13 Invariant: live shop must keep at least 1 available item
  if (shop.status === 'live' && currentItem.available && !targetAvailable) {
    const availCountRes = await query<{ count: string }>(
      `SELECT COUNT(*)::int as count FROM catalog_items WHERE shop_id = $1 AND available = TRUE;`,
      [shop.id]
    );
    const availableCount = Number(availCountRes.rows[0]?.count ?? 0);
    if (availableCount <= 1) {
      throw new Error('A live shop needs at least one available item. Pause your listing first.');
    }
  }

  const sort_order = params.sort_order ?? currentItem.sort_order;

  const result = await query<RawCatalogItemRow>(
    `UPDATE catalog_items
     SET group_name = $1,
         name = $2,
         description = $3,
         kind = $4,
         price_type = $5,
         price_inr = $6,
         price_max_inr = $7,
         duration_min = $8,
         diet = $9,
         tags = $10,
         available = $11,
         sort_order = $12
     WHERE id = $13 AND shop_id = $14
     RETURNING 
       id, shop_id, group_name, name, description, kind,
       price_type, price_inr, price_max_inr, duration_min, diet,
       tags, available, sort_order, search_text, created_at, updated_at;`,
    [
      normalized.group_name,
      normalized.name,
      normalized.description,
      normalized.kind,
      normalized.price_type,
      normalized.price_inr,
      normalized.price_max_inr,
      normalized.duration_min,
      normalized.diet,
      normalized.tags,
      targetAvailable,
      sort_order,
      currentItem.id,
      shop.id,
    ]
  );

  const updatedItem = mapItemRow(result.rows[0]!);

  await logAudit({
    actorId: params.actor.id,
    actorUsername: params.actor.username,
    action: 'item.update',
    entityType: 'catalog_item',
    entityId: updatedItem.id,
    beforeData: {
      name: currentItem.name,
      group_name: currentItem.group_name,
      kind: currentItem.kind,
      price_type: currentItem.price_type,
      price_inr: currentItem.price_inr,
      available: currentItem.available,
    },
    afterData: {
      name: updatedItem.name,
      group_name: updatedItem.group_name,
      kind: updatedItem.kind,
      price_type: updatedItem.price_type,
      price_inr: updatedItem.price_inr,
      available: updatedItem.available,
    },
  });

  return updatedItem;
}

export async function toggleOwnerMenuItemAvailable(
  ownerId: string,
  itemId: string,
  available: boolean,
  actor: { id: string; username: string }
): Promise<CatalogItemRecord> {
  const shop = await getOwnerShop(ownerId);

  const existingRes = await query<RawCatalogItemRow>(
    `SELECT * FROM catalog_items WHERE id = $1 AND shop_id = $2;`,
    [itemId, shop.id]
  );

  const existingRow = existingRes.rows[0];
  if (!existingRow) {
    throw new ItemNotFoundError();
  }

  const currentItem = mapItemRow(existingRow);

  // Invariant D13: live shop cannot toggle off the last available item
  if (shop.status === 'live' && currentItem.available && !available) {
    const availCountRes = await query<{ count: string }>(
      `SELECT COUNT(*)::int as count FROM catalog_items WHERE shop_id = $1 AND available = TRUE;`,
      [shop.id]
    );
    const availableCount = Number(availCountRes.rows[0]?.count ?? 0);
    if (availableCount <= 1) {
      throw new Error('A live shop needs at least one available item. Pause your listing first.');
    }
  }

  const result = await query<RawCatalogItemRow>(
    `UPDATE catalog_items
     SET available = $1
     WHERE id = $2 AND shop_id = $3
     RETURNING 
       id, shop_id, group_name, name, description, kind,
       price_type, price_inr, price_max_inr, duration_min, diet,
       tags, available, sort_order, search_text, created_at, updated_at;`,
    [available, itemId, shop.id]
  );

  const updatedItem = mapItemRow(result.rows[0]!);

  await logAudit({
    actorId: actor.id,
    actorUsername: actor.username,
    action: 'item.update',
    entityType: 'catalog_item',
    entityId: updatedItem.id,
    beforeData: { available: currentItem.available },
    afterData: { available: updatedItem.available },
  });

  return updatedItem;
}

export async function deleteOwnerMenuItem(
  ownerId: string,
  itemId: string,
  actor: { id: string; username: string }
): Promise<void> {
  const shop = await getOwnerShop(ownerId);

  const existingRes = await query<RawCatalogItemRow>(
    `SELECT * FROM catalog_items WHERE id = $1 AND shop_id = $2;`,
    [itemId, shop.id]
  );

  const existingRow = existingRes.rows[0];
  if (!existingRow) {
    throw new ItemNotFoundError();
  }

  const currentItem = mapItemRow(existingRow);

  // Invariant D13: live shop cannot delete the last available item
  if (shop.status === 'live' && currentItem.available) {
    const availCountRes = await query<{ count: string }>(
      `SELECT COUNT(*)::int as count FROM catalog_items WHERE shop_id = $1 AND available = TRUE;`,
      [shop.id]
    );
    const availableCount = Number(availCountRes.rows[0]?.count ?? 0);
    if (availableCount <= 1) {
      throw new Error('A live shop needs at least one available item. Pause your listing first.');
    }
  }

  await query(`DELETE FROM catalog_items WHERE id = $1 AND shop_id = $2;`, [itemId, shop.id]);

  await logAudit({
    actorId: actor.id,
    actorUsername: actor.username,
    action: 'item.delete',
    entityType: 'catalog_item',
    entityId: currentItem.id,
    beforeData: {
      name: currentItem.name,
      group_name: currentItem.group_name,
      price_inr: currentItem.price_inr,
      available: currentItem.available,
    },
  });
}
