import { NextRequest, NextResponse } from 'next/server';
import { publicRateLimiter } from '@/rate-limit';
import { searchShops, type SearchShopsInput } from '@/search/search-shops';
import { writeSearchLog } from '@/search/telemetry';
import { getClientIp } from '@/mcp/server';
import type { ShopCategory } from '@/search/stage1';

export async function GET(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateCheck = publicRateLimiter.check(clientIp, 60);
  if (!rateCheck.allowed) {
    await writeSearchLog({
      channel: 'web',
      tool: 'find_shops',
      error_code: 'rate_limited',
      total_ms: 0,
    });
    return NextResponse.json(
      { error: { code: 'rate_limited', message: 'Too many requests. Limit is 60 per minute.' } },
      { status: 429 }
    );
  }

  const url = req.nextUrl;
  const q = url.searchParams.get('q') ?? url.searchParams.get('query') ?? undefined;
  const locality = url.searchParams.get('locality') ?? undefined;
  const category = (url.searchParams.get('category') as ShopCategory) ?? undefined;
  const maxPriceStr = url.searchParams.get('max_price_inr');
  const maxPriceInr = maxPriceStr ? Number(maxPriceStr) : undefined;
  const openNowStr = url.searchParams.get('open_now');
  const openNow = openNowStr === 'true' || openNowStr === '1';
  const radiusKmStr = url.searchParams.get('radius_km');
  const radiusKm = radiusKmStr ? Number(radiusKmStr) : undefined;
  const latStr = url.searchParams.get('lat');
  const lat = latStr ? Number(latStr) : undefined;
  const lngStr = url.searchParams.get('lng');
  const lng = lngStr ? Number(lngStr) : undefined;
  const limitStr = url.searchParams.get('limit');
  const limit = limitStr ? Number(limitStr) : 10;
  const showSampleDataStr = url.searchParams.get('show_sample_data');
  const showSampleData = showSampleDataStr === 'true' || showSampleDataStr === '1';

  const input: SearchShopsInput = {
    query: q,
    locality,
    category,
    max_price_inr: maxPriceInr,
    open_now: openNow,
    radius_km: radiusKm,
    lat,
    lng,
    limit,
    show_sample_data: showSampleData,
  };

  const result = await searchShops(input, 'web');
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.data, { status: 200 });
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateCheck = publicRateLimiter.check(clientIp, 60);
  if (!rateCheck.allowed) {
    await writeSearchLog({
      channel: 'web',
      tool: 'find_shops',
      error_code: 'rate_limited',
      total_ms: 0,
    });
    return NextResponse.json(
      { error: { code: 'rate_limited', message: 'Too many requests. Limit is 60 per minute.' } },
      { status: 429 }
    );
  }

  let body: SearchShopsInput = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'invalid_input', message: 'Malformed JSON payload.' } },
      { status: 400 }
    );
  }

  const result = await searchShops(body, 'web');
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.data, { status: 200 });
}
