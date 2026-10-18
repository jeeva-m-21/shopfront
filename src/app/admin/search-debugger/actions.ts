'use server';

import { requireAdmin } from '../../../auth/guards.js';
import { searchShops, type SearchShopsInput } from '../../../search/search-shops.js';
import { computeStageDiff, evaluateHFilters, type HFilterResult } from '../../../admin/search-debug.js';
import type { ShopCategory } from '../../../search/stage1.js';

export interface DebugCandidateItem {
  slug: string;
  name: string;
  category: string;
  locality: string;
  distanceKm: number | null;
  openNow: boolean | null;
  stage1Rank: number;
  stage2Rank: number;
  rankDiff: number;
  relevanceScore: number | null;
  hFilters: Record<'H1' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6', HFilterResult>;
}

export interface DebugSearchResult {
  success: boolean;
  error?: string;
  stage1Count?: number;
  stage2Count?: number;
  reranked?: boolean;
  jevModel?: string | null;
  fallbackReason?: string | null;
  locationResolved?: string | null;
  candidates?: DebugCandidateItem[];
  timings?: {
    totalMs: number;
  };
}

export async function runSearchDebuggerAction(input: {
  query?: string;
  locality?: string;
  category?: string;
  maxPriceInr?: number;
  openNow?: boolean;
  showSampleData?: boolean;
}): Promise<DebugSearchResult> {
  await requireAdmin();

  const startTime = Date.now();

  const searchInput: SearchShopsInput = {
    query: input.query || undefined,
    locality: input.locality || undefined,
    category: (input.category || undefined) as ShopCategory | undefined,
    max_price_inr: input.maxPriceInr,
    open_now: input.openNow,
    show_sample_data: input.showSampleData ?? false,
    limit: 20,
  };

  // 1. Run full search with Stage 2
  const result = await searchShops(searchInput, 'web');

  if (!result.success) {
    return {
      success: false,
      error: `${result.error.code}: ${result.error.message}`,
    };
  }

  const stage2Shops = result.data.shops;

  // 2. Compute baseline stage 1 ordering (ordered by baseline rank before Jev rerank)
  // Stage 1 shops before Jev reranking can be sorted by baseline_rank or distance
  const stage1Shops = [...stage2Shops].sort((a, b) => {
    // If distance available, sort by distance, else name
    if (a.distance_km !== null && b.distance_km !== null) {
      return a.distance_km - b.distance_km;
    }
    return a.name.localeCompare(b.name);
  });

  const rankDiffs = computeStageDiff(stage1Shops, stage2Shops);

  const candidates: DebugCandidateItem[] = stage2Shops.map((shop, idx) => {
    const diff = rankDiffs.find((d) => d.slug === shop.slug) || {
      stage1Rank: idx + 1,
      stage2Rank: idx + 1,
      rankDiff: 0,
    };

    const hFilters = evaluateHFilters(shop as unknown as Record<string, unknown>, {
      category: input.category,
      max_price_inr: input.maxPriceInr,
      open_now: input.openNow,
    });

    return {
      slug: shop.slug,
      name: shop.name,
      category: shop.category,
      locality: shop.locality,
      distanceKm: shop.distance_km,
      openNow: shop.open_now,
      stage1Rank: diff.stage1Rank,
      stage2Rank: diff.stage2Rank,
      rankDiff: diff.rankDiff,
      relevanceScore: shop.relevance_score,
      hFilters,
    };
  });

  return {
    success: true,
    stage1Count: result.data.candidate_count,
    stage2Count: stage2Shops.length,
    reranked: result.data.reranked,
    jevModel: result.data.jev_model,
    fallbackReason: result.data.fallback_reason,
    locationResolved: result.data.location_resolved?.name || null,
    candidates,
    timings: {
      totalMs: Date.now() - startTime,
    },
  };
}
