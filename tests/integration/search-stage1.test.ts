import { describe, it, expect, beforeEach } from 'vitest';
import { query } from '../../src/db.js';
import {
  getCandidatePool,
  type Stage1QueryParams,
} from '../../src/search/stage1.js';
import { createAdminShop, makeShopLive } from '../../src/admin/shop-ops.js';

describe('Search Stage 1 Query 1 Candidate Pool (Integration Tests)', () => {
  let adminActor: { id: string; username: string };

  beforeEach(async () => {
    const ts = Date.now();
    const adminRes = await query<{ id: string; username: string }>(
      `INSERT INTO users (username, password_hash, display_name, role, is_active)
       VALUES ($1, 'dummyhash', 'Admin Actor', 'admin', TRUE)
       RETURNING id, username;`,
      [`s1_adm_${ts}`.slice(0, 30)]
    );
    adminActor = adminRes.rows[0]!;

    // Clean up shops created in this suite
    await query(`DELETE FROM shops WHERE slug LIKE 's1-test-%';`);
  });

  it('H1: filters out draft, paused, and sample shops according to visibility flags', async () => {
    const ts = Date.now();
    // 1. Live real shop
    const liveShop = await createAdminShop({
      name: 'Adyar Live Center',
      slug: `s1-test-live-${ts}`.slice(0, 30),
      category: 'repair_service',
      description: 'Authorized phone and tablet repair center.',
      address: '10 LB Road, Adyar, Chennai',
      locality_id: 1, // Adyar
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424410101',
      action_mode: 'phone_only',
      is_sample_data: false,
      actor: adminActor,
    });
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
       VALUES ($1, 'Repairs', 'Screen Repair', 'service', 'fixed', 2000, TRUE);`,
      [liveShop.id]
    );
    await makeShopLive({ shopId: liveShop.id, actor: adminActor });

    // 2. Draft real shop
    const draftShop = await createAdminShop({
      name: 'Adyar Draft Center',
      slug: `s1-test-draft-${ts}`.slice(0, 30),
      category: 'repair_service',
      description: 'Authorized phone and tablet repair center in draft.',
      address: '12 LB Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424410102',
      action_mode: 'phone_only',
      is_sample_data: false,
      actor: adminActor,
    });
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
       VALUES ($1, 'Repairs', 'Screen Repair', 'service', 'fixed', 2000, TRUE);`,
      [draftShop.id]
    );

    // 3. Paused real shop
    const pausedShop = await createAdminShop({
      name: 'Adyar Paused Center',
      slug: `s1-test-paused-${ts}`.slice(0, 30),
      category: 'repair_service',
      description: 'Authorized phone and tablet repair center in paused.',
      address: '14 LB Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424410103',
      action_mode: 'phone_only',
      is_sample_data: false,
      actor: adminActor,
    });
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
       VALUES ($1, 'Repairs', 'Screen Repair', 'service', 'fixed', 2000, TRUE);`,
      [pausedShop.id]
    );
    await makeShopLive({ shopId: pausedShop.id, actor: adminActor });
    await query(`UPDATE shops SET status = 'paused' WHERE id = $1;`, [pausedShop.id]);

    // 4. Sample live shop
    const sampleShop = await createAdminShop({
      name: 'Adyar Sample Center',
      slug: `s1-test-sample-${ts}`.slice(0, 30),
      category: 'repair_service',
      description: 'Sample benchmark repair store.',
      address: '16 LB Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424410104',
      action_mode: 'phone_only',
      is_sample_data: true,
      data_source_note: 'Benchmark seed test',
      actor: adminActor,
    });
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
       VALUES ($1, 'Repairs', 'Screen Repair', 'service', 'fixed', 2000, TRUE);`,
      [sampleShop.id]
    );
    await makeShopLive({ shopId: sampleShop.id, actor: adminActor });

    // Test with show_sample = false: only liveShop returned
    const poolWithoutSample = await getCandidatePool({
      query: '',
      showSampleData: false,
    });
    const ids1 = poolWithoutSample.map((s) => s.id);
    expect(ids1).toContain(liveShop.id);
    expect(ids1).not.toContain(draftShop.id);
    expect(ids1).not.toContain(pausedShop.id);
    expect(ids1).not.toContain(sampleShop.id);

    // Test with show_sample = true: both liveShop and sampleShop returned
    const poolWithSample = await getCandidatePool({
      query: '',
      showSampleData: true,
    });
    const ids2 = poolWithSample.map((s) => s.id);
    expect(ids2).toContain(liveShop.id);
    expect(ids2).toContain(sampleShop.id);
    expect(ids2).not.toContain(draftShop.id);
    expect(ids2).not.toContain(pausedShop.id);
  });

  it('H2: filters candidate pool strictly by category', async () => {
    const ts = Date.now();
    // Repair shop
    const repairShop = await createAdminShop({
      name: 'Adyar Phone Hospital',
      slug: `s1-test-cat-rep-${ts}`.slice(0, 30),
      category: 'repair_service',
      description: 'Mobile phone hardware repair specialists.',
      address: '20 LB Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424410201',
      action_mode: 'phone_only',
      is_sample_data: false,
      actor: adminActor,
    });
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
       VALUES ($1, 'Repairs', 'Battery Fix', 'service', 'fixed', 1200, TRUE);`,
      [repairShop.id]
    );
    await makeShopLive({ shopId: repairShop.id, actor: adminActor });

    // Salon shop
    const salonShop = await createAdminShop({
      name: 'Adyar Hair Studio',
      slug: `s1-test-cat-sal-${ts}`.slice(0, 30),
      category: 'salon_wellness',
      description: 'Unisex hair cut and styling salon.',
      address: '22 LB Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424410202',
      action_mode: 'phone_only',
      is_sample_data: false,
      actor: adminActor,
    });
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
       VALUES ($1, 'Hair', 'Haircut', 'service', 'fixed', 300, TRUE);`,
      [salonShop.id]
    );
    await makeShopLive({ shopId: salonShop.id, actor: adminActor });

    // Filter by repair_service
    const repairResults = await getCandidatePool({
      query: '',
      category: 'repair_service',
      showSampleData: false,
    });
    const repIds = repairResults.map((s) => s.id);
    expect(repIds).toContain(repairShop.id);
    expect(repIds).not.toContain(salonShop.id);

    // Filter by salon_wellness
    const salonResults = await getCandidatePool({
      query: '',
      category: 'salon_wellness',
      showSampleData: false,
    });
    const salIds = salonResults.map((s) => s.id);
    expect(salIds).toContain(salonShop.id);
    expect(salIds).not.toContain(repairShop.id);
  });

  it('H3: filters candidate pool by spatial radius (ST_DWithin)', async () => {
    const ts = Date.now();
    // Shop in Adyar: 13.0012, 80.2565
    const adyarShop = await createAdminShop({
      name: 'Adyar Tech Hub',
      slug: `s1-test-dist-ady-${ts}`.slice(0, 30),
      category: 'repair_service',
      description: 'Laptop and desktop repair in Adyar.',
      address: '30 LB Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424410301',
      action_mode: 'phone_only',
      is_sample_data: false,
      actor: adminActor,
    });
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
       VALUES ($1, 'Repairs', 'RAM Upgrade', 'service', 'fixed', 2500, TRUE);`,
      [adyarShop.id]
    );
    await makeShopLive({ shopId: adyarShop.id, actor: adminActor });

    // Shop in Anna Nagar: 13.0850, 80.2100 (~10.5 km away from Adyar)
    const annaNagarShop = await createAdminShop({
      name: 'Anna Nagar Tech Hub',
      slug: `s1-test-dist-ann-${ts}`.slice(0, 30),
      category: 'repair_service',
      description: 'Laptop and desktop repair in Anna Nagar.',
      address: '2nd Avenue, Anna Nagar, Chennai',
      locality_id: 3, // Anna Nagar
      latitude: 13.085,
      longitude: 80.21,
      phone: '+914426210302',
      action_mode: 'phone_only',
      is_sample_data: false,
      actor: adminActor,
    });
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
       VALUES ($1, 'Repairs', 'RAM Upgrade', 'service', 'fixed', 2500, TRUE);`,
      [annaNagarShop.id]
    );
    await makeShopLive({ shopId: annaNagarShop.id, actor: adminActor });

    // Search around Adyar with 5 km radius
    const results5km = await getCandidatePool({
      query: '',
      anchor: { lat: 13.0012, lng: 80.2565 },
      radiusKm: 5,
      showSampleData: false,
    });
    const ids5km = results5km.map((s) => s.id);
    expect(ids5km).toContain(adyarShop.id);
    expect(ids5km).not.toContain(annaNagarShop.id);

    // Find adyarShop entry and verify distance_km is close to 0
    const adyarEntry = results5km.find((s) => s.id === adyarShop.id);
    expect(adyarEntry?.distance_km).toBeLessThan(0.1);

    // Search around Adyar with 15 km radius: both shops included
    const results15km = await getCandidatePool({
      query: '',
      anchor: { lat: 13.0012, lng: 80.2565 },
      radiusKm: 15,
      showSampleData: false,
    });
    const ids15km = results15km.map((s) => s.id);
    expect(ids15km).toContain(adyarShop.id);
    expect(ids15km).toContain(annaNagarShop.id);
  });

  it('H4 & H5: filters by available items >= 1 and query-matching price ceiling', async () => {
    const ts = Date.now();
    // Shop 1: Cheap repair shop (Screen repair for 1500 INR)
    const cheapShop = await createAdminShop({
      name: 'Budget Mobile Repair',
      slug: `s1-test-price-chp-${ts}`.slice(0, 30),
      category: 'repair_service',
      description: 'Affordable display replacement and mobile care.',
      address: '40 LB Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424410401',
      action_mode: 'phone_only',
      is_sample_data: false,
      actor: adminActor,
    });
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
       VALUES ($1, 'Displays', 'Screen Replacement', 'service', 'fixed', 1500, TRUE);`,
      [cheapShop.id]
    );
    await makeShopLive({ shopId: cheapShop.id, actor: adminActor });

    // Shop 2: Luxury repair shop (Screen repair for 6000 INR)
    const luxuryShop = await createAdminShop({
      name: 'Luxury Mobile Clinic',
      slug: `s1-test-price-lux-${ts}`.slice(0, 30),
      category: 'repair_service',
      description: 'OEM display replacement and mobile care.',
      address: '42 LB Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424410402',
      action_mode: 'phone_only',
      is_sample_data: false,
      actor: adminActor,
    });
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
       VALUES ($1, 'Displays', 'Screen Replacement', 'service', 'fixed', 6000, TRUE);`,
      [luxuryShop.id]
    );
    await makeShopLive({ shopId: luxuryShop.id, actor: adminActor });

    // Shop 3: Shop with only 'on_request' pricing (excluded from meeting price ceiling)
    const onRequestShop = await createAdminShop({
      name: 'Custom Repair Atelier',
      slug: `s1-test-price-onr-${ts}`.slice(0, 30),
      category: 'repair_service',
      description: 'Custom fabrication and estimates.',
      address: '44 LB Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424410403',
      action_mode: 'phone_only',
      is_sample_data: false,
      actor: adminActor,
    });
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
       VALUES ($1, 'Displays', 'Screen Replacement', 'service', 'on_request', NULL, TRUE);`,
      [onRequestShop.id]
    );
    await makeShopLive({ shopId: onRequestShop.id, actor: adminActor });

    // Filter by max_price_inr = 2000 for query "Screen":
    // Only cheapShop should match (1500 <= 2000). Luxury (6000) and OnRequest are excluded.
    const priceFiltered = await getCandidatePool({
      query: 'Screen',
      maxPriceInr: 2000,
      showSampleData: false,
    });
    const pIds = priceFiltered.map((s) => s.id);
    expect(pIds).toContain(cheapShop.id);
    expect(pIds).not.toContain(luxuryShop.id);
    expect(pIds).not.toContain(onRequestShop.id);
  });
});
