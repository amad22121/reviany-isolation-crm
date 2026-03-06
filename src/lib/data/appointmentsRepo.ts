/**
 * Appointments Repository — CRUD for appointments.
 * Uses mock data when USE_MOCK is true; ready for Supabase queries.
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
import { fromLegacyStatus } from "@/domain/enums";
import { USE_MOCK } from "./config";

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
   * List appointments, optionally filtered.
   * TODO: Replace mock branch with Supabase query.
   */
  async list(filters: ListFilters): Promise<Appointment[]> {
    if (!USE_MOCK) {
      // TODO: Supabase query
      // const { data } = await supabase
      //   .from('appointments')
      //   .select('*')
      //   .eq('workspace_id', filters.workspaceId)
      //   .order('date', { ascending: false });
      return [];
    }

    // Mock branch — returns empty (no mock data)
    return [];
  },

  /**
   * Get a single appointment by ID.
   * TODO: Replace mock branch with Supabase query.
   */
  async get(params: { workspaceId: string; appointmentId: string }): Promise<Appointment | null> {
    if (!USE_MOCK) {
      // TODO: Supabase query
      return null;
    }
    return null;
  },

  /**
   * Create a new appointment.
   * TODO: Replace with Supabase insert.
   */
  async create(params: { workspaceId: string; payload: Omit<Appointment, "id" | "created_at" | "status_log"> }): Promise<Appointment> {
    // TODO: Supabase insert
    return {
      ...params.payload,
      id: `a${Date.now()}`,
      created_at: new Date().toISOString().split("T")[0],
      status_log: [],
    };
  },

  /**
   * Update an appointment.
   * TODO: Replace with Supabase update.
   */
  async update(params: { workspaceId: string; appointmentId: string; payload: Partial<Appointment> }): Promise<void> {
    // TODO: Supabase update
  },

  /**
   * Update appointment status with audit log.
   * TODO: Replace with Supabase update + activity log insert.
   */
  async updateStatus(params: {
    workspaceId: string;
    appointmentId: string;
    status: AppointmentStatus;
    userId: string;
  }): Promise<void> {
    // TODO: Supabase update + activity log
  },

  /**
   * Rebook an appointment to a new date/time.
   * TODO: Replace with Supabase update.
   */
  async rebook(params: { workspaceId: string; appointmentId: string; newDate: string; newTime: string }): Promise<void> {
    // TODO: Supabase update
  },

  /**
   * Cancel an appointment and create a hot call entry.
   * TODO: Replace with Supabase transaction.
   */
  async cancel(params: { workspaceId: string; appointmentId: string; userId: string }): Promise<void> {
    // TODO: Supabase transaction
  },
};
