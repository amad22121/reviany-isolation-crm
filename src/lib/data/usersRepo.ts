/**
 * Users Repository — team members & reps.
 * TODO: Replace with Supabase queries.
 *
 * Supabase shape:
 *   listReps → supabase.from('profiles').select('*').eq('workspace_id', wsId)
 *   getUser → supabase.from('profiles').select('*').eq('id', id).single()
 */

import type { SalesRep } from "@/domain/types";
import { SALES_REPS } from "@/data/crm-data";

export const usersRepo = {
  /**
   * TODO: Replace with Supabase
   * const { data } = await supabase
   *   .from('workspace_members')
   *   .select('*, profiles(*)')
   *   .eq('workspace_id', workspaceId)
   *   .eq('role', 'representant');
   */
  async listReps(params: { workspaceId: string }): Promise<SalesRep[]> {
    await new Promise((r) => setTimeout(r, 50));
    return SALES_REPS.map((r) => ({
      id: r.id,
      name: r.name,
      avatar: r.avatar,
      manager_id: r.managerId ?? null,
      zone: r.zone ?? null,
    }));
  },

  /**
   * TODO: Replace with Supabase
   * const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
   */
  async getUser(params: { workspaceId: string; userId: string }): Promise<SalesRep | null> {
    const rep = SALES_REPS.find((r) => r.id === params.userId);
    if (!rep) return null;
    return {
      id: rep.id,
      name: rep.name,
      avatar: rep.avatar,
      manager_id: rep.managerId ?? null,
      zone: rep.zone ?? null,
    };
  },
};
