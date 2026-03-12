
-- Add confirmed_at timestamp to appointments for accurate sales activity tracking.
-- This allows the Classement ranking to count confirmations by when they happened,
-- not by when the appointment is scheduled.

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

-- Backfill: for rows already in confirme status with no confirmed_at,
-- use updated_at as the best-effort approximation.
UPDATE public.appointments
SET confirmed_at = updated_at
WHERE status = 'confirme' AND confirmed_at IS NULL;

-- Trigger: auto-stamp confirmed_at server-side whenever status transitions
-- to 'confirme'. This keeps the client payload simple and prevents the status
-- update from failing if an older client doesn't send confirmed_at.
CREATE OR REPLACE FUNCTION public.stamp_confirmed_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'confirme' AND (OLD.status IS DISTINCT FROM 'confirme') THEN
    NEW.confirmed_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS appointments_stamp_confirmed_at ON public.appointments;
CREATE TRIGGER appointments_stamp_confirmed_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.stamp_confirmed_at();
