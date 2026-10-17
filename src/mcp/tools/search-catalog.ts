import { query } from '../../db.js';
import { getConfig } from '../../config.js';
import { formatPriceDisplay, type PriceType } from '../../domain/pricing.js';

export interface SearchCatalogInput {
  shop_slug: string;
  query: string;
  max_price_inr?: number;
  kind?: 'product' | 'service';
  limit?: number;
}

export interface SearchCatalogItemResult {
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
  similarity: number;
}

export interface SearchCatalogResult {
  shop_slug: string;
  items: SearchCatalogItemResult[];
}

interface RawSearchItemRow {
  id: string;
  name: string;
  description: string | null;
  kind: 'product' | 'service';
  price_type: PriceType;
  price_inr: number | null;
  price_max_inr: number | null;
  duration_min: number | null;
  diet: string | null;
  tags: string[];
  similarity: number | string;
}

export async function executeSearchCatalog(
  input: SearchCatalogInput
): Promise<{ success: true; data: SearchCatalogResult } | { success: false; error: { code: string; message: string } }> {
  // Validate query length: 2 to 100 characters per PRD 11.4
  const trimmedQuery = input.query ? input.query.trim() : '';
  if (trimmedQuery.length < 2 || trimmedQuery.length > 100) {
    return {
      success: false,
      error: { code: 'invalid_input', message: 'Query must be between 2 and 100 characters.' },
    };
  }

  const config = getConfig();

  // 1. Resolve visible shop
  const shopRes = await query<{ id: string; category: string }>(
    `SELECT s.id, s.category
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

  const limit = Math.min(20, Math.max(1, input.limit ?? 10));

  // 2. Query items matching query via trigram or FTS, filtered by price ceiling and kind
  const itemsRes = await query<RawSearchItemRow>(
    `SELECT
       ci.id,
       ci.name,
       ci.description,
       ci.kind,
       ci.price_type,
       ci.price_inr,
       ci.price_max_inr,
       ci.duration_min,
       ci.diet,
       ci.tags,
       GREATEST(similarity(ci.search_text, $2), word_similarity($2, ci.search_text)) AS similarity
     FROM catalog_items ci
     WHERE ci.shop_id = $1
       AND ci.available = TRUE
       AND (
         GREATEST(similarity(ci.search_text, $2), word_similarity($2, ci.search_text)) >= $3::real
         OR to_tsvector('english', ci.search_text) @@ plainto_tsquery('english', $2)
       )
       AND (
         $4::integer IS NULL
         OR (ci.price_type <> 'on_request' AND ci.price_inr IS NOT NULL AND ci.price_inr <= $4)
       )
       AND ($5::item_kind IS NULL OR ci.kind = $5)
     ORDER BY similarity DESC, ci.price_inr ASC NULLS LAST, ci.id ASC
     LIMIT $6;`,
    [
      shop.id,
      trimmedQuery.toLowerCase(),
      config.ITEM_MATCH_THRESHOLD,
      input.max_price_inr ?? null,
      input.kind ?? null,
      limit,
    ]
  );

  const items: SearchCatalogItemResult[] = itemsRes.rows.map((row) => ({
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
    similarity: Math.round(Number(row.similarity) * 100) / 100,
  }));

  return {
    success: true,
    data: {
      shop_slug: input.shop_slug,
      items,
    },
  };
}
