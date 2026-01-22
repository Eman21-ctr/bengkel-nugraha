-- Add note column to transactions table
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS note TEXT;
