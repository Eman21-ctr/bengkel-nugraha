-- MIGRATION: TECHNICIAN COMMISSIONS

-- 1. Add commission settings to services
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS commission_type TEXT CHECK (commission_type IN ('percentage', 'fixed')) DEFAULT 'fixed',
ADD COLUMN IF NOT EXISTS commission_value NUMERIC DEFAULT 0;

-- 2. Add commission tracking to transaction items
ALTER TABLE public.transaction_items 
ADD COLUMN IF NOT EXISTS commission_amount NUMERIC DEFAULT 0;

-- 3. Initial update for existing services (optional)
UPDATE public.services SET commission_type = 'fixed', commission_value = 0 WHERE commission_type IS NULL;
