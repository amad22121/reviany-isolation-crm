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
  date: string;
  time: string;
  repId: string;
  preQual1: string;
  preQual2: string;
  notes: string;
  status: AppointmentStatus;
  source?: "Door-to-door" | "Referral";
  smsScheduled: boolean;
  createdAt: string;
  statusLog: StatusChangeLog[];
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

export type HotCallPhase = "À rappeler" | "En cours" | "Re-booké" | "Converti" | "Perdu";

export const HOT_CALL_PHASES: HotCallPhase[] = [
  "À rappeler",
  "En cours",
  "Re-booké",
  "Converti",
  "Perdu",
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
  source: "Door-to-door" | "Referral";
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


export const MANAGERS = [
  { id: "mgr1", name: "Arthur" },
];

export const SALES_REPS: SalesRep[] = [
  { id: "rep1", name: "Samvel", avatar: "SA", managerId: "mgr1" },
  { id: "rep2", name: "Enzo", avatar: "EN", managerId: "mgr1" },
  { id: "rep3", name: "Florian", avatar: "FL", managerId: "mgr1" },
  { id: "rep4", name: "Hakim", avatar: "HA", managerId: "mgr1" },
  { id: "rep5", name: "Alex", avatar: "AL", managerId: "mgr1" },
];


const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: "a1", fullName: "Pierre Lavoie", phone: "(514) 555-0101", address: "1234 Rue Sainte-Catherine O", city: "Montréal", date: today, time: "09:00", repId: "rep1", preQual1: "Oui, propriétaire depuis 5 ans", preQual2: "Intéressé par les économies d'énergie", notes: "Préfère les rendez-vous matinaux", status: "Confirmé", source: "Door-to-door", smsScheduled: false, createdAt: today, statusLog: [] },
  { id: "a2", fullName: "Marie Côté", phone: "(514) 555-0102", address: "567 Boulevard Saint-Laurent", city: "Montréal", date: today, time: "10:30", repId: "rep2", preQual1: "Propriétaire, récemment rénové", preQual2: "Recherche amélioration isolation", notes: "A un chien, sonnette Ring", status: "Planifié", source: "Referral", smsScheduled: false, createdAt: today, statusLog: [] },
  { id: "a3", fullName: "François Bélanger", phone: "(514) 555-0103", address: "890 Avenue du Parc", city: "Montréal", date: today, time: "11:00", repId: "rep1", preQual1: "Oui, possède un duplex", preQual2: "Factures d'énergie élevées", notes: "Français seulement", status: "Confirmé", source: "Door-to-door", smsScheduled: false, createdAt: today, statusLog: [] },
  { id: "a4", fullName: "Nathalie Gagnon", phone: "(438) 555-0104", address: "2345 Rue Sherbrooke E", city: "Montréal", date: today, time: "13:00", repId: "rep3", preQual1: "Propriétaire depuis 2018", preQual2: "Veut des soumissions fenêtres", notes: "Appeler avant d'arriver", status: "À risque", source: "Door-to-door", smsScheduled: false, createdAt: today, statusLog: [] },
  { id: "a5", fullName: "Claude Morin", phone: "(514) 555-0105", address: "678 Rue Notre-Dame O", city: "Montréal", date: today, time: "14:00", repId: "rep4", preQual1: "Propriétaire, 3 chambres", preQual2: "Intéressé panneaux solaires", notes: "Stationnement dans l'entrée", status: "Planifié", source: "Referral", smsScheduled: false, createdAt: today, statusLog: [] },
  { id: "a6", fullName: "Sylvie Pelletier", phone: "(438) 555-0106", address: "1111 Rue de la Montagne", city: "Montréal", date: today, time: "15:30", repId: "rep5", preQual1: "Oui, propriétaire condo", preQual2: "Mise à niveau chauffage", notes: "Code buzzer #4521", status: "Confirmé", source: "Door-to-door", smsScheduled: false, createdAt: today, statusLog: [] },
  { id: "a7", fullName: "Luc Bergeron", phone: "(514) 555-0107", address: "3456 Avenue Papineau", city: "Montréal", date: today, time: "16:00", repId: "rep2", preQual1: "Propriétaire, construit en 2005", preQual2: "Inspection toiture requise", notes: "Entrée latérale", status: "Planifié", source: "Door-to-door", smsScheduled: false, createdAt: today, statusLog: [] },
  { id: "a8", fullName: "Annie Fortin", phone: "(438) 555-0108", address: "789 Rue Rachel E", city: "Montréal", date: today, time: "09:30", repId: "rep3", preQual1: "Propriétaire, triplex", preQual2: "Admissible aux subventions gouvernementales", notes: "Apporter les brochures en français", status: "Closé", source: "Referral", smsScheduled: false, createdAt: today, statusLog: [] },
  { id: "a9", fullName: "Martin Desjardins", phone: "(514) 555-0109", address: "2222 Boulevard Décarie", city: "Montréal", date: today, time: "10:00", repId: "rep4", preQual1: "Oui, maison unifamiliale", preQual2: "Remplacement climatiseur", notes: "A une soumission d'un concurrent", status: "Confirmé", source: "Door-to-door", smsScheduled: false, createdAt: today, statusLog: [] },
  { id: "a10", fullName: "Chantal Lemieux", phone: "(438) 555-0110", address: "555 Avenue Laurier E", city: "Montréal", date: today, time: "11:30", repId: "rep5", preQual1: "Propriétaire 10+ ans", preQual2: "Audit énergétique complet", notes: "Travaille de la maison", status: "Planifié", source: "Door-to-door", smsScheduled: false, createdAt: today, statusLog: [] },
  { id: "a11", fullName: "Robert Paquette", phone: "(514) 555-0111", address: "1800 Rue Ontario E", city: "Montréal", date: yesterday, time: "09:00", repId: "rep1", preQual1: "Propriétaire, bungalow", preQual2: "Imperméabilisation sous-sol", notes: "Complété avec succès", status: "Closé", source: "Door-to-door", smsScheduled: false, createdAt: yesterday, statusLog: [] },
  { id: "a12", fullName: "Diane Simard", phone: "(438) 555-0112", address: "430 Rue Beaubien E", city: "Montréal", date: yesterday, time: "10:30", repId: "rep2", preQual1: "Oui, propriétaire", preQual2: "Remplacement revêtement", notes: "Non confirmé, replanifier", status: "À risque", source: "Referral", smsScheduled: false, createdAt: yesterday, statusLog: [] },
  { id: "a13", fullName: "Jacques Thibault", phone: "(514) 555-0113", address: "675 Rue Masson", city: "Montréal", date: yesterday, time: "13:00", repId: "rep3", preQual1: "Propriétaire, split-level", preQual2: "Intéressé thermopompe", notes: "Confirmé et complété", status: "Closé", source: "Door-to-door", smsScheduled: false, createdAt: yesterday, statusLog: [] },
  { id: "a14", fullName: "Hélène Savard", phone: "(438) 555-0114", address: "999 Avenue Van Horne", city: "Montréal", date: yesterday, time: "14:30", repId: "rep4", preQual1: "Propriétaire depuis 2015", preQual2: "Fenêtres et portes", notes: "Confirmé", status: "Confirmé", source: "Door-to-door", smsScheduled: false, createdAt: yesterday, statusLog: [] },
  { id: "a15", fullName: "Michel Dubois", phone: "(514) 555-0115", address: "1350 Boulevard de Maisonneuve E", city: "Montréal", date: yesterday, time: "16:00", repId: "rep5", preQual1: "Propriétaire condo", preQual2: "Entretien CVAC", notes: "Préfère le soir la prochaine fois", status: "Closé", source: "Referral", smsScheduled: false, createdAt: yesterday, statusLog: [] },
];
