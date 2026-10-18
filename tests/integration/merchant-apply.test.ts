import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../../src/app/api/merchant/apply/route.js';
import { query } from '../../src/db.js';

describe('Merchant Apply API (SPRINT-8.4)', () => {
  const testPhone = '+919988776655';
  const testWhatsapp = '+919988776655';
  let createdShopId: string | null = null;

  beforeAll(async () => {
    await query('DELETE FROM audit_log WHERE entity_id IN (SELECT id::text FROM shops WHERE phone = $1)', [testPhone]);
    await query('DELETE FROM shops WHERE phone = $1', [testPhone]);
  });

  afterAll(async () => {
    if (createdShopId) {
      await query('DELETE FROM audit_log WHERE entity_id = $1', [createdShopId]);
      await query('DELETE FROM shops WHERE id = $1', [createdShopId]);
    }
  });

  it('rejects application without merchant consent', async () => {
    const req = new NextRequest('http://localhost:3000/api/merchant/apply', {
      method: 'POST',
      body: JSON.stringify({
        business_name: 'Test Mobile Care',
        category: 'repair_service',
        description: 'Quality smartphone repairs in Adyar with genuine parts.',
        address: '10 Sardar Patel Road, Adyar',
        locality_name: 'Adyar',
        phone: testPhone,
        whatsapp: testWhatsapp,
        owner_name: 'Ramesh',
        consent: false,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('invalid_input');
  });

  it('rejects unsupported locality', async () => {
    const req = new NextRequest('http://localhost:3000/api/merchant/apply', {
      method: 'POST',
      body: JSON.stringify({
        business_name: 'Test Mobile Care',
        category: 'repair_service',
        description: 'Quality smartphone repairs in Adyar with genuine parts.',
        address: '10 Sardar Patel Road',
        locality_name: 'Bengaluru Indiranagar',
        phone: testPhone,
        whatsapp: testWhatsapp,
        owner_name: 'Ramesh',
        consent: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('locality_not_found');
  });

  it('successfully creates draft shop and records audit log on valid submission', async () => {
    const req = new NextRequest('http://localhost:3000/api/merchant/apply', {
      method: 'POST',
      body: JSON.stringify({
        business_name: 'Karthik Laptop Station',
        category: 'repair_service',
        description: 'Precision motherboard chip-level repair and screen replacement.',
        address: '12 Gandhi Road, Adyar, Chennai 600020',
        locality_name: 'Adyar',
        phone: testPhone,
        whatsapp: testWhatsapp,
        owner_name: 'Karthik S',
        consent: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.shop_id).toBeDefined();
    expect(body.data.slug).toContain('karthik-laptop-station');

    createdShopId = body.data.shop_id;

    // Verify shop status is draft in DB
    const shopRow = await query<{ status: string; is_sample_data: boolean }>(
      'SELECT status, is_sample_data FROM shops WHERE id = $1',
      [createdShopId]
    );
    expect(shopRow.rows[0]?.status).toBe('draft');
    expect(shopRow.rows[0]?.is_sample_data).toBe(false);

    // Verify audit log entry
    const auditRow = await query<{ action: string; actor_username: string }>(
      'SELECT action, actor_username FROM audit_log WHERE entity_id = $1',
      [createdShopId]
    );
    expect(auditRow.rows[0]?.action).toBe('merchant.apply');
    expect(auditRow.rows[0]?.actor_username).toBe('system');
  });

  it('rejects duplicate application with already registered phone', async () => {
    const req = new NextRequest('http://localhost:3000/api/merchant/apply', {
      method: 'POST',
      body: JSON.stringify({
        business_name: 'Another Store Name',
        category: 'repair_service',
        description: 'Duplicate phone test shop description here.',
        address: '15 LB Road, Adyar',
        locality_name: 'Adyar',
        phone: testPhone,
        whatsapp: testWhatsapp,
        owner_name: 'Ramesh',
        consent: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe('already_registered');
  });
});
