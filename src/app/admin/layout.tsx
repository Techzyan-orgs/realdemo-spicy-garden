'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { AudioAlertProvider, useAudioAlert } from '@/context/AudioAlertContext';
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  FolderTree,
  MessageSquare,
  Volume2,
  VolumeX,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Sparkles,
  BellRing,
  TrendingUp
} from 'lucide-react';

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const {
    soundEnabled,
    toggleSound,
    triggerChime,
    activeOrderAlert,
    dismissOrderAlert,
    requestDesktopPermission,
  } = useAudioAlert();

  // If on login page, render clean layout without admin navbar
  const isLoginPage = pathname === '/admin/login';

  // Fetch count of pending orders and subscribe to changes
  useEffect(() => {
    if (isLoginPage) return;

    const supabase = getSupabaseBrowserClient();

    const fetchPendingCount = async () => {
      let pendingTotal = 0;
      try {
        const session = (await supabase?.auth.getSession())?.data?.session;
        const headers: Record<string, string> = { 'Cache-Control': 'no-store' };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        const res = await fetch('/api/orders', { cache: 'no-store', headers });
        if (res.ok) {
          const json = await res.json();
          const apiOrders = json.orders || [];
          pendingTotal = apiOrders.filter((o: any) => o.status === 'pending').length;
        }
      } catch (e) {}

      if (pendingTotal === 0 && typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem('sg_orders_cache');
          if (cached) {
            const list = JSON.parse(cached);
            if (Array.isArray(list)) {
              pendingTotal = list.filter((o: any) => o.status === 'pending').length;
            }
          }
        } catch (e) {}
      }

      setPendingOrdersCount(pendingTotal);
    };

    fetchPendingCount();

    let channel: any = null;
    if (supabase) {
      channel = supabase
        .channel('admin_pending_orders_badge')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          () => {
            fetchPendingCount();
          }
        )
        .subscribe();
    }

    const handleCustom = () => fetchPendingCount();
    window.addEventListener('sg_new_order', handleCustom);
    window.addEventListener('storage', handleCustom);

    return () => {
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('sg_new_order', handleCustom);
      window.removeEventListener('storage', handleCustom);
    };
  }, [isLoginPage]);

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/admin/login');
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    {
      label: 'Orders',
      href: '/admin/orders',
      icon: ShoppingBag,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
    },
    { label: 'Analytics', href: '/admin/analytics', icon: TrendingUp },
    { label: 'Menu Items', href: '/admin/menu', icon: UtensilsCrossed },
    { label: 'Categories', href: '/admin/categories', icon: FolderTree },
    { label: 'WhatsApp Opt-ins', href: '/admin/whatsapp', icon: MessageSquare },
  ];

  return (
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-gray-50 dark:bg-gray-950">
        
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 flex-shrink-0 h-screen sticky top-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-5 justify-between overflow-y-auto">
          <div className="space-y-6">
            {/* Brand */}
            <div>
              <Link href="/admin" className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-chili-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-chili-600/30">
                  SG
                </div>
                <div>
                  <h1 className="font-serif font-bold text-sm text-gray-900 dark:text-white leading-tight">
                    The Spicy Garden
                  </h1>
                  <span className="text-[10px] font-semibold text-chili-600 dark:text-chili-400 uppercase tracking-wider">
                    Admin Portal
                  </span>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="space-y-1.5" aria-label="Admin Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-chili-600 text-white shadow-md shadow-chili-600/25'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:text-chili-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-white text-chili-700'
                            : 'bg-rose-500 text-white animate-pulse'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Tools & Profile */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
            {/* Audio Alert Toggle */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={toggleSound}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  soundEnabled
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-gray-400" />
                  )}
                  <span>Sound Alerts</span>
                </div>
                <span className="text-[10px] uppercase font-bold">
                  {soundEnabled ? 'ON' : 'OFF'}
                </span>
              </button>

              {soundEnabled && (
                <button
                  type="button"
                  onClick={triggerChime}
                  className="w-full text-center py-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700 hover:underline flex items-center justify-center space-x-1"
                >
                  <span>🔊 Test Sound Chime</span>
                </button>
              )}
            </div>

            {/* Public Site Link */}
            <Link
              href="/"
              target="_blank"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-chili-600" />
                <span>View Public Site</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Header Bar */}
        <header className="md:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <Link href="/admin" className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-chili-600 flex items-center justify-center text-white font-bold text-xs">
              SG
            </div>
            <span className="font-serif font-bold text-sm text-gray-900 dark:text-white">
              Spicy Garden Admin
            </span>
          </Link>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleSound}
              className={`p-2 rounded-lg border ${
                soundEnabled
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                  : 'bg-gray-100 text-gray-400 border-gray-200'
              }`}
              title="Toggle order chime"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              aria-label="Toggle navigation drawer"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileNavOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 space-y-2 flex-shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                    isActive
                      ? 'bg-chili-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full relative">
          {/* Global Realtime Order Alert Banner */}
          {activeOrderAlert && (
            <div className="mb-6 animate-in slide-in-from-top-4 duration-300">
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-chili-600 via-rose-600 to-amber-600 text-white shadow-xl shadow-chili-600/30 border border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 animate-bounce">
                    <BellRing className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm sm:text-base tracking-wide">
                        🔔 NEW ORDER #SG-{activeOrderAlert.order_number}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-chili-700 animate-pulse">
                        Just Placed
                      </span>
                    </div>
                    <p className="text-xs text-white/90 mt-0.5">
                      <strong>{activeOrderAlert.customer_name}</strong> ({activeOrderAlert.customer_phone}) • Total:{' '}
                      <strong>₹{activeOrderAlert.total}</strong>
                      {activeOrderAlert.items && activeOrderAlert.items.length > 0 && (
                        <span className="opacity-80 ml-1">
                          ({activeOrderAlert.items.length} {activeOrderAlert.items.length === 1 ? 'item' : 'items'})
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
                  <Link
                    href="/admin/orders"
                    onClick={dismissOrderAlert}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-chili-700 hover:bg-gray-100 shadow-md transition-all active:scale-95"
                  >
                    Open Orders Console
                  </Link>
                  <button
                    type="button"
                    onClick={dismissOrderAlert}
                    className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Dismiss alert"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {children}
        </main>
      </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AudioAlertProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AudioAlertProvider>
  );
}
