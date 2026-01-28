-- Migration: Add kilometer field to transactions table
-- Run this in your Supabase SQL editor

-- Add kilometer column to transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS kilometer INTEGER;

-- Add comment
COMMENT ON COLUMN public.transactions.kilometer IS 'Odometer reading at time of service (for bengkel transactions)';
