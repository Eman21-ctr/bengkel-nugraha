-- MIGRATION: ADD MANUAL CASHIER NAME TO TRANSACTIONS
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS cashier_name TEXT;

-- Update existing transactions to use the full_name from profiles if available
UPDATE public.transactions t
SET cashier_name = p.full_name
FROM public.profiles p
WHERE t.user_id = p.id AND t.cashier_name IS NULL;
