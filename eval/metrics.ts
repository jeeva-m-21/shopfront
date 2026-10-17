/**
 * Pure evaluation metrics per PRD Section 17.4 and Architecture Section 8.
 * Computes NDCG@5, MRR@5, Recall@10, seeded Mulberry32 10k bootstrap CI, and Cohen's kappa.
 */

/**
 * Computes Discounted Cumulative Gain at rank K.
 * DCG@K = sum_{i=1..K} (2^rel_i - 1) / log2(i + 1)
 */
export function dcgAtK(labels: number[], k = 5): number {
  const topK = labels.slice(0, k);
  let sum = 0;
  for (let i = 0; i < topK.length; i++) {
    const rel = topK[i] ?? 0;
    const rank = i + 1;
    const numerator = Math.pow(2, rel) - 1;
    const denominator = Math.log2(rank + 1);
    sum += numerator / denominator;
  }
  return sum;
}

/**
 * Computes Ideal Discounted Cumulative Gain at rank K from ideal ordering of candidate set.
 */
export function idcgAtK(labels: number[], k = 5): number {
  const sorted = [...labels].sort((a, b) => b - a);
  return dcgAtK(sorted, k);
}

/**
 * Computes Normalized Discounted Cumulative Gain at rank K.
 * Returns null if IDCG is 0 (queries with no label >= 1 are excluded per PRD Section 17.4).
 */
export function ndcgAtK(labels: number[], k = 5): number | null {
  const idcg = idcgAtK(labels, k);
  if (idcg === 0) {
    return null;
  }
  const dcg = dcgAtK(labels, k);
  return dcg / idcg;
}

/**
 * Computes Mean Reciprocal Rank at rank K for candidates satisfying relevance threshold (default: >= 2).
 * MRR@K = 1 / rank of first candidate with label >= threshold in top K; 0 if none.
 */
export function mrrAtK(labels: number[], k = 5, threshold = 2): number {
  const topK = labels.slice(0, k);
  for (let i = 0; i < topK.length; i++) {
    const rel = topK[i] ?? 0;
    if (rel >= threshold) {
      return 1 / (i + 1);
    }
  }
  return 0;
}

/**
 * Computes Recall at rank K against all relevant benchmark shops satisfying query hard filters.
 * Returns 1.0 if there are no relevant shops in benchmark dataset.
 */
export function recallAtK(
  topKSlugs: string[],
  relevantSlugsInBenchmark: string[],
  k = 10
): number {
  if (relevantSlugsInBenchmark.length === 0) {
    return 1.0;
  }
  const retrievedSet = new Set(topKSlugs.slice(0, k));
  let matched = 0;
  for (const slug of relevantSlugsInBenchmark) {
    if (retrievedSet.has(slug)) {
      matched++;
    }
  }
  return matched / relevantSlugsInBenchmark.length;
}

/**
 * Fast, deterministic 32-bit PRNG (Mulberry32).
 */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BootstrapCIOptions {
  resamples?: number;
  seed?: number;
  alpha?: number;
}

export interface BootstrapCIResult {
  mean: number;
  ciLower: number;
  ciUpper: number;
}

/**
 * Computes 95% bootstrap confidence interval over difference values (B - A)
 * using 10,000 resamples and a fixed random seed.
 */
export function bootstrapMeanDifferenceCI(
  diffs: number[],
  options?: BootstrapCIOptions
): BootstrapCIResult {
  const n = diffs.length;
  if (n === 0) {
    return { mean: 0, ciLower: 0, ciUpper: 0 };
  }

  const mean = diffs.reduce((a, b) => a + b, 0) / n;
  const resamples = options?.resamples ?? 10000;
  const seed = options?.seed ?? 42;
  const alpha = options?.alpha ?? 0.05;
  const rng = mulberry32(seed);

  const means: number[] = new Array(resamples);
  for (let b = 0; b < resamples; b++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(rng() * n);
      sum += diffs[idx]!;
    }
    means[b] = sum / n;
  }

  means.sort((a, b) => a - b);
  const lowerIdx = Math.floor((alpha / 2) * resamples);
  const upperIdx = Math.floor((1 - alpha / 2) * resamples);

  const ciLower = means[Math.max(0, Math.min(lowerIdx, resamples - 1))]!;
  const ciUpper = means[Math.max(0, Math.min(upperIdx, resamples - 1))]!;

  return {
    mean,
    ciLower,
    ciUpper,
  };
}

export interface KappaResult {
  kappa: number;
  percentAgreement: number;
}

/**
 * Computes Cohen's kappa and percent agreement between two raters.
 */
export function cohensKappa(raterA: number[], raterB: number[]): KappaResult {
  if (raterA.length === 0 || raterA.length !== raterB.length) {
    throw new Error('Rater arrays must be non-empty and of equal length');
  }

  const n = raterA.length;
  let matches = 0;
  const categories = Array.from(new Set([...raterA, ...raterB]));
  const countA: Record<number, number> = {};
  const countB: Record<number, number> = {};

  for (const cat of categories) {
    countA[cat] = 0;
    countB[cat] = 0;
  }

  for (let i = 0; i < n; i++) {
    const a = raterA[i]!;
    const b = raterB[i]!;
    if (a === b) {
      matches++;
    }
    countA[a] = (countA[a] ?? 0) + 1;
    countB[b] = (countB[b] ?? 0) + 1;
  }

  const po = matches / n;
  let pe = 0;
  for (const cat of categories) {
    pe += ((countA[cat] ?? 0) / n) * ((countB[cat] ?? 0) / n);
  }

  if (Math.abs(1 - pe) < 1e-9) {
    return { kappa: 1.0, percentAgreement: po };
  }

  const kappa = (po - pe) / (1 - pe);
  return {
    kappa,
    percentAgreement: po,
  };
}
