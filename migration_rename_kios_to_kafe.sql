-- Rename 'kios' to 'kafe' in transactions table

-- 1. Update existing transactions
UPDATE public.transactions SET type = 'kafe' WHERE type = 'kios';

-- 2. Drop the old check constraint (need to find the name first, usually it's table_column_check)
-- Since we don't know the exact name, we'll try to find it or just create a new one.
-- In Supabase, often we can use:
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- 3. Add the new check constraint
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check CHECK (type IN ('bengkel', 'kafe'));

-- 4. Update initial data categories if they match kiosk style (optional but good for consistency)
UPDATE public.categories SET name = 'Kafe' WHERE name = 'Kios';
