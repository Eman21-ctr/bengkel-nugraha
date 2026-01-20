-- MIGRATION: EMPLOYEE & MECHANIC TRACKING

-- 1. Create Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    position TEXT CHECK (position IN ('Kasir', 'Mekanik', 'Operator', 'Admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add Mechanic/Operator Reference to Transaction Items
ALTER TABLE public.transaction_items 
ADD COLUMN IF NOT EXISTS performed_by UUID REFERENCES public.employees(id) ON DELETE SET NULL;

-- 3. Add RLS for Employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON public.employees FOR ALL USING (auth.role() = 'authenticated');

-- 4. Trigger for updated_at
CREATE TRIGGER on_employees_updated BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- 5. Seed some initial positions (Optional, but helps UI)
-- The UI will handle adding custom employees.
