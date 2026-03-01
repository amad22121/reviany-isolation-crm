/**
 * Centralized mock data — single location for all demo/seed data.
 * Controlled by USE_MOCK flag in config.ts.
 * When Supabase is wired, this file becomes unused.
 */

import type { SalesRep, Appointment, HotCall, CallLogEntry, StatusChangeLog } from "@/data/crm-data";
import type { AppointmentStatus, HotCallStatus, HotCallPhase, HotCallFeedback } from "@/data/crm-data";

// ─── Sales Reps ───────────────────────────────────────────────────────────────

export const MOCK_MANAGERS = [
  { id: "mgr1", name: "Arthur" },
];

export const MOCK_SALES_REPS: SalesRep[] = [
  { id: "rep1", name: "Samvel", avatar: "SA", managerId: "mgr1" },
  { id: "rep2", name: "Enzo", avatar: "EN", managerId: "mgr1" },
  { id: "rep3", name: "Florian", avatar: "FL", managerId: "mgr1" },
  { id: "rep4", name: "Hakim", avatar: "HA", managerId: "mgr1" },
  { id: "rep5", name: "Alex", avatar: "AL", managerId: "mgr1" },
];

// ─── Appointments ─────────────────────────────────────────────────────────────

const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];

export const MOCK_APPOINTMENTS: Appointment[] = [
  // ── Today ──
  { id: "a1", fullName: "Pierre Lavoie", phone: "(514) 555-0101", address: "1234 Rue Sainte-Catherine O", city: "Montréal", date: today, time: "09:00", repId: "rep1", preQual1: "Oui, propriétaire depuis 5 ans", preQual2: "Intéressé par les économies d'énergie", notes: "Préfère les rendez-vous matinaux", status: "Confirmé", source: "Door-to-door", smsScheduled: false, createdAt: today, statusLog: [] },
  { id: "a2", fullName: "Marie Côté", phone: "(514) 555-0102", address: "567 Boulevard Saint-Laurent", city: "Montréal", date: today, time: "10:30", repId: "rep2", preQual1: "Propriétaire, récemment rénové", preQual2: "Recherche amélioration isolation", notes: "A un chien, sonnette Ring", status: "Planifié", source: "Referral", smsScheduled: false, createdAt: today, statusLog: [] },
  { id: "a3", fullName: "François Bélanger", phone: "(514) 555-0103", address: "890 Avenue du Parc", city: "Montréal", date: today, time: "11:00", repId: "rep1", preQual1: "Oui, possède un duplex", preQual2: "Factures d'énergie élevées", notes: "Français seulement", status: "Confirmé", source: "Door-to-door", smsScheduled: false, createdAt: today, statusLog: [] },
  { id: "a4", fullName: "Nathalie Gagnon", phone: "(438) 555-0104", address: "2345 Rue Sherbrooke E", city: "Montréal", date: today, time: "13:00", repId: "rep3", preQual1: "Propriétaire depuis 2018", preQual2: "Veut des soumissions fenêtres", notes: "Appeler avant d'arriver", status: "À risque", source: "Door-to-door", smsScheduled: false, createdAt: today, statusLog: [] },
  { id: "a5", fullName: "Claude Morin", phone: "(514) 555-0105", address: "678 Rue Notre-Dame O", city: "Montréal", date: today, time: "14:00", repId: "rep4", preQual1: "Propriétaire, 3 chambres", preQual2: "Intéressé panneaux solaires", notes: "Stationnement dans l'entrée", status: "Non confirmé", source: "Facebook", smsScheduled: false, createdAt: today, statusLog: [] },
  { id: "a6", fullName: "Sylvie Pelletier", phone: "(438) 555-0106", address: "1111 Rue de la Montagne", city: "Montréal", date: today, time: "15:30", repId: "rep5", preQual1: "Oui, propriétaire condo", preQual2: "Mise à niveau chauffage", notes: "Code buzzer #4521", status: "Confirmé", source: "Door-to-door", smsScheduled: false, createdAt: today, statusLog: [] },
  { id: "a7", fullName: "Luc Bergeron", phone: "(514) 555-0107", address: "3456 Avenue Papineau", city: "Montréal", date: today, time: "16:00", repId: "rep2", preQual1: "Propriétaire, construit en 2005", preQual2: "Inspection toiture requise", notes: "Entrée latérale", status: "Reporté", source: "Door-to-door", smsScheduled: false, createdAt: today, statusLog: [] },
  { id: "a8", fullName: "Annie Fortin", phone: "(438) 555-0108", address: "789 Rue Rachel E", city: "Montréal", date: today, time: "09:30", repId: "rep3", preQual1: "Propriétaire, triplex", preQual2: "Admissible aux subventions gouvernementales", notes: "Apporter les brochures en français", status: "Closé", source: "Referral", smsScheduled: false, createdAt: today, statusLog: [] },
  { id: "a9", fullName: "Martin Desjardins", phone: "(514) 555-0109", address: "2222 Boulevard Décarie", city: "Montréal", date: today, time: "10:00", repId: "rep4", preQual1: "Oui, maison unifamiliale", preQual2: "Remplacement climatiseur", notes: "A une soumission d'un concurrent", status: "No-show", source: "Door-to-door", smsScheduled: false, createdAt: today, statusLog: [] },
  { id: "a10", fullName: "Chantal Lemieux", phone: "(438) 555-0110", address: "555 Avenue Laurier E", city: "Montréal", date: today, time: "11:30", repId: "rep5", preQual1: "Propriétaire 10+ ans", preQual2: "Audit énergétique complet", notes: "Travaille de la maison", status: "Annulé (à rappeler)", source: "Facebook", smsScheduled: false, createdAt: today, statusLog: [] },
  // ── Yesterday ──
  { id: "a11", fullName: "Robert Paquette", phone: "(514) 555-0111", address: "1800 Rue Ontario E", city: "Montréal", date: yesterday, time: "09:00", repId: "rep1", preQual1: "Propriétaire, bungalow", preQual2: "Imperméabilisation sous-sol", notes: "Complété avec succès", status: "Closé", source: "Door-to-door", smsScheduled: false, createdAt: yesterday, statusLog: [] },
  { id: "a12", fullName: "Diane Simard", phone: "(438) 555-0112", address: "430 Rue Beaubien E", city: "Montréal", date: yesterday, time: "10:30", repId: "rep2", preQual1: "Oui, propriétaire", preQual2: "Remplacement revêtement", notes: "Non confirmé, replanifier", status: "Annulé (définitif)", source: "Referral", smsScheduled: false, createdAt: yesterday, statusLog: [] },
  { id: "a13", fullName: "Jacques Thibault", phone: "(514) 555-0113", address: "675 Rue Masson", city: "Montréal", date: yesterday, time: "13:00", repId: "rep3", preQual1: "Propriétaire, split-level", preQual2: "Intéressé thermopompe", notes: "Confirmé et complété", status: "Closé", source: "Door-to-door", smsScheduled: false, createdAt: yesterday, statusLog: [] },
  { id: "a14", fullName: "Hélène Savard", phone: "(438) 555-0114", address: "999 Avenue Van Horne", city: "Montréal", date: yesterday, time: "14:30", repId: "rep4", preQual1: "Propriétaire depuis 2015", preQual2: "Fenêtres et portes", notes: "Confirmé", status: "Confirmé", source: "Door-to-door", smsScheduled: false, createdAt: yesterday, statusLog: [] },
  { id: "a15", fullName: "Michel Dubois", phone: "(514) 555-0115", address: "1350 Boulevard de Maisonneuve E", city: "Montréal", date: yesterday, time: "16:00", repId: "rep5", preQual1: "Propriétaire condo", preQual2: "Entretien CVAC", notes: "Préfère le soir la prochaine fois", status: "Closé", source: "Referral", smsScheduled: false, createdAt: yesterday, statusLog: [] },
  // ── Two days ago ──
  { id: "a16", fullName: "Isabelle Gendron", phone: "(514) 555-0116", address: "200 Rue Saint-Denis", city: "Montréal", date: twoDaysAgo, time: "09:00", repId: "rep1", preQual1: "", preQual2: "", notes: "No-show confirmé", status: "No-show", source: "Facebook", smsScheduled: false, createdAt: twoDaysAgo, statusLog: [] },
  { id: "a17", fullName: "Alain Mercier", phone: "(438) 555-0117", address: "450 Rue Jean-Talon E", city: "Montréal", date: twoDaysAgo, time: "10:00", repId: "rep2", preQual1: "", preQual2: "", notes: "Reporté à la semaine prochaine", status: "Reporté", source: "Door-to-door", smsScheduled: false, createdAt: twoDaysAgo, statusLog: [] },
  { id: "a18", fullName: "Sophie Lapointe", phone: "(514) 555-0118", address: "800 Rue Fleury E", city: "Montréal", date: twoDaysAgo, time: "14:00", repId: "rep3", preQual1: "", preQual2: "", notes: "Non confirmé", status: "Non confirmé", source: "Autre", smsScheduled: false, createdAt: twoDaysAgo, statusLog: [] },
];

