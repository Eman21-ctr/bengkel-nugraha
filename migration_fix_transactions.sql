-- Add missing columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS points_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS change NUMERIC DEFAULT 0;

-- Create sequence for invoice number if not exists
CREATE SEQUENCE IF NOT EXISTS invoice_seq;

-- Function to generate invoice number (Format: INV-2026-00001)
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL THEN
        NEW.invoice_number := 'INV-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('invoice_seq')::text, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invoice number
DROP TRIGGER IF EXISTS trg_invoice_number ON public.transactions;
CREATE TRIGGER trg_invoice_number
BEFORE INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION generate_invoice_number();
