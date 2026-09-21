import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, customerName, consentGiven = true, source = 'website_interest_prompt', metadata = {} } = body;

    const cleanPhone = phone?.replace(/\D/g, '') || '';
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: 'Valid 10-digit mobile number required.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { error } = await supabase
        .from('whatsapp_consents')
        .insert({
          phone: cleanPhone,
          customer_name: customerName?.trim() || null,
          consent_given: Boolean(consentGiven),
          source,
          metadata,
          consented_at: new Date().toISOString(),
          opted_out_at: consentGiven ? null : new Date().toISOString(),
        });

      if (error) {
        console.error('[API Consent] Database error storing consent:', error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API Consent] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to save consent.' },
      { status: 500 }
    );
  }
}
