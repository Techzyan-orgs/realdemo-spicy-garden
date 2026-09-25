import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
    const filename = `dish_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // 1. Try Supabase Storage first if configured
    const supabaseServer = await getSupabaseServerClient();
    const supabaseAdmin = getSupabaseAdminClient();

    if (supabaseServer && supabaseAdmin) {
      try {
        const { data: { user } } = await supabaseServer.auth.getUser();
        if (user) {
          const { data: profile } = await supabaseServer
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (profile?.role === 'admin') {
            const { error: uploadError } = await supabaseAdmin.storage
              .from('menu-images')
              .upload(filename, buffer, {
                contentType: file.type || 'image/webp',
                upsert: true,
              });

            if (!uploadError) {
              const { data: { publicUrl } } = supabaseAdmin.storage
                .from('menu-images')
                .getPublicUrl(filename);

              return NextResponse.json({
                success: true,
                publicUrl,
                storage: 'supabase',
                filename,
              });
            } else {
              console.warn('[API Upload] Supabase storage upload warning, falling back to local:', uploadError.message);
            }
          }
        }
      } catch (authOrStorageErr) {
        console.warn('[API Upload] Supabase upload failed, using local fallback:', authOrStorageErr);
      }
    }

    // 2. Local public fallback for development / offline / unconfigured Supabase
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;
    return NextResponse.json({
      success: true,
      publicUrl,
      storage: 'local',
      filename,
    });
  } catch (error: any) {
    console.error('[API Upload] Unexpected error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload image.' },
      { status: 500 }
    );
  }
}

