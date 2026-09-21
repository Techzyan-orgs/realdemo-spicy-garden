'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  ShoppingBag,
  Clock,
  IndianRupee,
  UtensilsCrossed,
  MessageSquare,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  TrendingUp
} from 'lucide-react';

export default function AdminDashboardOverview() {
  const router = useRouter();
  const [stats, setStats] = useState({
    pendingOrders: 0,
    todayOrders: 0,
    todayRevenue: 0,
    totalDishes: 0,
    availableDishes: 0,
    whatsappConsents: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    const loadOverviewData = async () => {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [
          pendingRes,
          todayOrdersRes,
          itemsRes,
          consentsRes,
          recentOrdersRes,
        ] = await Promise.all([
          // Pending orders count
          supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending'),

          // Today orders
          supabase
            .from('orders')
            .select('total, status')
            .gte('created_at', todayStart.toISOString()),

          // Menu items
          supabase.from('menu_items').select('id, is_available'),

          // WhatsApp consents
          supabase
            .from('whatsapp_consents')
            .select('*', { count: 'exact', head: true })
            .eq('consent_given', true),

          // Recent 5 orders
          supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

        const isDummy = (o: any) => {
          if (!o) return true;
          const num = String(o.order_number || '').trim();
          const name = String(o.customer_name || '').toLowerCase();
          if (['7', '8', '1111', '9999'].includes(num)) return true;
          if (name.includes('test customer') || name === 'test') return true;
          return false;
        };

        // Sync and sanitize local cached orders with server
        if (typeof window !== 'undefined') {
          try {
            const cached = localStorage.getItem('sg_orders_cache');
            if (cached) {
              const localOrders = JSON.parse(cached);
              if (Array.isArray(localOrders) && localOrders.length > 0) {
                const cleanMap = new Map<string, any>();
                for (const lo of localOrders) {
                  if (!lo || isDummy(lo)) continue;
                  const key = lo.order_number ? `num_${lo.order_number}` : lo.id;
                  if (!cleanMap.has(key)) cleanMap.set(key, lo);
                }
                const cleanedList = Array.from(cleanMap.values());
                localStorage.setItem('sg_orders_cache', JSON.stringify(cleanedList.slice(0, 50)));

                if (cleanedList.length > 0) {
                  await fetch('/api/orders/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clientOrders: cleanedList }),
                  });
                }
              }
            }
          } catch (e) {}
        }

        let apiOrders: any[] = [];
        try {
          const apiRes = await fetch('/api/orders');
          if (apiRes.ok) {
            const json = await apiRes.json();
            apiOrders = json.orders || [];
          }
        } catch (e) {}

        const dbRecent = recentOrdersRes.data || [];
        const orderMap = new Map<string, any>();
        const combined = [...apiOrders, ...dbRecent];
        for (const o of combined) {
          if (!o || isDummy(o)) continue;
          const key = o.order_number ? `num_${o.order_number}` : o.id;
          const existing = orderMap.get(key);
          if (!existing) {
            orderMap.set(key, o);
          } else {
            const existingTime = new Date(existing.updated_at || existing.created_at).getTime();
            const incomingTime = new Date(o.updated_at || o.created_at).getTime();
            const items =
              o.items && Array.isArray(o.items) && o.items.length > 0
                ? o.items
                : existing.items || [];
            const preferredId =
              existing.id && String(existing.id).includes('-') && !String(o.id).includes('-')
                ? existing.id
                : o.id;
            orderMap.set(key, {
              ...existing,
              ...o,
              id: preferredId,
              items,
              status: o.status || existing.status,
              created_at:
                existingTime < incomingTime && existingTime > 0
                  ? existing.created_at
                  : o.created_at,
              updated_at: incomingTime > existingTime ? o.updated_at : existing.updated_at,
            });
          }
        }

        const allRecentOrders = Array.from(orderMap.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('sg_orders_cache', JSON.stringify(allRecentOrders.slice(0, 50)));
          } catch (e) {}
        }

        const todayApiOrders = allRecentOrders.filter(
          (o) => new Date(o.created_at).getTime() >= todayStart.getTime()
        );

        const todayRevenue = todayApiOrders
          .filter((o) => o.status !== 'cancelled')
          .reduce((sum, o) => sum + Number(o.total || 0), 0);

        const pendingCount = allRecentOrders.filter((o) => o.status === 'pending').length;

        const allItems = itemsRes.data || [];
        const availableItems = allItems.filter((i) => i.is_available);

        setStats({
          pendingOrders: Math.max(pendingRes.count || 0, pendingCount),
          todayOrders: Math.max((todayOrdersRes.data || []).length, todayApiOrders.length),
          todayRevenue,
          totalDishes: allItems.length,
          availableDishes: availableItems.length,
          whatsappConsents: consentsRes.count || 0,
        });

        setRecentOrders(allRecentOrders.slice(0, 5));
      } catch (err) {
        console.error('[Admin Overview] Error loading dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadOverviewData();

    // Subscribe to realtime orders updates for live counters
    const channel = supabase
      .channel('admin_overview_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          loadOverviewData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard Overview
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time activity and catalog metrics for The Spicy Garden Cafe &amp; Bistro
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/analytics"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 shadow-sm transition-all"
          >
            <TrendingUp className="w-3.5 h-3.5 text-chili-600" />
            <span>Full Analytics</span>
          </Link>
          <Link
            href="/admin/orders"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-chili-600 hover:bg-chili-700 shadow-sm shadow-chili-600/30 transition-all active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>View Live Orders</span>
          </Link>
          <Link
            href="/admin/menu"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Dish</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Pending Orders */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Pending Orders
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-sans">
              {stats.pendingOrders}
            </span>
            {stats.pendingOrders > 0 && (
              <span className="text-[11px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full animate-pulse">
                Needs Attention
              </span>
            )}
          </div>
        </div>

        {/* Today's Sales */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Today's Orders Total
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-sans">
              ₹{stats.todayRevenue}
            </span>
            <span className="text-[11px] text-gray-400">
              {stats.todayOrders} orders today
            </span>
          </div>
        </div>

        {/* Active Dishes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Dishes in Catalog
            </span>
            <div className="p-2 rounded-xl bg-chili-50 dark:bg-chili-950/60 text-chili-600">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-sans">
              {stats.totalDishes}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold">
              {stats.availableDishes} available
            </span>
          </div>
        </div>

        {/* WhatsApp Consents */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              WhatsApp Opt-ins
            </span>
            <div className="p-2 rounded-xl bg-garden-50 dark:bg-garden-950/60 text-garden-600">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-sans">
              {stats.whatsappConsents}
            </span>
            <span className="text-[11px] text-gray-400">
              Subscribed diners
            </span>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-chili-600" />
            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white">
              Recent Incoming Orders
            </h3>
            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full hidden sm:inline border border-amber-200/60 dark:border-amber-800/40">
              💡 Double-click any order to open
            </span>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center space-x-1 text-xs font-bold text-chili-600 hover:underline"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-gray-400">
            Loading recent orders...
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              No orders placed yet.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              New orders placed on the public website will immediately show up here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-2.5 rounded-l-xl">Order #</th>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5">Items</th>
                  <th className="px-4 py-2.5">Total</th>
                  <th className="px-4 py-2.5">Payment</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Time</th>
                  <th className="px-4 py-2.5 rounded-r-xl text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentOrders.map((order) => {
                  const itemCount = Array.isArray(order.items)
                    ? order.items.reduce((s: number, i: any) => s + (i.quantity || 1), 0)
                    : 1;

                  const statusColor =
                    order.status === 'pending'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : order.status === 'confirmed' || order.status === 'preparing'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : order.status === 'ready' || order.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';

                  const navigateToOrder = () => {
                    router.push(`/admin/orders?orderId=${encodeURIComponent(order.id)}&orderNumber=${order.order_number}`);
                  };

                  return (
                    <tr
                      key={order.id}
                      onDoubleClick={navigateToOrder}
                      className="hover:bg-amber-50/50 dark:hover:bg-gray-800/70 cursor-pointer transition-colors group select-none"
                      title={`Double-click to open order #SG-${order.order_number} in Live Orders Console`}
                    >
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                        <span className="font-mono group-hover:text-chili-600 transition-colors">
                          #SG-{order.order_number}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800 dark:text-gray-200">
                          {order.customer_name}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {order.customer_phone}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </td>
                      <td className="px-4 py-3 font-bold font-sans text-gray-900 dark:text-white">
                        ₹{order.total}
                      </td>
                      <td className="px-4 py-3">
                        {order.payment_status === 'paid' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 inline-flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Paid {order.payment_mode ? `(${order.payment_mode})` : ''}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 inline-flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Unpaid</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColor}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {new Date(order.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToOrder();
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-chili-600 dark:text-chili-400 bg-chili-50 dark:bg-chili-950/50 hover:bg-chili-100 dark:hover:bg-chili-900/60 transition-colors shadow-sm"
                          title="Open order details"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
