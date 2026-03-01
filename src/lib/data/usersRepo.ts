/**
 * Users Repository — team members & reps.
 * Uses mock data when USE_MOCK is true; ready for Supabase queries.
 */

import type { SalesRep } from "@/domain/types";
import { USE_MOCK } from "./config";
import { MOCK_SALES_REPS } from "./mock-data";

export const usersRepo = {
  /**
   * List all reps in the workspace.
   * TODO: Replace mock branch with Supabase query.
   */
  async listReps(params: { workspaceId: string }): Promise<SalesRep[]> {
    if (!USE_MOCK) {
      // TODO: Supabase query
      return [];
    }
    await new Promise((r) => setTimeout(r, 50));
    return MOCK_SALES_REPS.map((r) => ({
      id: r.id,
      name: r.name,
      avatar: r.avatar,
      manager_id: r.managerId ?? null,
      zone: r.zone ?? null,
    }));
  },

  /**
   * Get a single user by ID.
   * TODO: Replace mock branch with Supabase query.
   */
  async getUser(params: { workspaceId: string; userId: string }): Promise<SalesRep | null> {
    if (!USE_MOCK) {
      // TODO: Supabase query
      return null;
    }
    const rep = MOCK_SALES_REPS.find((r) => r.id === params.userId);
    if (!rep) return null;
    return {
      id: rep.id,
      name: rep.name,
      avatar: rep.avatar,
      manager_id: rep.managerId ?? null,
      zone: rep.zone ?? null,
    };
  },
};
