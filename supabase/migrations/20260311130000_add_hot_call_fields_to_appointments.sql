-- Hot Calls V1: store hot-call state as fields on public.appointments
-- instead of a separate hot_calls table.
-- hot_call_state values: 'pool' | 'claimed' | 'recall' | 'done'

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS is_hot_call          boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hot_call_state        text         NULL,
  ADD COLUMN IF NOT EXISTS hot_call_owner_id     uuid         NULL,
  ADD COLUMN IF NOT EXISTS hot_call_taken_at     timestamptz  NULL,
  ADD COLUMN IF NOT EXISTS hot_call_recall_at    date         NULL,
  ADD COLUMN IF NOT EXISTS hot_call_attempt_count integer     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_hot_call_attempt_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS hot_call_last_feedback   text      NULL,
  ADD COLUMN IF NOT EXISTS hot_call_tags            text[]    NOT NULL DEFAULT '{}';

-- Auto-promote existing qualifying appointments to the hot-call pool
UPDATE public.appointments
SET is_hot_call = true,
    hot_call_state = 'pool'
WHERE status IN ('non_confirme', 'annule_rappeler', 'no_show')
  AND is_hot_call = false;
