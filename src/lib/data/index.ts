/**
 * Data layer barrel export.
 * Import repos from @/lib/data
 */
export { authRepo } from "./authRepo";
export { usersRepo } from "./usersRepo";
export { appointmentsRepo } from "./appointmentsRepo";
export { clientsRepo } from "./clientsRepo";
export { hotCallsRepo } from "./hotCallsRepo";
export { marketingRepo } from "./marketingRepo";
export { territoriesRepo } from "./territoriesRepo";
export { activityRepo } from "./activityRepo";

// Keep legacy api.ts exports for backward compatibility
export { listHotCalls, listAppointments, listReps, getClientById } from "./api";
