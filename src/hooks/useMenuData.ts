'use client';

import { useState, useEffect, useCallback } from 'react';
import { RESTAURANT_DATA, MenuItem, MenuCategory } from '@/data/restaurantData';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface ExtendedMenuItem extends MenuItem {
  isAvailable?: boolean;
  image_url?: string;
}

// Module-level cache to share menu data across multiple component instances
let globalMenuCache: {
  categories: MenuCategory[];
  items: ExtendedMenuItem[];
  isLive: boolean;
  timestamp: number;
} | null = null;

export function useMenuData() {
  const [categories, setCategories] = useState<MenuCategory[]>(
    globalMenuCache ? globalMenuCache.categories : RESTAURANT_DATA.menu.categories
  );
  const [items, setItems] = useState<ExtendedMenuItem[]>(
    globalMenuCache
      ? globalMenuCache.items
      : RESTAURANT_DATA.menu.items.map((i) => ({ ...i, isAvailable: true }))
  );
  const [isLoading, setIsLoading] = useState<boolean>(!globalMenuCache);
  const [isLive, setIsLive] = useState<boolean>(globalMenuCache ? globalMenuCache.isLive : false);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch('/api/menu', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch menu');
      const data = await res.json();

      if (data.categories && data.items) {
        const liveStatus = data.source === 'supabase';
        globalMenuCache = {
          categories: data.categories,
          items: data.items,
          isLive: liveStatus,
          timestamp: Date.now(),
        };
        setCategories(data.categories);
        setItems(data.items);
        setIsLive(liveStatus);
      }
    } catch (err) {
      console.warn('[useMenuData] Using cached or default menu data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();

    // Listen for local tab / window updates from Admin portal
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sg_menu_last_update') {
        fetchMenu();
      }
    };
    const handleLocalMenuUpdate = () => {
      fetchMenu();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('sg_menu_updated', handleLocalMenuUpdate);

    // Setup Supabase Realtime listener if browser client is available
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener('sg_menu_updated', handleLocalMenuUpdate);
      };
    }

    // Use a unique channel name per subscriber instance to avoid colliding with existing subscribed channels
    const channelName = `public_menu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        () => {
          fetchMenu();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_categories' },
        () => {
          fetchMenu();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('sg_menu_updated', handleLocalMenuUpdate);
      try {
        supabase.removeChannel(channel);
      } catch (e) {}
    };
  }, [fetchMenu]);

  return {
    categories,
    items,
    isLoading,
    isLive,
    refetch: fetchMenu,
  };
}
