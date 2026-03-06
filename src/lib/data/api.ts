/**
 * Data access layer — thin wrapper around repos.
 * All functions accept workspaceId for multi-tenancy.
 * Mock data removed — ready for Supabase queries.
 */

import type { AppRole } from "@/lib/workspace/WorkspaceProvider";
import type { Appointment, HotCall, SalesRep } from "@/data/crm-data";

interface DataParams {
  workspaceId: string;
  userId?: string;
  role?: AppRole;
}

/** List hot calls scoped to workspace and user role. */
export async function listHotCalls(params: DataParams): Promise<HotCall[]> {
  // TODO: Supabase query
  return [];
}

/** List appointments scoped to workspace and user role. */
export async function listAppointments(params: DataParams): Promise<Appointment[]> {
  // TODO: Supabase query
  return [];
}

/** List sales reps in the workspace. */
export async function listReps(params: { workspaceId: string }): Promise<SalesRep[]> {
  // TODO: Supabase query
  return [];
}

/** Get a single client/appointment by ID. */
export async function getClientById(params: { workspaceId: string; clientId: string }): Promise<Appointment | null> {
  // TODO: Supabase query
  return null;
}
