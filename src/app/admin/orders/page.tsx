'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAudioAlert } from '@/context/AudioAlertContext';
import { DbOrder, PaymentStatus, PaymentMode } from '@/lib/supabase/types';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageCircle,
  Volume2,
  VolumeX,
  X,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  Trash2,
  Loader2,
  Printer,
  Receipt,
  Plus,
  CreditCard,
  Banknote,
  CheckCircle,
  ShieldCheck,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import BillModal from '@/components/BillModal';
import ManualOrderModal from '@/components/ManualOrderModal';

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const targetOrderId = searchParams.get('orderId');
  const targetOrderNumber = searchParams.get('orderNumber');

  const {
    soundEnabled,
    setSoundEnabled,
    activeOrderAlert,
    recentOrders,
  } = useAudioAlert();

  // SSR-safe state: starts empty on both server & client initial render to guarantee matching DOM
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [mounted, setMounted] = useState<boolean>(false);

  const [selectedOrder, setSelectedOrder] = useState<DbOrder | null>(null);
  const selectedOrderRef = React.useRef<DbOrder | null>(null);
  selectedOrderRef.current = selectedOrder;

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newOrderAlert, setNewOrderAlert] = useState<DbOrder | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [showBillModal, setShowBillModal] = useState<boolean>(false);
  const [showManualOrderModal, setShowManualOrderModal] = useState<boolean>(false);

  // Deep-link to specific order if orderId or orderNumber is present in query parameters
  useEffect(() => {
    if (!targetOrderId && !targetOrderNumber) return;

    // Check if order is already in our list
    const match = orders.find(
      (o) =>
        (targetOrderId && o.id === targetOrderId) ||
        (targetOrderNumber && String(o.order_number) === String(targetOrderNumber))
    );

    if (match) {
      setSelectedOrder(match);
      setStatusFilter('all');
      setSearchQuery('');
      setTimeout(() => {
        const el = document.getElementById(`order-card-${match.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-chili-500');
          setTimeout(() => {
            el.classList.remove('ring-4', 'ring-chili-500');
          }, 3000);
        }
      }, 200);
      return;
    }

    // If orders have loaded and still not found in current state, fetch specifically from DB
    if (!isLoading && orders.length > 0) {
      const fetchSpecific = async () => {
        try {
          const supabase = getSupabaseBrowserClient();
          if (!supabase) return;
          let query = supabase.from('orders').select('*');
          if (targetOrderId) query = query.eq('id', targetOrderId);
          else if (targetOrderNumber) {
            const num = parseInt(targetOrderNumber, 10);
            if (!isNaN(num)) query = query.eq('order_number', num);
          }

          const { data, error } = await query.single();
          if (data && !error) {
            setOrders((prev) => (prev.some((o) => o.id === data.id) ? prev : [data, ...prev]));
            setSelectedOrder(data);
            setStatusFilter('all');
            setSearchQuery('');
            setTimeout(() => {
              const el = document.getElementById(`order-card-${data.id}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-4', 'ring-chili-500');
                setTimeout(() => {
                  el.classList.remove('ring-4', 'ring-chili-500');
                }, 3000);
              }
            }, 200);
          }
        } catch (e) {
          console.error('[Admin Orders] Error fetching target order:', e);
        }
      };
      fetchSpecific();
    }
  }, [orders, targetOrderId, targetOrderNumber, isLoading]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync active order notification banner directly into live list
  useEffect(() => {
    if (activeOrderAlert && activeOrderAlert.id) {
      setOrders((prev) => {
        if (prev.some((o) => o.id === activeOrderAlert.id)) return prev;
        return [activeOrderAlert as any, ...prev];
      });
    }
  }, [activeOrderAlert]);

  // Sync recent live alerts from context into live list
  useEffect(() => {
    if (recentOrders && recentOrders.length > 0) {
      setOrders((prev) => {
        const map = new Map<string, DbOrder>();
        for (const o of prev) map.set(o.id, o);
        for (const o of recentOrders) {
          if (!map.has(o.id)) map.set(o.id, o as any);
        }
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    }
  }, [recentOrders]);

  // Single-fetch strategy: directly loads authoritative orders from the database
  const fetchOrders = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const session = (await supabase?.auth.getSession())?.data?.session;
      const headers: Record<string, string> = { 'Cache-Control': 'no-store' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const res = await fetch('/api/orders', { cache: 'no-store', headers });
      if (res.ok) {
        const json = await res.json();
        const incomingOrders: DbOrder[] = json.orders || [];
        const sorted = [...incomingOrders].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setOrders(sorted);
      }
    } catch (err) {
      console.error('[Admin Orders] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    const addNewOrder = (newOrder: DbOrder) => {
      if (!newOrder || !newOrder.id) return;
      setOrders((prev) => {
        const next = [newOrder, ...prev.filter((o) => o.id !== newOrder.id)];
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('sg_orders_cache', JSON.stringify(next.slice(0, 50)));
          } catch (e) {}
        }
        return next;
      });
    };

    // 1. Supabase Realtime subscription on orders table
    const supabase = getSupabaseBrowserClient();
    let channel: any = null;
    if (supabase) {
      channel = supabase
        .channel('admin_realtime_orders')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload) => {
            addNewOrder(payload.new as DbOrder);
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          (payload) => {
            const updatedOrder = payload.new as DbOrder;
            setOrders((prev) =>
              prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
            );
            if (selectedOrderRef.current?.id === updatedOrder.id) {
              setSelectedOrder(updatedOrder);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'orders' },
          (payload) => {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setOrders((prev) => prev.filter((o) => o.id !== deletedId));
              if (selectedOrderRef.current?.id === deletedId) {
                setSelectedOrder(null);
              }
            }
          }
        )
        .subscribe();
    }

    // 2. BroadcastChannel for instant cross-tab order insertion
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('sg_orders_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'NEW_ORDER' && event.data?.order) {
            addNewOrder(event.data.order as DbOrder);
          }
        };
      } catch (e) {}
    }

    // 3. Storage event listener for cross-tab updates
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sg_last_order_event' && e.newValue) {
        try {
          const ord = JSON.parse(e.newValue) as DbOrder;
          addNewOrder(ord);
        } catch (err) {}
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
    }

    // 4. Same-window custom event listener
    const handleCustomOrder = (e: Event) => {
      const custom = e as CustomEvent<DbOrder>;
      if (custom.detail) {
        addNewOrder(custom.detail);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('sg_new_order', handleCustomOrder);
    }

    return () => {
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
      if (bc) {
        bc.close();
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener('sg_new_order', handleCustomOrder);
      }
    };
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, nextStatus: string) => {
    setIsUpdating(orderId);

    // Optimistic UI update in state and localStorage
    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === orderId
          ? { ...o, status: nextStatus as any, updated_at: new Date().toISOString() }
          : o
      );
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('sg_orders_cache', JSON.stringify(updated.slice(0, 50)));
        } catch (e) {}
      }
      return updated;
    });

    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: nextStatus as any } : null));
    }

    if (newOrderAlert?.id === orderId) {
      setNewOrderAlert(null);
    }

    if (nextStatus === 'completed') {
      const target = orders.find((o) => o.id === orderId) || selectedOrder;
      if (target) {
        setSelectedOrder({ ...target, status: 'completed' as any });
        setShowBillModal(true);
      }
    }

    // 1. Update persistent store and server cache via API
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: nextStatus }),
      });
    } catch (e) {
      console.error('[Admin Orders] Status PATCH error:', e);
    }

    // 2. Also update Supabase browser client if configured
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        await supabase
          .from('orders')
          .update({ status: nextStatus as any, updated_at: new Date().toISOString() })
          .eq('id', orderId);
      } catch (err) {
        console.error('[Admin Orders] Supabase status update error:', err);
      }
    }

    setIsUpdating(null);
  };

  const updatePaymentStatus = async (
    orderId: string,
    nextPaymentStatus: PaymentStatus,
    nextPaymentMode?: PaymentMode
  ) => {
    setIsUpdating(orderId);
    const now = new Date().toISOString();

    // 1. Optimistic UI update in state and localStorage
    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              payment_status: nextPaymentStatus,
              payment_mode: nextPaymentMode !== undefined ? nextPaymentMode : o.payment_mode,
              paid_at: nextPaymentStatus === 'paid' ? (o.paid_at || now) : null,
              updated_at: now,
            }
          : o
      );
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('sg_orders_cache', JSON.stringify(updated.slice(0, 50)));
        } catch (e) {}
      }
      return updated;
    });

    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              payment_status: nextPaymentStatus,
              payment_mode: nextPaymentMode !== undefined ? nextPaymentMode : prev.payment_mode,
              paid_at: nextPaymentStatus === 'paid' ? (prev.paid_at || now) : null,
              updated_at: now,
            }
          : null
      );
    }

    // 2. Call PATCH /api/orders
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          paymentStatus: nextPaymentStatus,
          paymentMode: nextPaymentMode,
        }),
      });
    } catch (e) {
      console.error('[Admin Orders] Payment PATCH error:', e);
    }

    // 3. Supabase browser client update
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        await supabase
          .from('orders')
          .update({
            payment_status: nextPaymentStatus,
            payment_mode: nextPaymentMode,
            paid_at: nextPaymentStatus === 'paid' ? now : null,
            updated_at: now,
          })
          .eq('id', orderId);
      } catch (err) {
        console.error('[Admin Orders] Supabase payment update error:', err);
      }
    }

    setIsUpdating(null);
  };

  const deleteOrder = async (orderId: string, orderNumber?: number) => {
    if (!confirm(`Delete order #SG-${orderNumber || ''}? This action cannot be undone.`)) {
      return;
    }
    setIsUpdating(orderId);

    // 1. Immediately remove from local state
    setOrders((prev) => {
      const updated = prev.filter((o) => o.id !== orderId && o.order_number !== orderNumber);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('sg_orders_cache', JSON.stringify(updated.slice(0, 50)));
        } catch (e) {}
      }
      return updated;
    });

    if (selectedOrder?.id === orderId) {
      setSelectedOrder(null);
    }
    if (newOrderAlert?.id === orderId) {
      setNewOrderAlert(null);
    }

    // 2. Delete via API
    try {
      await fetch(
        `/api/orders?id=${encodeURIComponent(orderId)}${orderNumber ? `&orderNumber=${orderNumber}` : ''}`,
        { method: 'DELETE' }
      );
    } catch (e) {
      console.error('[Admin Orders] API delete error:', e);
    }

    // 3. Delete from Supabase browser client
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        if (orderId) {
          await supabase.from('orders').delete().eq('id', orderId);
        } else if (orderNumber) {
          await supabase.from('orders').delete().eq('order_number', orderNumber);
        }
      } catch (err) {
        console.error('[Admin Orders] Supabase delete error:', err);
      }
    }

    setIsUpdating(null);
  };

  const clearAllTestOrders = async () => {
    if (!confirm('Are you sure you want to remove all dummy/test orders?')) return;
    setIsLoading(true);

    try {
      await fetch('/api/orders?clearTests=true', { method: 'DELETE' });
    } catch (e) {}

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        await supabase
          .from('orders')
          .delete()
          .in('order_number', [7, 8, 1111, 9999]);
        await supabase
          .from('orders')
          .delete()
          .ilike('customer_name', '%test%');
      } catch (e) {}
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('sg_last_order_event');
        localStorage.removeItem('sg_orders_cache');
      } catch (e) {}
    }

    await fetchOrders();
    setSelectedOrder(null);
    setIsLoading(false);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const currentPayment = order.payment_status || 'unpaid';
    const matchesPayment = paymentFilter === 'all' || currentPayment === paymentFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      order.customer_name.toLowerCase().includes(q) ||
      order.customer_phone.includes(q) ||
      order.order_number.toString().includes(q) ||
      (order.payment_mode && order.payment_mode.toLowerCase().includes(q)) ||
      (order.upi_transaction_id && order.upi_transaction_id.toLowerCase().includes(q));

    return matchesStatus && matchesPayment && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300';
      case 'preparing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300';
      case 'ready':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Realtime Alert Banner for New Order */}
      {newOrderAlert && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-chili-600 to-rose-600 text-white shadow-xl shadow-chili-600/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 animate-bounce">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm sm:text-base">
                  🔔 NEW ORDER #SG-{newOrderAlert.order_number}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-chili-700">
                  Just Placed
                </span>
              </div>
              <p className="text-xs text-white/90 mt-0.5">
                {newOrderAlert.customer_name} ({newOrderAlert.customer_phone}) • Total: ₹{newOrderAlert.total}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                setSelectedOrder(newOrderAlert);
                setNewOrderAlert(null);
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-chili-700 hover:bg-gray-100 shadow-sm"
            >
              View Details
            </button>
            <button
              onClick={() => updateOrderStatus(newOrderAlert.id, 'confirmed')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm"
            >
              Accept Order
            </button>
            <button
              onClick={() => setNewOrderAlert(null)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Live Orders Console
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Realtime Connected</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Incoming orders appear instantly with audible alerts and live status tracking
          </p>
        </div>

        {/* Action Controls & Audio Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowManualOrderModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-chili-600 hover:bg-chili-700 shadow-md shadow-chili-600/25 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Manual Order</span>
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              soundEnabled
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800'
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span>Audio Alert: Active</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-gray-400" />
                <span>Enable Order Sound</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={fetchOrders}
            className="p-2 rounded-xl bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 transition-colors"
            title="Refresh orders list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={clearAllTestOrders}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 text-xs font-semibold transition-colors"
            title="Purge all test orders"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Test Orders</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 p-2 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        {/* Status Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full lg:w-auto p-1">
          {['all', 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'].map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap capitalize transition-all ${
                  statusFilter === status
                    ? 'bg-chili-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {status}
              </button>
            )
          )}
        </div>

        {/* Right side: Payment Status Filter & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto px-1">
          {/* Payment Status Segmented Control */}
          <div className="flex items-center space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => setPaymentFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                paymentFilter === 'all'
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setPaymentFilter('unpaid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                paymentFilter === 'unpaid'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-100/50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Unpaid</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentFilter('paid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                paymentFilter === 'paid'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100/50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Paid</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search #, customer, UPI..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-xs focus:outline-none focus:ring-2 focus:ring-chili-500"
            />
          </div>
        </div>
      </div>

      {/* Orders Table / Cards */}
      {!mounted ? (
        <div className="py-16 text-center text-xs text-gray-400 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-chili-600" />
          <span>Loading live orders...</span>
        </div>
      ) : isLoading && orders.length === 0 ? (
        <div className="py-16 text-center text-xs text-gray-400 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-chili-600" />
          <span>Loading live orders...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800">
          <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            No orders found matching this filter.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            New orders will appear automatically in real-time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const items = Array.isArray(order.items) ? (order.items as any[]) : [];
            const isPending = order.status === 'pending';

            return (
              <div
                key={order.id}
                id={`order-card-${order.id}`}
                className={`p-5 rounded-3xl bg-white dark:bg-gray-900 border transition-all flex flex-col justify-between ${
                  isPending
                    ? 'border-amber-400 dark:border-amber-600 shadow-md ring-1 ring-amber-400/20'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                }`}
              >
                <div>
                  {/* Top: Order # & Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="font-mono font-bold text-sm text-gray-900 dark:text-white pt-0.5">
                      #SG-{order.order_number}
                    </span>
                    <div className="flex items-center flex-wrap justify-end gap-1.5">
                      {order.payment_status === 'paid' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>PAID {order.payment_mode ? `• ${order.payment_mode}` : ''}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>UNPAID</span>
                        </span>
                      )}

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                          setShowBillModal(true);
                        }}
                        className="p-1 rounded-lg text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Print / View Bill (Receipt)"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating === order.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteOrder(order.id, order.order_number);
                        }}
                        className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors disabled:opacity-40"
                        title="Delete order"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-serif font-bold text-base text-gray-900 dark:text-white truncate">
                        {order.customer_name}
                      </h4>
                      {order.source && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex-shrink-0">
                          {order.source}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 mt-1 text-xs">
                      <a
                        href={`tel:${order.customer_phone}`}
                        className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-chili-600"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{order.customer_phone}</span>
                      </a>
                      <a
                        href={`https://wa.me/91${order.customer_phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-emerald-600 hover:underline font-semibold"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    </div>

                    {/* Delivery Address / Location Badge */}
                    {order.delivery_address && (
                      <div className="mt-2.5 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200">
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-start space-x-1.5 min-w-0 flex-1">
                            <MapPin className="w-3.5 h-3.5 text-chili-600 flex-shrink-0 mt-0.5" />
                            <span className="font-medium leading-snug break-words">
                              {order.delivery_address}
                            </span>
                          </div>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 inline-flex items-center space-x-1 text-[10px] font-bold text-chili-600 dark:text-chili-400 hover:underline bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded border border-chili-200 dark:border-chili-900/80 shadow-2xs cursor-pointer"
                            title="Open address in Google Maps"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span>Maps</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ordered Items Preview */}
                  <div className="space-y-1.5 mb-4">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between text-xs text-gray-700 dark:text-gray-300"
                      >
                        <span className="line-clamp-1 flex-1 pr-2">
                          <strong className="text-gray-900 dark:text-white font-sans">{item.quantity}x</strong>{' '}
                          {item.name}
                          {item.variant && (
                            <span className="text-[10px] text-gray-400 ml-1">
                              ({item.variant})
                            </span>
                          )}
                        </span>
                        <span className="font-semibold font-sans">₹{item.totalPrice}</span>
                      </div>
                    ))}
                  </div>

                  {/* Cooking Notes if any */}
                  {order.notes && (
                    <div className="mb-4 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300">
                      <strong>Note:</strong> {order.notes}
                    </div>
                  )}
                </div>

                {/* Bottom Total & Actions */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-400">Total Amount:</span>
                    <span className="text-lg font-extrabold text-gray-900 dark:text-white font-sans">
                      ₹{order.total}
                    </span>
                  </div>

                  {/* Payment Bar & Quick Action */}
                  <div className="flex items-center justify-between py-1 px-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-xs">
                    <div className="flex items-center space-x-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[11px] text-gray-500 font-medium">Bill:</span>
                      <span className={`text-[11px] font-bold uppercase ${
                        order.payment_status === 'paid'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {order.payment_status === 'paid' ? `Paid (${order.payment_mode || 'UPI'})` : 'Unpaid'}
                      </span>
                    </div>

                    {order.payment_status === 'paid' ? (
                      <button
                        type="button"
                        disabled={isUpdating === order.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePaymentStatus(order.id, 'unpaid');
                        }}
                        className="text-[10px] font-bold text-gray-400 hover:text-amber-600 underline cursor-pointer disabled:opacity-50"
                        title="Change status to Unpaid"
                      >
                        Mark Unpaid
                      </button>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          disabled={isUpdating === order.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            updatePaymentStatus(order.id, 'paid', 'cash');
                          }}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 transition-colors disabled:opacity-50 cursor-pointer"
                          title="Record Cash Payment"
                        >
                          + Cash
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating === order.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            updatePaymentStatus(order.id, 'paid', 'upi');
                          }}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 transition-colors disabled:opacity-50 cursor-pointer"
                          title="Record UPI Payment"
                        >
                          + UPI
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 transition-colors"
                    >
                      Details
                    </button>

                    {order.status === 'pending' && (
                      <button
                        type="button"
                        disabled={isUpdating === order.id}
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-chili-600 text-white hover:bg-chili-700 shadow-sm"
                      >
                        Accept
                      </button>
                    )}
                    {order.status === 'confirmed' && (
                      <button
                        type="button"
                        disabled={isUpdating === order.id}
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700"
                      >
                        Preparing
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        type="button"
                        disabled={isUpdating === order.id}
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        Ready
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button
                        type="button"
                        disabled={isUpdating === order.id}
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        Complete
                      </button>
                    )}
                    {(order.status === 'completed' || order.status === 'cancelled') && (
                      <span className="text-center py-1.5 text-xs text-gray-400 italic">
                        Archived
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-lg text-gray-900 dark:text-white">
                  #SG-{selectedOrder.order_number}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadge(
                    selectedOrder.status
                  )}`}
                >
                  {selectedOrder.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Placed on {new Date(selectedOrder.created_at).toLocaleString()}
              </p>
            </div>

            {/* Customer Details */}
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Customer:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {selectedOrder.customer_name}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Phone:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono">{selectedOrder.customer_phone}</span>
                  <a
                    href={`https://wa.me/91${selectedOrder.customer_phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    title="WhatsApp chat"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
              {selectedOrder.notes && (
                <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60 text-xs">
                  <span className="text-gray-400">Instructions: </span>
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    {selectedOrder.notes}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Details Card */}
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-chili-600" />
                  <span>Payment Status</span>
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                  selectedOrder.payment_status === 'paid'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                }`}>
                  {selectedOrder.payment_status === 'paid' ? '● PAID IN FULL' : '○ BILL UNPAID'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Payment Mode:</span>
                  <p className="font-bold uppercase text-gray-900 dark:text-white mt-0.5">
                    {selectedOrder.payment_mode || (selectedOrder.payment_status === 'paid' ? 'UPI' : 'Not Set')}
                  </p>
                </div>
                {selectedOrder.upi_transaction_id ? (
                  <div>
                    <span className="text-gray-400">UPI Ref / UTR:</span>
                    <p className="font-mono font-bold text-gray-900 dark:text-white mt-0.5 text-[11px] truncate" title={selectedOrder.upi_transaction_id}>
                      {selectedOrder.upi_transaction_id}
                    </p>
                  </div>
                ) : selectedOrder.paid_at ? (
                  <div>
                    <span className="text-gray-400">Paid At:</span>
                    <p className="text-gray-700 dark:text-gray-300 mt-0.5 text-[11px]">
                      {new Date(selectedOrder.paid_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Quick Payment Settlement Actions */}
              <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-gray-400 font-semibold mr-1">Update Payment:</span>
                {selectedOrder.payment_status !== 'paid' ? (
                  <>
                    <button
                      type="button"
                      disabled={isUpdating === selectedOrder.id}
                      onClick={() => updatePaymentStatus(selectedOrder.id, 'paid', 'cash')}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      Mark Paid (Cash)
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating === selectedOrder.id}
                      onClick={() => updatePaymentStatus(selectedOrder.id, 'paid', 'upi')}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      Mark Paid (UPI)
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating === selectedOrder.id}
                      onClick={() => updatePaymentStatus(selectedOrder.id, 'paid', 'card')}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      Mark Paid (Card)
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={isUpdating === selectedOrder.id}
                    onClick={() => updatePaymentStatus(selectedOrder.id, 'unpaid')}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Mark as Unpaid
                  </button>
                )}
              </div>
            </div>

            {/* Line Items List */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Order Items
              </h5>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(Array.isArray(selectedOrder.items) ? (selectedOrder.items as any[]) : []).map(
                  (item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40 text-xs"
                    >
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {item.quantity}x {item.name}
                        </span>
                        {item.variant && (
                          <span className="text-gray-400 text-[10px] ml-1.5">
                            ({item.variant})
                          </span>
                        )}
                        <div className="text-[10px] text-gray-400">
                          ₹{item.unitPrice} each
                        </div>
                      </div>
                      <span className="font-bold font-sans">₹{item.totalPrice}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Subtotal & Total */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-baseline">
              <span className="text-xs text-gray-500">Order Total:</span>
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white font-sans">
                ₹{selectedOrder.total}
              </span>
            </div>

            {/* Print POS Receipt / Bill Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowBillModal(true)}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Generate &amp; Print Bill (POS Receipt)</span>
              </button>
            </div>

            {/* Actions: Update Status & Delete */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-500 mr-1">Status:</span>
                {['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'].map(
                  (st) => (
                    <button
                      key={st}
                      disabled={selectedOrder.status === st || isUpdating === selectedOrder.id}
                      onClick={() => updateOrderStatus(selectedOrder.id, st)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold capitalize transition-all ${
                        selectedOrder.status === st
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:border-chili-500 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                disabled={isUpdating === selectedOrder.id}
                onClick={() => deleteOrder(selectedOrder.id, selectedOrder.order_number)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 text-xs font-bold transition-colors ml-auto"
                title="Delete this order"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Order Modal (POS Terminal) */}
      {showManualOrderModal && (
        <ManualOrderModal
          isOpen={showManualOrderModal}
          onClose={() => setShowManualOrderModal(false)}
          onOrderCreated={(newOrder, autoPrint) => {
            setOrders((prev) => {
              const updated = [newOrder, ...prev.filter((o) => o.id !== newOrder.id)];
              if (typeof window !== 'undefined') {
                try {
                  localStorage.setItem('sg_orders_cache', JSON.stringify(updated.slice(0, 50)));
                } catch (e) {}
              }
              return updated;
            });

            if (autoPrint) {
              setSelectedOrder(newOrder);
              setShowBillModal(true);
            }
          }}
        />
      )}

      {/* Bill Modal (Pure B&W Thermal Print / POS Format) */}
      {showBillModal && selectedOrder && (
        <BillModal
          isOpen={showBillModal}
          onClose={() => setShowBillModal(false)}
          order={selectedOrder}
        />
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-20 text-center text-xs text-gray-400 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-chili-600" />
          <span>Loading Live Orders Console...</span>
        </div>
      }
    >
      <AdminOrdersContent />
    </React.Suspense>
  );
}
