-- Migration: Add vehicle_plate column to transactions table
-- Run this in your Supabase SQL editor (optional, POS will work regardless)

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS vehicle_plate TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.transactions.vehicle_plate IS 'Vehicle license plate / Nomor Polisi for the transaction';
