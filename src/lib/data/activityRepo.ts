/**
 * Activity Log Repository — audit trail for all CRM actions.
 * TODO: Replace with Supabase when activity_log table is created.
 *
 * Supabase shape:
 *   logAction → supabase.from('activity_log').insert({ ... })
 *   listByEntity → supabase.from('activity_log').select('*').eq('entity_type', type).eq('entity_id', id)
 */

import type { ActivityLog } from "@/domain/types";

export const activityRepo = {
  /**
   * TODO: Replace with Supabase
   * const { error } = await supabase.from('activity_log').insert({ ... });
   */
  async logAction(params: {
    workspaceId: string;
    entityType: ActivityLog["entity_type"];
    entityId: string;
    action: string;
    details?: Record<string, unknown>;
    userId: string;
  }): Promise<void> {
    // TODO: Replace with Supabase insert
    console.debug("[activityRepo.logAction]", params);
  },

  /**
   * TODO: Replace with Supabase
   * const { data } = await supabase.from('activity_log').select('*')
   *   .eq('entity_type', entityType)
   *   .eq('entity_id', entityId)
   *   .order('created_at', { ascending: false });
   */
  async listByEntity(params: {
    entityType: ActivityLog["entity_type"];
    entityId: string;
  }): Promise<ActivityLog[]> {
    // TODO: Replace with Supabase query
    return [];
  },
};
