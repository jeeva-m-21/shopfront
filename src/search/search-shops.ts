import { z } from 'zod';
import { isInServiceArea, parseConfig } from '../config.js';
import { resolveLocality, CHENNAI_LOCALITIES } from '../domain/localities.js';
import { formatPriceDisplay, computePriceRange } from '../domain/pricing.js';
import {
  executeStage1,
  generateRelaxationHints,
  type ShopCategory,
  type RelaxationHint,
} from './stage1.js';
import { rerankShops } from './rerank/shop-reranker.js';
import { writeSearchLog } from './telemetry.js';

export interface SearchShopsInput {
  query?: string;
  locality?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  category?: ShopCategory;
  max_price_inr?: number;
  open_now?: boolean;
  limit?: number;
  show_sample_data?: boolean;
}

const searchShopsSchema = z.object({
  query: z.string().max(200, 'Query must be at most 200 characters').optional(),
  locality: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  radius_km: z.number().min(0.5).max(25).optional(),
  category: z.enum(['repair_service', 'salon_wellness', 'food_beverage']).optional(),
  max_price_inr: z.number().int().min(1).max(1000000).optional(),
  open_now: z.boolean().optional(),
  limit: z.number().int().min(1).max(10).optional(),
  show_sample_data: z.boolean().optional(),
});

export type SearchErrorCode =
  | 'invalid_input'
  | 'location_required'
  | 'locality_not_found'
  | 'outside_service_area'
  | 'internal_error';

export interface SearchError {
  code: SearchErrorCode;
  message: string;
  data?: Record<string, unknown>;
}

export interface MatchingItemSummary {
  id: string;
  name: string;
  price_display: string;
  duration_min: number | null;
}

export interface SearchShopResult {
  slug: string;
  name: string;
  is_sample_data: boolean;
  category: ShopCategory;
  locality: string;
  distance_km: number | null;
  open_now: boolean | null;
  hours_status: 'unknown' | 'set';
  price_range_inr: [number, number] | null;
  relevance_score: number | null;
  matching_items: MatchingItemSummary[];
  menu_updated_at: string | null;
  action_mode: 'whatsapp' | 'external_url' | 'phone_only';
}

export interface SearchShopsSuccess {
  reranked: boolean;
  jev_model: string | null;
  fallback_reason: string | null;
  location_resolved: {
    name: string;
    lat: number;
    lng: number;
    radius_km: number;
  } | null;
  location_warning: string | null;
  candidate_count: number;
  shops: SearchShopResult[];
  relaxation_hints: RelaxationHint[];
}

export type SearchShopsResult =
  | { success: true; data: SearchShopsSuccess }
  | { success: false; error: SearchError };

