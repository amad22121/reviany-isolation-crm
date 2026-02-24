
-- Hot Calls table with Claim & Lock fields
CREATE TABLE public.hot_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT 'Montréal',
  source TEXT NOT NULL DEFAULT 'Door-to-door',
  status TEXT NOT NULL DEFAULT 'Premier contact',
  phase TEXT NOT NULL DEFAULT 'À rappeler',
  last_feedback TEXT NOT NULL DEFAULT 'No answer',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_contact_date TEXT,
  follow_up_date TEXT,
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  origin TEXT DEFAULT '',
  original_appointment_id TEXT,

  -- Claim & Lock fields
  assigned_to_user_id TEXT,          -- rep id who claimed the lead
  locked_at TIMESTAMPTZ,             -- when claimed
  lock_expires_at TIMESTAMPTZ,       -- auto-expiry time
  last_action_at TIMESTAMPTZ,        -- updated on each action

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hot Call Notes table for call history
CREATE TABLE public.hot_call_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hot_call_id UUID NOT NULL REFERENCES public.hot_calls(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  call_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hot_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hot_call_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies (app has no real auth, using permissive for now)
CREATE POLICY "Allow all access to hot_calls"
  ON public.hot_calls FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to hot_call_notes"
  ON public.hot_call_notes FOR ALL
  USING (true) WITH CHECK (true);

-- Auto-update updated_at
CREATE TRIGGER update_hot_calls_updated_at
  BEFORE UPDATE ON public.hot_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_map_zones_updated_at();

-- Indexes for performance
CREATE INDEX idx_hot_calls_assigned ON public.hot_calls(assigned_to_user_id);
CREATE INDEX idx_hot_calls_lock_expires ON public.hot_calls(lock_expires_at);
CREATE INDEX idx_hot_calls_phase ON public.hot_calls(phase);
CREATE INDEX idx_hot_call_notes_hot_call_id ON public.hot_call_notes(hot_call_id);
