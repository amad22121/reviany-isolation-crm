// TODO: Replace with Supabase
// Data access layer. All functions accept workspaceId for multi-tenancy.
// When role === "representant", results are filtered to the assigned user.

import type { AppRole } from "@/lib/workspace/WorkspaceProvider";
import {
  INITIAL_APPOINTMENTS,
  SALES_REPS,
  type Appointment,
  type HotCall,
  type SalesRep,
} from "@/data/crm-data";

interface DataParams {
  workspaceId: string;
  userId?: string;
  role?: AppRole;
}

/**
 * TODO: Replace with Supabase
 * List hot calls scoped to workspace and user role.
 */
export async function listHotCalls(params: DataParams): Promise<HotCall[]> {
  // TODO: Replace with Supabase
  // const { data } = await supabase
  //   .from('hot_calls')
  //   .select('*')
  //   .eq('workspace_id', params.workspaceId);
  // if (params.role === 'representant') filter by assigned_to
  return [];
}

/**
 * TODO: Replace with Supabase
 * List appointments scoped to workspace and user role.
 */
export async function listAppointments(params: DataParams): Promise<Appointment[]> {
  // TODO: Replace with Supabase
  await new Promise((r) => setTimeout(r, 100));
  let results = [...INITIAL_APPOINTMENTS];
  if (params.role === "representant" && params.userId) {
    // Find the rep ID for this user — placeholder mapping
    const repId = SALES_REPS.find((r) => r.id === params.userId)?.id;
    if (repId) {
      results = results.filter((a) => a.repId === repId);
    }
  }
  return results;
}

/**
 * TODO: Replace with Supabase
 * List sales reps in the workspace.
 */
export async function listReps(params: { workspaceId: string }): Promise<SalesRep[]> {
  // TODO: Replace with Supabase
  await new Promise((r) => setTimeout(r, 50));
  return [...SALES_REPS];
}

/**
 * TODO: Replace with Supabase
 * Get a single client/appointment by ID.
 */
export async function getClientById(params: { workspaceId: string; clientId: string }): Promise<Appointment | null> {
  // TODO: Replace with Supabase
  return INITIAL_APPOINTMENTS.find((a) => a.id === params.clientId) ?? null;
}
