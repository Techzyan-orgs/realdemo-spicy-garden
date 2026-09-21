import fs from 'fs';
import path from 'path';
import { DbOrder, OrderStatus, PaymentStatus, PaymentMode } from '@/lib/supabase/types';

const STORE_PATH = path.join(process.cwd(), 'src', 'data', 'orders_store.json');

// In-memory fallback / cache
let memoryOrders: DbOrder[] = [];

function ensureStoreFile() {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      fs.writeFileSync(STORE_PATH, JSON.stringify([]), 'utf-8');
    }
  } catch (err) {
    console.warn('[OrdersStore] Failed to ensure store file:', err);
  }
}

// Designated single specific name for test/probe users
export const TEST_USER_NAME = 'Test User';

export function isTestOrderRecord(o: any): boolean {
  if (!o) return true;
  const num = String(o.order_number || '').trim();
  const name = String(o.customer_name || '').trim().toLowerCase();
  if (['7', '8', '9', '1111', '9999'].includes(num)) return true;
  if (name === '__system_healthcheck__' || name === '__automated_probe__') return true;
  if (name === TEST_USER_NAME.toLowerCase()) return true;
  return false;
}

export function readOrdersFromStore(): DbOrder[] {
  try {
    ensureStoreFile();
    if (fs.existsSync(STORE_PATH)) {
      const content = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(content || '[]');
      if (Array.isArray(parsed)) {
        // Merge with memory orders using canonical order_number key
        const map = new Map<string, DbOrder>();
        for (const o of memoryOrders) {
          if (!o || isTestOrderRecord(o)) continue;
          const key = o.order_number ? `num_${o.order_number}` : o.id;
          map.set(key, o);
        }
        for (const o of parsed) {
          if (!o || isTestOrderRecord(o)) continue;
          const key = o.order_number ? `num_${o.order_number}` : o.id;
          const existing = map.get(key);
          if (!existing) {
            map.set(key, o);
          } else {
            const hasItems = Array.isArray(o.items) && o.items.length > 0;
            map.set(key, { ...existing, ...o, items: hasItems ? o.items : existing.items });
          }
        }
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        memoryOrders = merged;
        return merged;
      }
    }
  } catch (err) {
    console.error('[OrdersStore] Error reading orders from store:', err);
  }
  return memoryOrders;
}

