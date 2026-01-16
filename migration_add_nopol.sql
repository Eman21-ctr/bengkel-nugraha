-- Run this to update the existing members table
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS vehicle_plate TEXT;
