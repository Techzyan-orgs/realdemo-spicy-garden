'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  ShoppingBag,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  Utensils,
  ChevronRight,
  Filter,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart2,
  Users,
  MapPin,
  Coffee
} from 'lucide-react';

interface TimeSeriesPoint {
  dateKey: string;
  label: string;
  orders: number;
  revenue: number;
}

interface HourlyPoint {
  hour: number;
  label: string;
  orders: number;
  revenue: number;
}

interface RushWindow {
  name: string;
  range: string;
  orders: number;
  revenue: number;
}

interface TopDish {
  itemId: string;
  name: string;
  category: string;
  variant?: string | null;
  unitsSold: number;
  revenue: number;
  isVeg: boolean;
}

interface CategoryBreakdown {
  category: string;
  unitsSold: number;
  revenue: number;
  revenueShare: number;
}

interface ChannelBreakdown {
  label: string;
  count: number;
  revenue: number;
  share: number;
}

interface AnalyticsData {
  range: string;
  dateSpan: {
    from: string;
    to: string;
  };
  kpis: {
    grossRevenue: number;
    taxableSubtotal: number;
    totalGst: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    pendingOrders: number;
    completionRate: number;
    averageOrderValue: number;
    totalItemsSold: number;
    vegItemsSold: number;
    nonVegItemsSold: number;
    vegShare: number;
  };
  growth: {
    revenue: number;
    orders: number;
    aov: number;
  };
  timeSeries: TimeSeriesPoint[];
  hourlyRush: HourlyPoint[];
  rushWindows: RushWindow[];
  topDishes: TopDish[];
  categoriesBreakdown: CategoryBreakdown[];
  channelsBreakdown: ChannelBreakdown[];
  ordersList: any[];
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<string>('7d');
  
  // Custom Date Range State (default to first of current month through today)
  const defaultTo = new Date().toISOString().split('T')[0];
  const defaultFrom = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const [customFrom, setCustomFrom] = useState<string>(defaultFrom);
  const [customTo, setCustomTo] = useState<string>(defaultTo);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active hover point for the interactive time series chart
  const [hoveredPoint, setHoveredPoint] = useState<TimeSeriesPoint | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      let url = `/api/admin/analytics?range=${range}`;
      if (range === 'custom') {
        url += `&from=${encodeURIComponent(customFrom)}&to=${encodeURIComponent(customTo)}`;
      }

