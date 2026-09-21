export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';
import { Database, DbOrder } from '@/lib/supabase/types';
import { readOrdersFromStore, isTestOrderRecord } from '@/lib/ordersStore';
import { RESTAURANT_DATA } from '@/data/restaurantData';

function getDbClient(userToken?: string | null) {
  const adminClient = getSupabaseAdminClient();
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (url && key) {
    const options: any = {
      auth: { persistSession: false, autoRefreshToken: false },
    };
    if (userToken) {
      options.global = {
        headers: { Authorization: `Bearer ${userToken}` },
      };
    }
    return createClient<Database>(url, key, options);
  }
  return null;
}

// Fallback dish-to-category mapping from static menu data
const dishCategoryMap = new Map<string, string>();
RESTAURANT_DATA.menu.items.forEach((item) => {
  dishCategoryMap.set(item.id, item.category);
  dishCategoryMap.set(item.name.toLowerCase().trim(), item.category);
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7d';
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    // 1. Determine Date Range Boundaries First (enables DB-level filtering to save egress & compute)
    const now = new Date();
    let currentStart = new Date();
    let currentEnd = new Date();
    let previousStart = new Date();
    let previousEnd = new Date();
    let isHourly = false;

    if (range === 'custom' && fromParam && toParam) {
      currentStart = new Date(fromParam);
      currentStart.setHours(0, 0, 0, 0);

      currentEnd = new Date(toParam);
      currentEnd.setHours(23, 59, 59, 999);

      const spanMs = currentEnd.getTime() - currentStart.getTime();
      previousEnd = new Date(currentStart.getTime() - 1);
      previousStart = new Date(previousEnd.getTime() - spanMs);
    } else if (range === 'today') {
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);

      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 1);
      previousEnd = new Date(currentEnd);
      previousEnd.setDate(previousEnd.getDate() - 1);
      isHourly = true;
    } else if (range === 'yesterday') {
      currentStart.setDate(currentStart.getDate() - 1);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd = new Date(currentStart);
      currentEnd.setHours(23, 59, 59, 999);

      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 1);
      previousEnd = new Date(currentEnd);
      previousEnd.setDate(previousEnd.getDate() - 1);
      isHourly = true;
    } else if (range === '30d') {
      currentStart.setDate(currentStart.getDate() - 29);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);

      previousEnd = new Date(currentStart.getTime() - 1);
      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 30);
    } else if (range === 'all') {
      currentStart = new Date(0); // Epoch
      currentEnd = new Date();
      currentEnd.setHours(23, 59, 59, 999);
      previousStart = new Date(0);
      previousEnd = new Date(0);
    } else {
      // Default: 7d
      currentStart.setDate(currentStart.getDate() - 6);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);

      previousEnd = new Date(currentStart.getTime() - 1);
      previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - 7);
    }

    // 2. Fetch directly from Supabase with date bounds (cost-effective DB-level filtering)
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const supabase = getDbClient(token);
    let allOrders: DbOrder[] = [];

    if (supabase) {
      try {
        let query = supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (range !== 'all') {
          query = query
            .gte('created_at', previousStart.toISOString())
            .lte('created_at', currentEnd.toISOString());
        }

        const { data, error } = await query;
        if (!error && data) {
          allOrders = data as DbOrder[];
        }
      } catch (e) {
        console.warn('[Analytics API] Supabase query error, fallback to local store:', e);
      }
    }

    // Fallback only if Supabase returned 0 rows or is unconfigured
    if (allOrders.length === 0) {
      allOrders = readOrdersFromStore();
    }

    // Exclude test orders from authoritative analytics
    allOrders = allOrders.filter((ord) => !isTestOrderRecord(ord));

    const currentStartTime = currentStart.getTime();
    const currentEndTime = currentEnd.getTime();
    const prevStartTime = previousStart.getTime();
    const prevEndTime = previousEnd.getTime();

    // 3. Partition into Current vs Previous Period
    const filteredOrders = allOrders.filter((ord) => {
      const t = new Date(ord.created_at).getTime();
      return t >= currentStartTime && t <= currentEndTime;
    });

    const previousOrders = allOrders.filter((ord) => {
      const t = new Date(ord.created_at).getTime();
      return t >= prevStartTime && t <= prevEndTime;
    });

    // 4. Calculate Current KPIs
    let grossRevenue = 0;
    let completedOrdersCount = 0;
    let cancelledOrdersCount = 0;
    let pendingOrdersCount = 0;
    let totalItemsSold = 0;
    let vegItemsSold = 0;
    let nonVegItemsSold = 0;

    // Aggregation maps
    const dishSalesMap = new Map<
      string,
      {
        itemId: string;
        name: string;
        category: string;
        variant?: string | null;
        unitsSold: number;
        revenue: number;
        isVeg: boolean;
      }
    >();

    const categorySalesMap = new Map<
      string,
      { category: string; unitsSold: number; revenue: number }
    >();

    const channelMap = new Map<string, { label: string; count: number; revenue: number }>();

    const hourlyRush = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i.toString().padStart(2, '0')}:00`,
      orders: 0,
      revenue: 0,
    }));

    // Process Current Orders
    filteredOrders.forEach((order) => {
      const orderTotal = Number(order.total) || 0;
      const orderDate = new Date(order.created_at);
      const hour = orderDate.getHours();

      // Only count non-cancelled orders towards revenue
      if (order.status !== 'cancelled') {
        grossRevenue += orderTotal;
        hourlyRush[hour].orders += 1;
        hourlyRush[hour].revenue += orderTotal;
      }

      if (order.status === 'completed') completedOrdersCount++;
      else if (order.status === 'cancelled') cancelledOrdersCount++;
      else if (order.status === 'pending') pendingOrdersCount++;

      // Channel / Source analysis
      let channel = order.source || 'Website Direct';
      if (channel.toLowerCase().startsWith('dine-in')) channel = 'Dine-In';
      else if (channel.toLowerCase().startsWith('takeaway')) channel = 'Takeaway';
      else if (channel.toLowerCase().startsWith('phone')) channel = 'Phone Booking';
      else if (channel.toLowerCase().includes('pos') || channel.toLowerCase().includes('counter'))
        channel = 'Counter POS';
      else channel = 'Website Direct';

      const existingChannel = channelMap.get(channel) || {
        label: channel,
        count: 0,
        revenue: 0,
      };
      existingChannel.count += 1;
      if (order.status !== 'cancelled') existingChannel.revenue += orderTotal;
      channelMap.set(channel, existingChannel);

      // Line items breakdown
      const rawItems = Array.isArray(order.items) ? order.items : [];
      rawItems.forEach((item: any) => {
        const qty = Number(item.quantity) || 1;
        const lineTotal = Number(item.totalPrice) || (Number(item.unitPrice) || 0) * qty;
        totalItemsSold += qty;

        const isVeg =
          item.variant === 'veg' ||
          (!item.variant && !item.name.toLowerCase().includes('chicken'));

        if (isVeg) vegItemsSold += qty;
        else nonVegItemsSold += qty;

        // Dish Map key: name + variant
        const dishKey = `${item.name}__${item.variant || ''}`;
        const resolvedCategory =
          dishCategoryMap.get(item.itemId) ||
          dishCategoryMap.get(item.name.toLowerCase().trim()) ||
          'Specialties';

        const existingDish = dishSalesMap.get(dishKey) || {
          itemId: item.itemId || item.name,
          name: item.name,
          category: resolvedCategory,
          variant: item.variant || null,
          unitsSold: 0,
          revenue: 0,
          isVeg,
        };
        existingDish.unitsSold += qty;
        if (order.status !== 'cancelled') existingDish.revenue += lineTotal;
        dishSalesMap.set(dishKey, existingDish);

        // Category map
        const existingCat = categorySalesMap.get(resolvedCategory) || {
          category: resolvedCategory,
          unitsSold: 0,
          revenue: 0,
        };
        existingCat.unitsSold += qty;
        if (order.status !== 'cancelled') existingCat.revenue += lineTotal;
        categorySalesMap.set(resolvedCategory, existingCat);
      });
    });

    // Previous Period Metrics for Growth calculation
    let prevGrossRevenue = 0;
    previousOrders.forEach((o) => {
      if (o.status !== 'cancelled') prevGrossRevenue += Number(o.total) || 0;
    });

    const totalOrdersCount = filteredOrders.length;
    const prevTotalOrdersCount = previousOrders.length;

    const aov = totalOrdersCount > 0 ? Math.round(grossRevenue / totalOrdersCount) : 0;
    const prevAov =
      prevTotalOrdersCount > 0 ? Math.round(prevGrossRevenue / prevTotalOrdersCount) : 0;

    const completionRate =
      totalOrdersCount > 0 ? Math.round((completedOrdersCount / totalOrdersCount) * 100) : 0;

    const taxableSubtotal = Math.round((grossRevenue / 1.05) * 100) / 100;
    const totalGst = Math.round((grossRevenue - taxableSubtotal) * 100) / 100;

    // Calculate percentage growths
    const calcGrowth = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 1000) / 10;
    };

    const revenueGrowth = calcGrowth(grossRevenue, prevGrossRevenue);
    const ordersGrowth = calcGrowth(totalOrdersCount, prevTotalOrdersCount);
    const aovGrowth = calcGrowth(aov, prevAov);

    // 5. Time Series (Daily or Hourly) for Charting
    let timeSeries: Array<{
      dateKey: string;
      label: string;
      orders: number;
      revenue: number;
    }> = [];

    if (isHourly) {
      timeSeries = hourlyRush.map((h) => ({
        dateKey: h.label,
        label: h.label,
        orders: h.orders,
        revenue: h.revenue,
      }));
    } else {
      // Create continuous daily buckets between currentStart and currentEnd
      const dateMap = new Map<string, { label: string; orders: number; revenue: number }>();
      const tempDate = new Date(currentStart);

      while (tempDate.getTime() <= currentEnd.getTime()) {
        const y = tempDate.getFullYear();
        const m = String(tempDate.getMonth() + 1).padStart(2, '0');
        const d = String(tempDate.getDate()).padStart(2, '0');
        const key = `${y}-${m}-${d}`;

        const shortLabel = tempDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
        });

        dateMap.set(key, { label: shortLabel, orders: 0, revenue: 0 });
        tempDate.setDate(tempDate.getDate() + 1);
      }

      filteredOrders.forEach((order) => {
        const oDate = new Date(order.created_at);
        const y = oDate.getFullYear();
        const m = String(oDate.getMonth() + 1).padStart(2, '0');
        const d = String(oDate.getDate()).padStart(2, '0');
        const key = `${y}-${m}-${d}`;

        const bucket = dateMap.get(key);
        if (bucket) {
          bucket.orders += 1;
          if (order.status !== 'cancelled') {
            bucket.revenue += Number(order.total) || 0;
          }
        }
      });

      timeSeries = Array.from(dateMap.entries()).map(([key, val]) => ({
        dateKey: key,
        label: val.label,
        orders: val.orders,
        revenue: val.revenue,
      }));
    }

    // 6. Top Dishes Leaderboard
    const topDishes = Array.from(dishSalesMap.values())
      .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
      .slice(0, 10);

    // 7. Categories Breakdown with % of Total
    const categoriesBreakdown = Array.from(categorySalesMap.values())
      .map((cat) => ({
        ...cat,
        revenueShare: grossRevenue > 0 ? Math.round((cat.revenue / grossRevenue) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // 8. Channel Distribution
    const channelsBreakdown = Array.from(channelMap.values())
      .map((ch) => ({
        ...ch,
        share: totalOrdersCount > 0 ? Math.round((ch.count / totalOrdersCount) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // 9. Peak Rush Windows
    const rushWindows = [
      {
        name: 'Breakfast & Morning',
        range: '08:00 - 12:00',
        orders: hourlyRush.slice(8, 12).reduce((s, h) => s + h.orders, 0),
        revenue: hourlyRush.slice(8, 12).reduce((s, h) => s + h.revenue, 0),
      },
      {
        name: 'Lunch Rush',
        range: '12:00 - 16:00',
        orders: hourlyRush.slice(12, 16).reduce((s, h) => s + h.orders, 0),
        revenue: hourlyRush.slice(12, 16).reduce((s, h) => s + h.revenue, 0),
      },
      {
        name: 'Evening Snacks & Tea',
        range: '16:00 - 20:00',
        orders: hourlyRush.slice(16, 20).reduce((s, h) => s + h.orders, 0),
        revenue: hourlyRush.slice(16, 20).reduce((s, h) => s + h.revenue, 0),
      },
      {
        name: 'Dinner Rush',
        range: '20:00 - 23:00',
        orders: hourlyRush.slice(20, 24).reduce((s, h) => s + h.orders, 0),
        revenue: hourlyRush.slice(20, 24).reduce((s, h) => s + h.revenue, 0),
      },
    ];

    return NextResponse.json(
      {
        range,
        dateSpan: {
          from: currentStart.toISOString(),
          to: currentEnd.toISOString(),
        },
        kpis: {
          grossRevenue,
          taxableSubtotal,
          totalGst,
          totalOrders: totalOrdersCount,
          completedOrders: completedOrdersCount,
          cancelledOrders: cancelledOrdersCount,
          pendingOrders: pendingOrdersCount,
          completionRate,
          averageOrderValue: aov,
          totalItemsSold,
          vegItemsSold,
          nonVegItemsSold,
          vegShare:
            totalItemsSold > 0 ? Math.round((vegItemsSold / totalItemsSold) * 100) : 100,
        },
        growth: {
          revenue: revenueGrowth,
          orders: ordersGrowth,
          aov: aovGrowth,
        },
        timeSeries,
        hourlyRush,
        rushWindows,
        topDishes,
        categoriesBreakdown,
        channelsBreakdown,
        ordersList: filteredOrders.slice(0, 100), // Itemized orders for CSV export & preview
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (err: any) {
    console.error('[Analytics API] Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal error calculating analytics' },
      { status: 500 }
    );
  }
}
