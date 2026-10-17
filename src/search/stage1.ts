import { withStatementTimeout } from '../db.js';
import { getConfig } from '../config.js';
import { normalizeSearchQuery } from '../domain/text.js';
import { evaluateOpenNow } from '../domain/hours.js';

export type ShopCategory = 'repair_service' | 'salon_wellness' | 'food_beverage';

export interface Stage1QueryParams {
  query?: string;
  category?: ShopCategory | null;
  anchor?: { lat: number; lng: number } | null;
  radiusKm?: number | null;
  maxPriceInr?: number | null;
  showSampleData?: boolean;
  limit?: number;
  matchThreshold?: number;
}

export interface SearchStage1Options extends Stage1QueryParams {
  openNow?: boolean;
  now?: Date;
}

export interface Stage1Candidate {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ShopCategory;
  is_sample_data: boolean;
  hours_status: 'unknown' | 'set';
  action_mode: 'whatsapp' | 'external_url' | 'phone_only';
  locality_name: string;
  distance_km: number | null;
  baseline_score: number;
  hours_json: Array<{ weekday: number; open_time: string; close_time: string }>;
  closures_json: Array<{ closed_on: string; reason: string | null }>;
}

export interface CandidateTopItem {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  price_type: 'fixed' | 'starting_from' | 'range' | 'on_request';
  price_inr: number | null;
  price_max_inr: number | null;
  duration_min: number | null;
  sort_order: number;
  item_sim: number;
  is_matching: boolean;
}

export interface Stage1ShopCandidate extends Stage1Candidate {
  baseline_rank: number;
  open_now: boolean | null;
  menu_updated_at: Date | null;
  top_items: CandidateTopItem[];
}

interface RawCandidateRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ShopCategory;
  is_sample_data: boolean;
  hours_status: 'unknown' | 'set';
  action_mode: 'whatsapp' | 'external_url' | 'phone_only';
  locality_name: string;
  distance_km: string | number | null;
  baseline_score: string | number;
  hours_json: Array<{ weekday: number; open_time: string; close_time: string }> | null;
  closures_json: Array<{ closed_on: string; reason: string | null }> | null;
}

interface RawItemsRow {
  shop_id: string;
  menu_updated_at: string | Date | null;
  top_items: CandidateTopItem[] | null;
}

