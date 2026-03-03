/**
 * Legacy CRM data — thin re-export layer.
 * Types are kept here for backward compatibility with existing consumer files.
 * Mock data is sourced from the centralized mock-data module.
 * 
 * When Supabase is wired, this file can be removed and consumers
 * updated to import from @/domain and @/lib/data.
 */

import { USE_MOCK } from "@/lib/data/config";
import { MOCK_SALES_REPS, MOCK_MANAGERS, MOCK_APPOINTMENTS, MOCK_HOT_CALLS } from "@/lib/data/mock-data";

// ─── Re-export types (kept for 31+ consumer files) ───────────────────────────

export interface SalesRep {
  id: string;
  name: string;
  avatar: string;
  managerId?: string;
  zone?: string;
}

export type AppointmentStatus =
  | "Planifié"
  | "Confirmé"
  | "Non confirmé"
  | "À risque"
  | "Reporté"
  | "Annulé (à rappeler)"
  | "Annulé (définitif)"
  | "No-show"
  | "Closé"
  | "Backlog";

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "Planifié",
  "Confirmé",
  "Non confirmé",
  "À risque",
  "Reporté",
  "Annulé (à rappeler)",
  "Annulé (définitif)",
  "No-show",
  "Closé",
];

/** Statuses that automatically feed into Hot Calls */
export const HOT_CALL_TRIGGER_STATUSES: AppointmentStatus[] = [
  "Non confirmé",
  "À risque",
  "Annulé (à rappeler)",
  "No-show",
];

export interface StatusChangeLog {
  date: string;
  time: string;
  field: "status";
  previousValue: string;
  newValue: string;
  userId: string;
}

export interface Appointment {
  id: string;
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
  status: AppointmentStatus;
  source?: "Door-to-door" | "Referral" | "Facebook" | "Autre";
  smsScheduled: boolean;
  createdAt: string;
  statusLog: StatusChangeLog[];
  /** Revenue fields – populated when status = "Closé" */
  closedValue?: number;
  closedAt?: string;
  closedBy?: string;
  wasRecovered?: boolean;
}

export type HotCallStatus =
  | "Premier contact"
  | "Deuxième contact"
  | "Troisième contact"
  | "No answer"
  | "Call back later"
  | "Reschedule requested"
  | "Not interested"
  | "Follow-up 3 months"
  | "Follow-up 6 months"
  | "Follow-up 9 months"
  | "Follow-up 12 months"
  | "Booked"
  | "Closed"
  | "Dead";

export const HOT_CALL_STATUSES: HotCallStatus[] = [
  "Premier contact",
  "Deuxième contact",
  "Troisième contact",
  "No answer",
  "Call back later",
  "Reschedule requested",
  "Not interested",
  "Follow-up 3 months",
  "Follow-up 6 months",
  "Follow-up 9 months",
  "Follow-up 12 months",
  "Booked",
  "Closed",
  "Dead",
];

export type HotCallPhase = "pool" | "claimed" | "scheduled_follow_up" | "closed";

export const HOT_CALL_PHASES: HotCallPhase[] = [
  "pool",
  "claimed",
  "scheduled_follow_up",
  "closed",
];

export type HotCallFeedback =
  | "No answer"
  | "Call back later"
  | "Reschedule requested"
  | "Not interested"
  | "Follow-up 3 months"
  | "Follow-up 6 months"
  | "Follow-up 9 months"
  | "Follow-up 12 months";

export const HOT_CALL_FEEDBACKS: HotCallFeedback[] = [
  "No answer",
  "Call back later",
  "Reschedule requested",
  "Not interested",
  "Follow-up 3 months",
  "Follow-up 6 months",
  "Follow-up 9 months",
  "Follow-up 12 months",
];

export interface CallLogEntry {
  date: string;
  time: string;
  repId: string;
  note: string;
}

export interface HotCall {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  source: "Door-to-door" | "Referral" | "Facebook" | "Autre";
  repId: string;
  status: HotCallStatus;
  phase: HotCallPhase;
  lastFeedback: HotCallFeedback;
  attempts: number;
  lastContactDate: string;
  followUpDate: string;
  notes: string;
  createdAt: string;
  originalAppointmentId?: string;
  origin?: string;
  tags: string[];
  callHistory: CallLogEntry[];
}

// ─── Data constants — sourced from centralized mock-data ─────────────────────

export const MANAGERS = USE_MOCK ? MOCK_MANAGERS : [];
export const SALES_REPS: SalesRep[] = USE_MOCK ? MOCK_SALES_REPS : [];
export const INITIAL_APPOINTMENTS: Appointment[] = USE_MOCK ? MOCK_APPOINTMENTS : [];

/**
 * @deprecated Use repos from @/lib/data instead.
 * These constants are kept for backward compatibility only.
 */
export const INITIAL_HOT_CALLS: HotCall[] = USE_MOCK ? MOCK_HOT_CALLS : [];
