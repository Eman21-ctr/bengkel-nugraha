-- Create service_reminders table
CREATE TABLE IF NOT EXISTS public.service_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_phone TEXT,
    invoice_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('follow_up_3d', 'service_3m')),
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS (Row Level Security)
ALTER TABLE public.service_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users" ON public.service_reminders
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_reminders_status ON public.service_reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_date ON public.service_reminders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_reminders_member_id ON public.service_reminders(member_id);