const QUERY_1_SQL = `
WITH params AS (
  SELECT
    $1::text AS q,
    $2::boolean AS show_sample,
    CASE WHEN $3::text IS NOT NULL THEN $3::shop_category ELSE NULL END AS category,
    CASE WHEN $4::double precision IS NOT NULL AND $5::double precision IS NOT NULL
         THEN ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography
         ELSE NULL
    END AS anchor,
    $6::double precision AS radius_m,
    $7::integer AS max_price_inr,
    $8::real AS match_threshold
),
eligible_shops AS (
  SELECT
    s.id,
    s.slug,
    s.name,
    s.description,
    s.category,
    s.is_sample_data,
    s.hours_status,
    s.action_mode,
    l.name AS locality_name,
    CASE WHEN p.anchor IS NOT NULL
         THEN ST_Distance(s.location, p.anchor) / 1000.0
         ELSE NULL
    END AS distance_km,
    CASE WHEN p.q <> ''
         THEN GREATEST(
                similarity(lower(s.name || ' ' || s.description), p.q),
                word_similarity(p.q, lower(s.name || ' ' || s.description))
              )
         ELSE 0.0
    END AS shop_sim
  FROM shops s
  JOIN localities l ON l.id = s.locality_id
  CROSS JOIN params p
  WHERE s.status = 'live'                                                       -- H1
    AND (s.is_sample_data = FALSE OR p.show_sample = TRUE)                      -- H1
    AND (p.category IS NULL OR s.category = p.category)                         -- H2
    AND (p.anchor IS NULL OR ST_DWithin(s.location, p.anchor, p.radius_m))      -- H3
),
item_metrics AS (
  SELECT
    es.id AS shop_id,
    COUNT(ci.id) AS avail_count,
    MAX(
      CASE WHEN p.q <> ''
           THEN GREATEST(similarity(ci.search_text, p.q), word_similarity(p.q, ci.search_text))
           ELSE 0.0
      END
    ) AS max_item_sim,
    BOOL_OR(
      CASE WHEN p.q <> ''
           THEN to_tsvector('english', ci.search_text) @@ plainto_tsquery('english', p.q)
           ELSE FALSE
      END
    ) AS has_fts_match,
    BOOL_OR(
      CASE
        WHEN p.max_price_inr IS NULL THEN TRUE
        WHEN ci.price_type = 'on_request' OR ci.price_inr IS NULL THEN FALSE
        WHEN p.q = '' THEN ci.price_inr <= p.max_price_inr
        ELSE (
          GREATEST(similarity(ci.search_text, p.q), word_similarity(p.q, ci.search_text)) >= p.match_threshold
          OR to_tsvector('english', ci.search_text) @@ plainto_tsquery('english', p.q)
        ) AND ci.price_inr <= p.max_price_inr
      END
    ) AS passes_price_filter
  FROM eligible_shops es
  JOIN catalog_items ci ON ci.shop_id = es.id AND ci.available = TRUE
  CROSS JOIN params p
  GROUP BY es.id
),
scored_shops AS (
  SELECT
    es.*,
    LEAST(
      1.0,
      GREATEST(es.shop_sim, im.max_item_sim) + (CASE WHEN im.has_fts_match THEN 0.2 ELSE 0.0 END)
    ) AS text_score,
    CASE WHEN es.distance_km IS NOT NULL
         THEN 1.0 / (1.0 + es.distance_km)
         ELSE 0.0
    END AS distance_score
  FROM eligible_shops es
  JOIN item_metrics im ON im.shop_id = es.id
  CROSS JOIN params p
  WHERE im.avail_count >= 1                                                     -- H4
    AND im.passes_price_filter = TRUE                                           -- H5
)
SELECT
  ss.id,
  ss.slug,
  ss.name,
  ss.description,
  ss.category,
  ss.is_sample_data,
  ss.hours_status,
  ss.action_mode,
  ss.locality_name,
  ss.distance_km,
  CASE
    WHEN p.q <> '' AND p.anchor IS NOT NULL THEN (0.7 * ss.text_score) + (0.3 * ss.distance_score)
    WHEN p.q <> '' AND p.anchor IS NULL     THEN ss.text_score
    WHEN p.q = ''  AND p.anchor IS NOT NULL THEN ss.distance_score
    ELSE 0.0
  END AS baseline_score,
  COALESCE(
    (SELECT json_agg(json_build_object('weekday', sh.weekday, 'open_time', sh.open_time::text, 'close_time', sh.close_time::text))
     FROM shop_hours sh WHERE sh.shop_id = ss.id),
    '[]'::json
  ) AS hours_json,
  COALESCE(
    (SELECT json_agg(json_build_object('closed_on', sc.closed_on::text, 'reason', sc.reason))
     FROM shop_closures sc WHERE sc.shop_id = ss.id AND sc.closed_on >= CURRENT_DATE - 1),
    '[]'::json
  ) AS closures_json
FROM scored_shops ss
CROSS JOIN params p
ORDER BY baseline_score DESC, ss.distance_km ASC NULLS LAST, ss.slug ASC
LIMIT $9;
`;

