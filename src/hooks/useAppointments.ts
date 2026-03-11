/**
 * useAppointments — React Query hooks for appointments CRUD via Supabase.
 *
 * Backend contract (real Supabase):
 *   public.clients: id, tenant_id, full_name, phone, address, city,
 *                   cultural_origin, lead_source, origin, created_at
 *   public.appointments: id, tenant_id, client_id, scheduled_at, rep_id, status,
 *                        is_backlog, work_already_done, industry, property_duration_years,
 *                        recent_or_future_work, had_inspection_report, inspection_by,
 *                        decision_timeline, notes, close_amount, closed_at,
 *                        created_at, updated_at
 *
 * Appointments reference clients via client_id.
 * Client identity/contact data is NEVER stored in appointments.
 * scheduled_at is the single source of truth for date/time.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaceContext } from "@/lib/workspace/WorkspaceProvider";
import { AppointmentStatus } from "@/domain/enums";
import type { Appointment } from "@/data/crm-data";

const QUERY_KEY = "appointments";
const HOT_CALLS_KEY = "hot_calls";

/** Statuses that enter the Hot Calls pool */
const HOT_CALL_ENTER_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.UNCONFIRMED,        // non_confirme
  AppointmentStatus.CANCELLED_CALLBACK, // annule_rappeler
  AppointmentStatus.NO_SHOW,            // no_show
];

/** Statuses that exit Hot Calls entirely */
const HOT_CALL_EXIT_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.CONFIRMED,     // confirme
  AppointmentStatus.CANCELLED_FINAL, // annule_definitif
  AppointmentStatus.CLOSED,        // close
];

/** Compute the hot_call field patch for a given status change */
function hotCallPatchForStatus(status: AppointmentStatus): Record<string, unknown> {
  if (HOT_CALL_ENTER_STATUSES.includes(status)) {
    return {
      is_hot_call: true,
      hot_call_state: "pool",
      hot_call_owner_id: null,
      hot_call_taken_at: null,
    };
  }
  if (HOT_CALL_EXIT_STATUSES.includes(status)) {
    return {
      is_hot_call: false,
      hot_call_state: null,
      hot_call_owner_id: null,
      hot_call_taken_at: null,
      hot_call_recall_at: null,
    };
  }
  return {};
}

/** Map a Supabase row (with joined client) to the Appointment view model */
function mapRow(row: any): Appointment {
  // Prefer joined client data; fall back to legacy columns stored directly on the appointment row
  const client = row.clients ?? {};
  const scheduledAt = row.scheduled_at ? new Date(row.scheduled_at) : null;

  return {
    id: row.id,
    // Client identity: join result takes precedence; fall back to direct columns (legacy rows)
    fullName: client.full_name ?? row.full_name ?? "",
    phone: client.phone ?? row.phone ?? "",
    address: client.address ?? row.address ?? "",
    city: client.city ?? row.city ?? "",
    origin: client.origin ?? row.origin ?? undefined,
    culturalOrigin: client.cultural_origin ?? row.cultural_origin ?? undefined,
    leadSource: client.lead_source ?? row.lead_source ?? undefined,
    // Appointment time: prefer scheduled_at; fall back to legacy date/time columns
    date: scheduledAt ? scheduledAt.toISOString().split("T")[0] : (row.date ?? ""),
    time: scheduledAt
      ? `${String(scheduledAt.getHours()).padStart(2, "0")}:${String(scheduledAt.getMinutes()).padStart(2, "0")}`
      : (row.time ?? ""),
    repId: row.rep_id ?? "",
    // Pre-qualification: prefer structured columns; fall back to legacy pre_qual_1/2 columns
    preQual1: buildPreQualFromColumns(row) || (row.pre_qual_1 ?? ""),
    preQual2: row.pre_qual_2 ?? "",
    notes: row.notes ?? "",
    status: (row.status ?? AppointmentStatus.PLANNED) as AppointmentStatus,
    isBacklog: row.is_backlog ?? false,
    isHotCall: row.is_hot_call ?? false,
    hotCallState: row.hot_call_state ?? null,
    hotCallOwnerId: row.hot_call_owner_id ?? null,
    hotCallTakenAt: row.hot_call_taken_at ?? null,
    hotCallRecallAt: row.hot_call_recall_at ?? null,
    hotCallAttemptCount: row.hot_call_attempt_count ?? 0,
    lastHotCallAttemptAt: row.last_hot_call_attempt_at ?? null,
    hotCallLastFeedback: row.hot_call_last_feedback ?? null,
    hotCallTags: row.hot_call_tags ?? [],
    createdAt: row.created_at ?? "",
    // Status log: parse if array (legacy), else empty
    statusLog: Array.isArray(row.status_log) ? row.status_log : [],
    // Revenue: close_amount is the canonical column; closed_value is a legacy alias
    closedValue: row.close_amount ?? row.closed_value ?? undefined,
    closedAt: row.closed_at ?? undefined,
  };
}

