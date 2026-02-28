import type { AppRole } from "@/lib/workspace/WorkspaceProvider";

/**
 * Permission actions used throughout the CRM.
 * Add new actions here as needed.
 */
export type Action =
  | "assign_reps"
  | "change_appointment_status"
  | "change_any_appointment_status"
  | "view_all_appointments"
  | "view_all_leads"
  | "delete_appointment"
  | "edit_daily_target"
  | "edit_rep_goals"
  | "manage_users"
  | "view_statistics"
  | "manage_hot_calls"
  | "reassign_hot_calls";

const PERMISSIONS: Record<Action, AppRole[]> = {
  assign_reps: ["proprietaire", "gestionnaire"],
  change_appointment_status: ["proprietaire", "gestionnaire", "representant"],
  change_any_appointment_status: ["proprietaire", "gestionnaire"],
  view_all_appointments: ["proprietaire", "gestionnaire"],
  view_all_leads: ["proprietaire", "gestionnaire"],
  delete_appointment: ["proprietaire", "gestionnaire"],
  edit_daily_target: ["proprietaire"],
  edit_rep_goals: ["proprietaire"],
  manage_users: ["proprietaire"],
  view_statistics: ["proprietaire", "gestionnaire", "representant"],
  manage_hot_calls: ["proprietaire", "gestionnaire"],
  reassign_hot_calls: ["proprietaire", "gestionnaire"],
};

/**
 * Check if a role has permission to perform an action.
 */
export function can(role: AppRole | null, action: Action): boolean {
  if (!role) return false;
  return PERMISSIONS[action]?.includes(role) ?? false;
}

/**
 * Convenience: check multiple actions at once. Returns true if ALL are allowed.
 */
export function canAll(role: AppRole | null, actions: Action[]): boolean {
  return actions.every((a) => can(role, a));
}

/**
 * Convenience: check multiple actions at once. Returns true if ANY is allowed.
 */
export function canAny(role: AppRole | null, actions: Action[]): boolean {
  return actions.some((a) => can(role, a));
}
