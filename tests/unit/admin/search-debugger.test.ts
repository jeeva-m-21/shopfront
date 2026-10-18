import { describe, it, expect } from 'vitest';
import { computeStageDiff, evaluateHFilters } from '@/admin/search-debug';

describe('Admin Search Engine Debugger (SPRINT-10.5)', () => {
  describe('computeStageDiff', () => {
    it('computes rank diffs correctly between Stage 1 SQL and Stage 2 Jev reranker', () => {
      const stage1 = [
        { slug: 'shop-alpha', name: 'Alpha Care' },
        { slug: 'shop-beta', name: 'Beta Repair' },
        { slug: 'shop-gamma', name: 'Gamma Store' },
      ] as any[];

      const stage2 = [
        { slug: 'shop-beta', name: 'Beta Repair', relevance_score: 2.9 },
        { slug: 'shop-alpha', name: 'Alpha Care', relevance_score: 2.1 },
        { slug: 'shop-gamma', name: 'Gamma Store', relevance_score: 1.0 },
      ] as any[];

      const diffs = computeStageDiff(stage1, stage2);

      // Beta moved from #2 to #1 -> +1
      const beta = diffs.find((d) => d.slug === 'shop-beta');
      expect(beta?.stage1Rank).toBe(2);
      expect(beta?.stage2Rank).toBe(1);
      expect(beta?.rankDiff).toBe(1);

      // Alpha moved from #1 to #2 -> -1
      const alpha = diffs.find((d) => d.slug === 'shop-alpha');
      expect(alpha?.stage1Rank).toBe(1);
      expect(alpha?.stage2Rank).toBe(2);
      expect(alpha?.rankDiff).toBe(-1);

      // Gamma stayed at #3 -> 0
      const gamma = diffs.find((d) => d.slug === 'shop-gamma');
      expect(gamma?.stage1Rank).toBe(3);
      expect(gamma?.stage2Rank).toBe(3);
      expect(gamma?.rankDiff).toBe(0);
    });
  });

  describe('evaluateHFilters', () => {
    it('evaluates H1-H6 hard criteria pass/fail breakdown', () => {
      const liveShop = {
        status: 'live',
        available_items_count: 5,
        category: 'repair_service',
        locality: 'Adyar',
        distance_km: 1.2,
        open_now: true,
      };

      const results = evaluateHFilters(liveShop, {
        category: 'repair_service',
        open_now: true,
      });

      expect(results.H1.passed).toBe(true);
      expect(results.H2.passed).toBe(true);
      expect(results.H3.passed).toBe(true);
      expect(results.H4.passed).toBe(true);
      expect(results.H5.passed).toBe(true);
      expect(results.H6.passed).toBe(true);
    });

    it('identifies H1 failure for paused or draft shops', () => {
      const pausedShop = {
        status: 'paused',
        available_items_count: 5,
        category: 'repair_service',
      };

      const results = evaluateHFilters(pausedShop, {});
      expect(results.H1.passed).toBe(false);
      expect(results.H1.reason).toContain('paused');
    });

    it('identifies H2 failure when shop has 0 available catalog items', () => {
      const emptyShop = {
        status: 'live',
        available_items_count: 0,
        category: 'repair_service',
      };

      const results = evaluateHFilters(emptyShop, {});
      expect(results.H2.passed).toBe(false);
      expect(results.H2.reason).toContain('0 available items');
    });
  });
});
