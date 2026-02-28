/**
 * Clients Repository — virtual aggregation of client data.
 * TODO: Replace with Supabase views/queries.
 *
 * A "client" is identified by phone number across appointments, hot calls, and leads.
 *
 * Supabase shape:
 *   get → query across appointments + hot_calls + marketing_leads by phone
 *   addNote → supabase.from('notes').insert({ entity_type, entity_id, content, user_id })
 *   listByFilters → complex join query
 */

import type { Client, Note } from "@/domain/types";

export const clientsRepo = {
  /**
   * TODO: Replace with Supabase
   * Query appointments + hot_calls + marketing_leads by phone or ID
   */
  async get(params: { workspaceId: string; clientId: string }): Promise<Client | null> {
    // TODO: Replace with Supabase aggregate query
    return null;
  },

  /**
   * TODO: Replace with Supabase
   * const { error } = await supabase.from('notes').insert({
   *   entity_type: 'appointment', entity_id: clientId, content: note, user_id
   * });
   */
  async addNote(params: {
    workspaceId: string;
    entityType: string;
    entityId: string;
    content: string;
    userId: string;
  }): Promise<void> {
    // TODO: Replace with Supabase
  },

  /**
   * TODO: Replace with Supabase
   * Complex search across appointments + hot_calls + marketing_leads
   */
  async listByFilters(params: {
    workspaceId: string;
    search?: string;
    repId?: string;
  }): Promise<Client[]> {
    // TODO: Replace with Supabase
    return [];
  },

  /**
   * TODO: Replace with Supabase
   * const { error } = await supabase.from('appointments').update(payload).eq('id', clientId);
   */
  async update(params: {
    workspaceId: string;
    clientId: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    // TODO: Replace with Supabase
  },
};
