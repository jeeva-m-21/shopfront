import { describe, it, expect, beforeEach, vi } from 'vitest';
import { query } from '../../src/db.js';
import { searchShops, type SearchShopsInput } from '../../src/search/search-shops.js';
import { createAdminShop, makeShopLive } from '../../src/admin/shop-ops.js';

describe('Search Orchestrator & Telemetry (Integration Tests)', () => {
  let adminActor: { id: string; username: string };

  beforeEach(async () => {
    const ts = Date.now();
    const adminRes = await query<{ id: string; username: string }>(
      `INSERT INTO users (username, password_hash, display_name, role, is_active)
       VALUES ($1, 'dummyhash', 'Admin Actor', 'admin', TRUE)
       RETURNING id, username;`,
      [`s1_orch_adm_${ts}`.slice(0, 30)]
    );
    adminActor = adminRes.rows[0]!;

    // Clean up shops created in this suite
    await query(`DELETE FROM shops WHERE slug LIKE 's1-orch-%';`);
  });

  describe('Pre-Flight Validation', () => {
    it('rejects with invalid_input if both locality and lat/lng are provided', async () => {
      const res = await searchShops(
        {
          locality: 'Adyar',
          lat: 13.0012,
          lng: 80.2565,
        },
        'mcp'
      );
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('invalid_input');
      }
    });

    it('rejects with invalid_input if lat is provided without lng or vice versa', async () => {
      const res = await searchShops(
        {
          lat: 13.0012,
        },
        'mcp'
      );
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('invalid_input');
      }
    });

    it('rejects with location_required if query contains "near me" and no location is provided', async () => {
      const res = await searchShops(
        {
          query: 'mobile repair near me',
        },
        'mcp'
      );
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('location_required');
        expect(res.error.message).toContain('Ask the customer which Chennai area they are in');
        expect(res.error.data?.localities).toHaveLength(32);
      }
    });

    it('rejects with locality_not_found if locality cannot be resolved', async () => {
      const res = await searchShops(
        {
          locality: 'UnknownPlaceXYZ999',
        },
        'mcp'
      );
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('locality_not_found');
        expect(res.error.data?.suggestions).toBeDefined();
        expect(Array.isArray(res.error.data?.suggestions)).toBe(true);
      }
    });

    it('rejects with outside_service_area if coordinates are outside Chennai bounding box', async () => {
      const res = await searchShops(
        {
          lat: 19.076, // Mumbai
          lng: 72.8777,
        },
        'mcp'
      );
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('outside_service_area');
      }
    });
  });

  describe('Search Execution & Telemetry', () => {
    it('executes city-wide search without location, including location_warning and logging to search_logs', async () => {
      const ts = Date.now();
      const shop = await createAdminShop({
        name: 'Chennai Wide Repairs',
        slug: `s1-orch-cw-${ts}`.slice(0, 30),
        category: 'repair_service',
        description: 'Authorized phone and laptop repairs in Adyar.',
        address: '10 LB Road, Adyar, Chennai',
        locality_id: 1,
        latitude: 13.0012,
        longitude: 80.2565,
        phone: '+914424410701',
        action_mode: 'phone_only',
        is_sample_data: false,
        actor: adminActor,
      });
      await query(
        `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
         VALUES ($1, 'General', 'Screen Glass Fix', 'service', 'fixed', 1500, TRUE);`,
        [shop.id]
      );
      await makeShopLive({ shopId: shop.id, actor: adminActor });

      const res = await searchShops(
        {
          query: 'Screen Glass',
          show_sample_data: false,
        },
        'web'
      );

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.location_resolved).toBeNull();
        expect(res.data.location_warning).toContain('No location provided; showing results across Chennai');
        expect(res.data.shops.length).toBeGreaterThanOrEqual(1);

        const foundShop = res.data.shops.find((s) => s.slug === shop.slug);
        expect(foundShop).toBeDefined();
        expect(foundShop?.distance_km).toBeNull();
        expect(foundShop?.price_range_inr).toEqual([1500, 1500]);
        expect(foundShop?.matching_items.length).toBeGreaterThanOrEqual(1);
        expect(foundShop?.matching_items[0]?.price_display).toBe('₹1,500');
      }

      // Check telemetry search_logs table
      const logRes = await query<{
        channel: string;
        tool: string;
        query_text: string;
        total_ms: number;
      }>(
        `SELECT channel, tool, query_text, total_ms
         FROM search_logs
         WHERE channel = 'web' AND tool = 'find_shops'
         ORDER BY id DESC LIMIT 1;`
      );
      expect(logRes.rows.length).toBe(1);
      expect(logRes.rows[0]?.channel).toBe('web');
      expect(logRes.rows[0]?.tool).toBe('find_shops');
      expect(logRes.rows[0]?.total_ms).toBeGreaterThanOrEqual(0);
    });

    it('executes locality search, resolves location and returns relaxation hints if 0 shops', async () => {
      const res = await searchShops(
        {
          query: 'ImpossibleNonExistentItem999',
          locality: 'Adyar',
          max_price_inr: 50,
          show_sample_data: false,
        },
        'mcp'
      );

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.location_resolved).toEqual({
          name: 'Adyar',
          lat: 13.0012,
          lng: 80.2565,
          radius_km: 5,
        });
        expect(res.data.location_warning).toBeNull();
        expect(res.data.shops).toHaveLength(0);
        expect(res.data.relaxation_hints.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('executes Stage 2 reranking when enabled, ordering candidates by relevance score and logging to search_logs', async () => {
      const ts = Date.now();
      // Create two live shops in Adyar
      const shopA = await createAdminShop({
        name: 'Alpha Phone Repairs',
        slug: `s1-orch-rerank-a-${ts}`.slice(0, 30),
        category: 'repair_service',
        description: 'Screen repair and battery service.',
        address: '11 LB Road, Adyar, Chennai',
        locality_id: 1,
        latitude: 13.0012,
        longitude: 80.2565,
        phone: '+914424410702',
        whatsapp: '+919840123456',
        action_mode: 'whatsapp',
        is_sample_data: false,
        actor: adminActor,
      });
      await query(
        `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
         VALUES ($1, 'General', 'Screen Fix', 'service', 'fixed', 1500, TRUE);`,
        [shopA.id]
      );
      await makeShopLive({ shopId: shopA.id, actor: adminActor });

      const shopB = await createAdminShop({
        name: 'Beta Battery Center',
        slug: `s1-orch-rerank-b-${ts}`.slice(0, 30),
        category: 'repair_service',
        description: 'Battery specialists.',
        address: '12 LB Road, Adyar, Chennai',
        locality_id: 1,
        latitude: 13.0012,
        longitude: 80.2565,
        phone: '+914424410703',
        whatsapp: '+919840123457',
        action_mode: 'whatsapp',
        is_sample_data: false,
        actor: adminActor,
      });
      await query(
        `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
         VALUES ($1, 'General', 'Battery Replacement', 'service', 'fixed', 900, TRUE);`,
        [shopB.id]
      );
      await makeShopLive({ shopId: shopB.id, actor: adminActor });

      // Enable reranking for this test
      process.env.RERANK_ENABLED = 'true';
      process.env.JEV_API_KEY = 'test-key';
      process.env.JEV_MODEL = 'jev-1.13-20260917';

      // Mock fetch for Jev Decisions API
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockImplementation(async (url: any, opts: any) => {
        const body = JSON.parse(opts.body);
        const isBeta = body.state.shop.name.includes('Beta');
        return {
          ok: true,
          status: 200,
          json: async () => ({
            model: 'jev-1.13-20260917',
            distribution: isBeta
              ? [
                  { level: 0, probability: 0.0 },
                  { level: 1, probability: 0.0 },
                  { level: 2, probability: 0.1 },
                  { level: 3, probability: 0.9 },
                ] // E[score] = 2.9
              : [
                  { level: 0, probability: 0.2 },
                  { level: 1, probability: 0.6 },
                  { level: 2, probability: 0.2 },
                  { level: 3, probability: 0.0 },
                ], // E[score] = 1.0
          }),
        };
      });

      try {
        const res = await searchShops(
          {
            query: 'battery replacement',
            locality: 'Adyar',
            show_sample_data: false,
          },
          'mcp'
        );

        expect(res.success).toBe(true);
        if (res.success) {
          expect(res.data.reranked).toBe(true);
          expect(res.data.jev_model).toBe('jev-1.13-20260917');
          expect(res.data.fallback_reason).toBeNull();
          expect(res.data.shops.length).toBeGreaterThanOrEqual(2);

          // Beta shop should be reranked to top
          const firstShop = res.data.shops[0]!;
          expect(firstShop.slug).toBe(shopB.slug);
          expect(firstShop.relevance_score).toBe(2.9);
        }

        // Check telemetry search_logs
        const logRes = await query<{
          reranked: boolean;
          jev_model: string;
          fallback_reason: string | null;
        }>(
          `SELECT reranked, jev_model, fallback_reason
           FROM search_logs
           WHERE tool = 'find_shops' AND query_text = 'battery replacement'
           ORDER BY id DESC LIMIT 1;`
        );
        expect(logRes.rows[0]?.reranked).toBe(true);
        expect(logRes.rows[0]?.jev_model).toBe('jev-1.13-20260917');
        expect(logRes.rows[0]?.fallback_reason).toBeNull();
      } finally {
        global.fetch = originalFetch;
        process.env.RERANK_ENABLED = 'false';
        delete process.env.JEV_API_KEY;
      }
    });
  });
});
