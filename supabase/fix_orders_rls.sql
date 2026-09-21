-- =============================================================================
-- THE SPICY GARDEN - FIX ORDERS ROW LEVEL SECURITY (RLS)
-- Run this snippet in your Supabase Dashboard -> SQL Editor -> New Query -> Run
-- =============================================================================

-- 1. Fix orders table RLS policies
DROP POLICY IF EXISTS "Admins have full access to orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Public/Customers can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public and Admins can view orders" ON public.orders;
DROP POLICY IF EXISTS "Public and Admins can update orders" ON public.orders;

CREATE POLICY "Public can insert orders"
    ON public.orders FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public and Admins can view orders"
    ON public.orders FOR SELECT
    USING (true);

CREATE POLICY "Public and Admins can update orders"
    ON public.orders FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 2. Fix order_items table RLS policies
DROP POLICY IF EXISTS "Admins have full access to order items" ON public.order_items;
DROP POLICY IF EXISTS "Customers can view items of their orders" ON public.order_items;
DROP POLICY IF EXISTS "Public/Customers can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Public and Admins can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Public and Admins can update order items" ON public.order_items;

CREATE POLICY "Public can insert order items"
    ON public.order_items FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public and Admins can view order items"
    ON public.order_items FOR SELECT
    USING (true);

CREATE POLICY "Public and Admins can update order items"
    ON public.order_items FOR UPDATE
    USING (true)
    WITH CHECK (true);
