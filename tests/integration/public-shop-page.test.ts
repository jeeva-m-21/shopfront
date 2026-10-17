import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { query } from '@/db';
import { createAdminShop, makeShopLive, pauseShop } from '@/admin/shop-ops';
import ShopPage from '@/app/shop/[slug]/page';

describe('Public Shop Detail Page /shop/[slug] (Integration Tests)', () => {
  let adminActor: { id: string; username: string };

  beforeEach(async () => {
    const ts = Date.now();
    const adminRes = await query<{ id: string; username: string }>(
      `INSERT INTO users (username, password_hash, display_name, role, is_active)
       VALUES ($1, 'dummyhash', 'Admin Actor', 'admin', TRUE)
       RETURNING id, username;`,
      [`s6_pub_${ts}`.slice(0, 30)]
    );
    adminActor = adminRes.rows[0]!;

    await query(`DELETE FROM shops WHERE slug LIKE 's6-pub-%';`);
  });

  it('renders shop detail page for a live shop with catalog items and weekly hours', async () => {
    const ts = Date.now();
    const slug = `s6-pub-live-${ts}`.slice(0, 30);
    const shop = await createAdminShop({
      name: 'Adyar Quick Cuts',
      slug,
      category: 'salon_wellness',
      description: 'Classic grooming salon in Adyar.',
      address: '25 Kasturba Nagar, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424410900',
      whatsapp: '+919840112299',
      action_mode: 'whatsapp',
      is_sample_data: false,
      actor: adminActor,
    });

    await query(
      `INSERT INTO catalog_items (shop_id, group_name, name, kind, price_type, price_inr, available)
       VALUES ($1, 'Haircuts', 'Executive Haircut', 'service', 'fixed', 350, TRUE);`,
      [shop.id]
    );

    // Save weekly hours
    await query(
      `INSERT INTO shop_hours (shop_id, weekday, open_time, close_time)
       VALUES ($1, 1, '10:00', '20:00'), ($1, 2, '10:00', '20:00');`,
      [shop.id]
    );
    await query(`UPDATE shops SET hours_status = 'set' WHERE id = $1;`, [shop.id]);

    await makeShopLive({ shopId: shop.id, actor: adminActor });

    // Render the server component
    const pageComponent = await ShopPage({
      params: Promise.resolve({ slug }),
    });

    expect(pageComponent).toBeDefined();
    // Verify rendered content contains shop name and details
    const renderedString = renderToString(pageComponent);
    expect(renderedString).toContain('Adyar Quick Cuts');
    expect(renderedString).toContain('25 Kasturba Nagar, Adyar');
    expect(renderedString).toContain('Executive Haircut');
    expect(renderedString).toContain('350');
    expect(renderedString).toContain('Opens direct enquiry with the business');
  });

  it('triggers notFound() when shop slug does not exist', async () => {
    await expect(
      ShopPage({
        params: Promise.resolve({ slug: 'non-existent-shop-slug-999' }),
      })
    ).rejects.toThrow();
  });

  it('triggers notFound() when shop is paused', async () => {
    const ts = Date.now();
    const slug = `s6-pub-paused-${ts}`.slice(0, 30);
    const shop = await createAdminShop({
      name: 'Paused Shop',
      slug,
      category: 'repair_service',
      description: 'Phone repair.',
      address: '10 Road, Adyar',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424410901',
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
    await pauseShop({ shopId: shop.id, actor: adminActor });

    await expect(
      ShopPage({
        params: Promise.resolve({ slug }),
      })
    ).rejects.toThrow();
  });

  it('triggers notFound() when shop is a draft', async () => {
    const ts = Date.now();
    const slug = `s6-pub-draft-${ts}`.slice(0, 30);
    await createAdminShop({
      name: 'Draft Shop',
      slug,
      category: 'food_beverage',
      description: 'Fresh coffee and tea cafe.',
      address: '10 Road, Adyar',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424410902',
      action_mode: 'phone_only',
      is_sample_data: false,
      actor: adminActor,
    });

    await expect(
      ShopPage({
        params: Promise.resolve({ slug }),
      })
    ).rejects.toThrow();
  });
});
