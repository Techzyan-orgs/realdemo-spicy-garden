import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';
import { RESTAURANT_DATA } from '@/data/restaurantData';

export const dynamic = 'force-dynamic';

class DummyTransport {}

function getMenuDbClient() {
  const adminClient = getSupabaseAdminClient();
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (url && key) {
    return createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { transport: DummyTransport as any },
    });
  }

  return null;
}

export async function GET() {
  try {
    const supabase = getMenuDbClient();

    if (supabase) {
      const [categoriesRes, itemsRes] = await Promise.all([
        supabase
          .from('menu_categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('menu_items')
          .select('*')
          .order('sort_order', { ascending: true }),
      ]);

      if (
        !categoriesRes.error &&
        !itemsRes.error &&
        categoriesRes.data &&
        categoriesRes.data.length > 0
      ) {
        // Map DB types to match frontend expectations
        const staticCatMap = new Map(RESTAURANT_DATA.menu.categories.map((c) => [c.id, c]));
        const staticItemMap = new Map(RESTAURANT_DATA.menu.items.map((i) => [i.id, i]));

        const categories = [
          {
            id: 'all',
            label: 'All Items',
            icon: 'Utensils',
            subtitle: 'Complete menu catalog across all categories',
            description: 'Browse all freshly prepared dishes or open multiple categories simultaneously.',
          },
          ...categoriesRes.data.map((cat) => {
            const staticCat = staticCatMap.get(cat.id);
            return {
              id: cat.id,
              label: cat.label,
              icon: cat.icon || staticCat?.icon || 'Utensils',
              subtitle: cat.subtitle || staticCat?.subtitle || undefined,
              description: cat.description || staticCat?.description || undefined,
              image: cat.image_url || staticCat?.image || undefined,
            };
          }),
        ];

        const items = itemsRes.data.map((item) => {
          // Only display images that were custom uploaded / added in admin portal
          const isCustomUpload =
            Boolean(item.image_url) &&
            !item.image_url?.startsWith('/unnamed') &&
            item.image_url !== '/pasta.webp' &&
            item.image_url !== '/maggi.webp' &&
            item.image_url !== '/sandwich.webp';

          const resolvedImage = isCustomUpload ? item.image_url : undefined;

          return {
            id: item.id,
            name: item.name,
            category: item.category_id as any,
            price: Number(item.price),
            chickenPrice: item.chicken_price ? Number(item.chicken_price) : undefined,
            isVeg: item.is_veg,
            isSpicy: item.is_spicy,
            isBestSeller: item.is_bestseller,
            isSpecial: item.is_special,
            description: item.description,
            image: resolvedImage,
            image_url: resolvedImage,
            tags: item.tags || [],
            isAvailable: item.is_available,
          };
        });

        return NextResponse.json({
          source: 'supabase',
          categories,
          items,
        });
      }
    }

    // Default fallback to static restaurant data
    return NextResponse.json({
      source: 'static',
      categories: RESTAURANT_DATA.menu.categories,
      items: RESTAURANT_DATA.menu.items.map((i) => ({
        ...i,
        isAvailable: true,
        image: undefined,
        image_url: undefined,
      })),
    });
  } catch (error: any) {
    console.error('[API Menu] Error loading menu:', error);
    return NextResponse.json({
      source: 'fallback',
      categories: RESTAURANT_DATA.menu.categories,
      items: RESTAURANT_DATA.menu.items.map((i) => ({
        ...i,
        isAvailable: true,
        image_url: i.image,
      })),
    });
  }
}
