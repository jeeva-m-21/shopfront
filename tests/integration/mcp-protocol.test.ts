import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '../../src/app/mcp/route.js';
import { publicRateLimiter } from '../../src/rate-limit.js';
import { query } from '../../src/db.js';

describe('Stateless MCP Server Protocol Conformance (Integration Tests)', () => {
  beforeEach(async () => {
    publicRateLimiter.reset();
  });

  it('rejects GET /mcp with HTTP 405 and Allow: POST', async () => {
    const res = await GET();
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('POST');
  });

  it('rejects DELETE /mcp with HTTP 405 and Allow: POST', async () => {
    const res = await DELETE();
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('POST');
  });

  it('handles MCP initialize over POST /mcp without session headers (stateless mode)', async () => {
    const initPayload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' },
      },
    };

    const req = new NextRequest('http://localhost:3000/mcp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify(initPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Verify stateless: no mcp-session-id header
    expect(res.headers.get('mcp-session-id')).toBeNull();

    const body = await res.json();
    expect(body.jsonrpc).toBe('2.0');
    expect(body.id).toBe(1);
    expect(body.result?.serverInfo?.name).toBe('shopfront-mcp');
  });

  it('enforces rate limiting returning isError: true with rate_limited error', async () => {
    const clientIp = '198.51.100.42';

    // Exhaust rate limit for clientIp
    for (let i = 0; i < 60; i++) {
      publicRateLimiter.check(clientIp, 60);
    }

    // Now call tool find_shops
    const toolCallPayload = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'find_shops',
        arguments: {
          query: 'laptop repair',
        },
      },
    };

    const req = new NextRequest('http://localhost:3000/mcp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'accept': 'application/json, text/event-stream',
        'x-forwarded-for': clientIp,
      },
      body: JSON.stringify(toolCallPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.result?.isError).toBe(true);

    const errorContent = JSON.parse(body.result.content[0].text);
    expect(errorContent.error.code).toBe('rate_limited');
    expect(errorContent.error.message).toContain('Limit is 60 per minute');

    // Verify telemetry logged rate_limited
    const logRes = await query<{ error_code: string }>(
      `SELECT error_code FROM search_logs
       WHERE channel = 'mcp' AND error_code = 'rate_limited'
       ORDER BY id DESC LIMIT 1;`
    );
    expect(logRes.rows[0]?.error_code).toBe('rate_limited');
  });
});
