
-- Create map_zones table for territory management
CREATE TABLE public.map_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'À faire' CHECK (status IN ('À faire', 'Planifié aujourd''hui', 'En cours', 'Fait')),
  rep_id TEXT NOT NULL DEFAULT '',
  planned_date TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  polygon JSONB NOT NULL,
  created_by TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create status_logs table for audit trail
CREATE TABLE public.map_zone_status_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES public.map_zones(id) ON DELETE CASCADE,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (permissive for now since auth is demo-based)
ALTER TABLE public.map_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_zone_status_logs ENABLE ROW LEVEL SECURITY;

-- Permissive policies (project uses demo auth, not Supabase Auth)
CREATE POLICY "Allow all access to map_zones" ON public.map_zones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to map_zone_status_logs" ON public.map_zone_status_logs FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_map_zones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_map_zones_updated_at
BEFORE UPDATE ON public.map_zones
FOR EACH ROW
EXECUTE FUNCTION public.update_map_zones_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.map_zones;
