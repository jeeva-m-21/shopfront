import { query } from '../../db.js';
import { getConfig } from '../../config.js';
import { formatPriceDisplay, type PriceType } from '../../domain/pricing.js';

export interface GetCatalogInput {
  shop_slug: string;
  kind?: 'product' | 'service';
  cursor?: string;
}

export interface CatalogItemResult {
  id: string;
  name: string;
  description: string | null;
  kind: 'product' | 'service';
  price_type: PriceType;
  price_inr: number | null;
  price_max_inr: number | null;
  price_display: string;
  duration_min: number | null;
  diet: string | null;
  tags: string[];
}

export interface CatalogGroupResult {
  group_name: string;
  items: CatalogItemResult[];
}

export interface GetCatalogResult {
  shop_slug: string;
  groups: CatalogGroupResult[];
  next_cursor: string | null;
  menu_updated_at: string | null;
}

interface RawCatalogItemRow {
  id: string;
  group_name: string;
  name: string;
  description: string | null;
  kind: 'product' | 'service';
  price_type: PriceType;
  price_inr: number | null;
  price_max_inr: number | null;
  duration_min: number | null;
  diet: string | null;
  tags: string[];
  sort_order: number;
}

export async function executeGetCatalog(
  input: GetCatalogInput
): Promise<{ success: true; data: GetCatalogResult } | { success: false; error: { code: string; message: string } }> {
  const config = getConfig();

  // 1. Resolve visible shop
  const shopRes = await query<{ id: string; category: string; menu_updated_at: Date | string | null }>(
    `SELECT
       s.id,
       s.category,
       (SELECT MAX(ci.updated_at) FROM catalog_items ci WHERE ci.shop_id = s.id AND ci.available = TRUE) AS menu_updated_at
     FROM shops s
     WHERE s.slug = $1
       AND s.status = 'live'
       AND (s.is_sample_data = FALSE OR $2 = TRUE);`,
    [input.shop_slug, config.SHOW_SAMPLE_DATA]
  );

  const shop = shopRes.rows[0];
  if (!shop) {
    return {
      success: false,
      error: { code: 'shop_not_found', message: 'Shop not found.' },
    };
  }

  // 2. Decode cursor if present
  let cursorSortOrder: number | null = null;
  let cursorName: string | null = null;
  let cursorId: string | null = null;

  if (input.cursor) {
    try {
      const decoded = Buffer.from(input.cursor, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded);
      // Support { sort_order, name, id } or { s, n, id }
      const s = parsed.sort_order ?? parsed.s;
      const n = parsed.name ?? parsed.n;
      const id = parsed.id;
      if (typeof s !== 'number' || typeof n !== 'string' || typeof id !== 'string') {
        throw new Error('Invalid cursor shape');
      }
      cursorSortOrder = s;
      cursorName = n;
      cursorId = id;
    } catch {
      return {
        success: false,
        error: { code: 'invalid_input', message: 'Invalid pagination cursor.' },
      };
    }
  }

  // 3. Query catalog items using keyset pagination
  const itemsRes = await query<RawCatalogItemRow>(
    `SELECT
       ci.id,
       ci.group_name,
       ci.name,
       ci.description,
       ci.kind,
       ci.price_type,
       ci.price_inr,
       ci.price_max_inr,
       ci.duration_min,
       ci.diet,
       ci.tags,
       ci.sort_order
     FROM catalog_items ci
     WHERE ci.shop_id = $1
       AND ci.available = TRUE
       AND ($2::item_kind IS NULL OR ci.kind = $2)
       AND (
         $3::integer IS NULL
         OR (ci.sort_order, ci.name, ci.id) > ($3::integer, $4::text, $5::uuid)
       )
     ORDER BY ci.sort_order ASC, ci.name ASC, ci.id ASC
     LIMIT 26;`,
    [shop.id, input.kind ?? null, cursorSortOrder, cursorName, cursorId]
  );

  const rows = itemsRes.rows;
  let nextCursor: string | null = null;
  let returnRows = rows;

  if (rows.length === 26) {
    const item25 = rows[24]!;
    nextCursor = Buffer.from(
      JSON.stringify({
        sort_order: item25.sort_order,
        name: item25.name,
        id: item25.id,
      })
    ).toString('base64');
    returnRows = rows.slice(0, 25);
  }

  // 4. Group items by group_name preserving appearance order
  const groupMap = new Map<string, CatalogItemResult[]>();
  for (const row of returnRows) {
    let group = groupMap.get(row.group_name);
    if (!group) {
      group = [];
      groupMap.set(row.group_name, group);
    }

    group.push({
      id: row.id,
      name: row.name,
      description: row.description ?? null,
      kind: row.kind,
      price_type: row.price_type,
      price_inr: row.price_inr != null ? Number(row.price_inr) : null,
      price_max_inr: row.price_max_inr != null ? Number(row.price_max_inr) : null,
      price_display: formatPriceDisplay(row.price_type, row.price_inr, row.price_max_inr),
      duration_min: row.kind === 'service' ? (row.duration_min != null ? Number(row.duration_min) : null) : null,
      diet: shop.category === 'food_beverage' ? (row.diet ?? null) : null,
      tags: Array.isArray(row.tags) ? row.tags : [],
    });
  }

  const groups: CatalogGroupResult[] = Array.from(groupMap.entries()).map(([group_name, items]) => ({
    group_name,
    items,
  }));

  return {
    success: true,
    data: {
      shop_slug: input.shop_slug,
      groups,
      next_cursor: nextCursor,
      menu_updated_at: shop.menu_updated_at ? new Date(shop.menu_updated_at).toISOString() : null,
    },
  };
}