// ─── Hot Calls ────────────────────────────────────────────────────────────────

export const MOCK_HOT_CALLS: HotCall[] = [
  { id: "hc1", fullName: "Diane Simard", phone: "(438) 555-0112", address: "430 Rue Beaubien E", city: "Montréal", source: "Door-to-door", repId: "rep2", status: "No answer", phase: "pool", lastFeedback: "No answer", attempts: 2, lastContactDate: yesterday, followUpDate: today, notes: "Non confirmé, replanifier", createdAt: yesterday, tags: ["Callback"], callHistory: [{ date: yesterday, time: "10:30", repId: "rep2", note: "Pas de réponse" }] },
  { id: "hc2", fullName: "Lucie Tremblay", phone: "(514) 555-0120", address: "890 Rue Wellington", city: "Verdun", source: "Referral", repId: "rep1", status: "Call back later", phase: "claimed", lastFeedback: "Call back later", attempts: 1, lastContactDate: yesterday, followUpDate: today, notes: "Rappeler le matin", createdAt: yesterday, tags: ["À rappeler matin"], callHistory: [{ date: yesterday, time: "14:00", repId: "rep1", note: "Rappeler le matin" }] },
  { id: "hc3", fullName: "Yves Bouchard", phone: "(438) 555-0130", address: "1200 Avenue du Parc", city: "Montréal", source: "Door-to-door", repId: "rep3", status: "Follow-up 3 months", phase: "scheduled_follow_up", lastFeedback: "Follow-up 3 months", attempts: 3, lastContactDate: yesterday, followUpDate: "2026-05-19", notes: "Intéressé mais pas maintenant", createdAt: yesterday, tags: ["Client chaud"], callHistory: [{ date: yesterday, time: "11:00", repId: "rep3", note: "Intéressé mais pas maintenant" }] },
  { id: "hc4", fullName: "Julie Roy", phone: "(514) 555-0140", address: "567 Boulevard Gouin O", city: "Laval", source: "Door-to-door", repId: "rep4", status: "Reschedule requested", phase: "pool", lastFeedback: "Reschedule requested", attempts: 1, lastContactDate: today, followUpDate: today, notes: "Veut un RDV en soirée", createdAt: today, tags: ["À rappeler soir"], callHistory: [{ date: today, time: "09:00", repId: "rep4", note: "Veut un RDV en soirée" }] },
];

