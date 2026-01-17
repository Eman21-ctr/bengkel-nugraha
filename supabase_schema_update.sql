-- 1. MEMBER ENHANCEMENTS
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS member_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS vehicle_type TEXT CHECK (vehicle_type IN ('R2', 'R3', 'R4')),
ADD COLUMN IF NOT EXISTS vehicle_size TEXT CHECK (vehicle_size IN ('Kecil', 'Sedang', 'Besar', 'Jumbo')),
ADD COLUMN IF NOT EXISTS vehicle_model TEXT,
ADD COLUMN IF NOT EXISTS stnk_photo_url TEXT,
ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 0;

-- 2. DYNAMIC SERVICE PRICING
CREATE TABLE IF NOT EXISTS service_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    vehicle_type TEXT,
    vehicle_size TEXT,
    price DECIMAL(12,2),
    UNIQUE(service_id, vehicle_type, vehicle_size)
);

-- 3. QUEUE MANAGEMENT
CREATE TABLE IF NOT EXISTS queues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_number TEXT NOT NULL,
    status TEXT DEFAULT 'Menunggu' CHECK (status IN ('Menunggu', 'Sedang Dilayani', 'Selesai')),
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. LOYALTY PROGRAM
CREATE TABLE IF NOT EXISTS loyalty_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    target_visits INTEGER NOT NULL,
    reward_desc TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS loyalty_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    program_id UUID REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ROLE & PERMISSION (Table structure)
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    menu_key TEXT NOT NULL, -- e.g., 'dashboard', 'transactions', 'inventory'
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_update BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    UNIQUE(user_id, menu_key)
);
