-- Add is_active column to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
