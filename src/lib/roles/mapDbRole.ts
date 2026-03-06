import type { AppRole } from "@/lib/workspace/WorkspaceProvider";

/**
 * Single source of truth for mapping DB roles to frontend AppRole.
 * DB stores: owner | manager | rep
 * Frontend uses: proprietaire | gestionnaire | representant
 *
 * Returns null for unknown/missing roles — callers must handle this.
 */
export function mapDbRole(dbRole: string | null | undefined): AppRole | null {
  switch (dbRole) {
    case "owner":
    case "proprietaire":
      return "proprietaire";
    case "manager":
    case "gestionnaire":
      return "gestionnaire";
    case "rep":
    case "representant":
      return "representant";
    default:
      return null;
  }
}

/**
 * Map frontend AppRole back to DB role for inserts/updates.
 */
export function mapAppRoleToDb(appRole: AppRole): string {
  switch (appRole) {
    case "proprietaire":
      return "owner";
    case "gestionnaire":
      return "manager";
    case "representant":
      return "rep";
  }
}
