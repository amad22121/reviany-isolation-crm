/**
 * Appointments Repository — CRUD for appointments.
 * TODO: Replace with Supabase queries.
 *
 * Supabase shape:
 *   list → supabase.from('appointments').select('*').eq('workspace_id', wsId)
 *   get → supabase.from('appointments').select('*').eq('id', id).single()
 *   create → supabase.from('appointments').insert(payload)
 *   update → supabase.from('appointments').update(payload).eq('id', id)
 *   updateStatus → supabase.from('appointments').update({ status }).eq('id', id)
 *   cancel → update status + create hot_call entry
 *   rebook → update date/time
 */

import type { Appointment, StatusChangeLog } from "@/domain/types";
import type { AppointmentStatus } from "@/domain/enums";
import { INITIAL_APPOINTMENTS, SALES_REPS } from "@/data/crm-data";
import { fromLegacyStatus } from "@/domain/enums";

interface ListFilters {
  workspaceId: string;
  userId?: string;
  role?: string;
  repId?: string;
  status?: AppointmentStatus;
  dateFrom?: string;
  dateTo?: string;
}

/** Map legacy Appointment to domain Appointment */
function mapLegacy(a: any): Appointment {
  return {
    id: a.id,
    full_name: a.fullName,
    phone: a.phone,
    address: a.address,
    city: a.city,
    origin: a.origin ?? null,
    date: a.date,
    time: a.time,
    rep_id: a.repId,
    pre_qual_1: a.preQual1,
    pre_qual_2: a.preQual2,
    notes: a.notes,
    status: fromLegacyStatus(a.status),
    source: a.source === "Door-to-door" ? "door_to_door" : a.source === "Referral" ? "referral" : null,
    sms_scheduled: a.smsScheduled,
    created_at: a.createdAt,
    status_log: (a.statusLog || []).map((l: any) => ({
      date: l.date,
      time: l.time,
      field: l.field,
      previous_value: l.previousValue,
      new_value: l.newValue,
      user_id: l.userId,
    })),
  };
}

export const appointmentsRepo = {
  /**
   * TODO: Replace with Supabase
   * const { data } = await supabase
   *   .from('appointments')
   *   .select('*')
   *   .eq('workspace_id', filters.workspaceId)
   *   .order('date', { ascending: false });
   * If role === 'representant': .eq('rep_id', filters.userId)
   */
  async list(filters: ListFilters): Promise<Appointment[]> {
    await new Promise((r) => setTimeout(r, 100));
    let results = INITIAL_APPOINTMENTS.map(mapLegacy);

    if (filters.role === "representant" && filters.userId) {
      const repId = SALES_REPS.find((r) => r.id === filters.userId)?.id;
      if (repId) results = results.filter((a) => a.rep_id === repId);
    }
    if (filters.repId) results = results.filter((a) => a.rep_id === filters.repId);
    if (filters.status) results = results.filter((a) => a.status === filters.status);
    if (filters.dateFrom) results = results.filter((a) => a.date >= filters.dateFrom!);
    if (filters.dateTo) results = results.filter((a) => a.date <= filters.dateTo!);

    return results;
  },

  /**
   * TODO: Replace with Supabase
   * const { data } = await supabase.from('appointments').select('*').eq('id', id).single();
   */
  async get(params: { workspaceId: string; appointmentId: string }): Promise<Appointment | null> {
    const a = INITIAL_APPOINTMENTS.find((x) => x.id === params.appointmentId);
    return a ? mapLegacy(a) : null;
  },

  /**
   * TODO: Replace with Supabase
   * const { data, error } = await supabase.from('appointments').insert({ ...payload, workspace_id }).select().single();
   */
  async create(params: { workspaceId: string; payload: Omit<Appointment, "id" | "created_at" | "status_log"> }): Promise<Appointment> {
    // Placeholder — in real impl, Supabase returns the created row
    return {
      ...params.payload,
      id: `a${Date.now()}`,
      created_at: new Date().toISOString().split("T")[0],
      status_log: [],
    };
  },

  /**
   * TODO: Replace with Supabase
   * const { error } = await supabase.from('appointments').update(payload).eq('id', id);
   */
  async update(params: { workspaceId: string; appointmentId: string; payload: Partial<Appointment> }): Promise<void> {
    // TODO: Replace with Supabase update
  },

  /**
   * TODO: Replace with Supabase
   * const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
   * Also insert into activity_log
   */
  async updateStatus(params: {
    workspaceId: string;
    appointmentId: string;
    status: AppointmentStatus;
    userId: string;
  }): Promise<void> {
    // TODO: Replace with Supabase update + activity log insert
  },

  /**
   * TODO: Replace with Supabase
   * const { error } = await supabase.from('appointments').update({ date, time, status: 'pending' }).eq('id', id);
   */
  async rebook(params: { workspaceId: string; appointmentId: string; newDate: string; newTime: string }): Promise<void> {
    // TODO: Replace with Supabase
  },

  /**
   * TODO: Replace with Supabase
   * Update status to 'cancelled' + create hot_call entry
   */
  async cancel(params: { workspaceId: string; appointmentId: string; userId: string }): Promise<void> {
    // TODO: Replace with Supabase — also triggers hot call creation
  },
};
