/**
 * Territories Repository.
 * Partially wired to Supabase already (see useMapZones.ts).
 *
 * Supabase shape:
 *   list → supabase.from('map_zones').select('*').eq('workspace_id', wsId)
 *   createPolygon → insert into map_zones
 *   updatePolygon → update map_zones
 *   deletePolygon → delete from map_zones
 */

import type { TerritoryPolygon } from "@/domain/types";

export const territoriesRepo = {
  /**
   * TODO: Replace with Supabase (already done in useMapZones.ts)
   */
  async list(params: { workspaceId: string }): Promise<TerritoryPolygon[]> {
    // Currently handled by useMapZonesQuery()
    return [];
  },

  /**
   * TODO: Replace with Supabase
   */
  async createPolygon(params: {
    workspaceId: string;
    payload: Omit<TerritoryPolygon, "id" | "created_at" | "updated_at">;
  }): Promise<TerritoryPolygon> {
    // TODO: Replace with Supabase insert
    return {
      ...params.payload,
      id: `zone${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as TerritoryPolygon;
  },

  /**
   * TODO: Replace with Supabase
   */
  async updatePolygon(params: {
    zoneId: string;
    payload: Partial<TerritoryPolygon>;
  }): Promise<void> {
    // TODO: Replace with Supabase
  },

  /**
   * TODO: Replace with Supabase
   */
  async deletePolygon(params: { zoneId: string }): Promise<void> {
    // TODO: Replace with Supabase
  },
};
