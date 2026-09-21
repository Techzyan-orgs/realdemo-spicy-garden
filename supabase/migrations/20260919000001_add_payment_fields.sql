-- =============================================================================
-- Migration: Add Payment Fields, Enforce Uniqueness, and Clean Legacy Test Rows
-- =============================================================================

-- 1. Ensure Payment Tracking columns exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
ADD COLUMN IF NOT EXISTS payment_mode TEXT NOT NULL DEFAULT 'cash' CHECK (payment_mode IN ('cash', 'upi', 'card', 'online')),
ADD COLUMN IF NOT EXISTS upi_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 2. Performance indexes for cost-effective querying & analytics
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_mode ON public.orders(payment_mode);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 3. Delete Dummy Test Orders (#SG-7 and #SG-8)
DELETE FROM public.order_items 
WHERE order_id IN (
    SELECT id FROM public.orders 
    WHERE order_number IN (7, 8, 1111, 9999) 
       OR customer_name ILIKE '%test customer%'
);

DELETE FROM public.orders 
WHERE order_number IN (7, 8, 1111, 9999) 
   OR customer_name ILIKE '%test customer%';

-- 4. Programmatically remove any duplicate order_number rows (keeps the newest/canonical row)
DELETE FROM public.order_items
WHERE order_id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY order_number 
                   ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
               ) as rn
        FROM public.orders
    ) dupes
    WHERE dupes.rn > 1
);

DELETE FROM public.orders
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY order_number 
                   ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
               ) as rn
        FROM public.orders
    ) dupes
    WHERE dupes.rn > 1
);

-- 5. Prevent duplicate orders in the future by enforcing UNIQUE on order_number
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_order_number_unique'
    ) THEN
        ALTER TABLE public.orders ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);
    END IF;
END $$;

-- 6. Verification: View the clean 3 genuine orders in Supabase
SELECT id, order_number, customer_name, customer_phone, total, status, payment_status, payment_mode, created_at
FROM public.orders
ORDER BY created_at DESC;