// ─── Territories ──────────────────────────────────────────────────────────────

export const MOCK_TERRITORIES = [
  { id: "t1", city: "Montréal", sector: "Plateau Mont-Royal", street: "Rue Saint-Denis (entre Sherbrooke et Mont-Royal)", status: "Fait" as const, repId: "rep1", lastVisitDate: yesterday, estimatedDoors: 45, notes: "Bon secteur, plusieurs propriétaires intéressés", createdAt: yesterday, statusLog: [] },
  { id: "t2", city: "Montréal", sector: "Rosemont", street: "Avenue Papineau (nord de Beaubien)", status: "Planifié aujourd'hui" as const, repId: "rep2", lastVisitDate: "", estimatedDoors: 30, notes: "", createdAt: today, statusLog: [] },
  { id: "t3", city: "Montréal", sector: "Villeray", street: "Rue Jarry (entre Saint-Laurent et Saint-Denis)", status: "À faire" as const, repId: "rep1", lastVisitDate: "", estimatedDoors: 55, notes: "Zone dense, beaucoup de duplex", createdAt: today, statusLog: [] },
  { id: "t4", city: "Laval", sector: "Chomedey", street: "Boulevard Curé-Labelle (section sud)", status: "En cours" as const, repId: "rep3", lastVisitDate: today, estimatedDoors: 25, notes: "En cours de prospection", createdAt: today, statusLog: [] },
  { id: "t5", city: "Montréal", sector: "Verdun", street: "Rue Wellington (entre LaSalle et de l'Église)", status: "Fait" as const, repId: "rep4", lastVisitDate: yesterday, estimatedDoors: 35, notes: "Complété, quelques leads récupérés", createdAt: yesterday, statusLog: [] },
  { id: "t6", city: "Longueuil", sector: "Vieux-Longueuil", street: "Rue Saint-Charles (centre-ville)", status: "À faire" as const, repId: "rep5", lastVisitDate: "", estimatedDoors: 40, notes: "", createdAt: today, statusLog: [] },
];

