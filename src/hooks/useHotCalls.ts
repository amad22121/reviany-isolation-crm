import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const LOCK_DURATION_MINUTES = 30;

export interface DbHotCall {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  source: string;
  status: string;
  phase: string;
  last_feedback: string;
  attempts: number;
  last_contact_date: string | null;
  follow_up_date: string | null;
  notes: string | null;
  tags: string[];
  origin: string | null;
  original_appointment_id: string | null;
  assigned_to_user_id: string | null;
  locked_at: string | null;
  lock_expires_at: string | null;
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

const HC_KEY = ["hot_calls"];
const NOTES_KEY = (hcId: string) => ["hot_call_notes", hcId];

/** Check if a hot call is available (unclaimed or lock expired) */
export function isAvailable(hc: DbHotCall): boolean {
  if (!hc.assigned_to_user_id) return true;
  if (hc.lock_expires_at && new Date(hc.lock_expires_at) < new Date()) return true;
  return false;
}

/** Check if a hot call is claimed by a specific rep */
export function isClaimedBy(hc: DbHotCall, repId: string): boolean {
  if (hc.assigned_to_user_id !== repId) return false;
  if (hc.lock_expires_at && new Date(hc.lock_expires_at) < new Date()) return false;
  return true;
}

export function useHotCallsQuery() {
  return useQuery({
    queryKey: HC_KEY,
    queryFn: async (): Promise<DbHotCall[]> => {
      const { data, error } = await supabase
        .from("hot_calls")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DbHotCall[];
    },
    refetchInterval: 15000, // refresh every 15s for lock freshness
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
      const expires = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000).toISOString();

      // Optimistic claim: check availability then update
      const { data: current, error: fetchErr } = await supabase
        .from("hot_calls")
        .select("assigned_to_user_id, lock_expires_at")
        .eq("id", id)
        .single();
      if (fetchErr) throw fetchErr;

      const isFree =
        !current.assigned_to_user_id ||
        (current.lock_expires_at && new Date(current.lock_expires_at) < new Date());
      if (!isFree) throw new Error("ALREADY_CLAIMED");

      const { error } = await supabase
        .from("hot_calls")
        .update({
          assigned_to_user_id: repId,
          locked_at: now,
          lock_expires_at: expires,
          last_action_at: now,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: HC_KEY }),
  });
}

export function useReleaseHotCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("hot_calls")
        .update({
          assigned_to_user_id: null,
          locked_at: null,
          lock_expires_at: null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: HC_KEY }),
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
      const payload: Record<string, any> = { ...updates };
      if (extendLock) {
        const now = new Date().toISOString();
        payload.last_action_at = now;
        payload.lock_expires_at = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000).toISOString();
      }
      const { error } = await supabase.from("hot_calls").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: HC_KEY }),
  });
}

export function useDeleteHotCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hot_calls").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: HC_KEY }),
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

export function useCreateHotCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (hc: Partial<DbHotCall>) => {
      const { data, error } = await supabase
        .from("hot_calls")
        .insert({
          full_name: hc.full_name!,
          phone: hc.phone!,
          address: hc.address || "",
          city: hc.city || "Montréal",
          source: hc.source || "Door-to-door",
          status: hc.status || "Premier contact",
          phase: hc.phase || "À rappeler",
          last_feedback: hc.last_feedback || "No answer",
          notes: hc.notes || "",
          follow_up_date: hc.follow_up_date || null,
          origin: hc.origin || "",
          original_appointment_id: hc.original_appointment_id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: HC_KEY }),
  });
}
