/**
 * Hot Calls Repository — pool, claim/lock, status, attempts.
 * Partially wired to Supabase already (see useHotCalls.ts).
 *
 * Supabase shape:
 *   poolList → supabase.from('hot_calls').select('*').is('assigned_to_user_id', null).or(lock expired)
 *   claim → update assigned_to_user_id, locked_at, lock_expires_at
 *   release → set assigned_to_user_id = null, locked_at = null
 *   assign → update assigned_to_user_id (manager only)
 *   updateStatus → update status + phase logic
 *   incAttempts → update attempts = attempts + 1
 *   decAttempts → update attempts = max(0, attempts - 1)
 *   addNote → insert into hot_call_notes
 */

import type { HotCall, HotCallNote } from "@/domain/types";

interface PoolFilters {
  workspaceId: string;
  userId?: string;
  role?: string;
  phase?: string;
  repId?: string;
  search?: string;
}

export const hotCallsRepo = {
  /**
   * TODO: Replace with Supabase (already partially done in useHotCalls.ts)
   * const { data } = await supabase.from('hot_calls').select('*')
   *   .eq('workspace_id', wsId)
   *   .order('created_at', { ascending: false });
   */
  async poolList(filters: PoolFilters): Promise<HotCall[]> {
    // Currently handled by useHotCallsQuery() in useHotCalls.ts
    // TODO: Migrate here and remove hook-level query
    return [];
  },

  /**
   * TODO: Replace with Supabase
   * Atomic claim: check availability then update with lock
   */
  async claim(params: { hotCallId: string; repId: string }): Promise<void> {
    // Currently handled by useClaimHotCall() in useHotCalls.ts
  },

  /**
   * TODO: Replace with Supabase
   * Release lock: set assigned_to_user_id = null
   */
  async release(params: { hotCallId: string }): Promise<void> {
    // Currently handled by useReleaseHotCall() in useHotCalls.ts
  },

  /**
   * TODO: Replace with Supabase
   * Manager assigns directly
   */
  async assign(params: { hotCallId: string; userId: string }): Promise<void> {
    // TODO: Replace with Supabase
  },

  /**
   * TODO: Replace with Supabase
   * Update status + auto-compute phase
   */
  async updateStatus(params: { hotCallId: string; status: string }): Promise<void> {
    // TODO: Replace with Supabase
  },

  /**
   * TODO: Replace with Supabase
   * const { error } = await supabase.rpc('increment_attempts', { hc_id: hotCallId });
   */
  async incAttempts(params: { hotCallId: string }): Promise<void> {
    // TODO: Replace with Supabase
  },

  /**
   * TODO: Replace with Supabase — owner/manager only
   */
  async decAttempts(params: { hotCallId: string }): Promise<void> {
    // TODO: Replace with Supabase
  },

  /**
   * TODO: Replace with Supabase
   * const { error } = await supabase.from('hot_call_notes').insert({ ... });
   */
  async addNote(params: {
    hotCallId: string;
    userId: string;
    note: string;
    callFeedback?: string;
  }): Promise<void> {
    // Currently handled by useAddHotCallNote() in useHotCalls.ts
  },
};