/** Build a preQual1 display string from individual DB columns */
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

/**
 * Insert a new appointment.
 * Step 1: Upsert client into public.clients (all identity/contact data)
 * Step 2: Insert into public.appointments with client_id + workflow fields only
 */
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
      isBacklog?: boolean;
      workAlreadyDone?: string;
      industry?: string;
      propertyDurationYears?: number | null;
      recentOrFutureWork?: string;
      hadInspectionReport?: string;
      inspectionBy?: string;
      decisionTimeline?: string;
    }) => {
      const tenantId = workspaceId || "default";

      // 1. Upsert client — identity/contact fields only
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

      // 2. Build scheduled_at — single source of truth for date/time
      const scheduledAt =
        payload.date && payload.time
          ? `${payload.date}T${payload.time}:00`
          : null;

      // 3. Insert appointment — workflow fields only, NO client identity columns
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          tenant_id: tenantId,
          client_id: client.id,
          scheduled_at: scheduledAt,
          rep_id: payload.repId,
          status: payload.status,
          is_backlog: payload.isBacklog ?? false,
          notes: payload.notes,
          work_already_done: payload.workAlreadyDone || null,
          industry: payload.industry || null,
          property_duration_years: payload.propertyDurationYears ?? null,
          recent_or_future_work: payload.recentOrFutureWork || null,
          had_inspection_report: payload.hadInspectionReport || null,
          inspection_by: payload.inspectionBy || null,
          decision_timeline: payload.decisionTimeline || null,
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
      const { error } = await supabase
        .from("appointments")
        .update({
          status: params.status,
          ...hotCallPatchForStatus(params.status),
        })
        .eq("id", params.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [HOT_CALLS_KEY] });
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

/** Close appointment with revenue amount */
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

      const { error } = await supabase
        .from("appointments")
        .update({
          status: AppointmentStatus.CLOSED,
          close_amount: params.closedValue,
          closed_at: now.toISOString(),
          ...hotCallPatchForStatus(AppointmentStatus.CLOSED),
        })
        .eq("id", params.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [HOT_CALLS_KEY] });
    },
  });
}

/**
 * Complete a backlog appointment: fill in prequalification fields and clear is_backlog.
 * This UPDATES the existing appointment rather than creating a new one,
 * preserving the original client link, rep assignment, and scheduled_at.
 */
export function useCompleteBacklogAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      scheduledAt: string | null;
      repId: string;
      notes: string;
      workAlreadyDone?: string;
      industry?: string;
      propertyDurationYears?: number | null;
      recentOrFutureWork?: string;
      hadInspectionReport?: string;
      inspectionBy?: string;
      decisionTimeline?: string;
    }) => {
      const { error } = await supabase
        .from("appointments")
        .update({
          is_backlog: false,
          scheduled_at: params.scheduledAt,
          rep_id: params.repId,
          notes: params.notes,
          work_already_done: params.workAlreadyDone || null,
          industry: params.industry || null,
          property_duration_years: params.propertyDurationYears ?? null,
          recent_or_future_work: params.recentOrFutureWork || null,
          had_inspection_report: params.hadInspectionReport || null,
          inspection_by: params.inspectionBy || null,
          decision_timeline: params.decisionTimeline || null,
        })
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/**
 * Mark an appointment as a hot call (or update its status + set hot_call fields).
 * Used when status changes to non_confirme / annule_rappeler / no_show.
 */
export function useMarkAsHotCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      status: AppointmentStatus;
      isHotCall: boolean;
      hotCallState: string | null;
    }) => {
      const { error } = await supabase
        .from("appointments")
        .update({
          status: params.status,
          is_hot_call: params.isHotCall,
          hot_call_state: params.hotCallState,
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
