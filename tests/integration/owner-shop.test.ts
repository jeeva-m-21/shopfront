import { describe, it, expect, beforeEach } from 'vitest';
import { query } from '../../src/db.js';
import {
  getOwnerDashboard,
  getOwnerShop,
  updateOwnerShopDetails,
  ShopNotFoundError,
} from '../../src/owner/shop-ops.js';
import { createAdminShop } from '../../src/admin/shop-ops.js';

describe('Owner Shop Management & IDOR Security (Integration Tests)', () => {
  let adminActor: { id: string; username: string };
  let ownerUser1: { id: string; username: string };
  let ownerUser2: { id: string; username: string };
  let unassignedOwner: { id: string; username: string };

  beforeEach(async () => {
    // Unique user prefix for this test file to avoid race conditions: ownshp_
    const ts = Date.now();
    const adminRes = await query<{ id: string; username: string }>(
      `INSERT INTO users (username, password_hash, display_name, role, is_active)
       VALUES ($1, 'dummyhash', 'Admin Actor', 'admin', TRUE)
       RETURNING id, username;`,
      [`ownshp_adm_${ts}`.slice(0, 30)]
    );
    adminActor = adminRes.rows[0]!;

    const o1Res = await query<{ id: string; username: string }>(
      `INSERT INTO users (username, password_hash, display_name, role, is_active)
       VALUES ($1, 'dummyhash', 'Owner One', 'owner', TRUE)
       RETURNING id, username;`,
      [`ownshp_o1_${ts}`.slice(0, 30)]
    );
    ownerUser1 = o1Res.rows[0]!;

    const o2Res = await query<{ id: string; username: string }>(
      `INSERT INTO users (username, password_hash, display_name, role, is_active)
       VALUES ($1, 'dummyhash', 'Owner Two', 'owner', TRUE)
       RETURNING id, username;`,
      [`ownshp_o2_${ts}`.slice(0, 30)]
    );
    ownerUser2 = o2Res.rows[0]!;

    const unassignedRes = await query<{ id: string; username: string }>(
      `INSERT INTO users (username, password_hash, display_name, role, is_active)
       VALUES ($1, 'dummyhash', 'Unassigned Owner', 'owner', TRUE)
       RETURNING id, username;`,
      [`ownshp_una_${ts}`.slice(0, 30)]
    );
    unassignedOwner = unassignedRes.rows[0]!;

    // Clean up test shops created in this suite
    await query(`DELETE FROM shops WHERE slug LIKE 'ownshp-test-%';`);
  });

  it('O3: retrieves owner dashboard data including items count, menu updated date, and banner triggers', async () => {
    const slug = `ownshp-test-1-${Date.now()}`.slice(0, 30);
    const shop = await createAdminShop({
      name: 'Adyar Electronics Hub',
      slug,
      category: 'repair_service',
      description: 'Authorized gadget repairs and component replacements in Adyar.',
      address: '22 Sardar Patel Road, Adyar, Chennai',
      locality_id: 1, // Adyar
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424410001',
      action_mode: 'phone_only',
      is_sample_data: false,
      owner_id: ownerUser1.id,
      actor: adminActor,
    });

    // Check dashboard before adding items
    const dash1 = await getOwnerDashboard(ownerUser1.id);
    expect(dash1).not.toBeNull();
    expect(dash1?.shop.name).toBe('Adyar Electronics Hub');
    expect(dash1?.shop.status).toBe('draft');
    expect(dash1?.shop.hours_status).toBe('unknown');
    expect(dash1?.available_items_count).toBe(0);
    expect(dash1?.total_items_count).toBe(0);
    expect(dash1?.menu_updated_text).toBe('No menu items yet');
    expect(dash1?.banners.showUnknownHoursBanner).toBe(true);
    expect(dash1?.banners.showDraftBanner).toBe(true);
    expect(dash1?.banners.showAdminLockedBanner).toBe(false);

    // Insert 2 catalog items (1 available, 1 unavailable)
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available, sort_order)
       VALUES ($1, 'Repairs', 'Battery Replacement', 'service', 'fixed', 1500, TRUE, 0),
              ($1, 'Repairs', 'Screen Replacement', 'service', 'fixed', 3500, FALSE, 1);`,
      [shop.id]
    );

    // Fetch dashboard again
    const dash2 = await getOwnerDashboard(ownerUser1.id);
    expect(dash2).not.toBeNull();
    expect(dash2?.available_items_count).toBe(1);
    expect(dash2?.total_items_count).toBe(2);
    expect(dash2?.menu_updated_text).toMatch(/^Menu updated on /);
  });

  it('O3: handles unassigned owner returning null for shop dashboard', async () => {
    const dash = await getOwnerDashboard(unassignedOwner.id);
    expect(dash).toBeNull();
  });

  it('O4: IDOR protection prevents Owner 2 from viewing or updating Owner 1 shop', async () => {
    const slug = `ownshp-test-2-${Date.now()}`.slice(0, 30);
    const shop1 = await createAdminShop({
      name: 'Adyar Salon Luxe',
      slug,
      category: 'salon_wellness',
      description: 'Premium hair and skincare salon for men and women.',
      address: '15 Gandhi Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424410002',
      action_mode: 'phone_only',
      is_sample_data: false,
      owner_id: ownerUser1.id,
      actor: adminActor,
    });

    // Owner 1 can access their shop
    const owner1Shop = await getOwnerShop(ownerUser1.id, shop1.id);
    expect(owner1Shop.id).toBe(shop1.id);

    // Owner 2 attempting to access Owner 1 shop via getOwnerShop must throw 404 ShopNotFoundError
    await expect(getOwnerShop(ownerUser2.id, shop1.id)).rejects.toThrow(ShopNotFoundError);

    // Owner 2 attempting to update Owner 1 shop must throw 404 ShopNotFoundError
    await expect(
      updateOwnerShopDetails({
        ownerId: ownerUser2.id,
        requestedShopId: shop1.id,
        name: 'Hacked Shop Name',
        description: 'Attempted cross-tenant tamper by unauthorized owner.',
        address: 'Hacked Address Road',
        phone: '+914424419999',
        action_mode: 'phone_only',
        actor: ownerUser2,
      })
    ).rejects.toThrow(ShopNotFoundError);

    // Verify Owner 1 shop details were NOT changed
    const unchangedShop = await getOwnerShop(ownerUser1.id);
    expect(unchangedShop.name).toBe('Adyar Salon Luxe');
  });

  it('O4: updates allowed shop fields immediately and records audit log', async () => {
    const slug = `ownshp-test-3-${Date.now()}`.slice(0, 30);
    const shop = await createAdminShop({
      name: 'Velachery Quick Fix',
      slug,
      category: 'repair_service',
      description: 'Reliable doorstep mobile repair service in Velachery.',
      address: '88 Bypass Road, Velachery, Chennai',
      locality_id: 4, // Velachery
      latitude: 12.9815,
      longitude: 80.218,
      phone: '+914422430001',
      action_mode: 'phone_only',
      is_sample_data: false,
      owner_id: ownerUser1.id,
      actor: adminActor,
    });

    const updated = await updateOwnerShopDetails({
      ownerId: ownerUser1.id,
      requestedShopId: shop.id,
      name: 'Velachery Quick Fix & Gadgets',
      description: 'Authorized smartphone, tablet, and laptop hardware repair specialists.',
      address: '88 Bypass Road, Near Bus Terminus, Velachery, Chennai',
      phone: '+914422439999',
      whatsapp: '+919840123456',
      booking_url: 'https://velacheryquickfix.com/book',
      website_url: 'https://velacheryquickfix.com',
      action_mode: 'whatsapp',
      action_instructions: 'Please send your device model and the defect description.',
      actor: ownerUser1,
    });

    expect(updated.name).toBe('Velachery Quick Fix & Gadgets');
    expect(updated.phone).toBe('+914422439999');
    expect(updated.whatsapp).toBe('+919840123456');
    expect(updated.action_mode).toBe('whatsapp');
    expect(updated.action_instructions).toBe('Please send your device model and the defect description.');

    // Verify restricted fields did not change
    expect(updated.category).toBe('repair_service');
    expect(updated.locality_id).toBe(4);
    expect(updated.slug).toBe(slug);
    expect(updated.is_sample_data).toBe(false);

    // Verify audit log entry
    const auditRes = await query<{ action: string; entity_type: string; actor_username: string }>(
      `SELECT action, entity_type, actor_username FROM audit_log
       WHERE entity_id = $1 AND action = 'shop.update'
       ORDER BY created_at DESC LIMIT 1;`,
      [shop.id]
    );
    expect(auditRes.rows.length).toBe(1);
    expect(auditRes.rows[0]!.actor_username).toBe(ownerUser1.username);
  });

  it('O4: enforces action mode invariants during update', async () => {
    const slug = `ownshp-test-4-${Date.now()}`.slice(0, 30);
    const shop = await createAdminShop({
      name: 'Mylapore Coffee Roasters',
      slug,
      category: 'food_beverage',
      description: 'Artisanal South Indian filter coffee and fresh savouries.',
      address: '10 North Mada Street, Mylapore, Chennai',
      locality_id: 2, // Mylapore
      latitude: 13.0335,
      longitude: 80.2685,
      phone: '+914424640001',
      action_mode: 'phone_only',
      is_sample_data: false,
      owner_id: ownerUser1.id,
      actor: adminActor,
    });

    // Attempting whatsapp action_mode without whatsapp number must fail
    await expect(
      updateOwnerShopDetails({
        ownerId: ownerUser1.id,
        requestedShopId: shop.id,
        name: 'Mylapore Coffee Roasters',
        description: 'Artisanal South Indian filter coffee and fresh savouries.',
        address: '10 North Mada Street, Mylapore, Chennai',
        phone: '+914424640001',
        whatsapp: null,
        action_mode: 'whatsapp',
        actor: ownerUser1,
      })
    ).rejects.toThrow('WhatsApp number is required when action mode is whatsapp.');

    // Attempting external_url action_mode without booking URL must fail
    await expect(
      updateOwnerShopDetails({
        ownerId: ownerUser1.id,
        requestedShopId: shop.id,
        name: 'Mylapore Coffee Roasters',
        description: 'Artisanal South Indian filter coffee and fresh savouries.',
        address: '10 North Mada Street, Mylapore, Chennai',
        phone: '+914424640001',
        booking_url: null,
        action_mode: 'external_url',
        actor: ownerUser1,
      })
    ).rejects.toThrow('Booking URL is required when action mode is external_url.');
  });
});
