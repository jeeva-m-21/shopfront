import { NextResponse } from 'next/server';
import { query } from '@/db';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    await query('SELECT 1;');
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Database unreachable',
      },
      { status: 503 }
    );
  }
}
