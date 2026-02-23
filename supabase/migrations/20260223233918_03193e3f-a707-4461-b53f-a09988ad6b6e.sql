
-- Create private storage bucket for client photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-photos', 'client-photos', false);

-- Storage policies: allow all authenticated-like access (matching app pattern - no Supabase Auth)
CREATE POLICY "Allow upload client photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'client-photos');

CREATE POLICY "Allow read client photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'client-photos');

CREATE POLICY "Allow delete client photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'client-photos');

-- Create client_photos metadata table
CREATE TABLE public.client_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_phone TEXT NOT NULL,
  client_name TEXT NOT NULL DEFAULT '',
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'Other',
  uploaded_by TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_photos ENABLE ROW LEVEL SECURITY;

-- RLS policy (matching existing app pattern - local role system)
CREATE POLICY "Allow all access to client_photos"
  ON public.client_photos
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for fast lookups by phone
CREATE INDEX idx_client_photos_phone ON public.client_photos (client_phone);
