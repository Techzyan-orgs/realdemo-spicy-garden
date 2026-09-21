export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';

/**
 * Lightweight sync endpoint.
 * To guarantee database cost-effectiveness and prevent phantom/duplicate order creation,
 * this endpoint no longer executes blind insert loops into Supabase.
 * The Supabase orders table is the authoritative single source of truth.
 */
export async function POST(req: NextRequest) {
  try {
    return NextResponse.json(
      {
        success: true,
        message: 'Sync acknowledged. Database is canonical source of truth.',
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Sync failed.' },
      { status: 500 }
    );
  }
}
