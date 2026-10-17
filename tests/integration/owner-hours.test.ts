import { describe, it, expect, beforeEach } from 'vitest';
import { query } from '../../src/db.js';
import {
  getOwnerHoursAndClosures,
  saveOwnerWeeklyHours,
  addOwnerClosure,
  removeOwnerClosure,
  ClosureNotFoundError,
} from '../../src/owner/hours-ops.js';
import { createAdminShop } from '../../src/admin/shop-ops.js';
import { getIstParts } from '../../src/domain/hours.js';

describe('Owner Hours & Closures Management (Integration Tests)', () => {
  let adminActor: { id: string; username: string };
  let ownerUser1: { id: string; username: string };
  let ownerUser2: { id: string; username: string };

  beforeEach(async () => {
    const ts = Date.now();
    const adminRes = await query<{ id: string; username: string }>(
      `INSERT INTO users (username, password_hash, display_name, role, is_active)
       VALUES ($1, 'dummyhash', 'Admin Actor', 'admin', TRUE)
       RETURNING id, username;`,
      [`ownhrs_adm_${ts}`.slice(0, 30)]
    );
    adminActor = adminRes.rows[0]!;

    const o1Res = await query<{ id: string; username: string }>(
      `INSERT INTO users (username, password_hash, display_name, role, is_active)
       VALUES ($1, 'dummyhash', 'Owner One', 'owner', TRUE)
       RETURNING id, username;`,
      [`ownhrs_o1_${ts}`.slice(0, 30)]
    );
    ownerUser1 = o1Res.rows[0]!;

    const o2Res = await query<{ id: string; username: string }>(
      `INSERT INTO users (username, password_hash, display_name, role, is_active)
       VALUES ($1, 'dummyhash', 'Owner Two', 'owner', TRUE)
       RETURNING id, username;`,
      [`ownhrs_o2_${ts}`.slice(0, 30)]
    );
    ownerUser2 = o2Res.rows[0]!;

    await query(`DELETE FROM shops WHERE slug LIKE 'ownhrs-test-%';`);
  });

  it('O6: saves weekly hours, updates hours_status to set, and audits change', async () => {
    const slug = `ownhrs-test-1-${Date.now()}`.slice(0, 30);
    const shop = await createAdminShop({
      name: 'Adyar Diagnostic Lab',
      slug,
      category: 'salon_wellness',
      description: 'Medical laboratory and wellness tests in Adyar.',
      address: '50 Gandhi Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424412221',
      action_mode: 'phone_only',
      is_sample_data: false,
      owner_id: ownerUser1.id,
      actor: adminActor,
    });

    // Initial state: hours_status = 'unknown'
    const initial = await getOwnerHoursAndClosures(ownerUser1.id);
    expect(initial.shop.hours_status).toBe('unknown');
    expect(initial.intervals.length).toBe(0);

    // Save weekly schedule: Mon-Fri 09:00-13:00, 16:00-21:00 (split shift)
    const intervals = [
      { weekday: 0, open_time: '09:00', close_time: '13:00' },
      { weekday: 0, open_time: '16:00', close_time: '21:00' },
      { weekday: 1, open_time: '09:00', close_time: '21:00' },
      { weekday: 2, open_time: '09:00', close_time: '21:00' },
      { weekday: 3, open_time: '09:00', close_time: '21:00' },
      { weekday: 4, open_time: '09:00', close_time: '21:00' },
      { weekday: 5, open_time: '10:00', close_time: '18:00' },
    ];

    await saveOwnerWeeklyHours({
      ownerId: ownerUser1.id,
      intervals,
      actor: ownerUser1,
    });

    const updated = await getOwnerHoursAndClosures(ownerUser1.id);
    expect(updated.shop.hours_status).toBe('set');
    expect(updated.intervals.length).toBe(7);

    // Verify audit log
    const auditRes = await query<{ action: string; entity_type: string }>(
      `SELECT action, entity_type FROM audit_log WHERE entity_id = $1 AND action = 'shop.hours_update';`,
      [shop.id]
    );
    expect(auditRes.rows.length).toBe(1);
  });

  it('O6: rejects overlapping intervals on the same weekday', async () => {
    const slug = `ownhrs-test-2-${Date.now()}`.slice(0, 30);
    await createAdminShop({
      name: 'Adyar Pet Care',
      slug,
      category: 'salon_wellness',
      description: 'Veterinary care and pet grooming in Adyar.',
      address: '52 Gandhi Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424412222',
      action_mode: 'phone_only',
      is_sample_data: false,
      owner_id: ownerUser1.id,
      actor: adminActor,
    });

    // Overlapping intervals: 09:00–14:00 and 13:00–18:00 on Monday (weekday 0)
    await expect(
      saveOwnerWeeklyHours({
        ownerId: ownerUser1.id,
        intervals: [
          { weekday: 0, open_time: '09:00', close_time: '14:00' },
          { weekday: 0, open_time: '13:00', close_time: '18:00' },
        ],
        actor: ownerUser1,
      })
    ).rejects.toThrow(/overlap/i);
  });

  it('O6: manages closures (adds future closure, filters out past closures, removes closure)', async () => {
    const slug = `ownhrs-test-3-${Date.now()}`.slice(0, 30);
    const shop = await createAdminShop({
      name: 'Adyar Sweet House',
      slug,
      category: 'food_beverage',
      description: 'Traditional sweets and snacks in Adyar.',
      address: '55 Gandhi Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424412223',
      action_mode: 'phone_only',
      is_sample_data: false,
      owner_id: ownerUser1.id,
      actor: adminActor,
    });

    const todayStr = getIstParts(new Date()).dateStr;
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const tomorrowStr = getIstParts(tomorrow).dateStr;

    // Insert a past closure directly to test filtering
    await query(
      `INSERT INTO shop_closures (shop_id, closed_on, reason)
       VALUES ($1, '2020-01-01', 'Old historical closure');`,
      [shop.id]
    );

    // Add future closure via domain operation
    const closure = await addOwnerClosure({
      ownerId: ownerUser1.id,
      closed_on: tomorrowStr,
      reason: 'Deep Cleaning & Renovation',
      actor: ownerUser1,
    });

    expect(closure.id).toBeDefined();
    expect(closure.closed_on).toBe(tomorrowStr);
    expect(closure.reason).toBe('Deep Cleaning & Renovation');

    // Fetch closures: past closure '2020-01-01' must NOT be shown!
    const data = await getOwnerHoursAndClosures(ownerUser1.id);
    expect(data.closures.some((c) => c.closed_on === '2020-01-01')).toBe(false);
    expect(data.closures.some((c) => c.closed_on === tomorrowStr)).toBe(true);

    // Reject past closure attempt
    await expect(
      addOwnerClosure({
        ownerId: ownerUser1.id,
        closed_on: '2021-05-10',
        reason: 'Should be rejected',
        actor: ownerUser1,
      })
    ).rejects.toThrow('Closure date cannot be in the past.');

    // Remove closure
    await removeOwnerClosure({
      ownerId: ownerUser1.id,
      closureId: closure.id,
      actor: ownerUser1,
    });

    const afterRemove = await getOwnerHoursAndClosures(ownerUser1.id);
    expect(afterRemove.closures.length).toBe(0);
  });

  it('O6: IDOR protection prevents Owner 2 from deleting Owner 1 closure', async () => {
    const slug1 = `ownhrs-test-4-${Date.now()}`.slice(0, 30);
    const shop1 = await createAdminShop({
      name: 'Adyar Bakery A',
      slug: slug1,
      category: 'food_beverage',
      description: 'Artisanal bakery in Adyar.',
      address: '60 Gandhi Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424412224',
      action_mode: 'phone_only',
      is_sample_data: false,
      owner_id: ownerUser1.id,
      actor: adminActor,
    });

    const slug2 = `ownhrs-test-5-${Date.now()}`.slice(0, 30);
    await createAdminShop({
      name: 'Adyar Bakery B',
      slug: slug2,
      category: 'food_beverage',
      description: 'Artisanal bakery in Adyar.',
      address: '62 Gandhi Road, Adyar, Chennai',
      locality_id: 1,
      latitude: 13.0012,
      longitude: 80.2565,
      phone: '+914424412225',
      action_mode: 'phone_only',
      is_sample_data: false,
      owner_id: ownerUser2.id,
      actor: adminActor,
    });

    const tomorrowStr = getIstParts(new Date(Date.now() + 24 * 60 * 60 * 1000)).dateStr;
    const closure1 = await addOwnerClosure({
      ownerId: ownerUser1.id,
      closed_on: tomorrowStr,
      reason: 'Owner 1 Holiday',
      actor: ownerUser1,
    });

    // Owner 2 attempting to remove Owner 1 closure must throw ClosureNotFoundError
    await expect(
      removeOwnerClosure({
        ownerId: ownerUser2.id,
        closureId: closure1.id,
        actor: ownerUser2,
      })
    ).rejects.toThrow(ClosureNotFoundError);
  });
});