export async function searchShops(
  rawInput: SearchShopsInput,
  channel: 'mcp' | 'web' = 'web'
): Promise<SearchShopsResult> {
  const startTime = Date.now();
  let localityId: number | null = null;

  // 1. Validate basic schema via Zod
  const parseResult = searchShopsSchema.safeParse(rawInput);
  if (!parseResult.success) {
    const errorMsg = parseResult.error.errors.map((e) => e.message).join('; ');
    await writeSearchLog({
      channel,
      tool: 'find_shops',
      query_text: rawInput.query ?? null,
      category: rawInput.category ?? null,
      error_code: 'invalid_input',
      total_ms: Date.now() - startTime,
    });
    return {
      success: false,
      error: {
        code: 'invalid_input',
        message: `Invalid input: ${errorMsg}`,
      },
    };
  }

  const input = parseResult.data;

  // 2. Conflicting location parameters check
  const hasLocality = input.locality !== undefined && input.locality.trim() !== '';
  const hasLat = input.lat !== undefined;
  const hasLng = input.lng !== undefined;

  if (hasLocality && (hasLat || hasLng)) {
    await writeSearchLog({
      channel,
      tool: 'find_shops',
      query_text: input.query ?? null,
      category: input.category ?? null,
      error_code: 'invalid_input',
      total_ms: Date.now() - startTime,
    });
    return {
      success: false,
      error: {
        code: 'invalid_input',
        message: 'Cannot provide both locality and lat/lng coordinates.',
      },
    };
  }

  if ((hasLat && !hasLng) || (!hasLat && hasLng)) {
    await writeSearchLog({
      channel,
      tool: 'find_shops',
      query_text: input.query ?? null,
      category: input.category ?? null,
      error_code: 'invalid_input',
      total_ms: Date.now() - startTime,
    });
    return {
      success: false,
      error: {
        code: 'invalid_input',
        message: 'Both lat and lng coordinates must be provided together.',
      },
    };
  }

  // 3. "near me" check
  const queryText = input.query || '';
  const isNearMe = /\bnear\s+me\b/i.test(queryText);
  if (isNearMe && !hasLocality && !(hasLat && hasLng)) {
    await writeSearchLog({
      channel,
      tool: 'find_shops',
      query_text: input.query ?? null,
      category: input.category ?? null,
      error_code: 'location_required',
      total_ms: Date.now() - startTime,
    });
    return {
      success: false,
      error: {
        code: 'location_required',
        message:
          'Ask the customer which Chennai area they are in, then call again with locality.',
        data: {
          localities: CHENNAI_LOCALITIES.map((l) => l.name),
        },
      },
    };
  }

  // 4. Resolve locality or validate coordinates
  let anchor: { lat: number; lng: number } | null = null;
  let locationResolved: { name: string; lat: number; lng: number; radius_km: number } | null = null;
  let locationWarning: string | null = null;
  const radiusKm = input.radius_km ?? 5;

  if (hasLocality && input.locality) {
    const res = resolveLocality(input.locality);
    if (!res.success) {
      await writeSearchLog({
        channel,
        tool: 'find_shops',
        query_text: input.query ?? null,
        category: input.category ?? null,
        error_code: 'locality_not_found',
        total_ms: Date.now() - startTime,
      });
      return {
        success: false,
        error: {
          code: 'locality_not_found',
          message: `Locality '${input.locality}' not found.`,
          data: {
            suggestions: res.suggestions,
          },
        },
      };
    }
    anchor = { lat: res.locality.lat, lng: res.locality.lng };
    localityId = res.locality.id;
    locationResolved = {
      name: res.locality.name,
      lat: res.locality.lat,
      lng: res.locality.lng,
      radius_km: radiusKm,
    };
  } else if (hasLat && hasLng && input.lat !== undefined && input.lng !== undefined) {
    if (!isInServiceArea(input.lat, input.lng)) {
      await writeSearchLog({
        channel,
        tool: 'find_shops',
        query_text: input.query ?? null,
        category: input.category ?? null,
        error_code: 'outside_service_area',
        total_ms: Date.now() - startTime,
      });
      return {
        success: false,
        error: {
          code: 'outside_service_area',
          message: 'Coordinates outside Chennai service area (12.75-13.30 N, 79.95-80.40 E).',
        },
      };
    }
    anchor = { lat: input.lat, lng: input.lng };
    locationResolved = {
      name: 'Custom Coordinates',
      lat: input.lat,
      lng: input.lng,
      radius_km: radiusKm,
    };
  } else {
    locationWarning =
      'No location provided; showing results across Chennai. Specify a locality like Anna Nagar or Adyar to narrow by distance.';
  }

  // 5. Stage 1 retrieval
  try {
    const stage1Start = Date.now();
    const stage1Candidates = await executeStage1({
      query: input.query,
      category: input.category,
      anchor,
      radiusKm,
      maxPriceInr: input.max_price_inr,
      openNow: input.open_now ?? false,
      showSampleData: input.show_sample_data,
    });
    const stage1Ms = Date.now() - stage1Start;

    // 6. Stage 2 Reranking
    const rerankResult = await rerankShops({
      query: input.query || '',
      candidates: stage1Candidates,
      startTime,
    });

    const candidates = rerankResult.shops;
    const reranked = rerankResult.reranked;
    const fallbackReason = rerankResult.fallback_reason;
    const jevMs = rerankResult.jev_ms;
    const config = parseConfig();
    const jevModel = reranked ? config.JEV_MODEL : null;

    const limit = input.limit ?? 5;
    const topShops = candidates.slice(0, limit);

    // Map candidate items to response structure
    const mappedShops: SearchShopResult[] = topShops.map((shop) => {
      const matchingItems: MatchingItemSummary[] = shop.top_items.slice(0, 3).map((item) => ({
        id: item.id,
        name: item.name,
        price_display: formatPriceDisplay(item.price_type, item.price_inr, item.price_max_inr),
        duration_min: item.duration_min,
      }));

      const priceRange = computePriceRange(
        shop.top_items.map((i) => ({
          price_type: i.price_type,
          price_inr: i.price_inr,
          price_max_inr: i.price_max_inr,
        }))
      );

      return {
        slug: shop.slug,
        name: shop.name,
        is_sample_data: shop.is_sample_data,
        category: shop.category,
        locality: shop.locality_name,
        distance_km: shop.distance_km != null ? Math.round(shop.distance_km * 10) / 10 : null,
        open_now: shop.open_now,
        hours_status: shop.hours_status,
        price_range_inr: priceRange,
        relevance_score: shop.relevance_score ?? null,
        matching_items: matchingItems,
        menu_updated_at: shop.menu_updated_at ? shop.menu_updated_at.toISOString() : null,
        action_mode: shop.action_mode,
      };
    });

    // 7. Compute relaxation hints if 0 results and location present
    let relaxationHints: RelaxationHint[] = [];
    if (topShops.length === 0 && anchor) {
      relaxationHints = await generateRelaxationHints({
        query: input.query,
        category: input.category,
        anchor,
        radiusKm,
        maxPriceInr: input.max_price_inr,
        openNow: input.open_now ?? false,
        showSampleData: input.show_sample_data,
      });
    }

    const totalMs = Date.now() - startTime;

    // 8. Write telemetry log
    await writeSearchLog({
      channel,
      tool: 'find_shops',
      query_text: input.query ?? null,
      locality_id: localityId,
      category: input.category ?? null,
      shop_id: null,
      candidate_count: stage1Candidates.length,
      result_count: topShops.length,
      reranked,
      jev_model: jevModel,
      fallback_reason: fallbackReason,
      error_code: null,
      stage1_ms: stage1Ms,
      jev_ms: jevMs,
      total_ms: totalMs,
    });

    return {
      success: true,
      data: {
        reranked,
        jev_model: jevModel,
        fallback_reason: fallbackReason,
        location_resolved: locationResolved,
        location_warning: locationWarning,
        candidate_count: stage1Candidates.length,
        shops: mappedShops,
        relaxation_hints: relaxationHints,
      },
    };
  } catch (err) {
    console.error('[searchShops] Pipeline execution error:', err);
    await writeSearchLog({
      channel,
      tool: 'find_shops',
      query_text: input.query ?? null,
      locality_id: localityId,
      category: input.category ?? null,
      error_code: 'internal_error',
      total_ms: Date.now() - startTime,
    });
    return {
      success: false,
      error: {
        code: 'internal_error',
        message: 'An unexpected error occurred during search retrieval.',
      },
    };
  }
}
