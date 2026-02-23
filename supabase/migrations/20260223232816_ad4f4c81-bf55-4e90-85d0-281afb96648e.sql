
-- Create marketing_leads table
CREATE TABLE public.marketing_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  has_attic TEXT DEFAULT '',
  source TEXT NOT NULL DEFAULT 'Facebook',
  status TEXT NOT NULL DEFAULT 'New Lead',
  assigned_rep_id TEXT,
  attempts_count INTEGER NOT NULL DEFAULT 0,
  last_contact_date TIMESTAMP WITH TIME ZONE,
  notes TEXT DEFAULT '',
  next_followup_date DATE,
  converted_appointment_id TEXT,
  created_by_user_id TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;

-- RLS policy (matching existing pattern - app uses local role system, not Supabase Auth)
CREATE POLICY "Allow all access to marketing_leads"
  ON public.marketing_leads
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_marketing_leads_updated_at
  BEFORE UPDATE ON public.marketing_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_map_zones_updated_at();