const QUERY_2_SQL = `
SELECT
  s_id AS shop_id,
  (SELECT MAX(updated_at) FROM catalog_items WHERE shop_id = s_id AND available = TRUE) AS menu_updated_at,
  COALESCE(
    json_agg(item_row ORDER BY item_row.item_sim DESC, item_row.sort_order ASC, item_row.name ASC)
    FILTER (WHERE item_row.id IS NOT NULL),
    '[]'::json
  ) AS top_items
FROM unnest($1::uuid[]) AS s_id
LEFT JOIN LATERAL (
  SELECT
    ci.id,
    ci.name,
    ci.description,
    ci.tags,
    ci.price_type,
    ci.price_inr,
    ci.price_max_inr,
    ci.duration_min,
    ci.sort_order,
    CASE WHEN $2::text <> ''
         THEN GREATEST(similarity(ci.search_text, $2), word_similarity($2, ci.search_text))
         ELSE 0.0
    END AS item_sim,
    CASE WHEN $2::text <> ''
         THEN (
           GREATEST(similarity(ci.search_text, $2), word_similarity($2, ci.search_text)) >= $3::real
           OR to_tsvector('english', ci.search_text) @@ plainto_tsquery('english', $2)
         )
         ELSE TRUE
    END AS is_matching
  FROM catalog_items ci
  WHERE ci.shop_id = s_id AND ci.available = TRUE
  ORDER BY
    CASE WHEN $2::text <> ''
         THEN GREATEST(similarity(ci.search_text, $2), word_similarity($2, ci.search_text))
         ELSE 0.0
    END DESC,
    ci.sort_order ASC,
    ci.name ASC
  LIMIT 5
) item_row ON TRUE
GROUP BY s_id;
`;

export async function getCandidatePool(params: Stage1QueryParams): Promise<Stage1Candidate[]> {
  const config = getConfig();

  const q = normalizeSearchQuery(params.query);
  const showSample = params.showSampleData ?? config.SHOW_SAMPLE_DATA;
  const category = params.category ?? null;
  const anchorLng = params.anchor?.lng ?? null;
  const anchorLat = params.anchor?.lat ?? null;
  const radiusM = params.anchor ? (params.radiusKm != null ? params.radiusKm : 5) * 1000 : null;
  const maxPriceInr = params.maxPriceInr ?? null;
  const matchThreshold = params.matchThreshold ?? config.ITEM_MATCH_THRESHOLD;
  const limit = params.limit ?? config.CANDIDATE_POOL_SIZE;

  return withStatementTimeout(config.STAGE1_TIMEOUT_MS, async (client) => {
    const res = await client.query<RawCandidateRow>(QUERY_1_SQL, [
      q,
      showSample,
      category,
      anchorLng,
      anchorLat,
      radiusM,
      maxPriceInr,
      matchThreshold,
      limit,
    ]);

    return res.rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      category: row.category,
      is_sample_data: row.is_sample_data,
      hours_status: row.hours_status,
      action_mode: row.action_mode,
      locality_name: row.locality_name,
      distance_km: row.distance_km != null ? Number(row.distance_km) : null,
      baseline_score: Number(row.baseline_score),
      hours_json: Array.isArray(row.hours_json) ? row.hours_json : [],
      closures_json: Array.isArray(row.closures_json) ? row.closures_json : [],
    }));
  });
}

export async function fetchCandidateItems(
  candidateIds: string[],
  queryText: string,
  matchThreshold?: number
): Promise<Map<string, { menu_updated_at: Date | null; top_items: CandidateTopItem[] }>> {
  const result = new Map<string, { menu_updated_at: Date | null; top_items: CandidateTopItem[] }>();
  if (candidateIds.length === 0) {
    return result;
  }

  const config = getConfig();
  const q = normalizeSearchQuery(queryText);
  const threshold = matchThreshold ?? config.ITEM_MATCH_THRESHOLD;

  const rows = await withStatementTimeout(config.STAGE1_TIMEOUT_MS, async (client) => {
    const res = await client.query<RawItemsRow>(QUERY_2_SQL, [candidateIds, q, threshold]);
    return res.rows;
  });

  for (const row of rows) {
    result.set(row.shop_id, {
      menu_updated_at: row.menu_updated_at ? new Date(row.menu_updated_at) : null,
      top_items: Array.isArray(row.top_items)
        ? row.top_items.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description ?? null,
            tags: Array.isArray(item.tags) ? item.tags : [],
            price_type: item.price_type,
            price_inr: item.price_inr != null ? Number(item.price_inr) : null,
            price_max_inr: item.price_max_inr != null ? Number(item.price_max_inr) : null,
            duration_min: item.duration_min != null ? Number(item.duration_min) : null,
            sort_order: Number(item.sort_order),
            item_sim: Number(item.item_sim),
            is_matching: Boolean(item.is_matching),
          }))
        : [],
    });
  }

  return result;
}

