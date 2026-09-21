'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { playOrderChime, getAudioContext } from '@/lib/audio';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface GlobalOrderNotification {
  id: string;
  order_number: string | number;
  customer_name: string;
  customer_phone: string;
  items?: any[];
  total: number;
  notes?: string;
  created_at: string;
}

interface AudioAlertContextType {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  triggerChime: () => void;
  toggleSound: () => void;
  activeOrderAlert: GlobalOrderNotification | null;
  recentOrders: GlobalOrderNotification[];
  dismissOrderAlert: () => void;
  requestDesktopPermission: () => Promise<void>;
}

const AudioAlertContext = createContext<AudioAlertContextType>({
  soundEnabled: true,
  setSoundEnabled: () => {},
  triggerChime: () => {},
  toggleSound: () => {},
  activeOrderAlert: null,
  recentOrders: [],
  dismissOrderAlert: () => {},
  requestDesktopPermission: async () => {},
});

export const useAudioAlert = () => useContext(AudioAlertContext);

export function AudioAlertProvider({ children }: { children: React.ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeOrderAlert, setActiveOrderAlert] = useState<GlobalOrderNotification | null>(null);
  const [recentOrders, setRecentOrders] = useState<GlobalOrderNotification[]>([]);
  const recentAlertIds = useRef<Set<string>>(new Set());
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Restore sound preference and cached orders from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sg_admin_sound_enabled');
      if (saved === 'false') {
        setSoundEnabled(false);
      } else {
        setSoundEnabled(true);
      }

    }
  }, []);

  // Unlock audio context on first user interaction anywhere
  useEffect(() => {
    const unlockAudio = () => {
      getAudioContext();
    };
    window.addEventListener('click', unlockAudio, { once: true, passive: true });
    window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
    window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sg_admin_sound_enabled', nextState.toString());
    }
    if (nextState) {
      getAudioContext();
      playOrderChime();
    }
  };

  const triggerChime = useCallback(() => {
    if (soundEnabled) {
      playOrderChime();
    }
  }, [soundEnabled]);

  const dismissOrderAlert = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    setActiveOrderAlert(null);
  }, []);

  const requestDesktopPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
  };

  // Centralized incoming order handler with deduplication and sound chime
  const handleIncomingOrder = useCallback(
    (order: GlobalOrderNotification) => {
      if (!order || !order.id) return;

      // Deduplicate orders received within the last 60 seconds
      if (recentAlertIds.current.has(order.id)) {
        return;
      }
      recentAlertIds.current.add(order.id);
      setTimeout(() => {
        recentAlertIds.current.delete(order.id);
      }, 60000);

      // Play audio chime
      triggerChime();

      // Show floating alert banner
      setActiveOrderAlert(order);

      // Save into recentOrders context state
      setRecentOrders((prev) => [
        order,
        ...prev.filter(
          (o) =>
            o.id !== order.id &&
            (!order.order_number || String(o.order_number) !== String(order.order_number))
        ),
      ]);

      // Save into localStorage for persistence across browser tabs and page navigations
      if (typeof window !== 'undefined') {
        try {
          const isSameOrder = (o: any) =>
            o.id === order.id ||
            (order.order_number && String(o.order_number) === String(order.order_number));
          const cachedStr = localStorage.getItem('sg_orders_cache');
          const list = cachedStr ? JSON.parse(cachedStr) : [];
          const merged = [order, ...list.filter((o: any) => !isSameOrder(o))].slice(0, 50);
          localStorage.setItem('sg_orders_cache', JSON.stringify(merged));
        } catch (e) {}
      }

      // Auto-dismiss banner after 25 seconds
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
      dismissTimerRef.current = setTimeout(() => {
        setActiveOrderAlert(null);
      }, 25000);

      // Trigger HTML5 desktop notification if permitted
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          const notif = new Notification(`🔔 New Order #SG-${order.order_number}`, {
            body: `${order.customer_name} placed an order for ₹${order.total}`,
            icon: '/icons/icon-192x192.png',
            tag: order.id,
          });
          notif.onclick = () => {
            window.focus();
            window.location.href = '/admin/orders';
          };
        } catch (e) {}
      }
    },
    [triggerChime]
  );

  // 1. Supabase Realtime Listener across all admin pages
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel('admin_global_order_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new as any;
          handleIncomingOrder({
            id: newOrder.id,
            order_number: newOrder.order_number || `${Math.floor(1000 + Math.random() * 9000)}`,
            customer_name: newOrder.customer_name || 'Customer',
            customer_phone: newOrder.customer_phone || '',
            items: newOrder.items || [],
            total: newOrder.total || 0,
            notes: newOrder.notes,
            created_at: newOrder.created_at || new Date().toISOString(),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleIncomingOrder]);

  // 2. BroadcastChannel Listener (instant cross-tab communication)
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('sg_orders_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'NEW_ORDER' && event.data?.order) {
          handleIncomingOrder(event.data.order);
        }
      };
    } catch (e) {}

    return () => {
      if (bc) {
        bc.close();
      }
    };
  }, [handleIncomingOrder]);

  // 3. Storage Event Listener (fallback cross-tab communication)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sg_last_order_event' && e.newValue) {
        try {
          const order = JSON.parse(e.newValue);
          handleIncomingOrder(order);
        } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [handleIncomingOrder]);

  // 4. Same-window CustomEvent listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleCustomOrder = (e: Event) => {
      const customEvent = e as CustomEvent<GlobalOrderNotification>;
      if (customEvent.detail) {
        handleIncomingOrder(customEvent.detail);
      }
    };

    window.addEventListener('sg_new_order', handleCustomOrder);
    return () => {
      window.removeEventListener('sg_new_order', handleCustomOrder);
    };
  }, [handleIncomingOrder]);

  return (
    <AudioAlertContext.Provider
      value={{
        soundEnabled,
        setSoundEnabled,
        triggerChime,
        toggleSound,
        activeOrderAlert,
        recentOrders,
        dismissOrderAlert,
        requestDesktopPermission,
      }}
    >
      {children}
    </AudioAlertContext.Provider>
  );
}
