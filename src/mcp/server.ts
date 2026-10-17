import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { publicRateLimiter } from '../rate-limit.js';
import { searchShops } from '../search/search-shops.js';
import { writeSearchLog } from '../search/telemetry.js';
import { executeGetShopInfo } from './tools/get-shop-info.js';
import { executeGetCatalog } from './tools/get-catalog.js';
import { executeSearchCatalog } from './tools/search-catalog.js';
import { executeGetActionLink } from './tools/get-action-link.js';

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

export const GET_SHOP_INFO_DESCRIPTION =
  'Retrieve detailed public shop profile including address, locality, coordinates, weekly opening hours, upcoming closures, contact numbers, action mode, and latest menu timestamp.';

export const GET_CATALOG_DESCRIPTION =
  'Retrieve available menu or service catalog items for a shop grouped by category, with price display and duration, supporting cursor-based pagination.';

export const SEARCH_CATALOG_DESCRIPTION =
  'Search items within a specific shop catalog using text similarity and full-text search with optional price ceiling and item kind filtering.';

export const GET_ACTION_LINK_DESCRIPTION =
  'Generate an actionable WhatsApp deep link, booking URL, or phone dial link with standard customer enquiry message for a shop and optional item.';

export function createShopfrontMcpServer(req?: Request): McpServer {
  const server = new McpServer({
    name: 'shopfront-mcp',
    version: '2.0.0',
  });

  const clientIp = req ? getClientIp(req) : '127.0.0.1';

  // Helper for uniform rate limit checking and telemetry
  async function checkRateLimit(toolName: string): Promise<boolean> {
    const rateCheck = publicRateLimiter.check(clientIp, 60);
    if (!rateCheck.allowed) {
      await writeSearchLog({
        channel: 'mcp',
        tool: toolName,
        error_code: 'rate_limited',
        total_ms: 0,
      });
      return false;
    }
    return true;
  }

  const rateLimitedResponse = {
    isError: true,
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          error: {
            code: 'rate_limited',
            message: 'Too many requests. Limit is 60 per minute.',
          },
        }),
      },
    ],
  };

  // 1. find_shops
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
      if (!(await checkRateLimit('find_shops'))) {
        return rateLimitedResponse;
      }

      const res = await searchShops(args, 'mcp');
      if (res.success) {
        return {
          content: [{ type: 'text', text: JSON.stringify(res.data) }],
        };
      } else {
        return {
          isError: true,
          content: [{ type: 'text', text: JSON.stringify({ error: res.error }) }],
        };
      }
    }
  );

  // 2. get_shop_info
  server.tool(
    'get_shop_info',
    GET_SHOP_INFO_DESCRIPTION,
    {
      shop_slug: z.string().min(1),
    },
    { readOnlyHint: true },
    async (args) => {
      const startTime = Date.now();
      if (!(await checkRateLimit('get_shop_info'))) {
        return rateLimitedResponse;
      }

      const res = await executeGetShopInfo(args);
      const totalMs = Date.now() - startTime;

      await writeSearchLog({
        channel: 'mcp',
        tool: 'get_shop_info',
        error_code: res.success ? null : res.error.code,
        total_ms: totalMs,
      });

      if (res.success) {
        return {
          content: [{ type: 'text', text: JSON.stringify(res.data) }],
        };
      } else {
        return {
          isError: true,
          content: [{ type: 'text', text: JSON.stringify({ error: res.error }) }],
        };
      }
    }
  );

  // 3. get_catalog
  server.tool(
    'get_catalog',
    GET_CATALOG_DESCRIPTION,
    {
      shop_slug: z.string().min(1),
      kind: z.enum(['product', 'service']).optional(),
      cursor: z.string().optional(),
    },
    { readOnlyHint: true },
    async (args) => {
      const startTime = Date.now();
      if (!(await checkRateLimit('get_catalog'))) {
        return rateLimitedResponse;
      }

      const res = await executeGetCatalog(args);
      const totalMs = Date.now() - startTime;

      await writeSearchLog({
        channel: 'mcp',
        tool: 'get_catalog',
        error_code: res.success ? null : res.error.code,
        total_ms: totalMs,
      });

      if (res.success) {
        return {
          content: [{ type: 'text', text: JSON.stringify(res.data) }],
        };
      } else {
        return {
          isError: true,
          content: [{ type: 'text', text: JSON.stringify({ error: res.error }) }],
        };
      }
    }
  );

  // 4. search_catalog
  server.tool(
    'search_catalog',
    SEARCH_CATALOG_DESCRIPTION,
    {
      shop_slug: z.string().min(1),
      query: z.string(),
      max_price_inr: z.number().int().min(1).max(1000000).optional(),
      kind: z.enum(['product', 'service']).optional(),
      limit: z.number().int().min(1).max(20).optional(),
    },
    { readOnlyHint: true },
    async (args) => {
      const startTime = Date.now();
      if (!(await checkRateLimit('search_catalog'))) {
        return rateLimitedResponse;
      }

      const res = await executeSearchCatalog(args);
      const totalMs = Date.now() - startTime;

      await writeSearchLog({
        channel: 'mcp',
        tool: 'search_catalog',
        query_text: args.query,
        error_code: res.success ? null : res.error.code,
        total_ms: totalMs,
      });

      if (res.success) {
        return {
          content: [{ type: 'text', text: JSON.stringify(res.data) }],
        };
      } else {
        return {
          isError: true,
          content: [{ type: 'text', text: JSON.stringify({ error: res.error }) }],
        };
      }
    }
  );

  // 5. get_action_link
  server.tool(
    'get_action_link',
    GET_ACTION_LINK_DESCRIPTION,
    {
      shop_slug: z.string().min(1),
      item_id: z.string().uuid().optional(),
      preferred_time: z.string().max(80).optional(),
      customer_note: z.string().max(160).optional(),
    },
    { readOnlyHint: true },
    async (args) => {
      const startTime = Date.now();
      if (!(await checkRateLimit('get_action_link'))) {
        return rateLimitedResponse;
      }

      const res = await executeGetActionLink(args);
      const totalMs = Date.now() - startTime;

      await writeSearchLog({
        channel: 'mcp',
        tool: 'get_action_link',
        error_code: res.success ? null : res.error.code,
        total_ms: totalMs,
      });

      if (res.success) {
        return {
          content: [{ type: 'text', text: JSON.stringify(res.data) }],
        };
      } else {
        return {
          isError: true,
          content: [{ type: 'text', text: JSON.stringify({ error: res.error }) }],
        };
      }
    }
  );

  return server;
}
