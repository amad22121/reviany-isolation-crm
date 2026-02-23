import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LeadStatus =
  | "New Lead"
  | "Attempted Contact"
  | "Contacted"
  | "Appointment Booked"
  | "Closed"
  | "Not Closed";

export const LEAD_STATUSES: LeadStatus[] = [
  "New Lead",
  "Attempted Contact",
  "Contacted",
  "Appointment Booked",
  "Closed",
  "Not Closed",
];

export interface MarketingLead {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  has_attic: string;
  source: string;
  status: LeadStatus;
  assigned_rep_id: string | null;
  attempts_count: number;
  last_contact_date: string | null;
  notes: string;
  next_followup_date: string | null;
  converted_appointment_id: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

const LEADS_KEY = ["marketing_leads"];

export function useMarketingLeadsQuery() {
  return useQuery({
    queryKey: LEADS_KEY,
    queryFn: async (): Promise<MarketingLead[]> => {
      const { data, error } = await supabase
        .from("marketing_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MarketingLead[];
    },
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lead: Omit<MarketingLead, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("marketing_leads")
        .insert(lead as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LEADS_KEY }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from("marketing_leads")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LEADS_KEY }),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketing_leads")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LEADS_KEY }),
  });
}
