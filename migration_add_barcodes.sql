-- Add barcode columns to support scanning system
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS barcode TEXT UNIQUE;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS barcode TEXT UNIQUE;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS barcode TEXT UNIQUE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_services_barcode ON public.services(barcode);
CREATE INDEX IF NOT EXISTS idx_members_barcode ON public.members(barcode);
