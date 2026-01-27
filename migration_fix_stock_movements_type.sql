-- Drop the old constraint
ALTER TABLE public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_type_check;

-- Add new constraint including 'adjustment'
ALTER TABLE public.stock_movements ADD CONSTRAINT stock_movements_type_check CHECK (type IN ('in', 'out', 'adjustment'));
