import { describe, it, expect, beforeEach } from 'vitest';
import { query } from '../../src/db.js';
import {
  generateRelaxationHints,
  type SearchStage1Options,
} from '../../src/search/stage1.js';
import { createAdminShop, makeShopLive } from '../../src/admin/shop-ops.js';

describe('Search Stage 1 Relaxation Hints Generator (Integration Tests)', () => {
  let adminActor: { id: string; username: string };

  beforeEach(async () => {
    const ts = Date.now();
    const adminRes = await query<{ id: string; username: string }>(
      `INSERT INTO users (username, password_hash, display_name, role, is_active)
       VALUES ($1, 'dummyhash', 'Admin Actor', 'admin', TRUE)
       RETURNING id, username;`,
      [`s1_rel_adm_${ts}`.slice(0, 30)]
    );
    adminActor = adminRes.rows[0]!;

    // Clean up shops created in this suite
    await query(`DELETE FROM shops WHERE slug LIKE 's1-rel-%';`);
  });

  it('generates radius relaxation hint when shop is beyond 5km but within 25km', async () => {
    const ts = Date.now();
    // Shop in Anna Nagar (13.0850, 80.2100) ~10.5 km away from Adyar
    const annaShop = await createAdminShop({
      name: 'Anna Nagar Gadgets',
      slug: `s1-rel-rad-${ts}`.slice(0, 30),
      category: 'repair_service',
      description: 'Reliable gadget repairs in Anna Nagar.',
      address: '10 2nd Ave, Anna Nagar, Chennai',
      locality_id: 3,
      latitude: 13.085,
      longitude: 80.21,
      phone: '+914426210601',
      action_mode: 'phone_only',
      is_sample_data: false,
      actor: adminActor,
    });
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
       VALUES ($1, 'Repairs', 'Screen Service', 'service', 'fixed', 1500, TRUE);`,
      [annaShop.id]
    );
    await makeShopLive({ shopId: annaShop.id, actor: adminActor });

    // Searching from Adyar (13.0012, 80.2565) with 5km radius
    const hints = await generateRelaxationHints({
      query: '',
      anchor: { lat: 13.0012, lng: 80.2565 },
      radiusKm: 5,
      category: 'repair_service',
      showSampleData: false,
    });

    const radiusHint = hints.find((h) => h.constraint === 'radius');
    expect(radiusHint).toBeDefined();
    expect(radiusHint?.relaxed_to).toBe('25 km');
    expect(radiusHint?.would_return).toBeGreaterThanOrEqual(1);
  });

  it('generates max_price relaxation hint when all matching shops exceed price ceiling', async () => {
    const ts = Date.now();
    // Shop in Adyar with item price 5000 INR
    const adyarShop = await createAdminShop({
      name: 'Adyar Premium Repairs',
      slug: `s1-rel-prc-${ts}`.slice(0, 30),
      category: 'repair_service',
      description: 'Premium laptop repairs in Adyar.',
      address: '50 LB Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424410602',
      action_mode: 'phone_only',
      is_sample_data: false,
      actor: adminActor,
    });
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
       VALUES ($1, 'Displays', 'Retina Display', 'service', 'fixed', 5000, TRUE);`,
      [adyarShop.id]
    );
    await makeShopLive({ shopId: adyarShop.id, actor: adminActor });

    // Searching with maxPriceInr = 2000
    const hints = await generateRelaxationHints({
      query: 'Retina',
      anchor: { lat: 13.0012, lng: 80.2565 },
      radiusKm: 5,
      maxPriceInr: 2000,
      showSampleData: false,
    });

    const priceHint = hints.find((h) => h.constraint === 'max_price');
    expect(priceHint).toBeDefined();
    expect(priceHint?.relaxed_to).toBe('any price');
    expect(priceHint?.would_return).toBeGreaterThanOrEqual(1);
  });

  it('generates open_now relaxation hint when matching shop is closed at query time', async () => {
    const ts = Date.now();
    // Shop with hours Monday 19:00 - 22:00
    const eveningShop = await createAdminShop({
      name: 'Adyar Night Repairs',
      slug: `s1-rel-opn-${ts}`.slice(0, 30),
      category: 'repair_service',
      description: 'Night repairs in Adyar.',
      address: '52 LB Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424410603',
      action_mode: 'phone_only',
      is_sample_data: false,
      actor: adminActor,
    });
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
       VALUES ($1, 'General', 'Diagnostic', 'service', 'fixed', 500, TRUE);`,
      [eveningShop.id]
    );
    await makeShopLive({ shopId: eveningShop.id, actor: adminActor });
    await query(
      `INSERT INTO shop_hours (shop_id, weekday, open_time, close_time)
       VALUES ($1, 0, '19:00', '22:00');`,
      [eveningShop.id]
    );
    await query(`UPDATE shops SET hours_status = 'set' WHERE id = $1;`, [eveningShop.id]);

    // Query time: Monday 12:00 IST (UTC: 2026-10-19 06:30)
    const mondayNoon = new Date(Date.UTC(2026, 9, 19, 6, 30));

    const hints = await generateRelaxationHints({
      query: '',
      anchor: { lat: 13.0012, lng: 80.2565 },
      radiusKm: 5,
      openNow: true,
      now: mondayNoon,
      showSampleData: false,
    });

    const openHint = hints.find((h) => h.constraint === 'open_now');
    expect(openHint).toBeDefined();
    expect(openHint?.relaxed_to).toBe('all hours');
    expect(openHint?.would_return).toBeGreaterThanOrEqual(1);
  });

  it('omits hints when relaxing a constraint still returns 0 shops or when no location anchor exists', async () => {
    // 1. Without location anchor: hints should be empty
    const noAnchorHints = await generateRelaxationHints({
      query: 'NonExistentProductXYZ123',
      category: 'repair_service',
      showSampleData: false,
    });
    expect(noAnchorHints).toEqual([]);

    // 2. When radius is already at maximum (25km) and no other constraints are active
    const maxRadiusHints = await generateRelaxationHints({
      query: '',
      anchor: { lat: 13.0012, lng: 80.2565 },
      radiusKm: 25,
      showSampleData: false,
    });
    expect(maxRadiusHints).toEqual([]);
  });
});
