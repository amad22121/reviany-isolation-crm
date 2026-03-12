
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
