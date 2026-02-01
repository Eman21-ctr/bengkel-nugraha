-- MIGRATION: ADD ACTIVE STATUS TO MEMBERS
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing members to be active
UPDATE public.members SET is_active = true WHERE is_active IS NULL;
