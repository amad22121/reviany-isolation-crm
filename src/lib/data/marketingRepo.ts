/**
 * Marketing Leads Repository.
 * Partially wired to Supabase already (see useMarketingLeads.ts).
 *
 * Supabase shape:
 *   list → supabase.from('marketing_leads').select('*').eq('workspace_id', wsId)
 *   createFromFB → insert via webhook edge function
 *   updateStatus → update status column
 *   convertToAppointment → update lead + insert appointment
 */

import type { MarketingLead, Appointment } from "@/domain/types";
import type { MarketingLeadStatus } from "@/domain/enums";

interface ListFilters {
  workspaceId: string;
  userId?: string;
  role?: string;
  status?: MarketingLeadStatus;
  repId?: string;
  search?: string;
}

export const marketingRepo = {
  /**
   * TODO: Replace with Supabase (already partially done in useMarketingLeads.ts)
   * const { data } = await supabase.from('marketing_leads').select('*')
   *   .eq('workspace_id', wsId)
   *   .order('created_at', { ascending: false });
   */
  async list(filters: ListFilters): Promise<MarketingLead[]> {
    // Currently handled by useMarketingLeadsQuery()
    return [];
  },

  /**
   * TODO: Replace with Supabase
   * Called by the facebook-webhook edge function
   */
  async createFromFB(params: {
    workspaceId: string;
    payload: Omit<MarketingLead, "id" | "created_at" | "updated_at">;
  }): Promise<MarketingLead> {
    // TODO: Replace with Supabase insert
    return { ...params.payload, id: `ml${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as MarketingLead;
  },

  /**
   * TODO: Replace with Supabase
   * const { error } = await supabase.from('marketing_leads').update({ status }).eq('id', id);
   */
  async updateStatus(params: { leadId: string; status: MarketingLeadStatus }): Promise<void> {
    // TODO: Replace with Supabase
  },

  /**
   * TODO: Replace with Supabase — transaction:
   *   1. Insert appointment
   *   2. Update lead with converted_appointment_id + status = 'appointment_booked'
   *   Should be an n8n automation hook or DB function
   */
  async convertToAppointment(params: {
    leadId: string;
    appointmentPayload: Omit<Appointment, "id" | "created_at" | "status_log">;
  }): Promise<void> {
    // TODO: Replace with Supabase
  },
};
