/**
 * useHotCalls — Hot Calls backed by fields on public.appointments.
 *
 * DB columns used (on appointments):
 *   is_hot_call boolean            — true = in hot-call recovery flow
 *   hot_call_state text            — pool | claimed | recall | done
 *   hot_call_owner_id uuid         — which rep has claimed this
 *   hot_call_taken_at timestamptz  — when claimed; auto-return after 24h
 *   hot_call_recall_at date        — scheduled follow-up date
 *   hot_call_attempt_count int     — how many call attempts logged
 *   last_hot_call_attempt_at tstz  — timestamp of last attempt
 *   hot_call_last_feedback text    — last call outcome label
 *   hot_call_tags text[]           — labels / tags
 *
 * DbHotCall is a view-model that maps to what HotCallsPage expects.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaceContext } from "@/lib/workspace/WorkspaceProvider";

const CLAIM_HOURS = 24;
const HC_KEY = "hot_calls";
const NOTES_KEY = (hcId: string) => ["hot_call_notes", hcId];

// ─── Phase mapping ─────────────────────────────────────────────────────────
// DB hot_call_state → HotCallsPage "phase" value
function dbStateToPhase(state: string | null): string {
  switch (state) {
    case "claimed": return "claimed";
    case "recall":  return "scheduled_follow_up";
    case "done":    return "closed";
    default:        return "pool"; // null / "pool"
  }
}

function phaseToDbState(phase: string): string {
  switch (phase) {
    case "claimed":              return "claimed";
    case "scheduled_follow_up":  return "recall";
    case "closed":               return "done";
    default:                     return "pool";
  }
}

// ─── View model ────────────────────────────────────────────────────────────

export interface DbHotCall {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  source: string;
  status: string;
  phase: string;               // pool | claimed | scheduled_follow_up | closed
  last_feedback: string;
  attempts: number;
  last_contact_date: string | null;
  follow_up_date: string | null;
  notes: string | null;
  tags: string[];
  origin: string | null;
  original_appointment_id: string | null;
  assigned_to_user_id: string | null;
  locked_at: string | null;    // = hot_call_taken_at
  lock_expires_at: string | null; // computed: hot_call_taken_at + 24h
  last_action_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbHotCallNote {
  id: string;
  hot_call_id: string;
  user_id: string;
  note: string;
  call_feedback: string | null;
  created_at: string;
}

function mapApptToHotCall(row: any): DbHotCall {
  // Prefer joined client data; fall back to direct columns
  const client = row.clients ?? {};
  const takenAt = row.hot_call_taken_at ?? null;
  const lockExpiresAt = takenAt
    ? new Date(new Date(takenAt).getTime() + CLAIM_HOURS * 3600_000).toISOString()
    : null;

  // Auto-expire: if 24h passed since claim, treat phase as pool
  const expired = lockExpiresAt && new Date(lockExpiresAt) < new Date();
  const rawState = row.hot_call_state ?? "pool";
  const effectiveState = expired && rawState === "claimed" ? "pool" : rawState;

  return {
    id: row.id,
    full_name: client.full_name ?? row.full_name ?? "",
    phone: client.phone ?? row.phone ?? "",
    address: client.address ?? row.address ?? "",
    city: client.city ?? row.city ?? "",
    source: row.source ?? "door_to_door",
    status: row.status ?? "planifie",
    phase: dbStateToPhase(effectiveState),
    last_feedback: row.hot_call_last_feedback ?? "",
    attempts: row.hot_call_attempt_count ?? 0,
    last_contact_date: row.last_hot_call_attempt_at
      ? row.last_hot_call_attempt_at.split("T")[0]
      : null,
    follow_up_date: row.hot_call_recall_at ?? null,
    notes: row.notes ?? null,
    tags: row.hot_call_tags ?? [],
    origin: client.origin ?? row.origin ?? null,
    original_appointment_id: row.id, // the appointment IS the source
    assigned_to_user_id: effectiveState === "pool" ? null : (row.hot_call_owner_id ?? null),
    locked_at: takenAt,
    lock_expires_at: lockExpiresAt,
    last_action_at: row.last_hot_call_attempt_at ?? null,
    created_at: row.created_at ?? "",
    updated_at: row.updated_at ?? "",
  };
}

/** Build DB update payload from the page's generic "updates" object */
function mapUpdatesToDb(updates: Record<string, any>): Record<string, any> {
  const db: Record<string, any> = {};

  for (const [key, value] of Object.entries(updates)) {
    switch (key) {
      case "phase":
        db.hot_call_state = phaseToDbState(value);
        break;
      case "follow_up_date":
        db.hot_call_recall_at = value ?? null;
        break;
      case "last_feedback":
      case "status": // page mistakenly sets status = feedback; store as last_feedback instead
        db.hot_call_last_feedback = value ?? null;
        break;
      case "attempts":
        db.hot_call_attempt_count = value;
        break;
      case "last_contact_date":
        // convert to timestamptz if it's a date string
        db.last_hot_call_attempt_at = value
          ? `${value}T00:00:00Z`
          : null;
        break;
      case "last_action_at":
        db.last_hot_call_attempt_at = value ?? null;
        break;
      case "assigned_to_user_id":
        db.hot_call_owner_id = value ?? null;
        break;
      case "locked_at":
        db.hot_call_taken_at = value ?? null;
        break;
      case "lock_expires_at":
        // computed field — never write to DB
        break;
      case "tags":
        db.hot_call_tags = value ?? [];
        break;
      // any other keys are passed through as-is (shouldn't happen)
      default:
        db[key] = value;
    }
  }

  return db;
}

