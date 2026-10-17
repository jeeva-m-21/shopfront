import { describe, it, expect, beforeEach } from 'vitest';
import { query } from '../../src/db.js';
import {
  createAdminShop,
  updateAdminShop,
  makeShopLive,
  pauseShop,
  deleteShop,
  listAdminShops,
  getAdminShopById,
} from '../../src/admin/shop-ops.js';

describe('Admin Shop Management (Integration Tests)', () => {
  let adminActor: { id: string; username: string };

  beforeEach(async () => {
    // Ensure admin user exists for audit log FK
    const adminUsername = `admshop_${Date.now()}`.slice(0, 30);
    const adminRes = await query<{ id: string; username: string }>(
      `INSERT INTO users (username, password_hash, display_name, role, is_active)
       VALUES ($1, 'dummyhash', 'Shop Admin', 'admin', TRUE)
       RETURNING id, username;`,
      [adminUsername]
    );
    adminActor = {
      id: adminRes.rows[0]!.id,
      username: adminRes.rows[0]!.username,
    };

    // Clean up test shops
    await query(`DELETE FROM shops WHERE slug LIKE 'test-shop-%';`);
  });

  it('creates a new shop with draft status and audits the operation', async () => {
    const slug = `test-shop-${Date.now()}`.slice(0, 30);

    const shop = await createAdminShop({
      name: 'Adyar Quick Repair',
      slug,
      category: 'repair_service',
      description: 'Expert mobile and electronics repair service in Adyar.',
      address: '12 Gandhi Road, Adyar, Chennai',
      locality_id: 1, // Adyar
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424410000',
      action_mode: 'phone_only',
      is_sample_data: false,
      actor: adminActor,
    });

    expect(shop.id).toBeDefined();
    expect(shop.slug).toBe(slug);
    expect(shop.status).toBe('draft');
    expect(shop.hours_status).toBe('unknown');
    expect(shop.admin_locked).toBe(false);

    // Verify audit log
    const auditRes = await query<{ action: string; entity_type: string }>(
      `SELECT action, entity_type FROM audit_log WHERE entity_id = $1 AND action = 'shop.create';`,
      [shop.id]
    );
    expect(auditRes.rows.length).toBe(1);
    expect(auditRes.rows[0]?.action).toBe('shop.create');
  });

  it('enforces validation constraints on shop creation', async () => {
    const slug = `test-shop-val-${Date.now()}`.slice(0, 30);

    // Missing whatsapp number when action_mode is whatsapp
    await expect(
      createAdminShop({
        name: 'Invalid Action Shop',
        slug,
        category: 'food_beverage',
        description: 'Delicious food in Chennai.',
        address: '12 Anna Nagar, Chennai',
        locality_id: 2,
        latitude: 13.085,
        longitude: 80.21,
        phone: '+914424410000',
        action_mode: 'whatsapp', // Requires whatsapp!
        is_sample_data: false,
        actor: adminActor,
      })
    ).rejects.toThrow(/WhatsApp number is required when action mode is whatsapp/);

    // Missing data_source_note when is_sample_data is true
    await expect(
      createAdminShop({
        name: 'Invalid Sample Shop',
        slug,
        category: 'food_beverage',
        description: 'Delicious food in Chennai.',
        address: '12 Anna Nagar, Chennai',
        locality_id: 2,
        latitude: 13.085,
        longitude: 80.21,
        phone: '+914424410000',
        action_mode: 'phone_only',
        is_sample_data: true, // Requires data_source_note!
        actor: adminActor,
      })
    ).rejects.toThrow(/data_source_note is required when is_sample_data is true/);

    // Out of bounds coordinates (Delhi coordinates)
    await expect(
      createAdminShop({
        name: 'Delhi Shop in Chennai App',
        slug,
        category: 'food_beverage',
        description: 'Delicious food in Chennai.',
        address: '12 Connaught Place',
        locality_id: 2,
        latitude: 28.6139,
        longitude: 77.2090,
        phone: '+914424410000',
        action_mode: 'phone_only',
        is_sample_data: false,
        actor: adminActor,
      })
    ).rejects.toThrow(/Coordinates outside Chennai service area/);
  });

  it('blocks Make Live when shop has 0 available menu items, and allows when items exist', async () => {
    const slug = `test-shop-live-${Date.now()}`.slice(0, 30);

    const shop = await createAdminShop({
      name: 'Bistro Live Check',
      slug,
      category: 'food_beverage',
      description: 'Quality dining in Mylapore Chennai.',
      address: '44 Luz Church Road, Mylapore',
      locality_id: 4,
      latitude: 13.033,
      longitude: 80.267,
      phone: '+914424411111',
      action_mode: 'phone_only',
      is_sample_data: false,
      actor: adminActor,
    });

    // Make live should fail because 0 items exist
    await expect(
      makeShopLive({
        shopId: shop.id,
        actor: adminActor,
      })
    ).rejects.toThrow('Add at least one available menu item first');

    // Add an unavailable item - should still fail
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
       VALUES ($1, 'Beverages', 'Filter Coffee', 'product', 'fixed', 40, FALSE);`,
      [shop.id]
    );

    await expect(
      makeShopLive({
        shopId: shop.id,
        actor: adminActor,
      })
    ).rejects.toThrow('Add at least one available menu item first');

    // Add an available item - should succeed!
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
       VALUES ($1, 'Tiffin', 'Masala Dosa', 'product', 'fixed', 90, TRUE);`,
      [shop.id]
    );

    const liveShop = await makeShopLive({
      shopId: shop.id,
      actor: adminActor,
    });

    expect(liveShop.status).toBe('live');
    expect(liveShop.admin_locked).toBe(false);

    // Verify audit log
    const auditRes = await query<{ action: string }>(
      `SELECT action FROM audit_log WHERE entity_id = $1 AND action = 'shop.make_live';`,
      [shop.id]
    );
    expect(auditRes.rows.length).toBe(1);
  });

  it('pauses shop and sets admin_locked = true', async () => {
    const slug = `test-shop-pause-${Date.now()}`.slice(0, 30);

    const shop = await createAdminShop({
      name: 'Pause Target Shop',
      slug,
      category: 'salon_wellness',
      description: 'Hair styling and spa in Besant Nagar.',
      address: '15 Beach Road, Besant Nagar',
      locality_id: 3,
      latitude: 12.998,
      longitude: 80.269,
      phone: '+914424422222',
      action_mode: 'phone_only',
      is_sample_data: false,
      actor: adminActor,
    });

    const pausedShop = await pauseShop({
      shopId: shop.id,
      actor: adminActor,
    });

    expect(pausedShop.status).toBe('paused');
    expect(pausedShop.admin_locked).toBe(true);

    const auditRes = await query<{ action: string }>(
      `SELECT action FROM audit_log WHERE entity_id = $1 AND action = 'shop.pause';`,
      [shop.id]
    );
    expect(auditRes.rows.length).toBe(1);
  });

  it('deletes shop only when slug confirmation matches', async () => {
    const slug = `test-shop-del-${Date.now()}`.slice(0, 30);

    const shop = await createAdminShop({
      name: 'Delete Target Shop',
      slug,
      category: 'food_beverage',
      description: 'Test shop to be deleted.',
      address: '12 Mount Road, Chennai',
      locality_id: 1,
      latitude: 13.02,
      longitude: 80.24,
      phone: '+914424433333',
      action_mode: 'phone_only',
      is_sample_data: false,
      actor: adminActor,
    });

    // Mismatched slug should fail
    await expect(
      deleteShop({
        shopId: shop.id,
        confirmationSlug: 'wrong-slug-entered',
        actor: adminActor,
      })
    ).rejects.toThrow(/Shop slug confirmation mismatch/);

    // Matching slug succeeds
    await deleteShop({
      shopId: shop.id,
      confirmationSlug: slug,
      actor: adminActor,
    });

    // Verify shop is gone
    const fetched = await getAdminShopById(shop.id);
    expect(fetched).toBeNull();

    // Verify audit log
    const auditRes = await query<{ action: string }>(
      `SELECT action FROM audit_log WHERE entity_id = $1 AND action = 'shop.delete';`,
      [shop.id]
    );
    expect(auditRes.rows.length).toBe(1);
  });
});
