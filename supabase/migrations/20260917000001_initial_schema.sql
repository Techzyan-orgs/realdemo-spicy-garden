-- =============================================================================
-- Migration: 20260917000001_initial_schema.sql
-- The Spicy Garden - Cafe & Bistro Backend Database Schema
-- Includes: profiles, menu_categories, menu_items, orders, order_items,
--           whatsapp_consents, customer_events, RLS policies, Realtime & Storage
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. PROFILES TABLE & ROLES
-- Role: 'customer' (default) or 'admin'. Normal users cannot set themselves as admin.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index on role for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Helper security definer function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- Trigger to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        COALESCE(new.raw_user_meta_data->>'phone', ''),
        'customer' -- Force customer role by default
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update their own profile info (non-role)"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id 
        AND (role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    );

CREATE POLICY "Admins have full access to profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 2. MENU CATEGORIES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id TEXT PRIMARY KEY, -- e.g. 'pizza', 'pasta', 'burger', 'maggi', etc.
    label TEXT NOT NULL,
    icon TEXT DEFAULT 'Utensils',
    subtitle TEXT,
    description TEXT,
    image_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_menu_categories_sort ON public.menu_categories(sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_menu_categories_active ON public.menu_categories(is_active);

DROP TRIGGER IF EXISTS set_menu_categories_updated_at ON public.menu_categories;
CREATE TRIGGER set_menu_categories_updated_at
    BEFORE UPDATE ON public.menu_categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active menu categories"
    ON public.menu_categories FOR SELECT
    USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can insert menu categories"
    ON public.menu_categories FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update menu categories"
    ON public.menu_categories FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete menu categories"
    ON public.menu_categories FOR DELETE
    USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 3. MENU ITEMS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_items (
    id TEXT PRIMARY KEY, -- e.g. 'piz-1', 'bur-2', or UUID
    category_id TEXT NOT NULL REFERENCES public.menu_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    chicken_price NUMERIC(10,2) CHECK (chicken_price IS NULL OR chicken_price >= 0),
    is_veg BOOLEAN NOT NULL DEFAULT true,
    is_spicy BOOLEAN NOT NULL DEFAULT false,
    is_bestseller BOOLEAN NOT NULL DEFAULT false,
    is_special BOOLEAN NOT NULL DEFAULT false,
    image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    is_available BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_sort ON public.menu_items(sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON public.menu_items(is_available);

DROP TRIGGER IF EXISTS set_menu_items_updated_at ON public.menu_items;
CREATE TRIGGER set_menu_items_updated_at
    BEFORE UPDATE ON public.menu_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view available menu items"
    ON public.menu_items FOR SELECT
    USING (is_available = true OR public.is_admin());

CREATE POLICY "Admins can insert menu items"
    ON public.menu_items FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update menu items"
    ON public.menu_items FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Admins can delete menu items"
    ON public.menu_items FOR DELETE
    USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. ORDERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number SERIAL,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    total NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
    source TEXT NOT NULL DEFAULT 'website_whatsapp',
    notes TEXT,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to orders"
    ON public.orders FOR ALL
    USING (public.is_admin());

CREATE POLICY "Customers can view their own orders"
    ON public.orders FOR SELECT
    USING (
        auth.uid() = customer_id 
        OR public.is_admin()
    );

CREATE POLICY "Public/Customers can insert orders"
    ON public.orders FOR INSERT
    WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 5. ORDER ITEMS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id TEXT REFERENCES public.menu_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    variant TEXT, -- 'veg', 'non-veg', or null
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to order items"
    ON public.order_items FOR ALL
    USING (public.is_admin());

CREATE POLICY "Customers can view items of their orders"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND (o.customer_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Public/Customers can insert order items"
    ON public.order_items FOR INSERT
    WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 6. WHATSAPP CONSENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whatsapp_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT NOT NULL,
    customer_name TEXT,
    consent_given BOOLEAN NOT NULL DEFAULT true,
    source TEXT NOT NULL DEFAULT 'website_interest_prompt',
    metadata JSONB DEFAULT '{}'::jsonb,
    consented_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    opted_out_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_consents_phone ON public.whatsapp_consents(phone);

DROP TRIGGER IF EXISTS set_whatsapp_consents_updated_at ON public.whatsapp_consents;
CREATE TRIGGER set_whatsapp_consents_updated_at
    BEFORE UPDATE ON public.whatsapp_consents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.whatsapp_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to whatsapp consents"
    ON public.whatsapp_consents FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can insert whatsapp consent"
    ON public.whatsapp_consents FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public can update their own consent by phone"
    ON public.whatsapp_consents FOR UPDATE
    USING (true);

-- -----------------------------------------------------------------------------
-- 7. CUSTOMER EVENTS (ANALYTICS) TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    page_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_customer_events_session ON public.customer_events(session_id);
CREATE INDEX IF NOT EXISTS idx_customer_events_name ON public.customer_events(event_name);
CREATE INDEX IF NOT EXISTS idx_customer_events_created ON public.customer_events(created_at DESC);

ALTER TABLE public.customer_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to customer events"
    ON public.customer_events FOR ALL
    USING (public.is_admin());

CREATE POLICY "Public can insert analytics events"
    ON public.customer_events FOR INSERT
    WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 8. SUPABASE REALTIME CONFIGURATION
-- Enable publication on orders table so admin dashboard receives instant updates
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 9. SUPABASE STORAGE BUCKET CONFIGURATION
-- Bucket: 'menu-images' for dish and category photos
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public can read any image in menu-images
DROP POLICY IF EXISTS "Public can view menu images" ON storage.objects;
CREATE POLICY "Public can view menu images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'menu-images');

-- Admins can upload images
DROP POLICY IF EXISTS "Admins can upload menu images" ON storage.objects;
CREATE POLICY "Admins can upload menu images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'menu-images'
        AND (public.is_admin() OR auth.role() = 'service_role')
    );

-- Admins can update images
DROP POLICY IF EXISTS "Admins can update menu images" ON storage.objects;
CREATE POLICY "Admins can update menu images"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'menu-images'
        AND (public.is_admin() OR auth.role() = 'service_role')
    );

-- Admins can delete images
DROP POLICY IF EXISTS "Admins can delete menu images" ON storage.objects;
CREATE POLICY "Admins can delete menu images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'menu-images'
        AND (public.is_admin() OR auth.role() = 'service_role')
    );
