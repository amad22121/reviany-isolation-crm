/**
 * Domain types — Supabase-ready interfaces.
 * These represent the data shape that will map 1:1 to DB tables.
 * Fields use snake_case to match Supabase conventions.
 */

import type {
  AppointmentStatus,
  HotCallStatus,
  HotCallPhase,
  HotCallFeedback,
  MarketingLeadStatus,
  TerritoryStatus as TerritoryStatusEnum,
  AppRole,
  LeadSource,
} from "./enums";

// ─── Auth / Users ─────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthSession {
  access_token: string;
  user: AuthUser;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

// ─── Workspace / Team ─────────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: AppRole;
  /** For reps: links to their user profile */
  rep_id: string | null;
  /** For managers: links to their user profile */
  manager_id: string | null;
  created_at: string;
}

export interface SalesRep {
  id: string;
  name: string;
  avatar: string;
  manager_id: string | null;
  zone: string | null;
  /** TODO: Replace with Supabase - will map to user_id */
  user_id?: string;
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export interface StatusChangeLog {
  date: string;
  time: string;
  field: "status";
  previous_value: string;
  new_value: string;
  user_id: string;
}

export interface Appointment {
  id: string;
  workspace_id?: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  origin: string | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  rep_id: string;
  pre_qual_1: string;
  pre_qual_2: string;
  notes: string;
  status: AppointmentStatus;
  source: LeadSource | null;
  sms_scheduled: boolean;
  created_at: string;
  status_log: StatusChangeLog[];
}

// ─── Hot Calls ────────────────────────────────────────────────────────────────

export interface CallLogEntry {
  date: string;
  time: string;
  rep_id: string;
  note: string;
}

export interface HotCall {
  id: string;
  workspace_id?: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  source: LeadSource;
  assigned_to_user_id: string | null;
  status: HotCallStatus | string; // string for legacy compatibility
  phase: HotCallPhase | string;
  last_feedback: HotCallFeedback | string;
  attempts: number;
  last_contact_date: string | null;
  follow_up_date: string | null;
  notes: string | null;
  origin: string | null;
  original_appointment_id: string | null;
  tags: string[];
  locked_at: string | null;
  lock_expires_at: string | null;
  last_action_at: string | null;
  created_at: string;
  updated_at: string;
  /** Legacy field — local-only call history; will move to hot_call_notes table */
  call_history?: CallLogEntry[];
}

export interface HotCallNote {
  id: string;
  hot_call_id: string;
  user_id: string;
  note: string;
  call_feedback: string | null;
  created_at: string;
}

// ─── Marketing Leads ──────────────────────────────────────────────────────────

export interface MarketingLead {
  id: string;
  workspace_id?: string;
  full_name: string;
  phone: string;
  address: string | null;
  city: string | null;
  has_attic: string | null;
  source: string;
  status: MarketingLeadStatus | string; // string for legacy compatibility
  assigned_rep_id: string | null;
  attempts_count: number;
  last_contact_date: string | null;
  notes: string | null;
  next_followup_date: string | null;
  converted_appointment_id: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

// ─── Territories ──────────────────────────────────────────────────────────────

export interface TerritoryPolygon {
  id: string;
  workspace_id?: string;
  name: string;
  polygon: [number, number][]; // lat/lng pairs
  city: string;
  rep_id: string;
  status: TerritoryStatusEnum | string;
  notes: string | null;
  planned_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TerritoryStatusLog {
  id: string;
  zone_id: string;
  previous_status: string;
  new_status: string;
  changed_by: string;
  changed_at: string;
}

// ─── Activity Log (future) ────────────────────────────────────────────────────

export interface ActivityLog {
  id: string;
  workspace_id: string;
  entity_type: "appointment" | "hot_call" | "marketing_lead" | "territory";
  entity_id: string;
  action: string;
  details: Record<string, unknown> | null;
  user_id: string;
  created_at: string;
}

// ─── Notes (generic) ──────────────────────────────────────────────────────────

export interface Note {
  id: string;
  entity_type: string;
  entity_id: string;
  content: string;
  user_id: string;
  created_at: string;
}

// ─── Client (virtual — aggregated view) ───────────────────────────────────────

export interface Client {
  /** Derived from appointment or hot call */
  id: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  origin: string | null;
  /** Linked appointments */
  appointments: Appointment[];
  /** Linked hot calls */
  hot_calls: HotCall[];
  /** Linked marketing leads */
  marketing_leads: MarketingLead[];
}
