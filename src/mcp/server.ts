import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { publicRateLimiter } from '../rate-limit.js';
import { searchShops } from '../search/search-shops.js';
import { writeSearchLog } from '../search/telemetry.js';

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

export const FIND_SHOPS_DESCRIPTION =
  'Find and rank local shops in Chennai for a customer request. Always provide locality when the customer has told you where they are. If the customer has not said where they are, ask them for a Chennai area before calling this tool. Use category when it is clear. Results already satisfy distance, budget, and open-now constraints.';

export function createShopfrontMcpServer(req?: Request): McpServer {
  const server = new McpServer({
    name: 'shopfront-mcp',
    version: '2.0.0',
  });

  const clientIp = req ? getClientIp(req) : '127.0.0.1';

  // find_shops tool
  server.tool(
    'find_shops',
    FIND_SHOPS_DESCRIPTION,
    {
      query: z.string().max(200).optional(),
      locality: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      radius_km: z.number().min(0.5).max(25).optional(),
      category: z.enum(['repair_service', 'salon_wellness', 'food_beverage']).optional(),
      max_price_inr: z.number().int().min(1).max(1000000).optional(),
      open_now: z.boolean().optional(),
      limit: z.number().int().min(1).max(10).optional(),
    },
    { readOnlyHint: true },
    async (args) => {
      // Rate limit check
      const rateCheck = publicRateLimiter.check(clientIp, 60);
      if (!rateCheck.allowed) {
        await writeSearchLog({
          channel: 'mcp',
          tool: 'find_shops',
          query_text: args.query ?? null,
          error_code: 'rate_limited',
          total_ms: 0,
        });
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: {
                  code: 'rate_limited',
                  message: 'Too many requests. Limit is 60 per minute.',
                },
              }),
            },
          ],
        };
      }

      const res = await searchShops(args, 'mcp');
      if (res.success) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(res.data),
            },
          ],
        };
      } else {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: res.error }),
            },
          ],
        };
      }
    }
  );

  return server;
}
