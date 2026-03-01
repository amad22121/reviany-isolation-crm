/**
 * Centralized enums — single source of truth for all status values.
 * These MUST be used everywhere in the app. No duplicate string literals.
 */

// ─── Appointment ──────────────────────────────────────────────────────────────

export const AppointmentStatus = {
  PLANNED: "planned",
  CONFIRMED: "confirmed",
  UNCONFIRMED: "unconfirmed",
  AT_RISK: "at_risk",
  POSTPONED: "postponed",
  CANCELLED_CALLBACK: "cancelled_callback",
  CANCELLED_FINAL: "cancelled_final",
  NO_SHOW: "no_show",
  CLOSED: "closed",
} as const;
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.PLANNED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.UNCONFIRMED,
  AppointmentStatus.AT_RISK,
  AppointmentStatus.POSTPONED,
  AppointmentStatus.CANCELLED_CALLBACK,
  AppointmentStatus.CANCELLED_FINAL,
  AppointmentStatus.NO_SHOW,
  AppointmentStatus.CLOSED,
];

/** Human-readable labels (French UI) */
export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PLANNED]: "Planifié",
  [AppointmentStatus.CONFIRMED]: "Confirmé",
  [AppointmentStatus.UNCONFIRMED]: "Non confirmé",
  [AppointmentStatus.AT_RISK]: "À risque",
  [AppointmentStatus.POSTPONED]: "Reporté",
  [AppointmentStatus.CANCELLED_CALLBACK]: "Annulé (à rappeler)",
  [AppointmentStatus.CANCELLED_FINAL]: "Annulé (définitif)",
  [AppointmentStatus.NO_SHOW]: "No-show",
  [AppointmentStatus.CLOSED]: "Closé",
};

/**
 * Map legacy French status strings to domain enum values.
 * Use this when reading data from existing mock/zustand stores.
 */
export const LEGACY_STATUS_MAP: Record<string, AppointmentStatus> = {
  "Planifié": AppointmentStatus.PLANNED,
  "En attente": AppointmentStatus.PLANNED,
  "Confirmé": AppointmentStatus.CONFIRMED,
  "Non confirmé": AppointmentStatus.UNCONFIRMED,
  "À risque": AppointmentStatus.AT_RISK,
  "Reporté": AppointmentStatus.POSTPONED,
  "Annulé (à rappeler)": AppointmentStatus.CANCELLED_CALLBACK,
  "Annulé (définitif)": AppointmentStatus.CANCELLED_FINAL,
  "No-show": AppointmentStatus.NO_SHOW,
  "Closed": AppointmentStatus.CLOSED,
  "Closé": AppointmentStatus.CLOSED,
  "Annulé": AppointmentStatus.CANCELLED_CALLBACK,
};

export function toLegacyStatus(s: AppointmentStatus): string {
  return APPOINTMENT_STATUS_LABELS[s];
}

export function fromLegacyStatus(s: string): AppointmentStatus {
  return LEGACY_STATUS_MAP[s] ?? AppointmentStatus.PLANNED;
}

// ─── Hot Call ──────────────────────────────────────────────────────────────────

export const HotCallStatus = {
  FIRST_CONTACT: "first_contact",
  SECOND_CONTACT: "second_contact",
  THIRD_CONTACT: "third_contact",
  CALLBACK: "callback",
  FOLLOWUP_3M: "followup_3m",
  FOLLOWUP_6M: "followup_6m",
  FOLLOWUP_9M: "followup_9m",
  FOLLOWUP_12M: "followup_12m",
  BOOKED: "booked",
  DEAD: "dead",
} as const;
export type HotCallStatus = (typeof HotCallStatus)[keyof typeof HotCallStatus];

export const HOT_CALL_STATUSES: HotCallStatus[] = Object.values(HotCallStatus);

export const HOT_CALL_STATUS_LABELS: Record<HotCallStatus, string> = {
  [HotCallStatus.FIRST_CONTACT]: "Premier contact",
  [HotCallStatus.SECOND_CONTACT]: "Deuxième contact",
  [HotCallStatus.THIRD_CONTACT]: "Troisième contact",
  [HotCallStatus.CALLBACK]: "Call back later",
  [HotCallStatus.FOLLOWUP_3M]: "Follow-up 3 months",
  [HotCallStatus.FOLLOWUP_6M]: "Follow-up 6 months",
  [HotCallStatus.FOLLOWUP_9M]: "Follow-up 9 months",
  [HotCallStatus.FOLLOWUP_12M]: "Follow-up 12 months",
  [HotCallStatus.BOOKED]: "Booked",
  [HotCallStatus.DEAD]: "Dead",
};

export const LEGACY_HOT_CALL_STATUS_MAP: Record<string, HotCallStatus> = {
  "Premier contact": HotCallStatus.FIRST_CONTACT,
  "Deuxième contact": HotCallStatus.SECOND_CONTACT,
  "Troisième contact": HotCallStatus.THIRD_CONTACT,
  "No answer": HotCallStatus.CALLBACK,
  "Call back later": HotCallStatus.CALLBACK,
  "Reschedule requested": HotCallStatus.CALLBACK,
  "Not interested": HotCallStatus.DEAD,
  "Follow-up 3 months": HotCallStatus.FOLLOWUP_3M,
  "Follow-up 6 months": HotCallStatus.FOLLOWUP_6M,
  "Follow-up 9 months": HotCallStatus.FOLLOWUP_9M,
  "Follow-up 12 months": HotCallStatus.FOLLOWUP_12M,
  "Booked": HotCallStatus.BOOKED,
  "Closed": HotCallStatus.BOOKED,
  "Dead": HotCallStatus.DEAD,
};

