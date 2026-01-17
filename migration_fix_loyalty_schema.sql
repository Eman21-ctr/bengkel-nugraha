-- Migration: Fix Loyalty Schema Mismatch
-- Purpose: Aligns the database with the application code (loyalty-actions.ts)

-- 1. Fix loyalty_programs -> loyalty_rewards
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'loyalty_programs') THEN
        ALTER TABLE loyalty_programs RENAME TO loyalty_rewards;
    END IF;
END $$;

-- 2. Create loyalty_rewards if it doesn't exist at all
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visits_required INTEGER NOT NULL,
    reward_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Adjust columns if renamed from old schema
DO $$ 
BEGIN
    -- Rename target_visits -> visits_required if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loyalty_rewards' AND column_name='target_visits') THEN
        ALTER TABLE loyalty_rewards RENAME COLUMN target_visits TO visits_required;
    END IF;
    -- Rename name -> reward_name if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loyalty_rewards' AND column_name='name') THEN
        ALTER TABLE loyalty_rewards RENAME COLUMN name TO reward_name;
    END IF;
END $$;

-- 4. Fix loyalty_claims
CREATE TABLE IF NOT EXISTS public.loyalty_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    milestone_visit INTEGER NOT NULL,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add milestone_visit if it's missing in existing table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loyalty_claims' AND column_name='milestone_visit') THEN
        ALTER TABLE loyalty_claims ADD COLUMN milestone_visit INTEGER;
    END IF;
END $$;

-- 5. Enable RLS and Add Policies (Hardened)
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for authenticated users" ON loyalty_rewards;
CREATE POLICY "Enable all for authenticated users" ON loyalty_rewards FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all for authenticated users" ON loyalty_claims;
CREATE POLICY "Enable all for authenticated users" ON loyalty_claims FOR ALL USING (auth.role() = 'authenticated');
