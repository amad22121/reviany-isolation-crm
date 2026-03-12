/**
 * CRM data — re-export layer.
 * AppointmentStatus and related constants are sourced from @/domain/enums (single source of truth).
 * The Appointment interface is a VIEW MODEL (camelCase) for backward compat with pages/components.
 * It is NOT the DB schema — DB schema lives in @/domain/types.ts.
 */

// ─── AppointmentStatus: re-exported from domain/enums ─────────────────────────
// DB values: "planifie" | "confirme" | "non_confirme" | "a_risque" | "reporte"
//           | "annule_rappeler" | "annule_definitif" | "no_show" | "close" | "backlog"
export {
  AppointmentStatus,
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_LABELS,
  HOT_CALL_TRIGGER_STATUSES,
} from "@/domain/enums";

import type { AppointmentStatus } from "@/domain/enums";

// ─── View model types ─────────────────────────────────────────────────────────

export interface SalesRep {
  id: string;
  name: string;
  avatar: string;
  managerId?: string;
  zone?: string;
}

export interface StatusChangeLog {
  date: string;
  time: string;
  field: "status";
  previousValue: string;
  newValue: string;
  userId: string;
}

/**
 * Appointment VIEW MODEL — camelCase, consumed by pages/components.
 * Populated by useAppointments mapRow() which joins appointments + clients.
 * date/time/preQual1 are DERIVED from real DB columns in mapRow.
 * Never write this shape directly to Supabase.
 */
export interface Appointment {
  id: string;
  // Client identity (from public.clients join)
  fullName: string;
  phone: string;
  address: string;
  city: string;
  origin?: string;
  culturalOrigin?: string;
  leadSource?: string;
  // Appointment workflow (from public.appointments)
  date: string;        // derived from scheduled_at
  time: string;        // derived from scheduled_at
  repId: string;
  // Pre-qualification (derived from individual DB columns via buildPreQualFromColumns)
  preQual1: string;
  preQual2: string;
  notes: string;
  status: AppointmentStatus;  // stored in DB as snake_case English: "planifie", "close", etc.
  isBacklog: boolean;          // true = minimum info captured, prequalification pending
  // Hot Call fields
  isHotCall: boolean;          // true = in hot-call recovery flow
  hotCallState: string | null; // pool | claimed | recall | done
  hotCallOwnerId: string | null;
  hotCallTakenAt: string | null;
  hotCallRecallAt: string | null;
  hotCallAttemptCount: number;
  lastHotCallAttemptAt: string | null;
  hotCallLastFeedback: string | null;
  hotCallTags: string[];
  createdAt: string;
  confirmedAt: string | null;   // set when status transitions to confirme
  statusLog: StatusChangeLog[];  // will be populated from appointment_status_logs table (future)
  // Revenue (from appointments.close_amount)
  closedValue?: number;
  closedAt?: string;
}

// ─── Hot Call view model types ─────────────────────────────────────────────────

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
  | "pas_reponse"
  | "messagerie"
  | "numero_invalide"
  | "rappeler_plus_tard"
  | "pas_interesse"
  | "interesse"
  | "rdv_confirme";

export const HOT_CALL_FEEDBACKS: HotCallFeedback[] = [
  "pas_reponse",
  "messagerie",
  "numero_invalide",
  "rappeler_plus_tard",
  "pas_interesse",
  "interesse",
  "rdv_confirme",
];

export const HOT_CALL_FEEDBACK_LABELS: Record<HotCallFeedback, string> = {
  pas_reponse: "Pas de réponse",
  messagerie: "Messagerie",
  numero_invalide: "Numéro invalide",
  rappeler_plus_tard: "Rappeler plus tard",
  pas_interesse: "Pas intéressé",
  interesse: "Intéressé",
  rdv_confirme: "RDV confirmé",
};

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

// ─── Empty data constants ─────────────────────────────────────────────────────

/** @deprecated Use useTeamMembers hook instead */
export const MANAGERS: { id: string; name: string }[] = [];
/** @deprecated Use useTeamMembers hook instead */
export const SALES_REPS: SalesRep[] = [];
/** @deprecated Use useAppointments hook instead */
export const INITIAL_APPOINTMENTS: Appointment[] = [];
/** @deprecated Use useHotCallsQuery hook instead */
export const INITIAL_HOT_CALLS: HotCall[] = [];