// ─── Hot Call Phase ───────────────────────────────────────────────────────────

export const HotCallPhase = {
  POOL: "pool",
  CLAIMED: "claimed",
  SCHEDULED_FOLLOW_UP: "scheduled_follow_up",
  CLOSED: "closed",
} as const;
export type HotCallPhase = (typeof HotCallPhase)[keyof typeof HotCallPhase];

export const HOT_CALL_PHASES: HotCallPhase[] = Object.values(HotCallPhase);

export const HOT_CALL_PHASE_LABELS: Record<HotCallPhase, string> = {
  [HotCallPhase.POOL]: "Pool",
  [HotCallPhase.CLAIMED]: "Pris",
  [HotCallPhase.SCHEDULED_FOLLOW_UP]: "Relance planifiée",
  [HotCallPhase.CLOSED]: "Fermé",
};

// ─── Hot Call Feedback ────────────────────────────────────────────────────────

export const HotCallFeedback = {
  NO_ANSWER: "no_answer",
  CALLBACK: "callback",
  RESCHEDULE: "reschedule",
  NOT_INTERESTED: "not_interested",
  FOLLOWUP_3M: "followup_3m",
  FOLLOWUP_6M: "followup_6m",
  FOLLOWUP_9M: "followup_9m",
  FOLLOWUP_12M: "followup_12m",
} as const;
export type HotCallFeedback = (typeof HotCallFeedback)[keyof typeof HotCallFeedback];

export const HOT_CALL_FEEDBACKS: HotCallFeedback[] = Object.values(HotCallFeedback);

export const HOT_CALL_FEEDBACK_LABELS: Record<HotCallFeedback, string> = {
  [HotCallFeedback.NO_ANSWER]: "No answer",
  [HotCallFeedback.CALLBACK]: "Call back later",
  [HotCallFeedback.RESCHEDULE]: "Reschedule requested",
  [HotCallFeedback.NOT_INTERESTED]: "Not interested",
  [HotCallFeedback.FOLLOWUP_3M]: "Follow-up 3 months",
  [HotCallFeedback.FOLLOWUP_6M]: "Follow-up 6 months",
  [HotCallFeedback.FOLLOWUP_9M]: "Follow-up 9 months",
  [HotCallFeedback.FOLLOWUP_12M]: "Follow-up 12 months",
};

// ─── Marketing Lead ───────────────────────────────────────────────────────────

export const MarketingLeadStatus = {
  NEW_LEAD: "new_lead",
  ATTEMPTING_CONTACT: "attempting_contact",
  CONTACTED: "contacted",
  APPOINTMENT_BOOKED: "appointment_booked",
  CLOSED: "closed",
  NOT_CLOSED_CONTINUE: "not_closed_continue_followup",
} as const;
export type MarketingLeadStatus = (typeof MarketingLeadStatus)[keyof typeof MarketingLeadStatus];

export const MARKETING_LEAD_STATUSES: MarketingLeadStatus[] = Object.values(MarketingLeadStatus);

export const MARKETING_LEAD_STATUS_LABELS: Record<MarketingLeadStatus, string> = {
  [MarketingLeadStatus.NEW_LEAD]: "Nouveau",
  [MarketingLeadStatus.ATTEMPTING_CONTACT]: "Tentative",
  [MarketingLeadStatus.CONTACTED]: "Contacté",
  [MarketingLeadStatus.APPOINTMENT_BOOKED]: "RDV Booké",
  [MarketingLeadStatus.CLOSED]: "Fermé",
  [MarketingLeadStatus.NOT_CLOSED_CONTINUE]: "Non fermé",
};

export const LEGACY_LEAD_STATUS_MAP: Record<string, MarketingLeadStatus> = {
  "New Lead": MarketingLeadStatus.NEW_LEAD,
  "Attempted Contact": MarketingLeadStatus.ATTEMPTING_CONTACT,
  "Contacted": MarketingLeadStatus.CONTACTED,
  "Appointment Booked": MarketingLeadStatus.APPOINTMENT_BOOKED,
  "Closed": MarketingLeadStatus.CLOSED,
  "Not Closed": MarketingLeadStatus.NOT_CLOSED_CONTINUE,
};

// ─── Territory ────────────────────────────────────────────────────────────────

export const TerritoryStatus = {
  TODO: "todo",
  PLANNED_TODAY: "planned_today",
  IN_PROGRESS: "in_progress",
  DONE: "done",
} as const;
export type TerritoryStatus = (typeof TerritoryStatus)[keyof typeof TerritoryStatus];

export const TERRITORY_STATUSES: TerritoryStatus[] = Object.values(TerritoryStatus);

export const TERRITORY_STATUS_LABELS: Record<TerritoryStatus, string> = {
  [TerritoryStatus.TODO]: "À faire",
  [TerritoryStatus.PLANNED_TODAY]: "Planifié aujourd'hui",
  [TerritoryStatus.IN_PROGRESS]: "En cours",
  [TerritoryStatus.DONE]: "Fait",
};

// ─── Roles ────────────────────────────────────────────────────────────────────

export const AppRole = {
  OWNER: "proprietaire",
  MANAGER: "gestionnaire",
  REP: "representant",
} as const;
export type AppRole = (typeof AppRole)[keyof typeof AppRole];

// ─── Lead Sources ─────────────────────────────────────────────────────────────

export const LeadSource = {
  DOOR_TO_DOOR: "door_to_door",
  REFERRAL: "referral",
  FACEBOOK: "facebook",
} as const;
export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];