// ─── Hooks ─────────────────────────────────────────────────────────────────

export function isAvailable(hc: DbHotCall): boolean {
  if (!hc.assigned_to_user_id) return true;
  if (hc.lock_expires_at && new Date(hc.lock_expires_at) < new Date()) return true;
  return false;
}

export function isClaimedBy(hc: DbHotCall, repId: string): boolean {
  if (hc.assigned_to_user_id !== repId) return false;
  if (hc.lock_expires_at && new Date(hc.lock_expires_at) < new Date()) return false;
  return true;
}

export function useHotCallsQuery() {
  const { workspaceId } = useWorkspaceContext();

  return useQuery({
    queryKey: [HC_KEY, workspaceId],
    queryFn: async (): Promise<DbHotCall[]> => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("*, clients(*)")
        .eq("tenant_id", workspaceId)
        .eq("is_hot_call", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapApptToHotCall);
    },
    enabled: !!workspaceId,
    refetchInterval: 15_000, // refresh every 15s for lock freshness
  });
}

export function useHotCallNotesQuery(hcId: string | null) {
  return useQuery({
    queryKey: NOTES_KEY(hcId ?? ""),
    enabled: !!hcId,
    queryFn: async (): Promise<DbHotCallNote[]> => {
      const { data, error } = await supabase
        .from("hot_call_notes")
        .select("*")
        .eq("hot_call_id", hcId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DbHotCallNote[];
    },
  });
}

export function useClaimHotCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, repId }: { id: string; repId: string }) => {
      const now = new Date().toISOString();

      // Check availability: must be pool (no owner or expired)
      const { data: current, error: fetchErr } = await supabase
        .from("appointments")
        .select("hot_call_owner_id, hot_call_taken_at, hot_call_state")
        .eq("id", id)
        .single();
      if (fetchErr) throw fetchErr;

      const takenAt = current.hot_call_taken_at;
      const lockExpires = takenAt
        ? new Date(new Date(takenAt).getTime() + CLAIM_HOURS * 3600_000)
        : null;
      const isFree =
        !current.hot_call_owner_id ||
        current.hot_call_state === "pool" ||
        (lockExpires && lockExpires < new Date());
      if (!isFree) throw new Error("ALREADY_CLAIMED");

      const { error } = await supabase
        .from("appointments")
        .update({
          hot_call_owner_id: repId,
          hot_call_taken_at: now,
          hot_call_state: "claimed",
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [HC_KEY] }),
  });
}

export function useReleaseHotCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("appointments")
        .update({
          hot_call_owner_id: null,
          hot_call_taken_at: null,
          hot_call_state: "pool",
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [HC_KEY] }),
  });
}

export function useUpdateHotCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
      extendLock,
    }: {
      id: string;
      updates: Record<string, any>;
      extendLock?: boolean;
    }) => {
      const payload = mapUpdatesToDb(updates);
      if (extendLock) {
        payload.hot_call_taken_at = new Date().toISOString();
        payload.last_hot_call_attempt_at = new Date().toISOString();
      }
      const { error } = await supabase.from("appointments").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [HC_KEY] }),
  });
}

export function useDeleteHotCall() {
  const qc = useQueryClient();
  return useMutation({
    // "Delete" from hot calls = clear the is_hot_call flag (keeps the appointment)
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("appointments")
        .update({ is_hot_call: false, hot_call_state: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [HC_KEY] }),
  });
}

export function useAddHotCallNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (note: {
      hot_call_id: string;
      user_id: string;
      note: string;
      call_feedback?: string;
    }) => {
      const { error } = await supabase.from("hot_call_notes").insert({
        hot_call_id: note.hot_call_id,
        user_id: note.user_id,
        note: note.note,
        call_feedback: note.call_feedback || null,
      });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: NOTES_KEY(vars.hot_call_id) });
    },
  });
}
