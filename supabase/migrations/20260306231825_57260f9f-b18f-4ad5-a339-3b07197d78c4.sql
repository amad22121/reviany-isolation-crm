
-- Create clients table
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT 'default',
  full_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  cultural_origin text,
  lead_source text,
  origin text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX clients_tenant_phone_idx ON public.clients (tenant_id, phone);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tenant clients" ON public.clients FOR SELECT
  USING (tenant_id IN (SELECT p.tenant_id FROM profiles p WHERE p.user_id = auth.uid()));

CREATE POLICY "Users can insert clients in own tenant" ON public.clients FOR INSERT
  WITH CHECK (tenant_id IN (SELECT p.tenant_id FROM profiles p WHERE p.user_id = auth.uid()));

CREATE POLICY "Users can update clients in own tenant" ON public.clients FOR UPDATE
  USING (tenant_id IN (SELECT p.tenant_id FROM profiles p WHERE p.user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT p.tenant_id FROM profiles p WHERE p.user_id = auth.uid()));

-- Add new columns to appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id),
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS work_already_done text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS property_duration_years numeric,
  ADD COLUMN IF NOT EXISTS recent_or_future_work text,
  ADD COLUMN IF NOT EXISTS had_inspection_report text,
  ADD COLUMN IF NOT EXISTS inspection_by text,
  ADD COLUMN IF NOT EXISTS decision_timeline text,
  ADD COLUMN IF NOT EXISTS close_amount numeric;

-- Migrate existing appointment data into clients
INSERT INTO public.clients (tenant_id, full_name, phone, address, city, cultural_origin, lead_source, origin)
SELECT DISTINCT ON (tenant_id, phone)
  tenant_id, full_name, phone, address, city, cultural_origin, lead_source, origin
FROM public.appointments
WHERE phone IS NOT NULL AND phone != ''
ON CONFLICT DO NOTHING;

-- Link existing appointments to their clients and populate scheduled_at
UPDATE public.appointments a
SET
  client_id = c.id,
  scheduled_at = CASE
    WHEN a.date IS NOT NULL AND a.date != '' AND a.time IS NOT NULL AND a.time != ''
    THEN (a.date || 'T' || a.time || ':00')::timestamptz
    ELSE NULL
  END,
  close_amount = COALESCE(a.close_amount, a.closed_value)
FROM public.clients c
WHERE a.phone = c.phone AND a.tenant_id = c.tenant_id AND a.client_id IS NULL;
