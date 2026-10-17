import { describe, it, expect } from 'vitest';
import {
  dcgAtK,
  idcgAtK,
  ndcgAtK,
  mrrAtK,
  recallAtK,
  mulberry32,
  bootstrapMeanDifferenceCI,
  cohensKappa,
} from '../../../eval/metrics';

describe('Evaluation Metrics (SPRINT-5.3)', () => {
  describe('NDCG@5', () => {
    it('computes exact hand-calculated DCG@5 and IDCG@5 for ideal ranking', () => {
      // Labels: [3, 2, 1, 0, 0]
      // DCG = (2^3-1)/log2(2) + (2^2-1)/log2(3) + (2^1-1)/log2(4) + 0 + 0
      //     = 7/1 + 3/1.58496250072 + 1/2
      //     = 7 + 1.89278926 + 0.5 = 9.39278926
      const labels = [3, 2, 1, 0, 0];
      const dcg = dcgAtK(labels, 5);
      const idcg = idcgAtK(labels, 5);

      expect(dcg).toBeCloseTo(9.392789, 4);
      expect(idcg).toBeCloseTo(9.392789, 4);
      expect(ndcgAtK(labels, 5)).toBeCloseTo(1.0, 4);
    });

    it('computes exact hand-calculated NDCG@5 for non-ideal ranking', () => {
      // Labels: [0, 1, 2, 3, 0]
      // DCG = 0 + (2^1-1)/log2(3) + (2^2-1)/log2(4) + (2^3-1)/log2(5) + 0
      //     = 0 + 1/1.5849625 + 3/2 + 7/2.321928 = 0.63092975 + 1.5 + 3.014736 = 5.1456658
      // Ideal labels: [3, 2, 1, 0, 0] -> IDCG = 9.39278926
      // NDCG = 5.1456658 / 9.39278926 = 0.54783
      const labels = [0, 1, 2, 3, 0];
      const dcg = dcgAtK(labels, 5);
      expect(dcg).toBeCloseTo(5.145666, 4);

      const ndcg = ndcgAtK(labels, 5);
      expect(ndcg).not.toBeNull();
      expect(ndcg!).toBeCloseTo(0.54783, 4);
    });

    it('returns null for queries where all candidates have label 0 (excluded per PRD 17.4)', () => {
      const allZeros = [0, 0, 0, 0, 0];
      expect(idcgAtK(allZeros, 5)).toBe(0);
      expect(ndcgAtK(allZeros, 5)).toBeNull();
    });
  });

  describe('MRR@5', () => {
    it('computes reciprocal rank 1.0 when first relevant (>=2) candidate is rank 1', () => {
      const labels = [2, 1, 0, 0, 0];
      expect(mrrAtK(labels, 5)).toBe(1.0);
    });

    it('computes reciprocal rank 0.5 when first relevant (>=2) candidate is rank 2', () => {
      const labels = [1, 3, 0, 0, 0];
      expect(mrrAtK(labels, 5)).toBe(0.5);
    });

    it('computes reciprocal rank 0.25 when first relevant (>=2) candidate is rank 4', () => {
      const labels = [1, 0, 0, 2, 0];
      expect(mrrAtK(labels, 5)).toBe(0.25);
    });

    it('returns 0.0 when no relevant candidate appears in top 5', () => {
      const labels = [1, 1, 0, 0, 0, 3]; // relevant at rank 6
      expect(mrrAtK(labels, 5)).toBe(0.0);
    });
  });

  describe('Recall@10', () => {
    it('computes fraction of benchmark-relevant items retrieved in top 10', () => {
      const top10 = ['shop-a', 'shop-b', 'shop-c'];
      const allRelevant = ['shop-a', 'shop-b', 'shop-c', 'shop-d', 'shop-e'];
      expect(recallAtK(top10, allRelevant, 10)).toBeCloseTo(3 / 5, 4);
    });

    it('returns 1.0 when there are no relevant items in the benchmark for that query', () => {
      expect(recallAtK(['shop-a'], [], 10)).toBe(1.0);
    });
  });

  describe('Mulberry32 & Bootstrap 95% Confidence Interval', () => {
    it('generates deterministic pseudorandom sequence for a fixed seed', () => {
      const rng1 = mulberry32(42);
      const rng2 = mulberry32(42);

      const seq1 = Array.from({ length: 5 }, () => rng1());
      const seq2 = Array.from({ length: 5 }, () => rng2());

      expect(seq1).toEqual(seq2);
      for (const val of seq1) {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });

    it('computes 95% bootstrap confidence interval with 10k resamples', () => {
      const diffs = [0.1, 0.2, 0.15, -0.05, 0.3, 0.25, 0.1, 0.05, 0.12, 0.18];
      const result = bootstrapMeanDifferenceCI(diffs, {
        resamples: 10000,
        seed: 12345,
      });

      expect(result.mean).toBeCloseTo(0.14, 4);
      expect(result.ciLower).toBeLessThan(result.mean);
      expect(result.ciUpper).toBeGreaterThan(result.mean);
      // Ensure repeat run with same seed gives exact same CI
      const repeatResult = bootstrapMeanDifferenceCI(diffs, {
        resamples: 10000,
        seed: 12345,
      });
      expect(result.ciLower).toBe(repeatResult.ciLower);
      expect(result.ciUpper).toBe(repeatResult.ciUpper);
    });
  });

  describe('Cohen\'s Kappa', () => {
    it('computes kappa 1.0 for perfect agreement', () => {
      const raterA = [0, 1, 2, 3, 2, 1, 0, 3];
      const raterB = [0, 1, 2, 3, 2, 1, 0, 3];
      const res = cohensKappa(raterA, raterB);
      expect(res.kappa).toBeCloseTo(1.0, 4);
      expect(res.percentAgreement).toBe(1.0);
    });

    it('computes correct kappa for known intermediate agreement', () => {
      // 10 samples
      // Agreement on 8, disagreement on 2
      const raterA = [1, 1, 2, 2, 3, 3, 0, 0, 1, 2];
      const raterB = [1, 1, 2, 2, 3, 3, 0, 0, 2, 1];
      const res = cohensKappa(raterA, raterB);
      expect(res.percentAgreement).toBe(0.8);
      expect(res.kappa).toBeGreaterThan(0.6);
      expect(res.kappa).toBeLessThan(1.0);
    });
  });
});