export function saveOrderToStore(order: DbOrder): DbOrder {
  try {
    if (isTestOrderRecord(order)) return order;
    ensureStoreFile();
    const current = readOrdersFromStore();
    const exists = current.findIndex(
      (o) => (order.order_number && o.order_number === order.order_number) || o.id === order.id
    );
    let updated: DbOrder[];
    if (exists >= 0) {
      updated = [...current];
      const hasItems = Array.isArray(order.items) && order.items.length > 0;
      updated[exists] = { ...updated[exists], ...order, items: hasItems ? order.items : updated[exists].items };
    } else {
      updated = [order, ...current];
    }

    memoryOrders = updated;
    fs.writeFileSync(STORE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('[OrdersStore] Error saving order to store:', err);
    memoryOrders = [order, ...memoryOrders.filter((o) => o.id !== order.id && (!order.order_number || o.order_number !== order.order_number))];
  }
  return order;
}

export function syncOrdersWithStore(incomingOrders: DbOrder[]): DbOrder[] {
  try {
    ensureStoreFile();
    const current = readOrdersFromStore();
    const map = new Map<string, DbOrder>();

    // Index existing server orders canonically by order_number
    for (const o of current) {
      if (!o || isTestOrderRecord(o)) continue;
      const key = o.order_number ? `num_${o.order_number}` : o.id;
      map.set(key, o);
    }

    let modified = false;

    for (const incoming of incomingOrders) {
      if (!incoming || isTestOrderRecord(incoming)) continue;
      const key = incoming.order_number ? `num_${incoming.order_number}` : incoming.id;
      const existing = map.get(key);

      if (!existing) {
        map.set(key, incoming);
        modified = true;
      } else {
        // Merge updates (e.g. status change, payment change, or line items)
        const isStatusDifferent = incoming.status && incoming.status !== existing.status;
        const isPaymentDifferent =
          incoming.payment_status && incoming.payment_status !== existing.payment_status;
        const isClientNewer =
          incoming.updated_at &&
          existing.updated_at &&
          new Date(incoming.updated_at).getTime() > new Date(existing.updated_at).getTime();

        if (isStatusDifferent || isPaymentDifferent || isClientNewer) {
          const hasItems = Array.isArray(incoming.items) && incoming.items.length > 0;
          const mergedOrder: DbOrder = {
            ...existing,
            ...incoming,
            items: hasItems ? incoming.items : existing.items,
            status: incoming.status || existing.status,
            payment_status: incoming.payment_status || existing.payment_status || 'unpaid',
            payment_mode: incoming.payment_mode || existing.payment_mode || 'cash',
            upi_transaction_id:
              incoming.upi_transaction_id !== undefined
                ? incoming.upi_transaction_id
                : existing.upi_transaction_id || null,
            paid_at:
              incoming.payment_status === 'paid'
                ? incoming.paid_at || existing.paid_at || new Date().toISOString()
                : incoming.paid_at !== undefined
                ? incoming.paid_at
                : existing.paid_at || null,
            updated_at: incoming.updated_at || new Date().toISOString(),
          };
          map.set(key, mergedOrder);
          modified = true;
        }
      }
    }

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    if (modified) {
      memoryOrders = merged;
      fs.writeFileSync(STORE_PATH, JSON.stringify(merged, null, 2), 'utf-8');
    }

    return merged;
  } catch (err) {
    console.error('[OrdersStore] Error syncing orders with store:', err);
    return readOrdersFromStore();
  }
}

export function updateOrderStatusInStore(
  orderId: string,
  status: OrderStatus
): DbOrder | null {
  try {
    ensureStoreFile();
    const current = readOrdersFromStore();
    const idx = current.findIndex((o) => o.id === orderId || (o.order_number && String(o.order_number) === String(orderId)));
    if (idx >= 0) {
      const updatedOrder: DbOrder = {
        ...current[idx],
        status,
        updated_at: new Date().toISOString(),
      };
      current[idx] = updatedOrder;
      memoryOrders = current;
      fs.writeFileSync(STORE_PATH, JSON.stringify(current, null, 2), 'utf-8');
      return updatedOrder;
    }
  } catch (err) {
    console.error('[OrdersStore] Error updating order status:', err);
  }
  return null;
}

export function updateOrderPaymentStatusInStore(
  orderId: string,
  payment_status: PaymentStatus,
  payment_mode?: PaymentMode,
  upi_transaction_id?: string | null
): DbOrder | null {
  try {
    ensureStoreFile();
    const current = readOrdersFromStore();
    const idx = current.findIndex((o) => o.id === orderId || (o.order_number && String(o.order_number) === String(orderId)));
    if (idx >= 0) {
      const now = new Date().toISOString();
      const updatedOrder: DbOrder = {
        ...current[idx],
        payment_status,
        payment_mode: payment_mode || current[idx].payment_mode || 'cash',
        upi_transaction_id:
          upi_transaction_id !== undefined ? upi_transaction_id : current[idx].upi_transaction_id || null,
        paid_at: payment_status === 'paid' ? current[idx].paid_at || now : null,
        updated_at: now,
      };
      current[idx] = updatedOrder;
      memoryOrders = current;
      fs.writeFileSync(STORE_PATH, JSON.stringify(current, null, 2), 'utf-8');
      return updatedOrder;
    }
  } catch (err) {
    console.error('[OrdersStore] Error updating order payment status:', err);
  }
  return null;
}

export function deleteOrderFromStore(identifier: string | number): boolean {
  try {
    ensureStoreFile();
    const current = readOrdersFromStore();
    const filtered = current.filter(
      (o) => o.id !== identifier && o.order_number !== Number(identifier)
    );
    memoryOrders = filtered;
    fs.writeFileSync(STORE_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[OrdersStore] Error deleting order from store:', err);
    return false;
  }
}

export function clearTestOrdersFromStore(): boolean {
  try {
    ensureStoreFile();
    const current = readOrdersFromStore();
    const filtered = current.filter((o) => !isTestOrderRecord(o));
    memoryOrders = filtered;
    fs.writeFileSync(STORE_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[OrdersStore] Error clearing test orders from store:', err);
    return false;
  }
}

