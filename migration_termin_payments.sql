-- MIGRATION: TRANSACTION PAYMENTS (TERMIN/INSTALLMENTS)

-- 1. Create Transaction Payments Table
CREATE TABLE IF NOT EXISTS public.transaction_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    note TEXT, -- DP, Pelunasan, Cicilan 2, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add Payment Status to Transactions Table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('Lunas', 'Belum Lunas')) DEFAULT 'Lunas';

-- 3. Enable RLS for transaction_payments
ALTER TABLE public.transaction_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON public.transaction_payments FOR ALL USING (auth.role() = 'authenticated');

-- 4. Initial Migration of existing data
-- For existing transactions, we assume they were lunas upon creation.
-- We insert a payment record for each existing transaction that has payment_amount > 0.

INSERT INTO public.transaction_payments (transaction_id, amount, payment_method, note, created_at)
SELECT id, payment_amount, payment_method, 'Pembayaran Awal', created_at
FROM public.transactions
WHERE payment_amount > 0
ON CONFLICT DO NOTHING;

-- Set status to 'Belum Lunas' for those where payment_amount < final_amount
UPDATE public.transactions 
SET payment_status = 'Belum Lunas'
WHERE payment_amount < final_amount;
