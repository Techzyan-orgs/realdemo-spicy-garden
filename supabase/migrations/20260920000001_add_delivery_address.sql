-- =============================================================================
-- Migration: Add Delivery Address & Location Support to Orders
-- =============================================================================

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_coordinates JSONB;

-- Performance index for delivery address lookups if needed
CREATE INDEX IF NOT EXISTS idx_orders_delivery_address ON public.orders(delivery_address);
