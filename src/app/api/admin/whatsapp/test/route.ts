import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { sendWhatsAppTextMessage, isWhatsAppConfigured } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase unconfigured' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { phone, message } = await req.json();
    if (!phone || !message) {
      return NextResponse.json({ error: 'Phone and message required' }, { status: 400 });
    }

    if (!isWhatsAppConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'WhatsApp Business API is not configured in .env.local (WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is missing).'
      });
    }

    const result = await sendWhatsAppTextMessage(phone, message);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
