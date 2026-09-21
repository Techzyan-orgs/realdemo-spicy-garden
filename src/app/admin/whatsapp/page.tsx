'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { DbWhatsAppConsent } from '@/lib/supabase/types';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  ShieldCheck,
  Phone,
  Calendar,
  ExternalLink
} from 'lucide-react';

export default function AdminWhatsAppPage() {
  const [consents, setConsents] = useState<DbWhatsAppConsent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState(
    'Hello from The Spicy Garden! This is a test confirmation message from our official restaurant bot.'
  );
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchConsents = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('whatsapp_consents')
        .select('*')
        .order('consented_at', { ascending: false });

      if (error) throw error;
      setConsents(data || []);
      if (data && data.length > 0 && !testPhone) {
        setTestPhone(data[0].phone);
      }
    } catch (err) {
      console.error('[Admin WhatsApp] Error fetching consents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [testPhone]);

  useEffect(() => {
    fetchConsents();
  }, [fetchConsents]);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/admin/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone,
          message: testMessage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSendResult({
          success: true,
          message: `Message successfully dispatched via Meta Graph API! (Message ID: ${data.messageId || 'sent'})`,
        });
      } else {
        setSendResult({
          success: false,
          message: data.error || 'Failed to dispatch message.',
        });
      }
    } catch (err: any) {
      setSendResult({
        success: false,
        message: err?.message || 'Error contacting API.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          WhatsApp Opt-ins &amp; Cloud Messaging
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review opt-in subscribers, track consent metadata, and test outbound WhatsApp Cloud API notifications
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Outbound Messaging Sandbox */}
        <div className="lg:col-span-1 space-y-5">
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                <Send className="w-4 h-4" />
              </div>
              <h3 className="font-serif font-bold text-base text-gray-900 dark:text-white">
                Outbound Message Tester
              </h3>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Verify your official WhatsApp Business Cloud API integration by sending a live test message to an opted-in subscriber.
            </p>

            {sendResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${
                  sendResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300'
                }`}
              >
                {sendResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{sendResult.message}</span>
              </div>
            )}

            <form onSubmit={handleSendTest} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Recipient WhatsApp Number
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Message Content
                </label>
                <textarea
                  rows={4}
                  required
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/25 disabled:opacity-60 cursor-pointer"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending via Meta API...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Test Message</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400 space-y-1">
              <p>• Requires <code className="font-mono text-emerald-600">WHATSAPP_ACCESS_TOKEN</code> in .env.local</p>
              <p>• Outbound messages must comply with Meta WhatsApp Business messaging policies</p>
            </div>
          </div>
        </div>

        {/* Right Column: Consents Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h3 className="font-serif font-bold text-base text-gray-900 dark:text-white">
                  Explicit Opt-In Subscribers ({consents.length})
                </h3>
              </div>
              <span className="text-xs text-gray-400">
                Consent collected via privacy-conscious prompt
              </span>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-xs text-gray-400">
                Loading subscribers...
              </div>
            ) : consents.length === 0 ? (
              <div className="py-16 text-center">
                <ShieldCheck className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  No subscribers have opted in yet.
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  When visitors engage with your menu and accept WhatsApp updates, their verified phone and consent timestamp will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5 rounded-l-xl">Mobile Phone</th>
                      <th className="px-4 py-2.5">Name</th>
                      <th className="px-4 py-2.5">Source</th>
                      <th className="px-4 py-2.5">Consented At</th>
                      <th className="px-4 py-2.5 rounded-r-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {consents.map((consent) => (
                      <tr key={consent.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                        <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">
                          +91 {consent.phone}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {consent.customer_name || 'Guest Diner'}
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {consent.source}
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {new Date(consent.consented_at).toLocaleDateString([], {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setTestPhone(consent.phone)}
                            className="text-xs text-emerald-600 font-semibold hover:underline"
                          >
                            Send Test
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
