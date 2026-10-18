export interface CandidateRankDiff {
  slug: string;
  name: string;
  stage1Rank: number;
  stage2Rank: number;
  rankDiff: number; // positive = promoted, negative = demoted, 0 = unchanged
  relevanceScore?: number | null;
}

export function computeStageDiff(
  stage1Shops: Array<{ slug: string; name: string }>,
  stage2Shops: Array<{ slug: string; name: string; relevance_score?: number | null }>
): CandidateRankDiff[] {
  const stage1Ranks = new Map<string, number>();
  stage1Shops.forEach((shop, index) => {
    stage1Ranks.set(shop.slug, index + 1);
  });

  return stage2Shops.map((shop, stage2Index) => {
    const stage2Rank = stage2Index + 1;
    const stage1Rank = stage1Ranks.get(shop.slug) ?? 999;
    const rankDiff = stage1Rank - stage2Rank;

    return {
      slug: shop.slug,
      name: shop.name,
      stage1Rank,
      stage2Rank,
      rankDiff,
      relevanceScore: shop.relevance_score,
    };
  });
}

export interface HFilterResult {
  passed: boolean;
  reason: string;
}

export function evaluateHFilters(
  shop: Record<string, unknown>,
  input: { category?: string; max_price_inr?: number; open_now?: boolean }
): Record<'H1' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6', HFilterResult> {
  const status = typeof shop.status === 'string' ? shop.status : 'live';
  const availableItems =
    typeof shop.available_items_count === 'number'
      ? shop.available_items_count
      : typeof shop.matching_items === 'object' && Array.isArray(shop.matching_items)
      ? shop.matching_items.length
      : 1;

  // H1: Shop is live
  const h1Passed = status === 'live';
  const H1: HFilterResult = {
    passed: h1Passed,
    reason: h1Passed ? 'Shop is published and live' : `Status is '${status}' (not live)`,
  };

  // H2: At least 1 available item
  const h2Passed = availableItems > 0;
  const H2: HFilterResult = {
    passed: h2Passed,
    reason: h2Passed ? `${availableItems} available items` : '0 available items on menu',
  };

  // H3: Category constraint
  const h3Passed = !input.category || shop.category === input.category;
  const H3: HFilterResult = {
    passed: h3Passed,
    reason: h3Passed ? 'Category match' : `Expected ${input.category}, got ${shop.category}`,
  };

  // H4: Locality / Distance constraint
  const H4: HFilterResult = {
    passed: true,
    reason:
      typeof shop.distance_km === 'number'
        ? `${shop.distance_km.toFixed(1)} km from query anchor`
        : 'Within Chennai service area',
  };

  // H5: Price ceiling constraint
  const priceRange = Array.isArray(shop.price_range_inr) ? shop.price_range_inr : null;
  const minPrice = priceRange ? (priceRange[0] as number) : null;
  const h5Passed =
    !input.max_price_inr || minPrice === null || minPrice <= input.max_price_inr;
  const H5: HFilterResult = {
    passed: h5Passed,
    reason: h5Passed
      ? 'Satisfies price ceiling'
      : `Minimum item price ₹${minPrice} exceeds max ₹${input.max_price_inr}`,
  };

  // H6: Open Now schedule constraint
  const h6Passed = !input.open_now || shop.open_now === true;
  const H6: HFilterResult = {
    passed: h6Passed,
    reason: h6Passed
      ? shop.open_now
        ? 'Open now in IST'
        : 'Schedule filter not requested'
      : 'Currently closed in IST',
  };

  return { H1, H2, H3, H4, H5, H6 };
}
