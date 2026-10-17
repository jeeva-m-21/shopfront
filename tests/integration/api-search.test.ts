import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/search/route';
import { publicRateLimiter } from '@/rate-limit';
import { NextRequest } from 'next/server';

describe('Public Search API /api/search (Integration Tests)', () => {
  beforeEach(() => {
    publicRateLimiter.reset();
  });

  it('GET /api/search returns 200 with search results', async () => {
    const req = new NextRequest('http://localhost:3000/api/search?locality=Adyar&show_sample_data=true', {
      headers: {
        'x-forwarded-for': '192.168.1.101',
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.shops).toBeDefined();
    expect(Array.isArray(body.shops)).toBe(true);
    expect(body.candidate_count).toBeGreaterThanOrEqual(1);
    expect(body.location_resolved).toEqual({
      name: 'Adyar',
      lat: 13.0012,
      lng: 80.2565,
      radius_km: 5,
    });
  });

  it('POST /api/search returns 200 with JSON body input', async () => {
    const req = new NextRequest('http://localhost:3000/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.102',
      },
      body: JSON.stringify({
        query: 'MacBook repair',
        locality: 'Adyar',
        show_sample_data: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.shops).toBeDefined();
    expect(body.shops.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/search returns 400 on location_required when "near me" lacks location', async () => {
    const req = new NextRequest('http://localhost:3000/api/search?q=laptop+repair+near+me', {
      headers: {
        'x-forwarded-for': '192.168.1.103',
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe('location_required');
    expect(body.error.data?.localities).toHaveLength(32);
  });

  it('GET /api/search returns 400 on coordinates outside service area', async () => {
    const req = new NextRequest('http://localhost:3000/api/search?lat=19.076&lng=72.8777', {
      headers: {
        'x-forwarded-for': '192.168.1.104',
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe('outside_service_area');
  });

  it('enforces 60 req/min rate limit per IP and returns HTTP 429', async () => {
    const ip = '192.168.1.200';
    for (let i = 0; i < 60; i++) {
      publicRateLimiter.check(ip, 60);
    }

    const req = new NextRequest('http://localhost:3000/api/search?locality=Adyar', {
      headers: {
        'x-forwarded-for': ip,
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(429);

    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe('rate_limited');
  });
});