export async function executeStage1(options: SearchStage1Options): Promise<Stage1ShopCandidate[]> {
  const config = getConfig();
  const candidates = await getCandidatePool(options);

  const now = options.now ?? new Date();

  // Evaluate H6 Open Now in Node.js IST context
  const scoredWithOpenNow = candidates.map((candidate) => ({
    candidate,
    openNow: evaluateOpenNow(
      candidate.hours_status,
      candidate.hours_json,
      candidate.closures_json,
      now
    ),
  }));

  // Apply H6 filter if openNow === true (excludes false and null)
  const filtered = options.openNow === true
    ? scoredWithOpenNow.filter((entry) => entry.openNow === true)
    : scoredWithOpenNow;

  // Slice to CANDIDATE_COUNT (10)
  const topCandidates = filtered.slice(0, config.CANDIDATE_COUNT);
  if (topCandidates.length === 0) {
    return [];
  }

  const topIds = topCandidates.map((entry) => entry.candidate.id);
  const itemsMap = await fetchCandidateItems(topIds, options.query ?? '', options.matchThreshold);

  return topCandidates.map((entry, index) => {
    const c = entry.candidate;
    const itemData = itemsMap.get(c.id);

    return {
      ...c,
      baseline_rank: index + 1,
      open_now: entry.openNow,
      menu_updated_at: itemData?.menu_updated_at ?? null,
      top_items: itemData?.top_items ?? [],
    };
  });
}

export interface RelaxationHint {
  constraint: 'radius' | 'max_price' | 'open_now' | 'category';
  relaxed_to: string;
  would_return: number;
}

export async function generateRelaxationHints(
  options: SearchStage1Options
): Promise<RelaxationHint[]> {
  // Triggered only when a location anchor is present (PRD 11.2, Architecture 5.4)
  if (!options.anchor) {
    return [];
  }

  const activeConstraints: Array<{
    constraint: 'radius' | 'max_price' | 'open_now' | 'category';
    relaxed_to: string;
    relaxedOptions: SearchStage1Options;
  }> = [];

  const currentRadius = options.radiusKm ?? 5;
  if (currentRadius < 25) {
    activeConstraints.push({
      constraint: 'radius',
      relaxed_to: '25 km',
      relaxedOptions: { ...options, radiusKm: 25 },
    });
  }

  if (options.maxPriceInr != null) {
    activeConstraints.push({
      constraint: 'max_price',
      relaxed_to: 'any price',
      relaxedOptions: { ...options, maxPriceInr: null },
    });
  }

  if (options.openNow === true) {
    activeConstraints.push({
      constraint: 'open_now',
      relaxed_to: 'all hours',
      relaxedOptions: { ...options, openNow: false },
    });
  }

  if (options.category != null) {
    activeConstraints.push({
      constraint: 'category',
      relaxed_to: 'all categories',
      relaxedOptions: { ...options, category: null },
    });
  }

  if (activeConstraints.length === 0) {
    return [];
  }

  const config = getConfig();

  const hintResults = await Promise.all(
    activeConstraints.map(async ({ constraint, relaxed_to, relaxedOptions }) => {
      const candidates = await getCandidatePool({
        ...relaxedOptions,
        limit: config.CANDIDATE_POOL_SIZE,
      });

      if (candidates.length === 0) {
        return null;
      }

      let count = candidates.length;
      if (relaxedOptions.openNow === true) {
        const now = relaxedOptions.now ?? new Date();
        count = candidates.filter(
          (c) => evaluateOpenNow(c.hours_status, c.hours_json, c.closures_json, now) === true
        ).length;
      }

      if (count > 0) {
        return {
          constraint,
          relaxed_to,
          would_return: count,
        };
      }
      return null;
    })
  );

  return hintResults.filter((h): h is RelaxationHint => h !== null);
}

