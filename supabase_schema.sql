-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'kasir')) DEFAULT 'kasir',
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 2. CATEGORIES
CREATE TABLE public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('product', 'service')) DEFAULT 'product',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PRODUCTS (Inventory)
CREATE TABLE public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    unit TEXT DEFAULT 'pcs',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. SERVICES (Jasa Catalog)
CREATE TABLE public.services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. MEMBERS
CREATE TABLE public.members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    vehicle_plate TEXT, -- Nomor Polisi
    points INTEGER DEFAULT 0,
    join_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TRANSACTIONS
CREATE TABLE public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    type TEXT CHECK (type IN ('bengkel', 'kios')) NOT NULL,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    final_amount NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TRANSACTION ITEMS
CREATE TABLE public.transaction_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    item_type TEXT CHECK (item_type IN ('product', 'service', 'manual')),
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL, -- Snapshot of name
    qty INTEGER NOT NULL DEFAULT 1,
    price NUMERIC NOT NULL DEFAULT 0, -- Snapshot of price
    subtotal NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. STOCK MOVEMENTS (History)
CREATE TABLE public.stock_movements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('in', 'out', 'adjust')),
    qty INTEGER NOT NULL,
    stock_before INTEGER NOT NULL,
    stock_after INTEGER NOT NULL,
    reference_id UUID, -- Can be transaction_id or null for manual adjust
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. SETTINGS (Store Profile & Config)
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

-- RLS POLICIES
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow generic access to authenticated users (Simplification for small internal app)
-- PROFILES
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- OTHER TABLES (Read/Write for Authenticated Users)
CREATE POLICY "Enable all for authenticated users" ON public.categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON public.products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all products for auth" ON public.products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all services for auth" ON public.services FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all members for auth" ON public.members FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all transactions for auth" ON public.transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all transaction_items for auth" ON public.transaction_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all stock_movements for auth" ON public.stock_movements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all settings for auth" ON public.settings FOR ALL USING (auth.role() = 'authenticated');


-- TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER on_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER on_services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER on_members_updated BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- TRIGGER TO CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'kasir', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- INITIAL DATA (Optional Categories)
INSERT INTO public.categories (name, type) VALUES 
('Spare Part', 'product'),
('Makanan', 'product'),
('Minuman', 'product');

-- INITIAL SETTINGS
INSERT INTO public.settings (key, value) VALUES 
('store_profile', '{"name": "Bengkel & Kios Maju Jaya", "address": "Jl. Raya No. 123", "phone": "0812-9999-8888"}'::jsonb),
('point_config', '{"is_active": true, "earn_rate": 10000, "redeem_rate": 100}'::jsonb);
