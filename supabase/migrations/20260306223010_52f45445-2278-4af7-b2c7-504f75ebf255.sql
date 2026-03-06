
-- Create the appointments table
CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id text NOT NULL DEFAULT 'default',
  full_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  origin text,
  cultural_origin text,
  lead_source text,
  date text NOT NULL,
  time text NOT NULL DEFAULT '09:00',
  rep_id text NOT NULL DEFAULT '',
  pre_qual_1 text NOT NULL DEFAULT '',
  pre_qual_2 text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Planifié',
  source text,
  sms_scheduled boolean NOT NULL DEFAULT false,
  closed_value numeric,
  closed_at timestamptz,
  closed_by text,
  was_recovered boolean DEFAULT false,
  status_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS: Authenticated users can read appointments in their tenant
CREATE POLICY "Users can read own tenant appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );

-- RLS: Reps can only insert into their own tenant
CREATE POLICY "Users can insert appointments in own tenant"
  ON public.appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );

-- RLS: Owners/managers can update any appointment in their tenant; reps can update their own
CREATE POLICY "Users can update appointments in own tenant"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );

-- RLS: Owners can delete appointments in their tenant
CREATE POLICY "Owners can delete appointments in own tenant"
  ON public.appointments FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'owner'
    )
  );

-- Auto-update updated_at
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();
