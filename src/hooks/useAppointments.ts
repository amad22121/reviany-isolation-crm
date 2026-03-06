/**
 * useAppointments — React Query hook for appointments CRUD via Supabase.
 * Returns data in legacy camelCase Appointment shape for backward compatibility.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaceContext } from "@/lib/workspace/WorkspaceProvider";
import type { Appointment, AppointmentStatus } from "@/data/crm-data";

const QUERY_KEY = "appointments";

/** Map a Supabase row to the legacy Appointment shape */
function mapRow(row: any): Appointment {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    address: row.address,
    city: row.city,
    origin: row.origin ?? undefined,
    culturalOrigin: row.cultural_origin ?? undefined,
    leadSource: row.lead_source ?? undefined,
    date: row.date,
    time: row.time,
    repId: row.rep_id,
    preQual1: row.pre_qual_1 ?? "",
    preQual2: row.pre_qual_2 ?? "",
    notes: row.notes ?? "",
    status: row.status as AppointmentStatus,
    source: row.source ?? undefined,
    smsScheduled: row.sms_scheduled ?? false,
    createdAt: row.created_at,
    closedValue: row.closed_value ?? undefined,
    closedAt: row.closed_at ?? undefined,
    closedBy: row.closed_by ?? undefined,
    wasRecovered: row.was_recovered ?? undefined,
    statusLog: Array.isArray(row.status_log)
      ? row.status_log.map((l: any) => ({
          date: l.date,
          time: l.time,
          field: l.field ?? "status",
          previousValue: l.previousValue ?? l.previous_value ?? "",
          newValue: l.newValue ?? l.new_value ?? "",
          userId: l.userId ?? l.user_id ?? "",
        }))
      : [],
  };
}

/** Fetch all appointments for the current tenant */
export function useAppointments() {
  const { workspaceId } = useWorkspaceContext();

  return useQuery({
    queryKey: [QUERY_KEY, workspaceId],
    queryFn: async (): Promise<Appointment[]> => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("tenant_id", workspaceId)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching appointments:", error);
        return [];
      }
      return (data ?? []).map(mapRow);
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}

/** Insert a new appointment */
export function useAddAppointment() {
  const queryClient = useQueryClient();
  const { workspaceId } = useWorkspaceContext();

  return useMutation({
    mutationFn: async (payload: {
      fullName: string;
      phone: string;
      address: string;
      city: string;
      origin?: string;
      culturalOrigin?: string;
      leadSource?: string;
      date: string;
      time: string;
      repId: string;
      preQual1: string;
      preQual2: string;
      notes: string;
      status: string;
      source?: string;
    }) => {
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          tenant_id: workspaceId || "default",
          full_name: payload.fullName,
          phone: payload.phone,
          address: payload.address,
          city: payload.city,
          origin: payload.origin || null,
          cultural_origin: payload.culturalOrigin || null,
          lead_source: payload.leadSource || null,
          date: payload.date,
          time: payload.time,
          rep_id: payload.repId,
          pre_qual_1: payload.preQual1,
          pre_qual_2: payload.preQual2,
          notes: payload.notes,
          status: payload.status,
          source: payload.source || null,
          sms_scheduled: false,
          status_log: [],
        })
        .select()
        .single();

      if (error) throw error;
      return mapRow(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/** Update appointment status */
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      status: AppointmentStatus;
      userId: string;
      currentStatusLog: any[];
      previousStatus: string;
    }) => {
      const now = new Date();
      const newLog = {
        date: now.toISOString().split("T")[0],
        time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
        field: "status",
        previousValue: params.previousStatus,
        newValue: params.status,
        userId: params.userId,
      };

      const updatedLog = [...(params.currentStatusLog || []), newLog];

      const updatePayload: Record<string, any> = {
        status: params.status,
        status_log: updatedLog,
      };

      const { error } = await supabase
        .from("appointments")
        .update(updatePayload)
        .eq("id", params.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/** Update appointment notes */
export function useUpdateAppointmentNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("appointments")
        .update({ notes: params.notes })
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/** Close appointment with value */
export function useCloseAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      closedValue: number;
      userId: string;
      previousStatus: string;
      currentStatusLog: any[];
      wasRecovered?: boolean;
    }) => {
      const now = new Date();
      const newLog = {
        date: now.toISOString().split("T")[0],
        time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
        field: "status",
        previousValue: params.previousStatus,
        newValue: "Closé",
        userId: params.userId,
      };

      const { error } = await supabase
        .from("appointments")
        .update({
          status: "Closé",
          closed_value: params.closedValue,
          closed_at: now.toISOString(),
          closed_by: params.userId,
          was_recovered: params.wasRecovered ?? false,
          status_log: [...(params.currentStatusLog || []), newLog],
        })
        .eq("id", params.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/** Delete an appointment */
export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
