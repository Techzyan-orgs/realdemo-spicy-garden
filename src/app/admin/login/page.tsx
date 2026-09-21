'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Lock, Mail, AlertCircle, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/admin';
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam === 'unauthorized'
      ? 'Access denied: Your account does not have admin permissions.'
      : errorParam === 'supabase_not_configured'
      ? 'Supabase credentials are not set in .env.local. Please configure your project first.'
      : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setErrorMessage(
        'Supabase client is not configured. Please fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.'
      );
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        setErrorMessage(error?.message || 'Invalid email or password.');
        setIsLoading(false);
        return;
      }

      // Verify admin role in database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || profile?.role !== 'admin') {
        // Sign out unauthorized user
        await supabase.auth.signOut();
        setErrorMessage(
          'Access Denied: This account does not have administrator privileges.'
        );
        setIsLoading(false);
        return;
      }

      // Success! Refresh router and navigate to admin
      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred during login.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back Link */}
        <div className="mb-6 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs font-medium text-gray-500 hover:text-chili-600 dark:hover:text-chili-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Public Website</span>
          </Link>
        </div>

        {/* Logo & Heading */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-chili-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-chili-600/30">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="mt-4 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Spicy Garden Admin
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Secure management portal for restaurant orders &amp; menu
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-gray-900 py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-gray-200 dark:border-gray-800">
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs flex items-start space-x-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@spicygardencafe.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-chili-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-chili-500"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-chili-600 hover:bg-chili-700 active:scale-95 transition-all shadow-md shadow-chili-600/25 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In as Admin</span>
                )}
              </button>
            </div>
          </form>

          {/* First Time Admin Note */}
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Only authorized restaurant managers with the <code className="text-chili-600 font-mono">admin</code> role in Supabase can access this portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-xs text-gray-400">Loading admin portal...</div>}>
      <LoginForm />
    </Suspense>
  );
}
