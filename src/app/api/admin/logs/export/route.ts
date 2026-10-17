import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../auth/guards.js';
import { exportSearchLogsCsv } from '../../../../../admin/telemetry-ops.js';

export async function GET(request: Request) {
  await requireAdmin();

  const url = new URL(request.url);
  const channel = (url.searchParams.get('channel') as 'mcp' | 'web') || undefined;
  const tool = url.searchParams.get('tool') || undefined;
  const fallbackOnly = url.searchParams.get('fallback_only') === 'true';
  const fromDate = url.searchParams.get('from_date') || undefined;
  const toDate = url.searchParams.get('to_date') || undefined;

  const csv = await exportSearchLogsCsv({
    channel,
    tool,
    fallbackOnly,
    fromDate,
    toDate,
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="search_logs.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
