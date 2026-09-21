import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, eventName, eventData, pagePath } = body;

    if (!eventName) {
      return NextResponse.json({ error: 'Event name is required.' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      await supabase.from('customer_events').insert({
        session_id: sessionId || 'anonymous',
        event_name: eventName,
        event_data: eventData || {},
        page_path: pagePath || null,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    // Non-blocking fail-safe
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