      const supabase = getSupabaseBrowserClient();
      const session = (await supabase?.auth.getSession())?.data?.session;
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`Failed to load analytics (HTTP ${res.status})`);
      }
      const json = await res.json();
      if (json.error) {
        throw new Error(json.error);
      }
      setData(json);
    } catch (err: any) {
      console.error('[Analytics Page] Error:', err);
      setErrorMsg(err.message || 'Failed to fetch analytics data.');
    } finally {
      setIsLoading(false);
    }
  }, [range, customFrom, customTo]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Handle Preset Range Selection
  const handleSelectPreset = (selectedRange: string) => {
    if (selectedRange === 'custom') {
      setIsCustomMode(true);
      setRange('custom');
    } else {
      setIsCustomMode(false);
      setRange(selectedRange);
    }
  };

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(customFrom) > new Date(customTo)) {
      alert('The "From" date must be earlier than or equal to the "To" date.');
      return;
    }
    setRange('custom');
    fetchAnalytics();
  };

  // CSV Export Utility
  const handleExportCSV = () => {
    if (!data) return;

    const rows: string[][] = [];
    rows.push(['THE SPICY GARDEN - BUSINESS ANALYTICS REPORT']);
    rows.push(['Generated At', new Date().toLocaleString('en-IN')]);
    rows.push(['Selected Period', data.range]);
    rows.push(['Date Range', `${data.dateSpan.from} to ${data.dateSpan.to}`]);
    rows.push([]);

    // KPI Summary
    rows.push(['KEY PERFORMANCE INDICATORS']);
    rows.push(['Gross Revenue (INR)', String(data.kpis.grossRevenue)]);
    rows.push(['Net Taxable Subtotal (INR)', String(data.kpis.taxableSubtotal)]);
    rows.push(['GST 5% (INR)', String(data.kpis.totalGst)]);
    rows.push(['Total Orders', String(data.kpis.totalOrders)]);
    rows.push(['Completed Orders', String(data.kpis.completedOrders)]);
    rows.push(['Cancelled Orders', String(data.kpis.cancelledOrders)]);
    rows.push(['Completion Rate', `${data.kpis.completionRate}%`]);
    rows.push(['Average Order Value (INR)', String(data.kpis.averageOrderValue)]);
    rows.push(['Total Portions Sold', String(data.kpis.totalItemsSold)]);
    rows.push(['Vegetarian Portions', String(data.kpis.vegItemsSold)]);
    rows.push(['Chicken / Non-Veg Portions', String(data.kpis.nonVegItemsSold)]);
    rows.push([]);

    // Category Sales
    rows.push(['CATEGORY SALES SUMMARY']);
    rows.push(['Category', 'Units Sold', 'Revenue (INR)', 'Revenue Share (%)']);
    data.categoriesBreakdown.forEach((cat) => {
      rows.push([cat.category, String(cat.unitsSold), String(cat.revenue), `${cat.revenueShare}%`]);
    });
    rows.push([]);

    // Top Selling Dishes
    rows.push(['TOP SELLING DISHES']);
    rows.push(['Rank', 'Dish Name', 'Category', 'Preference', 'Units Sold', 'Revenue (INR)']);
    data.topDishes.forEach((dish, idx) => {
      rows.push([
        String(idx + 1),
        dish.name,
        dish.category,
        dish.isVeg ? 'Vegetarian' : 'Chicken/Non-Veg',
        String(dish.unitsSold),
        String(dish.revenue),
      ]);
    });
    rows.push([]);

    // Itemized Orders
    rows.push(['ITEMIZED ORDERS RECORD']);
    rows.push(['Order Number', 'Date', 'Customer Name', 'Phone', 'Source', 'Status', 'Total (INR)']);
    (data.ordersList || []).forEach((ord: any) => {
      rows.push([
        `#SG-${ord.order_number}`,
        new Date(ord.created_at).toLocaleString('en-IN'),
        ord.customer_name || 'Walk-in',
        ord.customer_phone || '-',
        ord.source || 'Website',
        ord.status,
        String(ord.total),
      ]);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `spicy-garden-analytics-${range}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chart Max Values for scaling
  const maxRevenue = useMemo(() => {
    if (!data || data.timeSeries.length === 0) return 100;
    const peak = Math.max(...data.timeSeries.map((t) => t.revenue));
    return peak > 0 ? peak : 100;
  }, [data]);

  const maxOrders = useMemo(() => {
    if (!data || data.timeSeries.length === 0) return 10;
    const peak = Math.max(...data.timeSeries.map((t) => t.orders));
    return peak > 0 ? peak : 10;
  }, [data]);

  const maxHourlyOrders = useMemo(() => {
    if (!data || data.hourlyRush.length === 0) return 5;
    const peak = Math.max(...data.hourlyRush.map((h) => h.orders));
    return peak > 0 ? peak : 5;
  }, [data]);

  // Dynamically derived operational insight based on actual rush data
  const dynamicTip = useMemo(() => {
    if (!data || data.kpis.totalOrders === 0) {
      return 'No rush detected in this period yet. Operational insights will update automatically as customer orders are placed.';
    }

    const sorted = [...data.rushWindows].sort(
      (a, b) => b.revenue - a.revenue || b.orders - a.orders
    );
    const top = sorted[0];

    if (!top || top.orders === 0) {
      return 'Orders in this period occurred outside standard rush slots. Monitor custom off-peak dining patterns.';
    }

    const totalRev = data.kpis.grossRevenue || 1;
    const share = Math.round((top.revenue / totalRev) * 100);

    return `Peak Traffic: ${top.name} (${top.range}) dominates this period with ₹${top.revenue.toLocaleString('en-IN')} (${share}% of period sales across ${top.orders} orders). Prioritize line-cook staffing and key inventory during this window.`;
  }, [data]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* ===================================================================== */}
      {/* HEADER: Title & Global Actions */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Business Analytics &amp; Intelligence
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-chili-100 text-chili-700 dark:bg-chili-950 dark:text-chili-300 border border-chili-300">
              Live Reports
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Revenue trends, peak dining hours, best-selling dishes, and order source distribution
          </p>
        </div>

        {/* Global Toolbar: Refresh, Export, Print */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 transition-colors cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-chili-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!data}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition-all cursor-pointer"
            title="Download CSV report for accounting"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm transition-all cursor-pointer"
            title="Print executive analytics summary"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* DATE RANGE CONTROLS: Presets & Custom From-To Picker */}
      {/* ===================================================================== */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Preset Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7d', label: 'Last 7 Days' },
            { id: '30d', label: 'Last 30 Days' },
            { id: 'all', label: 'All Time' },
            { id: 'custom', label: 'Custom Range (From - To)' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectPreset(item.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                range === item.id || (item.id === 'custom' && isCustomMode)
                  ? 'bg-chili-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-750'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom Date Inputs (From - To) */}
        {isCustomMode && (
          <form
            onSubmit={handleApplyCustomRange}
            className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-800 text-xs animate-in fade-in duration-200"
          >
            <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-xl border border-gray-200 dark:border-gray-700">
              <span className="text-gray-400 font-semibold text-[11px]">From:</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-transparent text-gray-900 dark:text-white font-medium focus:outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-xl border border-gray-200 dark:border-gray-700">
              <span className="text-gray-400 font-semibold text-[11px]">To:</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-transparent text-gray-900 dark:text-white font-medium focus:outline-none cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              Apply Filter
            </button>
          </form>
        )}
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading state skeleton */}
      {isLoading && !data && (
        <div className="h-96 flex flex-col items-center justify-center space-y-3 text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin text-chili-600" />
          <p className="text-sm font-semibold">Aggregating real-time restaurant metrics...</p>
        </div>
      )}

      {data && (
        <>
          {/* ================================================================= */}
          {/* KPI CARDS GRID */}
          {/* ================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Gross Revenue */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Gross Revenue
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-sans">
                  ₹{data.kpis.grossRevenue.toLocaleString('en-IN')}
                </span>
                {data.range !== 'all' && (
                  <span
                    className={`text-xs font-bold flex items-center ${
                      data.growth.revenue >= 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {data.growth.revenue >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    <span>{Math.abs(data.growth.revenue)}%</span>
                  </span>
                )}
              </div>

              <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
                <span>Taxable: ₹{data.kpis.taxableSubtotal.toFixed(0)}</span>
                <span>GST 5%: ₹{data.kpis.totalGst.toFixed(0)}</span>
              </div>
            </div>

            {/* KPI 2: Total Orders */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total Orders
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-sans">
                  {data.kpis.totalOrders}
                </span>
                {data.range !== 'all' && (
                  <span
                    className={`text-xs font-bold flex items-center ${
                      data.growth.orders >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {data.growth.orders >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    <span>{Math.abs(data.growth.orders)}%</span>
                  </span>
                )}
              </div>

              <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
                <span className="text-emerald-600 font-bold">
                  {data.kpis.completedOrders} Completed
                </span>
                <span>{data.kpis.completionRate}% Success</span>
              </div>
            </div>

            {/* KPI 3: Average Order Value (AOV) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Average Order Value
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-sans">
                  ₹{data.kpis.averageOrderValue}
                </span>
                {data.range !== 'all' && (
                  <span
                    className={`text-xs font-bold flex items-center ${
                      data.growth.aov >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {data.growth.aov >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    <span>{Math.abs(data.growth.aov)}%</span>
                  </span>
                )}
              </div>

              <div className="text-[11px] text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
                <span>Revenue per transaction</span>
              </div>
            </div>

            {/* KPI 4: Portions Sold & Dietary Ratio */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Portions Served
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Utensils className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-sans">
                  {data.kpis.totalItemsSold}
                </span>
                <span className="text-xs text-gray-400">items</span>
              </div>

              {/* Veg vs Non-Veg Mini Bar */}
              <div className="pt-1 border-t border-gray-100 dark:border-gray-800 space-y-1 text-[11px]">
                <div className="w-full h-2 rounded-full bg-rose-500/20 overflow-hidden flex">
                  <div
                    style={{ width: `${data.kpis.vegShare}%` }}
                    className="h-full bg-emerald-500 rounded-full"
                    title={`Vegetarian: ${data.kpis.vegShare}%`}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-emerald-600">{data.kpis.vegItemsSold} Veg ({data.kpis.vegShare}%)</span>
                  <span className="text-rose-600">{data.kpis.nonVegItemsSold} Non-Veg</span>
                </div>
              </div>
            </div>

          </div>

          {/* ================================================================= */}
          {/* INTERACTIVE TIME-SERIES REVENUE & ORDERS CHART */}
          {/* ================================================================= */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-serif font-bold text-lg text-gray-900 dark:text-white flex items-center space-x-2">
                  <BarChart2 className="w-5 h-5 text-chili-600" />
                  <span>Revenue &amp; Orders Trend</span>
                </h3>
                <p className="text-xs text-gray-400">
                  {data.range === 'today' || data.range === 'yesterday'
                    ? 'Hourly sales progression across 24 hours'
                    : 'Daily gross revenue and order frequency'}
                </p>
              </div>

              {/* Hover Details Card */}
              {hoveredPoint ? (
                <div className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center space-x-3 text-xs">
                  <span className="font-bold text-gray-900 dark:text-white">
                    {hoveredPoint.label}:
                  </span>
                  <span className="font-extrabold text-chili-600 dark:text-chili-400 font-sans">
                    ₹{hoveredPoint.revenue}
                  </span>
                  <span className="text-gray-500 font-bold">
                    ({hoveredPoint.orders} orders)
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-gray-400 italic">
                  Hover over any bar to view exact revenue and order count
                </div>
              )}
            </div>

            {/* SVG Native Responsive Bar Chart */}
            <div className="relative pt-6 pb-2 w-full overflow-x-auto">
              <div className="min-w-[600px] h-60 flex items-end justify-between gap-2 px-2 border-b border-gray-200 dark:border-gray-800">
                {data.timeSeries.map((point, index) => {
                  const heightPercent =
                    maxRevenue > 0 ? Math.max(4, Math.round((point.revenue / maxRevenue) * 100)) : 4;
                  const isHovered = hoveredPoint?.dateKey === point.dateKey;

                  return (
                    <div
                      key={index}
                      onMouseEnter={() => setHoveredPoint(point)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                    >
                      {/* Floating tooltip on hover */}
                      {isHovered && (
                        <div className="absolute -top-10 z-10 px-2 py-1 rounded-lg bg-black text-white text-[10px] font-bold whitespace-nowrap shadow-lg animate-in fade-in">
                          ₹{point.revenue} | {point.orders} ord
                        </div>
                      )}

                      {/* Bar fill */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 ${
                          point.revenue > 0
                            ? isHovered
                              ? 'bg-chili-600 dark:bg-chili-500 shadow-md shadow-chili-600/30'
                              : 'bg-gradient-to-t from-chili-600 to-amber-500 opacity-90 hover:opacity-100'
                            : 'bg-gray-100 dark:bg-gray-800/80'
                        }`}
                      />

                      {/* X-axis Label */}
                      <span className="text-[10px] font-semibold text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white mt-2 truncate max-w-full">
                        {point.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ================================================================= */}
          {/* PEAK HOURS & RUSH ANALYSIS */}
          {/* ================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Rush Windows Cards */}
            <div className="lg:col-span-1 p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-gray-900 dark:text-white flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Dining Rush Windows</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Busiest operational periods for staffing &amp; kitchen prep
                </p>
              </div>

              <div className="space-y-2.5">
                {data.rushWindows.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center justify-between"
                  >
                    <div>
                      <h5 className="font-bold text-xs text-gray-900 dark:text-white">{w.name}</h5>
                      <span className="text-[10px] text-gray-400">{w.range}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-xs font-sans text-gray-900 dark:text-white">
                        ₹{w.revenue}
                      </span>
                      <div className="text-[10px] text-gray-400">{w.orders} orders</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Operational Insight: </strong>
                  <span>{dynamicTip}</span>
                </div>
              </div>
            </div>

            {/* 24-Hour Rush Histogram */}
            <div className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <div>
                <h3 className="font-serif font-bold text-base text-gray-900 dark:text-white flex items-center space-x-2">
                  <Users className="w-4 h-4 text-chili-600" />
                  <span>24-Hour Hourly Rush Distribution</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Total incoming orders plotted hour by hour (00:00 to 23:00)
                </p>
              </div>

              <div className="h-44 flex items-end justify-between gap-1 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
                {data.hourlyRush.map((h) => {
                  const heightPercent =
                    maxHourlyOrders > 0
                      ? Math.max(6, Math.round((h.orders / maxHourlyOrders) * 100))
                      : 6;

                  const isPeak = h.orders === maxHourlyOrders && h.orders > 0;

                  return (
                    <div
                      key={h.hour}
                      className="flex-1 min-w-[18px] flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-7 hidden group-hover:block z-10 px-1.5 py-0.5 rounded bg-black text-white text-[9px] font-bold whitespace-nowrap shadow-md">
                        {h.label}: {h.orders} orders (₹{h.revenue})
                      </div>

                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-sm transition-all ${
                          isPeak
                            ? 'bg-chili-600 animate-pulse'
                            : h.orders > 0
                            ? 'bg-amber-500 dark:bg-amber-400'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                      />

                      <span className="text-[9px] text-gray-400 mt-1 font-mono">
                        {h.hour % 3 === 0 ? `${h.hour}h` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span>00:00 (Midnight)</span>
                <span>12:00 (Noon)</span>
                <span>23:00 (Late Night)</span>
              </div>
            </div>

          </div>

          {/* ================================================================= */}
          {/* CATEGORY REVENUE & ORDER SOURCE BREAKDOWN */}
          {/* ================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Category Performance */}
            <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
              <div>
                <h3 className="font-serif font-bold text-base text-gray-900 dark:text-white flex items-center space-x-2">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  <span>Sales by Menu Category</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Revenue contribution and portion volume per food category
                </p>
              </div>

              {data.categoriesBreakdown.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">No category sales recorded yet</p>
              ) : (
                <div className="space-y-3 pt-2">
                  {data.categoriesBreakdown.map((cat, idx) => (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex justify-between items-baseline font-bold">
                        <span className="text-gray-900 dark:text-white">{cat.category}</span>
                        <div className="space-x-2 font-sans">
                          <span className="text-gray-400 text-[11px]">({cat.unitsSold} sold)</span>
                          <span>₹{cat.revenue}</span>
                          <span className="text-emerald-600 text-[11px] font-mono">
                            {cat.revenueShare}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, cat.revenueShare)}%` }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Channel / Dining Type */}
            <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
              <div>
                <h3 className="font-serif font-bold text-base text-gray-900 dark:text-white flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Order Origin &amp; Dining Channel</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Breakdown across Dine-In, Takeaway, Online Delivery, and Counter POS
                </p>
              </div>

              {data.channelsBreakdown.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">No channel data recorded yet</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {data.channelsBreakdown.map((ch, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-900 dark:text-white">
                          {ch.label}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          {ch.share}%
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline pt-1 text-xs">
                        <span className="text-gray-400">{ch.count} orders</span>
                        <span className="font-bold font-sans">₹{ch.revenue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ================================================================= */}
          {/* TOP 10 BEST-SELLING DISHES LEADERBOARD */}
          {/* ================================================================= */}
          <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-gray-900 dark:text-white flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Top 10 Best-Selling Dishes</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Ranked by volume of portions sold in the selected time range
                </p>
              </div>
            </div>

            {data.topDishes.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No orders recorded in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold text-[11px] pb-2">
                      <th className="py-2.5 px-3 w-12 text-center">RANK</th>
                      <th className="py-2.5 px-3">DISH NAME</th>
                      <th className="py-2.5 px-3">CATEGORY</th>
                      <th className="py-2.5 px-3">TYPE</th>
                      <th className="py-2.5 px-3 text-right">UNITS SOLD</th>
                      <th className="py-2.5 px-3 text-right">TOTAL REVENUE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {data.topDishes.map((dish, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors"
                      >
                        <td className="py-3 px-3 text-center font-extrabold">
                          {idx === 0 ? (
                            <span className="inline-block w-6 h-6 rounded-full bg-amber-400 text-black text-xs font-bold leading-6">
                              1
                            </span>
                          ) : idx === 1 ? (
                            <span className="inline-block w-6 h-6 rounded-full bg-gray-300 text-black text-xs font-bold leading-6">
                              2
                            </span>
                          ) : idx === 2 ? (
                            <span className="inline-block w-6 h-6 rounded-full bg-amber-700 text-white text-xs font-bold leading-6">
                              3
                            </span>
                          ) : (
                            <span className="text-gray-400">#{idx + 1}</span>
                          )}
                        </td>

                        <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">
                          {dish.name}
                          {dish.variant && (
                            <span className="text-[10px] text-gray-400 ml-1.5 font-normal">
                              ({dish.variant})
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-gray-500 uppercase text-[10px] font-semibold">
                          {dish.category}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              dish.isVeg
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                            }`}
                          >
                            {dish.isVeg ? 'Veg' : 'Chicken / Non-Veg'}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right font-extrabold font-sans text-gray-900 dark:text-white">
                          {dish.unitsSold}
                        </td>

                        <td className="py-3 px-3 text-right font-extrabold font-sans text-emerald-600 dark:text-emerald-400">
                          ₹{dish.revenue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
