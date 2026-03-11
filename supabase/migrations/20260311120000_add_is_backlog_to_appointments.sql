-- Add is_backlog boolean flag to appointments.
-- Backlog is NOT an appointment status — it is a separate flag indicating
-- that minimum required info has been captured but prequalification is pending.
-- The status column always holds a real workflow status (e.g. 'planifie').

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS is_backlog boolean NOT NULL DEFAULT false;

-- Migrate any rows that previously used status='backlog' as a workaround:
-- reset their status to 'planifie' and set the new flag.
UPDATE public.appointments
  SET is_backlog = true,
      status     = 'planifie'
  WHERE status = 'backlog';
