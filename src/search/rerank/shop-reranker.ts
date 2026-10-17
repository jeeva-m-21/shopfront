import { parseConfig } from '@/config';
import {
  buildJevState,
  callJevDecisionsApi,
  JevError,
  JevFailureReason,
  JEV_DEFAULT_QUESTION,
} from './jev-client';
import type { Stage1ShopCandidate } from '../stage1';

export type RerankCandidate = Stage1ShopCandidate & {
  relevance_score?: number | null;
  expected_score?: number | null;
};

export interface RerankShopsOptions<T extends Stage1ShopCandidate = Stage1ShopCandidate> {
  query: string;
  candidates: T[];
  startTime: number;
  question?: string;
}

export interface RerankShopsResult<T extends Stage1ShopCandidate = Stage1ShopCandidate> {
  reranked: boolean;
  fallback_reason: JevFailureReason | null;
  shops: (T & { relevance_score?: number | null; expected_score?: number | null })[];
  jev_ms: number | null;
}

/**
 * Orchestrates Stage 2 Jev reranking over Stage 1 candidates with strict latency budget,
 * parallel execution, and all-or-nothing fail-open fallback per PRD Section 12.3 & Architecture 5.5.
 */
export async function rerankShops<T extends Stage1ShopCandidate = Stage1ShopCandidate>(
  options: RerankShopsOptions<T>
): Promise<RerankShopsResult<T>> {
  const { query, candidates, startTime, question } = options;
  const config = parseConfig();

  // 1. Gate condition: query must be non-empty and >= 2 candidates
  if (!query || query.trim() === '' || candidates.length < 2) {
    return {
      reranked: false,
      fallback_reason: 'not_applicable',
      shops: candidates,
      jev_ms: null,
    };
  }

  // 2. Gate condition: feature flag & API key
  if (!config.RERANK_ENABLED || !config.JEV_API_KEY || !config.JEV_MODEL) {
    return {
      reranked: false,
      fallback_reason: 'disabled',
      shops: candidates,
      jev_ms: null,
    };
  }

  // 3. Gate condition: budget calculation
  const elapsedMs = Date.now() - startTime;
  const jevTimeoutMs = Math.min(
    config.JEV_TIMEOUT_MS,
    config.TOTAL_BUDGET_MS - elapsedMs - 30
  );

  if (jevTimeoutMs < 150) {
    return {
      reranked: false,
      fallback_reason: 'budget',
      shops: candidates,
      jev_ms: null,
    };
  }

  // 4. Parallel dispatch with shared AbortController
  const jevStart = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), jevTimeoutMs);

  try {
    const scores = await Promise.all(
      candidates.map(async (candidate) => {
        const state = buildJevState(query, candidate);
        const result = await callJevDecisionsApi({
          baseUrl: config.JEV_API_BASE_URL,
          apiKey: config.JEV_API_KEY,
          model: config.JEV_MODEL,
          question: question ?? JEV_DEFAULT_QUESTION,
          state,
          signal: controller.signal,
        });
        return {
          candidate,
          expectedScore: result.expectedScore,
        };
      })
    );

    clearTimeout(timer);
    const jevMs = Date.now() - jevStart;

    // Attach expectedScore and 2-decimal rounded relevance_score
    const rerankedShops: (T & {
      expected_score?: number | null;
      relevance_score?: number | null;
    })[] = scores.map(({ candidate, expectedScore }) => ({
      ...candidate,
      expected_score: expectedScore,
      relevance_score: Math.round(expectedScore * 100) / 100,
    }));

    // Sort descending by expectedScore rounded to 4 decimals, tie-breaking by baseline_rank ASC
    rerankedShops.sort((a, b) => {
      const scoreA = Math.round((a.expected_score ?? 0) * 10000) / 10000;
      const scoreB = Math.round((b.expected_score ?? 0) * 10000) / 10000;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return a.baseline_rank - b.baseline_rank;
    });

    return {
      reranked: true,
      fallback_reason: null,
      shops: rerankedShops,
      jev_ms: jevMs,
    };
  } catch (err: unknown) {
    clearTimeout(timer);
    const jevMs = Date.now() - jevStart;

    let fallbackReason: JevFailureReason = 'http_error';
    if (err instanceof JevError) {
      fallbackReason = err.reason;
    } else if (
      (err instanceof Error && err.name === 'AbortError') ||
      controller.signal.aborted
    ) {
      fallbackReason = 'timeout';
    }

    // Fail open: log warning, return Stage 1 order with reranked = false
    console.warn(
      `[rerankShops] Stage 2 reranker failed with reason='${fallbackReason}'. Failing open to Stage 1.`
    );

    return {
      reranked: false,
      fallback_reason: fallbackReason,
      shops: candidates,
      jev_ms: jevMs,
    };
  }
}
