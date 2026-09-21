export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { RESTAURANT_DATA } from '@/data/restaurantData';
import { sendWhatsAppTextMessage, isWhatsAppConfigured } from '@/lib/whatsapp';
import { createClient } from '@supabase/supabase-js';
import { Database, DbOrder, OrderStatus, PaymentStatus, PaymentMode } from '@/lib/supabase/types';
import {
  readOrdersFromStore,
  saveOrderToStore,
  syncOrdersWithStore,
  updateOrderStatusInStore,
  updateOrderPaymentStatusInStore,
  deleteOrderFromStore,
  clearTestOrdersFromStore,
  isTestOrderRecord,
  TEST_USER_NAME,
} from '@/lib/ordersStore';

function getOrderDbClient(userToken?: string | null) {
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

interface OrderItemInput {
  itemId: string;
  variant?: 'veg' | 'non-veg';
  quantity: number;
}

interface OrderRequestBody {
  customerName?: string;
  customerPhone?: string;
  items: OrderItemInput[];
  notes?: string;
  deliveryAddress?: string;
  deliveryCoordinates?: { lat: number; lng: number };
  orderType?: 'delivery' | 'takeaway' | 'dine-in';
  idempotencyKey?: string;
  source?: string;
  status?: OrderStatus;
  isManual?: boolean;
  paymentStatus?: PaymentStatus;
  paymentMode?: PaymentMode;
  upiTransactionId?: string;
}

// In-memory cache to ensure zero order loss regardless of RLS state
const globalOrdersCache: any[] = [];

// In-memory debounce set to prevent rapid concurrent double clicks
const recentSubmissions = new Map<string, { timestamp: number; response: any }>();

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const supabaseClient = getOrderDbClient(token);

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          syncOrdersWithStore(data as DbOrder[]);
          const visibleOrders = (data as DbOrder[]).filter((o) => !isTestOrderRecord(o));
          return NextResponse.json(
            { orders: visibleOrders },
            {
              headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              },
            }
          );
        }
      } catch (e) {
        console.warn('[API Orders GET] Supabase query error, fallback to local store:', e);
      }
    }

    // Fallback only if Supabase is unreachable or unconfigured
    const fileOrders = readOrdersFromStore();
    return NextResponse.json(
      { orders: fileOrders },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch {
    return NextResponse.json(
      { orders: readOrdersFromStore() },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: OrderRequestBody = await req.json();
    const {
      customerName,
      customerPhone,
      items,
      notes,
      deliveryAddress,
      deliveryCoordinates,
      orderType,
      idempotencyKey,
      source,
      status,
      isManual,
      paymentStatus,
      paymentMode,
      upiTransactionId,
    } = body;

    // 1. Validation
    const resolvedName = customerName?.trim() || (isManual ? 'Walk-in Guest' : '');
    if (!resolvedName || resolvedName.length < 2) {
      return NextResponse.json(
        { error: 'Customer name must be at least 2 characters.' },
        { status: 400 }
      );
    }

    let cleanPhone = customerPhone?.replace(/\D/g, '') || '';
    if (isManual && cleanPhone.length < 10) {
      cleanPhone = '0000000000';
    } else if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: 'A valid 10-digit mobile phone number is required.' },
        { status: 400 }
      );
    }

    const orderStatus: OrderStatus = status || (isManual ? 'confirmed' : 'pending');
    const orderSource: string =
      source ||
      (isManual
        ? 'Counter POS'
        : orderType === 'delivery'
        ? 'Home Delivery'
        : orderType === 'takeaway'
        ? 'Takeaway / Parcel'
        : 'website_order');

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one dish.' },
        { status: 400 }
      );
    }

    // 2. Idempotency / Duplicate submission prevention
    if (idempotencyKey) {
      const existing = recentSubmissions.get(idempotencyKey);
      if (existing && Date.now() - existing.timestamp < 60000) {
        return NextResponse.json(existing.response);
      }
    }

    const supabaseClient = getOrderDbClient();

    // 3. Server-side price calculation from trusted database
    let computedSubtotal = 0;
    const validatedItems: Array<{
      itemId: string;
      name: string;
      variant?: 'veg' | 'non-veg' | null;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    // If Supabase is available, load fresh items from DB
    if (supabaseClient) {
      const itemIds = items.map((i) => i.itemId);
      const { data: dbItems, error: itemsError } = await supabaseClient
        .from('menu_items')
        .select('*')
        .in('id', itemIds);

      if (itemsError) {
        console.error('[API Orders] Failed to query menu items:', itemsError);
        return NextResponse.json({ error: 'Failed to verify menu items.' }, { status: 500 });
      }

      const itemMap = new Map((dbItems || []).map((item) => [item.id, item]));

      for (const itemInput of items) {
        const dbItem = itemMap.get(itemInput.itemId);
        if (!dbItem) {
          return NextResponse.json(
            { error: `Item "${itemInput.itemId}" was not found in the menu.` },
            { status: 400 }
          );
        }

        if (!dbItem.is_available) {
          return NextResponse.json(
            { error: `Sorry, "${dbItem.name}" is currently sold out or unavailable.` },
            { status: 400 }
          );
        }

        const qty = Math.max(1, Math.floor(itemInput.quantity || 1));
        let unitPrice = Number(dbItem.price);

        if (itemInput.variant === 'non-veg' && dbItem.chicken_price) {
          unitPrice = Number(dbItem.chicken_price);
        }

        const lineTotal = unitPrice * qty;
        computedSubtotal += lineTotal;

        validatedItems.push({
          itemId: dbItem.id,
          name: dbItem.name,
          variant: itemInput.variant || null,
          quantity: qty,
          unitPrice,
          totalPrice: lineTotal,
        });
      }
    } else {
      // Fallback: verify against static catalog if Supabase credentials are not configured yet
      const fallbackMap = new Map(RESTAURANT_DATA.menu.items.map((i) => [i.id, i]));

      for (const itemInput of items) {
        const item = fallbackMap.get(itemInput.itemId);
        if (!item) {
          return NextResponse.json(
            { error: `Item "${itemInput.itemId}" is invalid.` },
            { status: 400 }
          );
        }

        const qty = Math.max(1, Math.floor(itemInput.quantity || 1));
        let unitPrice = item.price;
        if (itemInput.variant === 'non-veg' && item.chickenPrice) {
          unitPrice = item.chickenPrice;
        }

        const lineTotal = unitPrice * qty;
        computedSubtotal += lineTotal;

        validatedItems.push({
          itemId: item.id,
          name: item.name,
          variant: itemInput.variant || null,
          quantity: qty,
          unitPrice,
          totalPrice: lineTotal,
        });
      }
    }

    const computedTotal = computedSubtotal;

    // 4. Save order to Supabase
    const savedOrderId = crypto.randomUUID();
    const orderNumber = Math.floor(1000 + Math.random() * 9000);
    const createdAt = new Date().toISOString();

    const resolvedPaymentStatus: PaymentStatus = paymentStatus === 'paid' ? 'paid' : 'unpaid';
    const resolvedPaymentMode: PaymentMode =
      paymentMode || (resolvedPaymentStatus === 'paid' ? 'upi' : 'cash');
    const resolvedPaidAt = resolvedPaymentStatus === 'paid' ? createdAt : null;
    const resolvedDeliveryAddress = deliveryAddress?.trim() || null;
    const resolvedDeliveryCoordinates = deliveryCoordinates || null;

    const orderRecord = {
      id: savedOrderId,
      order_number: orderNumber,
      customer_name: resolvedName,
      customer_phone: cleanPhone,
      items: validatedItems as any,
      subtotal: computedSubtotal,
      total: computedTotal,
      status: orderStatus,
      payment_status: resolvedPaymentStatus,
      payment_mode: resolvedPaymentMode,
      upi_transaction_id: upiTransactionId || null,
      paid_at: resolvedPaidAt,
      source: orderSource,
      notes: notes?.trim() || null,
      delivery_address: resolvedDeliveryAddress,
      delivery_coordinates: resolvedDeliveryCoordinates,
      idempotency_key: idempotencyKey || null,
      created_at: createdAt,
      updated_at: createdAt,
    };

    // Store in global memory cache and persistent file store for immediate and permanent availability
    globalOrdersCache.unshift(orderRecord);
    saveOrderToStore(orderRecord as any);

    if (supabaseClient) {
      try {
        const orderPayload: any = {
          id: savedOrderId,
          order_number: orderNumber,
          customer_name: resolvedName,
          customer_phone: cleanPhone,
          items: validatedItems as any,
          subtotal: computedSubtotal,
          total: computedTotal,
          status: orderStatus,
          payment_status: resolvedPaymentStatus,
          payment_mode: resolvedPaymentMode,
          upi_transaction_id: upiTransactionId || null,
          paid_at: resolvedPaidAt,
          source: orderSource,
          notes: notes?.trim() || null,
          delivery_address: resolvedDeliveryAddress,
          delivery_coordinates: resolvedDeliveryCoordinates,
          idempotency_key: idempotencyKey || null,
        };

        let { error: orderInsertError } = await supabaseClient
          .from('orders')
          .insert(orderPayload);

        // Resilient fallback: if delivery_address column doesn't exist yet in Supabase
        if (
          orderInsertError &&
          (orderInsertError.message?.toLowerCase().includes('delivery_address') ||
            orderInsertError.message?.toLowerCase().includes('column'))
        ) {
          console.warn('[API Orders] Retrying insert without delivery columns for backward compatibility:', orderInsertError.message);
          delete orderPayload.delivery_address;
          delete orderPayload.delivery_coordinates;
          if (resolvedDeliveryAddress && !orderPayload.notes?.includes(resolvedDeliveryAddress)) {
            orderPayload.notes = orderPayload.notes
              ? `${orderPayload.notes} | Delivery Address: ${resolvedDeliveryAddress}`
              : `Delivery Address: ${resolvedDeliveryAddress}`;
          }
          const retryRes = await supabaseClient.from('orders').insert(orderPayload);
          orderInsertError = retryRes.error;
        }

        if (orderInsertError) {
          console.error('[API Orders] Database insertion error:', orderInsertError);
        } else {
          // Insert line items
          const orderItemsToInsert = validatedItems.map((v) => ({
            order_id: savedOrderId,
            menu_item_id: v.itemId,
            item_name: v.name,
            variant: v.variant,
            quantity: v.quantity,
            unit_price: v.unitPrice,
            total_price: v.totalPrice,
          }));

          await supabaseClient.from('order_items').insert(orderItemsToInsert);
        }
      } catch (dbErr) {
        console.error('[API Orders] Database error:', dbErr);
      }

      // Automated outbound WhatsApp confirmation if WhatsApp Cloud API is configured
      if (isWhatsAppConfigured() && cleanPhone !== '0000000000' && !cleanPhone.startsWith('0000')) {
        const itemSummary = validatedItems
          .map((i) => `${i.quantity}x ${i.name} (${i.variant || 'Standard'}) - ₹${i.totalPrice}`)
          .join('\n');

        const deliveryLine = resolvedDeliveryAddress ? `\n📍 Delivery To: ${resolvedDeliveryAddress}` : '';
        const message = `Hello ${resolvedName}! Thank you for ordering from The Spicy Garden - Cafe & Bistro.\n\nOrder Ref: #SG-${orderNumber}\n\nItems:\n${itemSummary}\n\nTotal: ₹${computedTotal}${deliveryLine}\n\nOur kitchen is processing your order. For immediate inquiries, call 8777866602.`;

        sendWhatsAppTextMessage(cleanPhone, message).catch((err) => {
          console.error('[API Orders] Automated outbound message error:', err);
        });
      }
    }

    const responsePayload = {
      success: true,
      orderId: savedOrderId,
      orderNumber: `#SG-${orderNumber}`,
      order: orderRecord,
      subtotal: computedSubtotal,
      total: computedTotal,
      items: validatedItems,
    };

    if (idempotencyKey) {
      recentSubmissions.set(idempotencyKey, {
        timestamp: Date.now(),
        response: responsePayload,
      });
    }

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error('[API Orders] Unexpected error:', error);
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred while placing order.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, status, paymentStatus, paymentMode, upiTransactionId } = body;
    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required.' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    let updatedStoreOrder: any = null;

    // 1. Update in persistent store
    if (status) {
      updatedStoreOrder = updateOrderStatusInStore(orderId, status as OrderStatus);
    }
    if (paymentStatus) {
      updatedStoreOrder = updateOrderPaymentStatusInStore(
        orderId,
        paymentStatus as PaymentStatus,
        paymentMode as PaymentMode,
        upiTransactionId
      );
    }

    // 2. Update in-memory cache
    const memOrder = globalOrdersCache.find(
      (o) => o.id === orderId || (o.order_number && String(o.order_number) === String(orderId))
    );
    if (memOrder) {
      if (status) memOrder.status = status;
      if (paymentStatus) {
        memOrder.payment_status = paymentStatus;
        if (paymentMode) memOrder.payment_mode = paymentMode;
        if (upiTransactionId !== undefined) memOrder.upi_transaction_id = upiTransactionId;
        memOrder.paid_at = paymentStatus === 'paid' ? memOrder.paid_at || now : null;
      }
      memOrder.updated_at = now;
    }

    // 3. Update in Supabase
    const supabaseClient = getOrderDbClient();
    if (supabaseClient) {
      try {
        const updatePayload: any = { updated_at: now };
        if (status) updatePayload.status = status as OrderStatus;
        if (paymentStatus) {
          updatePayload.payment_status = paymentStatus;
          if (paymentMode) updatePayload.payment_mode = paymentMode;
          if (upiTransactionId !== undefined) updatePayload.upi_transaction_id = upiTransactionId;
          updatePayload.paid_at = paymentStatus === 'paid' ? now : null;
        }
        await supabaseClient
          .from('orders')
          .update(updatePayload)
          .eq('id', orderId);
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      order: updatedStoreOrder || memOrder,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('id');
    const orderNumber = searchParams.get('orderNumber');
    const isClearTest = searchParams.get('clearTests') === 'true';

    if (isClearTest) {
      clearTestOrdersFromStore();

      // Clear memory cache test orders
      for (let i = globalOrdersCache.length - 1; i >= 0; i--) {
        const o = globalOrdersCache[i];
        if (isTestOrderRecord(o)) {
          globalOrdersCache.splice(i, 1);
        }
      }

      // Also attempt deleting from Supabase
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      const supabaseClient = getOrderDbClient(token);
      if (supabaseClient) {
        try {
          await supabaseClient
            .from('orders')
            .delete()
            .in('order_number', [7, 8, 9, 1111, 9999]);
          await supabaseClient
            .from('orders')
            .delete()
            .ilike('customer_name', TEST_USER_NAME);
        } catch (e) {}
      }

      return NextResponse.json({ success: true, message: 'All test orders deleted successfully.' });
    }

    if (!orderId && !orderNumber) {
      return NextResponse.json(
        { error: 'orderId or orderNumber is required.' },
        { status: 400 }
      );
    }

    if (orderId) deleteOrderFromStore(orderId);
    if (orderNumber) deleteOrderFromStore(Number(orderNumber));

    // Remove from in-memory cache
    const idx = globalOrdersCache.findIndex(
      (o) => o.id === orderId || (orderNumber && o.order_number === Number(orderNumber))
    );
    if (idx >= 0) {
      globalOrdersCache.splice(idx, 1);
    }

    // Try deleting from Supabase
    const supabaseClient = getOrderDbClient();
    if (supabaseClient) {
      try {
        if (orderId) {
          await supabaseClient.from('orders').delete().eq('id', orderId);
        } else if (orderNumber) {
          await supabaseClient.from('orders').delete().eq('order_number', Number(orderNumber));
        }
      } catch (e) {}
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to delete order' },
      { status: 500 }
    );
  }
}
