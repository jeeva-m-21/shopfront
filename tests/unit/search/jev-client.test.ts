import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  callJevDecisionsApi,
  buildJevState,
  validateAndExtractDistribution,
  computeExpectedScore,
  JevError,
  JEV_DEFAULT_QUESTION,
} from '@/search/rerank/jev-client';

describe('Jev Decisions API Client (SPRINT-5.1)', () => {
  describe('buildJevState', () => {
    it('truncates customer query to 200 chars and strips control characters', () => {
      const longQuery = 'laptop repair '.repeat(20) + '\x00\x1f\t\nend';
      const state = buildJevState(longQuery, {
        name: 'Test Shop',
        category: 'repair_service',
        description: 'Quality repair',
        top_items: [],
      });

      expect(state.customer_query.length).toBeLessThanOrEqual(200);
      expect(state.customer_query).not.toContain('\x00');
      expect(state.customer_query).not.toContain('\x1f');
      expect(state.customer_query).not.toContain('\t');
      expect(state.customer_query).not.toContain('\n');
    });

    it('truncates shop fields and caps items at 5 with item-level truncations', () => {
      const longName = 'A'.repeat(120);
      const longDesc = 'B'.repeat(500);
      const items = Array.from({ length: 8 }, (_, idx) => ({
        name: `Item ${idx} ` + 'C'.repeat(100),
        description: `Desc ${idx} ` + 'D'.repeat(250),
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6_overflow', 'E'.repeat(50)],
      }));

      const state = buildJevState('broken screen', {
        name: longName,
        category: 'repair_service',
        description: longDesc,
        top_items: items,
      });

      expect(state.shop.name.length).toBeLessThanOrEqual(80);
      expect(state.shop.description.length).toBeLessThanOrEqual(300);
      expect(state.shop.items).toHaveLength(5);

      for (const item of state.shop.items) {
        expect(item.name.length).toBeLessThanOrEqual(80);
        if (item.description) {
          expect(item.description.length).toBeLessThanOrEqual(160);
        }
        expect(item.tags.length).toBeLessThanOrEqual(5);
        for (const tag of item.tags) {
          expect(tag.length).toBeLessThanOrEqual(30);
        }
      }
    });

    it('never includes prices, coordinates, distances, or opening hours', () => {
      const candidate: any = {
        name: 'Safe Shop',
        category: 'salon_wellness',
        description: 'Clean salon',
        distance_km: 2.5,
        lat: 13.08,
        lng: 80.27,
        open_now: true,
        hours_status: 'set',
        top_items: [
          {
            name: 'Haircut',
            description: 'Standard cut',
            price_inr: 300,
            price_max_inr: 500,
            price_type: 'fixed',
            tags: ['hair'],
          },
        ],
      };

      const state = buildJevState('haircut', candidate);
      const serialized = JSON.stringify(state);

      expect(serialized).not.toContain('300');
      expect(serialized).not.toContain('500');
      expect(serialized).not.toContain('2.5');
      expect(serialized).not.toContain('13.08');
      expect(serialized).not.toContain('80.27');
      expect(serialized).not.toContain('open_now');
      expect(serialized).not.toContain('hours_status');
    });
  });

  describe('validateAndExtractDistribution & computeExpectedScore', () => {
    it('validates and extracts level-probability object array', () => {
      const raw = [
        { level: 0, probability: 0.1 },
        { level: 1, probability: 0.2 },
        { level: 2, probability: 0.3 },
        { level: 3, probability: 0.4 },
      ];
      const dist = validateAndExtractDistribution(raw);
      expect(dist).toEqual([0.1, 0.2, 0.3, 0.4]);

      const score = computeExpectedScore(dist);
      // 0*0.1 + 1*0.2 + 2*0.3 + 3*0.4 = 0 + 0.2 + 0.6 + 1.2 = 2.0
      expect(score).toBeCloseTo(2.0, 4);
    });

    it('validates distribution with sum within 1.0 +- 0.01 tolerance', () => {
      const lower = [0.1, 0.2, 0.3, 0.39]; // sum = 0.99
      expect(validateAndExtractDistribution(lower)).toEqual([0.1, 0.2, 0.3, 0.39]);

      const upper = [0.1, 0.2, 0.3, 0.41]; // sum = 1.01
      expect(validateAndExtractDistribution(upper)).toEqual([0.1, 0.2, 0.3, 0.41]);
    });

    it('rejects distribution when sum is outside 1.0 +- 0.01', () => {
      const badSum = [0.1, 0.2, 0.3, 0.35]; // sum = 0.95
      expect(() => validateAndExtractDistribution(badSum)).toThrowError(JevError);
      try {
        validateAndExtractDistribution(badSum);
      } catch (err: any) {
        expect(err.reason).toBe('invalid_schema');
      }
    });

    it('rejects distribution with negative probabilities', () => {
      const negative = [-0.1, 0.3, 0.4, 0.4];
      expect(() => validateAndExtractDistribution(negative)).toThrowError(JevError);
    });

    it('rejects distribution with fewer or more than 4 levels', () => {
      expect(() => validateAndExtractDistribution([0.5, 0.5])).toThrowError(JevError);
      expect(() => validateAndExtractDistribution([0.2, 0.2, 0.2, 0.2, 0.2])).toThrowError(JevError);
    });
  });

  describe('callJevDecisionsApi', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('sends correct headers, method, body, and parses response successfully', async () => {
      const mockResponse = {
        model: 'jev-1.13-20260917',
        distribution: [
          { level: 0, probability: 0.05 },
          { level: 1, probability: 0.1 },
          { level: 2, probability: 0.25 },
          { level: 3, probability: 0.6 },
        ],
      };

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });
      global.fetch = fetchMock;

      const state = buildJevState('iphone repair', {
        name: 'Apple Care Center',
        category: 'repair_service',
        description: 'Official screen replacement',
        top_items: [{ name: 'Screen Fix', description: 'Original display', tags: ['iphone'] }],
      });

      const result = await callJevDecisionsApi({
        baseUrl: 'https://api.typesafe.ai/v1/decisions',
        apiKey: 'test-jev-key',
        model: 'jev-1.13-20260917',
        state,
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const call = fetchMock.mock.calls[0]!;
      const [url, options] = call;
      expect(url).toBe('https://api.typesafe.ai/v1/decisions');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['Authorization']).toBe('Bearer test-jev-key');

      const parsedBody = JSON.parse(options.body);
      expect(parsedBody.model).toBe('jev-1.13-20260917');
      expect(parsedBody.question).toBe(JEV_DEFAULT_QUESTION);
      expect(parsedBody.levels).toEqual([0, 1, 2, 3]);
      expect(parsedBody.state.customer_query).toBe('iphone repair');

      // Expected score: 0*0.05 + 1*0.10 + 2*0.25 + 3*0.60 = 0 + 0.1 + 0.5 + 1.8 = 2.4
      expect(result.distribution).toEqual([0.05, 0.1, 0.25, 0.6]);
      expect(result.expectedScore).toBeCloseTo(2.4, 4);
    });

    it('throws JevError with reason="http_error" on non-2xx status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Service Unavailable' }),
      });

      const state = buildJevState('test', {
        name: 'Shop',
        category: 'food_beverage',
        description: 'Desc',
        top_items: [],
      });

      await expect(
        callJevDecisionsApi({
          baseUrl: 'https://api.typesafe.ai/v1/decisions',
          apiKey: 'key',
          model: 'jev-1.13-20260917',
          state,
        })
      ).rejects.toMatchObject({
        name: 'JevError',
        reason: 'http_error',
        statusCode: 500,
      });
    });

    it('throws JevError with reason="http_error" on network fetch failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      const state = buildJevState('test', {
        name: 'Shop',
        category: 'food_beverage',
        description: 'Desc',
        top_items: [],
      });

      await expect(
        callJevDecisionsApi({
          baseUrl: 'https://api.typesafe.ai/v1/decisions',
          apiKey: 'key',
          model: 'jev-1.13-20260917',
          state,
        })
      ).rejects.toMatchObject({
        name: 'JevError',
        reason: 'http_error',
      });
    });

    it('throws JevError with reason="timeout" on AbortSignal trigger', async () => {
      const controller = new AbortController();
      controller.abort();

      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      global.fetch = vi.fn().mockRejectedValue(abortError);

      const state = buildJevState('test', {
        name: 'Shop',
        category: 'food_beverage',
        description: 'Desc',
        top_items: [],
      });

      await expect(
        callJevDecisionsApi({
          baseUrl: 'https://api.typesafe.ai/v1/decisions',
          apiKey: 'key',
          model: 'jev-1.13-20260917',
          state,
          signal: controller.signal,
        })
      ).rejects.toMatchObject({
        name: 'JevError',
        reason: 'timeout',
      });
    });

    it('throws JevError with reason="invalid_schema" on malformed JSON response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON at position 0');
        },
      });

      const state = buildJevState('test', {
        name: 'Shop',
        category: 'food_beverage',
        description: 'Desc',
        top_items: [],
      });

      await expect(
        callJevDecisionsApi({
          baseUrl: 'https://api.typesafe.ai/v1/decisions',
          apiKey: 'key',
          model: 'jev-1.13-20260917',
          state,
        })
      ).rejects.toMatchObject({
        name: 'JevError',
        reason: 'invalid_schema',
      });
    });

    it('throws JevError with reason="invalid_schema" when response misses distribution', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ model: 'jev-1.13-20260917' }), // no distribution
      });

      const state = buildJevState('test', {
        name: 'Shop',
        category: 'food_beverage',
        description: 'Desc',
        top_items: [],
      });

      await expect(
        callJevDecisionsApi({
          baseUrl: 'https://api.typesafe.ai/v1/decisions',
          apiKey: 'key',
          model: 'jev-1.13-20260917',
          state,
        })
      ).rejects.toMatchObject({
        name: 'JevError',
        reason: 'invalid_schema',
      });
    });
  });
});
