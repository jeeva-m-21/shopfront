import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rerankShops, RerankCandidate } from '@/search/rerank/shop-reranker';
import * as jevClient from '@/search/rerank/jev-client';

describe('Shop Reranker Orchestrator (SPRINT-5.2)', () => {
  const dummyCandidates: RerankCandidate[] = [
    {
      id: 'shop-1',
      slug: 'shop-one',
      name: 'Shop One',
      category: 'repair_service',
      description: 'First shop description',
      baseline_rank: 1,
      baseline_score: 0.9,
      locality_name: 'Adyar',
      distance_km: 1.2,
      open_now: true,
      hours_status: 'set',
      is_sample_data: false,
      action_mode: 'whatsapp',
      hours_json: [],
      closures_json: [],
      top_items: [
        {
          id: 'item-1',
          name: 'Screen Repair',
          description: 'Phone screen',
          price_type: 'fixed',
          price_inr: 1500,
          price_max_inr: null,
          duration_min: 60,
          sort_order: 1,
          item_sim: 0.8,
          is_matching: true,
          tags: ['screen'],
        },
      ],
      menu_updated_at: new Date('2026-01-01T00:00:00Z'),
    },
    {
      id: 'shop-2',
      slug: 'shop-two',
      name: 'Shop Two',
      category: 'repair_service',
      description: 'Second shop description',
      baseline_rank: 2,
      baseline_score: 0.8,
      locality_name: 'Adyar',
      distance_km: 2.1,
      open_now: true,
      hours_status: 'set',
      is_sample_data: false,
      action_mode: 'whatsapp',
      hours_json: [],
      closures_json: [],
      top_items: [
        {
          id: 'item-2',
          name: 'Battery Replacement',
          description: 'Phone battery',
          price_type: 'fixed',
          price_inr: 800,
          price_max_inr: null,
          duration_min: 30,
          sort_order: 1,
          item_sim: 0.9,
          is_matching: true,
          tags: ['battery'],
        },
      ],
      menu_updated_at: new Date('2026-01-01T00:00:00Z'),
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.RERANK_ENABLED = 'true';
    process.env.JEV_API_KEY = 'test-api-key';
    process.env.JEV_MODEL = 'jev-1.13-20260917';
    process.env.JEV_TIMEOUT_MS = '450';
    process.env.TOTAL_BUDGET_MS = '700';
  });

  describe('Gate Conditions', () => {
    it('skips reranking with fallback_reason="not_applicable" when query is empty', async () => {
      const result = await rerankShops({
        query: '',
        candidates: dummyCandidates,
        startTime: Date.now(),
      });

      expect(result.reranked).toBe(false);
      expect(result.fallback_reason).toBe('not_applicable');
      expect(result.shops).toEqual(dummyCandidates);
    });

    it('skips reranking with fallback_reason="not_applicable" when candidates count < 2', async () => {
      const result = await rerankShops({
        query: 'screen repair',
        candidates: [dummyCandidates[0]!],
        startTime: Date.now(),
      });

      expect(result.reranked).toBe(false);
      expect(result.fallback_reason).toBe('not_applicable');
      expect(result.shops).toEqual([dummyCandidates[0]]);
    });

    it('skips reranking with fallback_reason="disabled" when RERANK_ENABLED is false', async () => {
      process.env.RERANK_ENABLED = 'false';

      const result = await rerankShops({
        query: 'screen repair',
        candidates: dummyCandidates,
        startTime: Date.now(),
      });

      expect(result.reranked).toBe(false);
      expect(result.fallback_reason).toBe('disabled');
      expect(result.shops).toEqual(dummyCandidates);
    });

    it('skips reranking with fallback_reason="disabled" when JEV_API_KEY is missing', async () => {
      delete process.env.JEV_API_KEY;

      const result = await rerankShops({
        query: 'screen repair',
        candidates: dummyCandidates,
        startTime: Date.now(),
      });

      expect(result.reranked).toBe(false);
      expect(result.fallback_reason).toBe('disabled');
      expect(result.shops).toEqual(dummyCandidates);
    });

    it('skips reranking with fallback_reason="budget" when jevTimeoutMs < 150', async () => {
      // TOTAL_BUDGET_MS = 700. If elapsed is 530ms, 700 - 530 - 30 = 140 < 150
      const startTime = Date.now() - 530;

      const result = await rerankShops({
        query: 'screen repair',
        candidates: dummyCandidates,
        startTime,
      });

      expect(result.reranked).toBe(false);
      expect(result.fallback_reason).toBe('budget');
      expect(result.shops).toEqual(dummyCandidates);
    });
  });

  describe('Successful Reranking & Tie-Breaking', () => {
    it('orders candidates by expectedScore DESC and formats relevance_score to 2 decimals', async () => {
      vi.spyOn(jevClient, 'callJevDecisionsApi').mockImplementation(async (opts) => {
        if (opts.state.shop.name === 'Shop One') {
          // Score = 1.0
          return {
            distribution: [0.1, 0.8, 0.1, 0.0],
            expectedScore: 1.0,
          };
        } else {
          // Shop Two: Score = 2.7
          return {
            distribution: [0.0, 0.0, 0.3, 0.7],
            expectedScore: 2.7,
          };
        }
      });

      const result = await rerankShops({
        query: 'battery replacement',
        candidates: dummyCandidates,
        startTime: Date.now(),
      });

      expect(result.reranked).toBe(true);
      expect(result.fallback_reason).toBeNull();
      expect(result.shops).toHaveLength(2);

      // Shop Two should be first because 2.7 > 1.0
      expect(result.shops[0]!.name).toBe('Shop Two');
      expect(result.shops[0]!.relevance_score).toBe(2.7);

      expect(result.shops[1]!.name).toBe('Shop One');
      expect(result.shops[1]!.relevance_score).toBe(1.0);
    });

    it('tie-breaks by baseline_rank ASC when expectedScore rounded to 4 decimals is identical', async () => {
      vi.spyOn(jevClient, 'callJevDecisionsApi').mockImplementation(async () => {
        return {
          distribution: [0.1, 0.2, 0.3, 0.4],
          expectedScore: 2.0,
        };
      });

      const result = await rerankShops({
        query: 'repair',
        candidates: dummyCandidates,
        startTime: Date.now(),
      });

      expect(result.reranked).toBe(true);
      expect(result.fallback_reason).toBeNull();
      // Tied scores: Shop One (baseline_rank 1) should stay before Shop Two (baseline_rank 2)
      expect(result.shops[0]!.name).toBe('Shop One');
      expect(result.shops[1]!.name).toBe('Shop Two');
    });
  });

  describe('Resilience & All-or-Nothing Fallback', () => {
    it('falls back to Stage 1 order with fallback_reason="timeout" if any candidate times out', async () => {
      vi.spyOn(jevClient, 'callJevDecisionsApi').mockImplementation(async (opts) => {
        if (opts.state.shop.name === 'Shop Two') {
          throw new jevClient.JevError('timeout', 'Request timed out');
        }
        return {
          distribution: [0.0, 0.0, 0.0, 1.0],
          expectedScore: 3.0,
        };
      });

      const result = await rerankShops({
        query: 'repair',
        candidates: dummyCandidates,
        startTime: Date.now(),
      });

      expect(result.reranked).toBe(false);
      expect(result.fallback_reason).toBe('timeout');
      expect(result.shops).toEqual(dummyCandidates);
      expect(result.shops[0]!.relevance_score).toBeUndefined();
    });

    it('falls back to Stage 1 order with fallback_reason="http_error" on HTTP 500', async () => {
      vi.spyOn(jevClient, 'callJevDecisionsApi').mockImplementation(async (opts) => {
        if (opts.state.shop.name === 'Shop One') {
          throw new jevClient.JevError('http_error', 'HTTP 500', 500);
        }
        return {
          distribution: [0.0, 0.0, 0.0, 1.0],
          expectedScore: 3.0,
        };
      });

      const result = await rerankShops({
        query: 'repair',
        candidates: dummyCandidates,
        startTime: Date.now(),
      });

      expect(result.reranked).toBe(false);
      expect(result.fallback_reason).toBe('http_error');
      expect(result.shops).toEqual(dummyCandidates);
    });

    it('falls back to Stage 1 order with fallback_reason="invalid_schema" on schema validation error', async () => {
      vi.spyOn(jevClient, 'callJevDecisionsApi').mockImplementation(async (opts) => {
        if (opts.state.shop.name === 'Shop Two') {
          throw new jevClient.JevError('invalid_schema', 'Invalid sum');
        }
        return {
          distribution: [0.0, 0.0, 0.0, 1.0],
          expectedScore: 3.0,
        };
      });

      const result = await rerankShops({
        query: 'repair',
        candidates: dummyCandidates,
        startTime: Date.now(),
      });

      expect(result.reranked).toBe(false);
      expect(result.fallback_reason).toBe('invalid_schema');
      expect(result.shops).toEqual(dummyCandidates);
    });
  });
});
