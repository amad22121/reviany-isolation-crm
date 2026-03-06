/**
 * useAppointments — React Query hooks for appointments CRUD via Supabase.
 * Appointments reference clients via client_id. Data is joined and mapped
 * to the legacy camelCase Appointment shape for backward compatibility.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaceContext } from "@/lib/workspace/WorkspaceProvider";
import type { Appointment, AppointmentStatus } from "@/data/crm-data";

const QUERY_KEY = "appointments";

/** Map a Supabase row (with joined client) to the legacy Appointment shape */
function mapRow(row: any): Appointment {
  const client = row.clients ?? {};
  const scheduledAt = row.scheduled_at ? new Date(row.scheduled_at) : null;

  return {
    id: row.id,
    fullName: client.full_name || row.full_name || "",
    phone: client.phone || row.phone || "",
    address: client.address || row.address || "",
    city: client.city || row.city || "",
    origin: client.origin || row.origin ?? undefined,
    culturalOrigin: client.cultural_origin || row.cultural_origin ?? undefined,
    leadSource: client.lead_source || row.lead_source ?? undefined,
    date: scheduledAt
      ? scheduledAt.toISOString().split("T")[0]
      : row.date || "",
    time: scheduledAt
      ? `${String(scheduledAt.getHours()).padStart(2, "0")}:${String(scheduledAt.getMinutes()).padStart(2, "0")}`
      : row.time || "",
    repId: row.rep_id,
    preQual1: row.pre_qual_1 ?? buildPreQualFromColumns(row),
    preQual2: row.pre_qual_2 ?? "",
    notes: row.notes ?? "",
    status: row.status as AppointmentStatus,
    source: row.source ?? undefined,
    smsScheduled: row.sms_scheduled ?? false,
    createdAt: row.created_at,
    closedValue: row.close_amount ?? row.closed_value ?? undefined,
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

/** Build a preQual1-style string from individual columns (for new appointments) */
function buildPreQualFromColumns(row: any): string {
  const parts: string[] = [];
  if (row.work_already_done) parts.push(`Travail réalisé: ${row.work_already_done}`);
  if (row.industry) parts.push(`Secteur: ${row.industry}`);
  if (row.property_duration_years != null) parts.push(`Années propriétaire: ${row.property_duration_years}`);
  if (row.recent_or_future_work) parts.push(`Travaux: ${row.recent_or_future_work}`);
  if (row.had_inspection_report) parts.push(`Inspection: ${row.had_inspection_report}`);
  if (row.inspection_by) parts.push(`Inspecteur: ${row.inspection_by}`);
  if (row.decision_timeline) parts.push(`Délai décision: ${row.decision_timeline}`);
  return parts.join(" | ");
}

/** Fetch all appointments for the current tenant (joined with clients) */
export function useAppointments() {
  const { workspaceId } = useWorkspaceContext();

  return useQuery({
    queryKey: [QUERY_KEY, workspaceId],
    queryFn: async (): Promise<Appointment[]> => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("*, clients(*)")
        .eq("tenant_id", workspaceId)
        .order("scheduled_at", { ascending: false });

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

/** Insert a new appointment (upserts client first, then creates appointment) */
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
      notes: string;
      status: string;
      source?: string;
      workAlreadyDone?: string;
      industry?: string;
      propertyDurationYears?: number | null;
      recentOrFutureWork?: string;
      hadInspectionReport?: string;
      inspectionBy?: string;
      decisionTimeline?: string;
    }) => {
      const tenantId = workspaceId || "default";

      // 1. Upsert client
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .upsert(
          {
            tenant_id: tenantId,
            full_name: payload.fullName,
            phone: payload.phone,
            address: payload.address,
            city: payload.city,
            cultural_origin: payload.culturalOrigin || null,
            lead_source: payload.leadSource || null,
            origin: payload.origin || null,
          },
          { onConflict: "tenant_id,phone" }
        )
        .select()
        .single();

      if (clientError) throw clientError;

      // 2. Build scheduled_at from date + time
      const scheduledAt =
        payload.date && payload.time
          ? `${payload.date}T${payload.time}:00`
          : null;

      // 3. Insert appointment
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          tenant_id: tenantId,
          client_id: client.id,
          scheduled_at: scheduledAt,
          rep_id: payload.repId,
          status: payload.status,
          notes: payload.notes,
          work_already_done: payload.workAlreadyDone || null,
          industry: payload.industry || null,
          property_duration_years: payload.propertyDurationYears ?? null,
          recent_or_future_work: payload.recentOrFutureWork || null,
          had_inspection_report: payload.hadInspectionReport || null,
          inspection_by: payload.inspectionBy || null,
          decision_timeline: payload.decisionTimeline || null,
          source: payload.source || null,
          // Keep legacy columns populated for backward compat
          full_name: payload.fullName,
          phone: payload.phone,
          address: payload.address,
          city: payload.city,
          date: payload.date,
          time: payload.time,
          cultural_origin: payload.culturalOrigin || null,
          lead_source: payload.leadSource || null,
          origin: payload.origin || null,
          sms_scheduled: false,
          status_log: [],
        })
        .select("*, clients(*)")
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

      const { error } = await supabase
        .from("appointments")
        .update({
          status: params.status,
          status_log: updatedLog,
        })
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
          close_amount: params.closedValue,
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
