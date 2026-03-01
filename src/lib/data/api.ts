// TODO: Replace with Supabase
// Data access layer — thin wrapper around repos for backward compatibility.
// All functions accept workspaceId for multi-tenancy.

import type { AppRole } from "@/lib/workspace/WorkspaceProvider";
import type { Appointment, HotCall, SalesRep } from "@/data/crm-data";
import { USE_MOCK } from "./config";
import { MOCK_APPOINTMENTS, MOCK_SALES_REPS } from "./mock-data";

interface DataParams {
  workspaceId: string;
  userId?: string;
  role?: AppRole;
}

/**
 * List hot calls scoped to workspace and user role.
 * TODO: Replace with Supabase query.
 */
export async function listHotCalls(params: DataParams): Promise<HotCall[]> {
  if (!USE_MOCK) {
    // TODO: Supabase query
    return [];
  }
  // Hot calls are managed by crm-store for now
  return [];
}

/**
 * List appointments scoped to workspace and user role.
 * TODO: Replace with Supabase query.
 */
export async function listAppointments(params: DataParams): Promise<Appointment[]> {
  if (!USE_MOCK) {
    // TODO: Supabase query
    return [];
  }
  await new Promise((r) => setTimeout(r, 100));
  let results = [...MOCK_APPOINTMENTS];
  if (params.role === "representant" && params.userId) {
    const repId = MOCK_SALES_REPS.find((r) => r.id === params.userId)?.id;
    if (repId) {
      results = results.filter((a) => a.repId === repId);
    }
  }
  return results;
}

/**
 * List sales reps in the workspace.
 * TODO: Replace with Supabase query.
 */
export async function listReps(params: { workspaceId: string }): Promise<SalesRep[]> {
  if (!USE_MOCK) {
    // TODO: Supabase query
    return [];
  }
  await new Promise((r) => setTimeout(r, 50));
  return [...MOCK_SALES_REPS];
}

/**
 * Get a single client/appointment by ID.
 * TODO: Replace with Supabase query.
 */
export async function getClientById(params: { workspaceId: string; clientId: string }): Promise<Appointment | null> {
  if (!USE_MOCK) {
    // TODO: Supabase query
    return null;
  }
  return MOCK_APPOINTMENTS.find((a) => a.id === params.clientId) ?? null;
}
