import { describe, it, expect, beforeEach } from 'vitest';
import { query } from '../../src/db.js';
import {
  executeStage1,
  fetchCandidateItems,
  type SearchStage1Options,
} from '../../src/search/stage1.js';
import { createAdminShop, makeShopLive } from '../../src/admin/shop-ops.js';

describe('Search Stage 1 Step 2 & Query 2 (Integration Tests)', () => {
  let adminActor: { id: string; username: string };

  beforeEach(async () => {
    const ts = Date.now();
    const adminRes = await query<{ id: string; username: string }>(
      `INSERT INTO users (username, password_hash, display_name, role, is_active)
       VALUES ($1, 'dummyhash', 'Admin Actor', 'admin', TRUE)
       RETURNING id, username;`,
      [`s1_q2_adm_${ts}`.slice(0, 30)]
    );
    adminActor = adminRes.rows[0]!;

    // Clean up shops created in this suite
    await query(`DELETE FROM shops WHERE slug LIKE 's1-q2-%';`);
  });

  it('H6: filters shops by open_now in IST context (excluding closed and unknown hours)', async () => {
    const ts = Date.now();

    // Shop 1: Open Shop (set hours Monday 09:00 - 18:00)
    const openShop = await createAdminShop({
      name: 'Open Electronics',
      slug: `s1-q2-open-${ts}`.slice(0, 30),
      category: 'repair_service',
      description: 'Open electronics repair shop in Adyar.',
      address: '100 LB Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424410501',
      action_mode: 'phone_only',
      is_sample_data: false,
      actor: adminActor,
    });
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
       VALUES ($1, 'General', 'Diagnostics', 'service', 'fixed', 500, TRUE);`,
      [openShop.id]
    );
    await makeShopLive({ shopId: openShop.id, actor: adminActor });
    // Mon (weekday 0) 09:00-18:00
    await query(
      `INSERT INTO shop_hours (shop_id, weekday, open_time, close_time)
       VALUES ($1, 0, '09:00', '18:00');`,
      [openShop.id]
    );
    await query(`UPDATE shops SET hours_status = 'set' WHERE id = $1;`, [openShop.id]);

    // Shop 2: Closed Shop (set hours Monday 19:00 - 22:00)
    const closedShop = await createAdminShop({
      name: 'Evening Electronics',
      slug: `s1-q2-closed-${ts}`.slice(0, 30),
      category: 'repair_service',
      description: 'Night shift electronics repair in Adyar.',
      address: '102 LB Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424410502',
      action_mode: 'phone_only',
      is_sample_data: false,
      actor: adminActor,
    });
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
       VALUES ($1, 'General', 'Diagnostics', 'service', 'fixed', 500, TRUE);`,
      [closedShop.id]
    );
    await makeShopLive({ shopId: closedShop.id, actor: adminActor });
    await query(
      `INSERT INTO shop_hours (shop_id, weekday, open_time, close_time)
       VALUES ($1, 0, '19:00', '22:00');`,
      [closedShop.id]
    );
    await query(`UPDATE shops SET hours_status = 'set' WHERE id = $1;`, [closedShop.id]);

    // Shop 3: Unknown Hours Shop (hours_status = 'unknown')
    const unknownShop = await createAdminShop({
      name: 'Mystery Repairs',
      slug: `s1-q2-unknown-${ts}`.slice(0, 30),
      category: 'repair_service',
      description: 'Repairs with unknown hours in Adyar.',
      address: '104 LB Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424410503',
      action_mode: 'phone_only',
      is_sample_data: false,
      actor: adminActor,
    });
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
       VALUES ($1, 'General', 'Diagnostics', 'service', 'fixed', 500, TRUE);`,
      [unknownShop.id]
    );
    await makeShopLive({ shopId: unknownShop.id, actor: adminActor });

    // Shop 4: Closure Day Shop (hours are 09:00 - 18:00, but has closure scheduled on target date)
    const closureShop = await createAdminShop({
      name: 'Holiday Repairs',
      slug: `s1-q2-closure-${ts}`.slice(0, 30),
      category: 'repair_service',
      description: 'Repairs closed today for maintenance.',
      address: '106 LB Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424410504',
      action_mode: 'phone_only',
      is_sample_data: false,
      actor: adminActor,
    });
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
       VALUES ($1, 'General', 'Diagnostics', 'service', 'fixed', 500, TRUE);`,
      [closureShop.id]
    );
    await makeShopLive({ shopId: closureShop.id, actor: adminActor });
    await query(
      `INSERT INTO shop_hours (shop_id, weekday, open_time, close_time)
       VALUES ($1, 0, '09:00', '18:00');`,
      [closureShop.id]
    );
    await query(`UPDATE shops SET hours_status = 'set' WHERE id = $1;`, [closureShop.id]);

    // Target date: Monday Oct 19, 2026 12:00 IST (UTC: 2026-10-19 06:30)
    const mondayNoon = new Date(Date.UTC(2026, 9, 19, 6, 30)); // 12:00 IST
    await query(
      `INSERT INTO shop_closures (shop_id, closed_on, reason)
       VALUES ($1, '2026-10-19', 'Deep clean');`,
      [closureShop.id]
    );

    // 1. Query with openNow: true at Monday 12:00 IST
    // Only openShop should be returned! (closedShop is outside hours, unknownShop is unknown, closureShop is closed)
    const openCandidates = await executeStage1({
      query: '',
      openNow: true,
      now: mondayNoon,
      showSampleData: false,
      limit: 50,
    });
    const openIds = openCandidates.map((c) => c.id);
    expect(openIds).toContain(openShop.id);
    expect(openIds).not.toContain(closedShop.id);
    expect(openIds).not.toContain(unknownShop.id);
    expect(openIds).not.toContain(closureShop.id);

    // 2. Query with openNow omitted / false at Monday 12:00 IST
    // All shops returned with their respective open_now status
    const allCandidates = await executeStage1({
      query: '',
      openNow: false,
      now: mondayNoon,
      showSampleData: false,
      limit: 50,
    });
    const openEntry = allCandidates.find((c) => c.id === openShop.id);
    const closedEntry = allCandidates.find((c) => c.id === closedShop.id);
    const unknownEntry = allCandidates.find((c) => c.id === unknownShop.id);
    const closureEntry = allCandidates.find((c) => c.id === closureShop.id);

    expect(openEntry?.open_now).toBe(true);
    expect(closedEntry?.open_now).toBe(false);
    expect(unknownEntry?.open_now).toBe(null);
    expect(closureEntry?.open_now).toBe(false);
  });

  it('Query 2: fetches top 5 items ordered by text similarity, sort order, and name', async () => {
    const ts = Date.now();
    const testShop = await createAdminShop({
      name: 'Chennai Super Gadgets',
      slug: `s1-q2-items-${ts}`.slice(0, 30),
      category: 'repair_service',
      description: 'Premier smartphone and tablet repair.',
      address: '200 LB Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424410505',
      action_mode: 'phone_only',
      is_sample_data: false,
      actor: adminActor,
    });

    // Insert 7 catalog items
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, description, kind, price_type, price_inr, sort_order, available)
       VALUES
       ($1, 'Screen', 'OLED Screen Replacement', 'Genuine display replacement for phones', 'service', 'fixed', 5000, 1, TRUE),
       ($1, 'Screen', 'LCD Screen Replacement', 'Budget display replacement for phones', 'service', 'fixed', 2500, 2, TRUE),
       ($1, 'Screen', 'Screen Glass Protector', 'Tempered glass for displays', 'product', 'fixed', 300, 3, TRUE),
       ($1, 'Power', 'Battery Replacement', 'High capacity lithium battery', 'service', 'fixed', 1500, 4, TRUE),
       ($1, 'Power', 'Charging Port Fix', 'Clean and resolder charging port', 'service', 'fixed', 800, 5, TRUE),
       ($1, 'Audio', 'Speaker Repair', 'Earpiece and loud speaker repair', 'service', 'fixed', 900, 6, TRUE),
       ($1, 'Camera', 'Rear Camera Glass', 'Back camera lens protector', 'product', 'fixed', 400, 7, FALSE);`, // unavailable!
      [testShop.id]
    );
    await makeShopLive({ shopId: testShop.id, actor: adminActor });

    // Execute Stage 1 with query 'Screen'
    const results = await executeStage1({
      query: 'Screen',
      showSampleData: false,
    });

    const shopCandidate = results.find((c) => c.id === testShop.id);
    expect(shopCandidate).toBeDefined();
    expect(shopCandidate!.baseline_rank).toBeGreaterThanOrEqual(1);
    expect(shopCandidate!.top_items).toHaveLength(5); // At most 5 items

    // Top items should prioritize items matching 'Screen'
    const topItemNames = shopCandidate!.top_items.map((i) => i.name);
    expect(topItemNames.slice(0, 3)).toEqual(
      expect.arrayContaining([
        'OLED Screen Replacement',
        'LCD Screen Replacement',
        'Screen Glass Protector',
      ])
    );
    // Unavailable item 'Rear Camera Glass' must NOT be in top items
    expect(topItemNames).not.toContain('Rear Camera Glass');

    // Each matching item should have is_matching = true
    const screenItem = shopCandidate!.top_items.find((i) => i.name === 'OLED Screen Replacement');
    expect(screenItem?.is_matching).toBe(true);

    // menu_updated_at must be populated
    expect(shopCandidate!.menu_updated_at).toBeDefined();
  });
});
