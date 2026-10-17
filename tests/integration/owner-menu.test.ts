import { describe, it, expect, beforeEach } from 'vitest';
import { query } from '../../src/db.js';
import {
  listOwnerMenuItems,
  createOwnerMenuItem,
  updateOwnerMenuItem,
  toggleOwnerMenuItemAvailable,
  deleteOwnerMenuItem,
  ItemNotFoundError,
} from '../../src/owner/menu-ops.js';
import { createAdminShop, makeShopLive } from '../../src/admin/shop-ops.js';

describe('Owner Menu Management & D13 Invariant (Integration Tests)', () => {
  let adminActor: { id: string; username: string };
  let ownerUser1: { id: string; username: string };
  let ownerUser2: { id: string; username: string };

  beforeEach(async () => {
    const ts = Date.now();
    const adminRes = await query<{ id: string; username: string }>(
      `INSERT INTO users (username, password_hash, display_name, role, is_active)
       VALUES ($1, 'dummyhash', 'Admin Actor', 'admin', TRUE)
       RETURNING id, username;`,
      [`ownmenu_adm_${ts}`.slice(0, 30)]
    );
    adminActor = adminRes.rows[0]!;

    const o1Res = await query<{ id: string; username: string }>(
      `INSERT INTO users (username, password_hash, display_name, role, is_active)
       VALUES ($1, 'dummyhash', 'Owner One', 'owner', TRUE)
       RETURNING id, username;`,
      [`ownmenu_o1_${ts}`.slice(0, 30)]
    );
    ownerUser1 = o1Res.rows[0]!;

    const o2Res = await query<{ id: string; username: string }>(
      `INSERT INTO users (username, password_hash, display_name, role, is_active)
       VALUES ($1, 'dummyhash', 'Owner Two', 'owner', TRUE)
       RETURNING id, username;`,
      [`ownmenu_o2_${ts}`.slice(0, 30)]
    );
    ownerUser2 = o2Res.rows[0]!;

    await query(`DELETE FROM shops WHERE slug LIKE 'ownmenu-test-%';`);
  });

  it('O5: adds item with validation, formats tags, and audits creation', async () => {
    const slug = `ownmenu-test-1-${Date.now()}`.slice(0, 30);
    const shop = await createAdminShop({
      name: 'Adyar Gadget Care',
      slug,
      category: 'repair_service',
      description: 'Expert smartphone repair center in Adyar.',
      address: '10 Sardar Patel Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424411111',
      action_mode: 'phone_only',
      is_sample_data: false,
      owner_id: ownerUser1.id,
      actor: adminActor,
    });

    const item = await createOwnerMenuItem({
      ownerId: ownerUser1.id,
      group_name: 'Battery & Charging',
      name: 'iPhone 13 Battery Replacement',
      description: 'Original capacity battery replacement with 6-month warranty.',
      kind: 'service',
      price_type: 'fixed',
      price_inr: 2800,
      duration_min: 45,
      tags: ['Battery', 'IPHONE', 'Charging '],
      available: true,
      sort_order: 1,
      actor: ownerUser1,
    });

    expect(item.id).toBeDefined();
    expect(item.shop_id).toBe(shop.id);
    expect(item.group_name).toBe('Battery & Charging');
    expect(item.name).toBe('iPhone 13 Battery Replacement');
    expect(item.price_inr).toBe(2800);
    expect(item.duration_min).toBe(45);
    expect(item.tags).toEqual(['battery', 'iphone', 'charging']);
    expect(item.available).toBe(true);

    // Verify search_text trigger generated lowercase text
    expect(item.search_text).toContain('iphone 13 battery replacement');
    expect(item.search_text).toContain('battery iphone charging');

    // Verify audit log
    const auditRes = await query<{ action: string; entity_type: string }>(
      `SELECT action, entity_type FROM audit_log WHERE entity_id = $1 AND action = 'item.create';`,
      [item.id]
    );
    expect(auditRes.rows.length).toBe(1);
  });

  it('O5: enforces category-specific validations (duration on services only, diet on food only)', async () => {
    const slug = `ownmenu-test-2-${Date.now()}`.slice(0, 30);
    await createAdminShop({
      name: 'Adyar Tech Spares',
      slug,
      category: 'repair_service',
      description: 'Computer spares and components in Adyar.',
      address: '12 Sardar Patel Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424411112',
      action_mode: 'phone_only',
      is_sample_data: false,
      owner_id: ownerUser1.id,
      actor: adminActor,
    });

    // Rejects duration on a product
    await expect(
      createOwnerMenuItem({
        ownerId: ownerUser1.id,
        group_name: 'Accessories',
        name: 'USB-C Cable',
        kind: 'product',
        price_type: 'fixed',
        price_inr: 499,
        duration_min: 30, // Invalid for product
        actor: ownerUser1,
      })
    ).rejects.toThrow('Duration may only be set for service items.');

    // Rejects diet on a non-food shop
    await expect(
      createOwnerMenuItem({
        ownerId: ownerUser1.id,
        group_name: 'Accessories',
        name: 'Screen Guard',
        kind: 'product',
        price_type: 'fixed',
        price_inr: 299,
        diet: 'veg', // Invalid for repair_service
        actor: ownerUser1,
      })
    ).rejects.toThrow('Diet may only be set for food and beverage items.');
  });

  it('O5: enforces 100-item ceiling', async () => {
    const slug = `ownmenu-test-3-${Date.now()}`.slice(0, 30);
    const shop = await createAdminShop({
      name: 'Adyar Electronics Warehouse',
      slug,
      category: 'repair_service',
      description: 'Extensive catalog parts shop in Adyar.',
      address: '15 Sardar Patel Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424411113',
      action_mode: 'phone_only',
      is_sample_data: false,
      owner_id: ownerUser1.id,
      actor: adminActor,
    });

    // Bulk insert 100 items directly
    const itemValues: string[] = [];
    for (let i = 1; i <= 100; i++) {
      itemValues.push(`('${shop.id}', 'Parts', 'Component Part ${i}', 'product', 'fixed', 100, TRUE, ${i})`);
    }
    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available, sort_order)
       VALUES ${itemValues.join(', ')};`
    );

    // Attempting to add 101st item must be rejected with exact PRD error
    await expect(
      createOwnerMenuItem({
        ownerId: ownerUser1.id,
        group_name: 'Parts',
        name: 'Component Part 101',
        kind: 'product',
        price_type: 'fixed',
        price_inr: 150,
        actor: ownerUser1,
      })
    ).rejects.toThrow('Menu limit reached (100 items)');
  });

  it('O5 & D13: enforces live shop invariant (rejects toggle off or delete when it leaves 0 available items)', async () => {
    const slug = `ownmenu-test-4-${Date.now()}`.slice(0, 30);
    const shop = await createAdminShop({
      name: 'Adyar Quick Cuts',
      slug,
      category: 'salon_wellness',
      description: 'Modern styling and grooming salon in Adyar.',
      address: '25 Gandhi Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424411114',
      action_mode: 'phone_only',
      is_sample_data: false,
      owner_id: ownerUser1.id,
      actor: adminActor,
    });

    // Add 1 available item
    const item1 = await createOwnerMenuItem({
      ownerId: ownerUser1.id,
      group_name: 'Haircuts',
      name: 'Classic Haircut',
      kind: 'service',
      price_type: 'fixed',
      price_inr: 250,
      available: true,
      actor: ownerUser1,
    });

    // Make the shop live as admin
    await makeShopLive({ shopId: shop.id, actor: adminActor });

    // Attempting to toggle off the only available item on a live shop must fail with exact D13 message
    await expect(
      toggleOwnerMenuItemAvailable(ownerUser1.id, item1.id, false, ownerUser1)
    ).rejects.toThrow('A live shop needs at least one available item. Pause your listing first.');

    // Attempting to delete the only available item on a live shop must fail with exact D13 message
    await expect(
      deleteOwnerMenuItem(ownerUser1.id, item1.id, ownerUser1)
    ).rejects.toThrow('A live shop needs at least one available item. Pause your listing first.');

    // Now add a second available item
    const item2 = await createOwnerMenuItem({
      ownerId: ownerUser1.id,
      group_name: 'Haircuts',
      name: 'Beard Trim',
      kind: 'service',
      price_type: 'fixed',
      price_inr: 150,
      available: true,
      actor: ownerUser1,
    });

    // Now toggling off item1 succeeds because item2 remains available
    const toggled = await toggleOwnerMenuItemAvailable(ownerUser1.id, item1.id, false, ownerUser1);
    expect(toggled.available).toBe(false);

    // Now item2 is the ONLY available item. Attempting to delete item2 must fail!
    await expect(
      deleteOwnerMenuItem(ownerUser1.id, item2.id, ownerUser1)
    ).rejects.toThrow('A live shop needs at least one available item. Pause your listing first.');

    // Deleting item1 (which is already unavailable) succeeds
    await deleteOwnerMenuItem(ownerUser1.id, item1.id, ownerUser1);
    const remaining = await listOwnerMenuItems(ownerUser1.id);
    expect(remaining.items.length).toBe(1);
    expect(remaining.items[0]!.id).toBe(item2.id);
  });

  it('O5: IDOR protection prevents Owner 2 from viewing, updating, toggling, or deleting Owner 1 item', async () => {
    const slug1 = `ownmenu-test-5-${Date.now()}`.slice(0, 30);
    await createAdminShop({
      name: 'Adyar Cafe One',
      slug: slug1,
      category: 'food_beverage',
      description: 'Specialty cafe and fresh bakery in Adyar.',
      address: '30 Gandhi Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424411115',
      action_mode: 'phone_only',
      is_sample_data: false,
      owner_id: ownerUser1.id,
      actor: adminActor,
    });

    const item1 = await createOwnerMenuItem({
      ownerId: ownerUser1.id,
      group_name: 'Beverages',
      name: 'Filter Coffee',
      kind: 'product',
      price_type: 'fixed',
      price_inr: 40,
      diet: 'veg',
      available: true,
      actor: ownerUser1,
    });

    const slug2 = `ownmenu-test-6-${Date.now()}`.slice(0, 30);
    await createAdminShop({
      name: 'Adyar Cafe Two',
      slug: slug2,
      category: 'food_beverage',
      description: 'Another specialty cafe in Adyar.',
      address: '35 Gandhi Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424411116',
      action_mode: 'phone_only',
      is_sample_data: false,
      owner_id: ownerUser2.id,
      actor: adminActor,
    });

    // Owner 2 attempting to update Owner 1 item must throw ItemNotFoundError
    await expect(
      updateOwnerMenuItem({
        ownerId: ownerUser2.id,
        itemId: item1.id,
        name: 'Hacked Coffee',
        group_name: 'Beverages',
        kind: 'product',
        price_type: 'fixed',
        price_inr: 10,
        actor: ownerUser2,
      })
    ).rejects.toThrow(ItemNotFoundError);

    // Owner 2 attempting to toggle Owner 1 item must throw ItemNotFoundError
    await expect(
      toggleOwnerMenuItemAvailable(ownerUser2.id, item1.id, false, ownerUser2)
    ).rejects.toThrow(ItemNotFoundError);

    // Owner 2 attempting to delete Owner 1 item must throw ItemNotFoundError
    await expect(
      deleteOwnerMenuItem(ownerUser2.id, item1.id, ownerUser2)
    ).rejects.toThrow(ItemNotFoundError);
  });
});
