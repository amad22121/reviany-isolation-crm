/**
 * At-Risk Appointment Detection Logic
 *
 * An appointment is considered "at risk" when:
 * 1. status is "Non confirmé" (or domain enum "unconfirmed")
 * 2. The appointment datetime is in the future
 * 3. We are within the risk window (default 12h before the appointment)
 *
 * This module is UI-only for now. When Supabase is wired,
 * this logic can be moved to a database view or RPC.
 */

/** Hours before appointment when it becomes "at risk" */
export const RISK_WINDOW_HOURS = 12;

export interface AtRiskAppointment {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  rep_id: string;
  status: string;
  notes: string;
  origin?: string;
}

/**
 * Check if an appointment is "at risk" for confirmation.
 * Returns true if the appointment is unconfirmed and within the risk window.
 */
export function isAtRisk(appt: AtRiskAppointment, now: Date = new Date()): boolean {
  // Must be "Non confirmé" or "unconfirmed"
  const unconfirmedStatuses = ["Non confirmé", "unconfirmed", "À risque", "at_risk"];
  if (!unconfirmedStatuses.includes(appt.status)) return false;

  // Appointment must be in the future
  const apptDate = new Date(`${appt.date}T${appt.time || "09:00"}`);
  if (apptDate <= now) return false;

  // Must be within the risk window (e.g. 12h before appointment)
  const riskStart = new Date(apptDate.getTime() - RISK_WINDOW_HOURS * 60 * 60 * 1000);
  if (now < riskStart) return false;

  return true;
}

/**
 * Check if an appointment's risk deadline falls on a specific date.
 * The risk deadline = appointment datetime - RISK_WINDOW_HOURS.
 */
export function riskDeadlineFallsOnDate(appt: AtRiskAppointment, dateStr: string): boolean {
  const apptDate = new Date(`${appt.date}T${appt.time || "09:00"}`);
  const riskDeadline = new Date(apptDate.getTime() - RISK_WINDOW_HOURS * 60 * 60 * 1000);
  const deadlineDateStr = riskDeadline.toISOString().split("T")[0];
  return deadlineDateStr === dateStr || appt.date === dateStr;
}

/**
 * Filter at-risk appointments for "today" view.
 * Shows appointments where:
 * - appointment.date is today, OR
 * - risk deadline falls today
 */
export function getAtRiskToday(appointments: AtRiskAppointment[], now: Date = new Date()): AtRiskAppointment[] {
  const todayStr = now.toISOString().split("T")[0];
  return appointments.filter(
    (a) => isAtRisk(a, now) && (a.date === todayStr || riskDeadlineFallsOnDate(a, todayStr))
  );
}

/**
 * Filter at-risk appointments for "this week" view.
 * Shows appointments where:
 * - appointment.date is within next 7 days and still at-risk
 */
export function getAtRiskThisWeek(appointments: AtRiskAppointment[], now: Date = new Date()): AtRiskAppointment[] {
  const todayStr = now.toISOString().split("T")[0];
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  return appointments.filter(
    (a) => isAtRisk(a, now) && a.date >= todayStr && a.date <= in7Days
  );
}