export const MOCK_MAP_ZONES = [
  { id: "mz1", name: "Plateau Mont-Royal", city: "Montréal", status: "Fait" as const, repId: "rep1", plannedDate: yesterday, notes: "Secteur complété", polygon: [[45.5225, -73.5800], [45.5225, -73.5650], [45.5320, -73.5650], [45.5320, -73.5800]] as [number, number][], statusLog: [] },
  { id: "mz2", name: "Rosemont–La Petite-Patrie", city: "Montréal", status: "Planifié aujourd'hui" as const, repId: "rep2", plannedDate: today, notes: "Zone prioritaire aujourd'hui", polygon: [[45.5340, -73.5900], [45.5340, -73.5650], [45.5450, -73.5650], [45.5450, -73.5900]] as [number, number][], statusLog: [] },
  { id: "mz3", name: "Villeray–Saint-Michel", city: "Montréal", status: "À faire" as const, repId: "rep1", plannedDate: "", notes: "Zone dense, beaucoup de duplex", polygon: [[45.5450, -73.6150], [45.5450, -73.5900], [45.5560, -73.5900], [45.5560, -73.6150]] as [number, number][], statusLog: [] },
  { id: "mz4", name: "Mercier–Hochelaga", city: "Montréal", status: "En cours" as const, repId: "rep3", plannedDate: today, notes: "Prospection en cours", polygon: [[45.5400, -73.5600], [45.5400, -73.5350], [45.5520, -73.5350], [45.5520, -73.5600]] as [number, number][], statusLog: [] },
  { id: "mz5", name: "Verdun", city: "Montréal", status: "Fait" as const, repId: "rep4", plannedDate: yesterday, notes: "Complété, quelques leads récupérés", polygon: [[45.4520, -73.5750], [45.4520, -73.5550], [45.4620, -73.5550], [45.4620, -73.5750]] as [number, number][], statusLog: [] },
  { id: "mz6", name: "Côte-des-Neiges", city: "Montréal", status: "À faire" as const, repId: "rep5", plannedDate: "", notes: "", polygon: [[45.4900, -73.6350], [45.4900, -73.6100], [45.5050, -73.6100], [45.5050, -73.6350]] as [number, number][], statusLog: [] },
  { id: "mz7", name: "Ahuntsic-Cartierville", city: "Montréal", status: "À faire" as const, repId: "rep2", plannedDate: "", notes: "Grande zone résidentielle", polygon: [[45.5500, -73.6700], [45.5500, -73.6400], [45.5650, -73.6400], [45.5650, -73.6700]] as [number, number][], statusLog: [] },
  { id: "mz8", name: "Saint-Léonard", city: "Montréal", status: "Planifié aujourd'hui" as const, repId: "rep3", plannedDate: today, notes: "Planifié pour cet après-midi", polygon: [[45.5700, -73.5950], [45.5700, -73.5700], [45.5830, -73.5700], [45.5830, -73.5950]] as [number, number][], statusLog: [] },
];
