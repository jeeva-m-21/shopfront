import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../../src/app/mcp/route.js';
import { query } from '../../src/db.js';
import { createAdminShop, makeShopLive } from '../../src/admin/shop-ops.js';
import { publicRateLimiter } from '../../src/rate-limit.js';

describe('MCP Tools Implementation (Integration Tests)', () => {
  let adminActor: { id: string; username: string };

  beforeEach(async () => {
    publicRateLimiter.reset();
    const ts = Date.now();
    const adminRes = await query<{ id: string; username: string }>(
      `INSERT INTO users (username, password_hash, display_name, role, is_active)
       VALUES ($1, 'dummyhash', 'Admin Actor', 'admin', TRUE)
       RETURNING id, username;`,
      [`s1_tools_adm_${ts}`.slice(0, 30)]
    );
    adminActor = adminRes.rows[0]!;

    // Clean up shops created in this suite
    await query(`DELETE FROM shops WHERE slug LIKE 's1-tools-%';`);
  });

  async function callMcpTool(toolName: string, args: Record<string, unknown>) {
    const req = new NextRequest('http://localhost:3000/mcp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args,
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    return body.result;
  }

  describe('1. find_shops tool', () => {
    it('executes find_shops and returns matching shops', async () => {
      const ts = Date.now();
      const shop = await createAdminShop({
        name: 'Adyar Quick Repair',
        slug: `s1-tools-find-${ts}`.slice(0, 30),
        category: 'repair_service',
        description: 'Screen and battery repair in Adyar.',
        address: '500 LB Road, Adyar, Chennai',
        locality_id: 1,
        latitude: 13.0012,
        longitude: 80.2565,
        phone: '+914424410801',
        action_mode: 'phone_only',
        is_sample_data: false,
        actor: adminActor,
      });
      await query(
        `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
         VALUES ($1, 'Repairs', 'Display Fix', 'service', 'fixed', 1800, TRUE);`,
        [shop.id]
      );
      await makeShopLive({ shopId: shop.id, actor: adminActor });

      const result = await callMcpTool('find_shops', {
        query: 'Display Fix',
        locality: 'Adyar',
        category: 'repair_service',
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.shops.length).toBeGreaterThanOrEqual(1);
      expect(data.location_resolved.name).toBe('Adyar');
    });

    it('returns error when query contains "near me" and no location is provided', async () => {
      const result = await callMcpTool('find_shops', {
        query: 'phone repair near me',
      });

      expect(result.isError).toBe(true);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error.code).toBe('location_required');
      expect(parsed.error.data.localities).toHaveLength(32);
    });
  });

  describe('2. get_shop_info tool', () => {
    it('returns shop info with weekly hours, upcoming closures, and contact details', async () => {
      const ts = Date.now();
      const shop = await createAdminShop({
        name: 'Adyar Info Clinic',
        slug: `s1-tools-nfo-${ts}`.slice(0, 30),
        category: 'repair_service',
        description: 'Complete diagnostic and repairs in Adyar.',
        address: '502 LB Road, Adyar, Chennai',
        locality_id: 1,
        latitude: 13.0012,
        longitude: 80.2565,
        phone: '+914424410802',
        whatsapp: '+919840123456',
        action_mode: 'whatsapp',
        action_instructions: 'Please bring proof of purchase',
        is_sample_data: false,
        actor: adminActor,
      });
      await query(
        `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
         VALUES ($1, 'Repairs', 'Battery Swap', 'service', 'fixed', 1200, TRUE);`,
        [shop.id]
      );
      await makeShopLive({ shopId: shop.id, actor: adminActor });

      // Add weekly hours (Mon 09:00 - 18:00)
      await query(
        `INSERT INTO shop_hours (shop_id, weekday, open_time, close_time)
         VALUES ($1, 0, '09:00', '18:00');`,
        [shop.id]
      );
      await query(`UPDATE shops SET hours_status = 'set' WHERE id = $1;`, [shop.id]);

      // Add upcoming closure tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0]!;
      await query(
        `INSERT INTO shop_closures (shop_id, closed_on, reason)
         VALUES ($1, $2, 'Renovation');`,
        [shop.id, tomorrowStr]
      );

      const result = await callMcpTool('get_shop_info', {
        shop_slug: shop.slug,
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.slug).toBe(shop.slug);
      expect(data.name).toBe('Adyar Info Clinic');
      expect(data.hours_status).toBe('set');
      expect(data.weekly_hours).toHaveLength(7);
      expect(data.weekly_hours[0]).toEqual(['09:00–18:00']);
      expect(data.upcoming_closures).toHaveLength(1);
      expect(data.upcoming_closures[0].reason).toBe('Renovation');
      expect(data.contact.whatsapp).toBe('+919840123456');
      expect(data.contact.action_mode).toBe('whatsapp');
      expect(data.contact.action_instructions).toBe('Please bring proof of purchase');
    });

    it('returns shop_not_found error for non-existent or draft shop', async () => {
      const result = await callMcpTool('get_shop_info', {
        shop_slug: 'non-existent-shop-slug-999',
      });

      expect(result.isError).toBe(true);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error.code).toBe('shop_not_found');
    });
  });

  describe('3. get_catalog tool', () => {
    it('returns grouped catalog items with formatted prices and handles cursor pagination', async () => {
      const ts = Date.now();
      const shop = await createAdminShop({
        name: 'Adyar Catalog Superstore',
        slug: `s1-tools-cat-${ts}`.slice(0, 30),
        category: 'repair_service',
        description: 'Large catalog repair shop.',
        address: '504 LB Road, Adyar, Chennai',
        locality_id: 1,
        latitude: 13.0012,
        longitude: 80.2565,
        phone: '+914424410803',
        action_mode: 'phone_only',
        is_sample_data: false,
        actor: adminActor,
      });

      // Insert 30 items to test 25-item page size and next_cursor
      for (let i = 1; i <= 30; i++) {
        await query(
          `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, sort_order, available)
           VALUES ($1, $2, $3, 'service', 'fixed', $4, $5, TRUE);`,
          [
            shop.id,
            i <= 15 ? 'Group A' : 'Group B',
            `Item ${i.toString().padStart(2, '0')}`,
            100 * i,
            i,
          ]
        );
      }
      await makeShopLive({ shopId: shop.id, actor: adminActor });

      // Page 1
      const page1Res = await callMcpTool('get_catalog', {
        shop_slug: shop.slug,
      });
      expect(page1Res.isError).toBeUndefined();
      const page1Data = JSON.parse(page1Res.content[0].text);
      expect(page1Data.shop_slug).toBe(shop.slug);

      const page1TotalItems = page1Data.groups.reduce(
        (sum: number, g: { items: unknown[] }) => sum + g.items.length,
        0
      );
      expect(page1TotalItems).toBe(25);
      expect(page1Data.next_cursor).toBeDefined();
      expect(page1Data.next_cursor).not.toBeNull();

      // Page 2
      const page2Res = await callMcpTool('get_catalog', {
        shop_slug: shop.slug,
        cursor: page1Data.next_cursor,
      });
      expect(page2Res.isError).toBeUndefined();
      const page2Data = JSON.parse(page2Res.content[0].text);

      const page2TotalItems = page2Data.groups.reduce(
        (sum: number, g: { items: unknown[] }) => sum + g.items.length,
        0
      );
      expect(page2TotalItems).toBe(5);
      expect(page2Data.next_cursor).toBeNull();
    });

    it('returns invalid_input when cursor is malformed', async () => {
      const ts = Date.now();
      const shop = await createAdminShop({
        name: 'Adyar Bad Cursor Shop',
        slug: `s1-tools-cur-${ts}`.slice(0, 30),
        category: 'repair_service',
        description: 'Test shop for cursor.',
        address: '506 LB Road, Adyar, Chennai',
        locality_id: 1,
        latitude: 13.0012,
        longitude: 80.2565,
        phone: '+914424410804',
        action_mode: 'phone_only',
        is_sample_data: false,
        actor: adminActor,
      });
      await query(
        `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
         VALUES ($1, 'General', 'Item 1', 'service', 'fixed', 500, TRUE);`,
        [shop.id]
      );
      await makeShopLive({ shopId: shop.id, actor: adminActor });

      const result = await callMcpTool('get_catalog', {
        shop_slug: shop.slug,
        cursor: 'invalid-not-base64-json!!!',
      });

      expect(result.isError).toBe(true);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error.code).toBe('invalid_input');
    });
  });

  describe('4. search_catalog tool', () => {
    it('searches items within shop by text query, price limit and kind', async () => {
      const ts = Date.now();
      const shop = await createAdminShop({
        name: 'Adyar Search Catalog Shop',
        slug: `s1-tools-scat-${ts}`.slice(0, 30),
        category: 'repair_service',
        description: 'Catalog search test shop.',
        address: '508 LB Road, Adyar, Chennai',
        locality_id: 1,
        latitude: 13.0012,
        longitude: 80.2565,
        phone: '+914424410805',
        action_mode: 'phone_only',
        is_sample_data: false,
        actor: adminActor,
      });
      await query(
        `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
         VALUES
         ($1, 'Displays', 'iPhone 13 Screen Replacement', 'service', 'fixed', 4000, TRUE),
         ($1, 'Displays', 'iPhone 13 Tempered Glass', 'product', 'fixed', 300, TRUE),
         ($1, 'Power', 'iPhone 13 Battery Replacement', 'service', 'fixed', 2000, TRUE);`,
        [shop.id]
      );
      await makeShopLive({ shopId: shop.id, actor: adminActor });

      // Search for 'iPhone 13' with kind: 'service' and max_price_inr: 3000
      // Only 'iPhone 13 Battery Replacement' (2000 INR service) should match!
      const result = await callMcpTool('search_catalog', {
        shop_slug: shop.slug,
        query: 'iPhone 13',
        kind: 'service',
        max_price_inr: 3000,
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.shop_slug).toBe(shop.slug);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].name).toBe('iPhone 13 Battery Replacement');
      expect(data.items[0].similarity).toBeGreaterThan(0);
    });

    it('rejects query shorter than 2 chars with invalid_input', async () => {
      const result = await callMcpTool('search_catalog', {
        shop_slug: 'any-shop',
        query: 'a',
      });

      expect(result.isError).toBe(true);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error.code).toBe('invalid_input');
    });
  });

  describe('5. get_action_link tool', () => {
    it('generates WhatsApp action link with populated message and disclaimer', async () => {
      const ts = Date.now();
      const shop = await createAdminShop({
        name: 'Adyar Action Shop',
        slug: `s1-tools-act-${ts}`.slice(0, 30),
        category: 'repair_service',
        description: 'Action link test shop.',
        address: '510 LB Road, Adyar, Chennai',
        locality_id: 1,
        latitude: 13.0012,
        longitude: 80.2565,
        phone: '+914424410806',
        whatsapp: '+919840999888',
        action_mode: 'whatsapp',
        action_instructions: 'WhatsApp preferred for estimates',
        is_sample_data: false,
        actor: adminActor,
      });
      const itemRes = await query<{ id: string }>(
        `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
         VALUES ($1, 'Displays', 'OLED Glass Replacement', 'service', 'fixed', 3500, TRUE)
         RETURNING id;`,
        [shop.id]
      );
      const itemId = itemRes.rows[0]!.id;
      await makeShopLive({ shopId: shop.id, actor: adminActor });

      const result = await callMcpTool('get_action_link', {
        shop_slug: shop.slug,
        item_id: itemId,
        preferred_time: 'Tomorrow at 4 PM',
        customer_note: 'Screen is cracked',
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.shop_slug).toBe(shop.slug);
      expect(data.action_mode).toBe('whatsapp');
      expect(data.action_url).toContain('https://wa.me/919840999888');
      expect(data.action_url).toContain('Tomorrow%20at%204%20PM');
      expect(data.suggested_message).toContain('OLED Glass Replacement');
      expect(data.suggested_message).toContain('(via Shopfront)');
      expect(data.item_summary).toBe('"OLED Glass Replacement" (₹3,500)');
      expect(data.disclaimer).toBe('Opens direct enquiry with the business; not an automatic confirmed booking.');
    });

    it('returns item_not_found error if item does not exist or belongs to another shop', async () => {
      const ts = Date.now();
      const shop = await createAdminShop({
        name: 'Adyar Empty Action Shop',
        slug: `s1-tools-act2-${ts}`.slice(0, 30),
        category: 'repair_service',
        description: 'Action link test shop 2.',
        address: '512 LB Road, Adyar, Chennai',
        locality_id: 1,
        latitude: 13.0012,
        longitude: 80.2565,
        phone: '+914424410807',
        action_mode: 'phone_only',
        is_sample_data: false,
        actor: adminActor,
      });
      await query(
        `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
         VALUES ($1, 'Displays', 'Display Fix', 'service', 'fixed', 1000, TRUE);`,
        [shop.id]
      );
      await makeShopLive({ shopId: shop.id, actor: adminActor });

      const result = await callMcpTool('get_action_link', {
        shop_slug: shop.slug,
        item_id: '00000000-0000-0000-0000-000000000000',
      });

      expect(result.isError).toBe(true);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error.code).toBe('item_not_found');
    });
  });
});
