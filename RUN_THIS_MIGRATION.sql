-- ==========================================
-- SOLUSI ERROR TRANSAKSI (MIGRASI LENGKAP)
-- ==========================================
-- Jalankan kode ini di SQL Editor Supabase bosku!

-- 1. Tambah Kolom Nama Kasir
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS cashier_name TEXT;

-- 2. Tambah Kolom Status Pembayaran (Lunas/Termin)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('Lunas', 'Belum Lunas')) DEFAULT 'Lunas';

-- 3. Buat Tabel Riwayat Pembayaran (Termin)
CREATE TABLE IF NOT EXISTS public.transaction_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Aktifkan Keamanan (RLS)
ALTER TABLE public.transaction_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.transaction_payments;
CREATE POLICY "Enable all for authenticated users" ON public.transaction_payments FOR ALL USING (auth.role() = 'authenticated');

-- 5. Perbaiki Data Lama (Opsional)
UPDATE public.transactions t
SET cashier_name = p.full_name
FROM public.profiles p
WHERE t.user_id = p.id AND t.cashier_name IS NULL;

INSERT INTO public.transaction_payments (transaction_id, amount, payment_method, note, created_at)
SELECT id, payment_amount, payment_method, 'Pembayaran Awal', created_at
FROM public.transactions
WHERE payment_amount > 0
AND id NOT IN (SELECT transaction_id FROM public.transaction_payments)
ON CONFLICT DO NOTHING;
