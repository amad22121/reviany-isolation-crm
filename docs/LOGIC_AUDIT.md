# Logic Audit Report

Generated: 2026-02-28

---

## 1) Auth/Login + Team Structure

### Current Behavior
- Placeholder auth in `authClient.ts` accepts any email + password ≥ 6 chars.
- Session stored in localStorage. No real auth provider.
- `AuthProvider` + `ProtectedRoute` wrap all routes.
- Forgot password shows a placeholder modal.

### Intended Behavior
- Supabase Auth with email/password sign-in.
- Session managed by Supabase SDK with auto-refresh.
- Password reset via Supabase email flow.

### Problems Found
- **P1**: No real validation — any credentials work. ✅ Expected for placeholder.
- **P2**: `useAuthCompat.ts` bridges old Zustand `useAuth` to new context — works but adds indirection.
- **P3**: No signup flow — needed when Supabase is connected.

### Fixes Applied
- ✅ Auth architecture is clean and ready for Supabase swap.
- ✅ `authRepo.ts` created in data layer with exact Supabase query shapes in comments.

### Remaining TODOs
- [ ] Replace `authRepo.signIn()` with `supabase.auth.signInWithPassword()`
- [ ] Replace `authRepo.signOut()` with `supabase.auth.signOut()`
- [ ] Add `supabase.auth.onAuthStateChange()` listener
- [ ] Create `profiles` table + auto-create trigger on signup
- [ ] Create `workspace_members` table for role assignment
- [ ] Implement real password reset flow with `/reset-password` page

---

## 2) Roles & Permissions

### Current Behavior
- Three roles: `proprietaire`, `gestionnaire`, `representant`.
- `can(role, action)` helper in `src/lib/permissions/can.ts`.
- Dev panel allows role switching for testing.
- Status change permissions defined per role in `AppointmentsPage.tsx`.

### Intended Behavior
- Same three roles, stored in `workspace_members` table.
- Permissions enforced both in UI (guards) and backend (RLS).

### Problems Found
- **P1**: `can()` helper exists but is NOT used in most pages. Pages use inline `role ===` checks.
- **P2**: Rep role still allows seeing all appointments in some views (e.g., LeaderboardPage shows all reps' data).
- **P3**: UserManagementPage has no route guard — any role can access `/users`.
- **P4**: Status permissions in `AppointmentsPage` are inline, not using `can()`.

### Fixes Applied
- ✅ Domain enums created for roles in `src/domain/enums.ts`.
- ✅ `can()` helper exists with proper action mapping.

### Remaining TODOs
- [ ] Add route guard: `/users` accessible only by `proprietaire`
- [ ] Replace all inline `role ===` checks with `can(role, action)` calls
- [ ] Enforce data scoping in all pages for reps (filter by rep_id)
- [ ] Create `user_roles` table in Supabase with RLS
- [ ] Create `has_role()` security definer function for RLS policies

---

## 3) Dashboard "Ma vue"

### Current Behavior
- Owner/Manager: `DashboardPage` with daily KPIs, objectives, period performance, rep table, recent RDV.
- Rep: `RepViewPage` with personal objectives, weekly stats, "Horaire du jour" table.
- Daily schedule shows: time, client, phone, address (Google Maps link), status badge, notes.

### Intended Behavior
- Same layout. Data fetched from repos, scoped by workspace + role.

### Problems Found
- **P1**: Dashboard reads directly from Zustand store (`useCrm`) — not from data layer.
- **P2**: `SALES_REPS` imported directly from static data — should come from `usersRepo`.
- **P3**: RepViewPage `teamTodayAppts` counts ALL appointments (no workspace filter).

### Fixes Applied
- ✅ Data layer repos created for future migration.

### Remaining TODOs
- [ ] Migrate `DashboardPage` to use `appointmentsRepo.list()` instead of `useCrm().appointments`
- [ ] Migrate `RepViewPage` similarly
- [ ] Replace `SALES_REPS` imports with `usersRepo.listReps()`
- [ ] Add workspace_id filtering

---

## 4) Appointments Pipeline

### Current Behavior
- `AppointmentsPage` shows all non-Backlog appointments.
- Status change via dropdown with role-based restrictions.
- Notes editable inline.
- Click client name opens `FicheClient` modal.
- Sorted by display order (no explicit sort on date).

### Intended Behavior
- Same pipeline with consistent `AppointmentStatus` enum.
- Status changes logged with timestamp + user.
- Newest appointments first.

### Problems Found
- **P1**: Uses French string literals ("En attente", "Confirmé") — should use enum constants.
- **P2**: No explicit sort by date — appointments appear in insertion order.
- **P3**: `Backlog` status mixed into same type as regular statuses — should be a separate entity or flag.
- **P4**: Status log records `userId` as role string ("proprietaire") not actual user ID.

### Fixes Applied
- ✅ Domain `AppointmentStatus` enum created with legacy mapping functions.
- ✅ `appointmentsRepo` created with proper function signatures.

### Remaining TODOs
- [ ] Add `.sort((a, b) => ...)` for newest-first in appointments list
- [ ] Replace string literals with enum imports
- [ ] Fix statusLog to record actual user ID instead of role string
- [ ] Create `appointments` table in Supabase
- [ ] Separate Backlog into its own table or use status flag with clear separation

---

## 5) Client Profile (Fiche Client)

### Current Behavior
- Modal dialog showing: name, phone, date, time, rep, origin, address (Google Maps), prequalification, notes (editable), status (editable with role guard), photos, status change history, call history (from hot calls).
- Delete button visible for owner/manager.

### Intended Behavior
- Same layout. Notes system with chronological history.

### Problems Found
- **P1**: Notes are a single string field, not a chronological log. Only latest note shown.
- **P2**: Status change triggers `moveAppointmentToHotCalls()` on "Annulé" — side effect buried in UI component.
- **P3**: Photos section uses Supabase storage directly (partially wired).

### Fixes Applied
- ✅ `clientsRepo.addNote()` signature created for future note history.
- ✅ `Note` type defined in domain.

### Remaining TODOs
- [ ] Create `notes` table in Supabase for chronological note history
- [ ] Replace single `notes` string with notes list
- [ ] Move "Annulé → Hot Calls" logic to backend (DB trigger or n8n automation)
- [ ] Wire photos to use `clientsRepo` pattern

---

## 6) New Appointment Form

### Current Behavior
- Single form with: full name, phone, address, city (with chips), date, time, rep selector, origin, preQual Q1/Q2, notes.
- Two actions: "Créer le rendez-vous" + "Ajouter à la liste (backlog)".
- Backlog conversion: loads from URL param `?backlog=id`.

### Intended Behavior
- Same form. Create triggers n8n automation (TODO).

### Problems Found
- **P1**: `addAppointment()` from Zustand generates ID client-side — should be DB-generated UUID.
- **P2**: Rep selector shows static `SALES_REPS` — should come from `usersRepo`.
- **P3**: Backlog conversion calls `useCrm.getState()` directly — anti-pattern.

### Fixes Applied
- ✅ `appointmentsRepo.create()` signature ready for Supabase.

### Remaining TODOs
- [ ] Migrate to use `appointmentsRepo.create()` instead of Zustand `addAppointment()`
- [ ] Replace `SALES_REPS` with dynamic rep list
- [ ] Add n8n webhook trigger on appointment creation
- [ ] Fix backlog conversion to use proper repo pattern

---

## 7) Hot Calls Module

### Current Behavior
- **Already partially wired to Supabase** via `useHotCalls.ts`.
- Pool view (unassigned/expired locks), "Mes Hot Calls" (claimed by current rep), "Tous" (manager view).
- Claim & Lock: 30-min lock, auto-extend on action.
- Post-call popup: feedback, note, follow-up date.
- Attempts counter (+/-), tags, reassignment (manager), rebook.

### Intended Behavior
- Same behavior. Fully Supabase-backed.

### Problems Found
- **P1**: `currentRepId` from `useAuth()` may be placeholder value — needs real user ID mapping.
- **P2**: Zustand store still has parallel hot call management (`useCrm().hotCalls`) — dual source of truth.
- **P3**: `hotCallToAppointment()` creates a fake Appointment for FicheClient — fragile bridge.
- **P4**: Delete operation has no soft-delete — permanently removes data.
- **P5**: Lock expiry checked client-side only — no server-side cron to release expired locks.

### Fixes Applied
- ✅ `hotCallsRepo` created mirroring existing Supabase hooks.
- ✅ Domain types align with DB schema.

### Remaining TODOs
- [ ] Remove Zustand hot call state — use only Supabase via hooks
- [ ] Add server-side lock expiry (DB function or scheduled edge function)
- [ ] Map `currentRepId` to real Supabase user ID
- [ ] Consider soft-delete pattern
- [ ] Fix RLS policies (currently `true` — insecure)

---

## 8) Calendar

### Current Behavior
- Day/Week/Month views. Day view is a real hourly grid (07:00-20:00).
- Status filters (chips), rep filter dropdown.
- "Itinéraire Google Maps" button in day view for confirmed appointments.
- KPIs at top: total, confirmed, at risk, closing rate.

### Intended Behavior
- Same. Owner/Manager sees all, rep sees only theirs.

### Problems Found
- **P1**: Reads from Zustand `useCrm().appointments` — not from repos.
- **P2**: Closing rate calculation includes "Confirmé" as closed — should only count "Closed".
- **P3**: Status colors use inline hardcoded values — could use centralized theme tokens.

### Fixes Applied
- ✅ Calendar views functional with proper filtering.

### Remaining TODOs
- [ ] Migrate to use `appointmentsRepo.list()` with date range filters
- [ ] Fix closing rate: `closedCount / totalCompletedCount * 100`
- [ ] Ensure rep view auto-filters (no "all" option for reps)

---

## 9) Territories

### Current Behavior
- Leaflet map with polygon drawing, zone list, status management.
- **Already wired to Supabase** via `useMapZones.ts`.
- Geocoding address search added (Nominatim).
- Red "Annuler dessin" button removed.

### Intended Behavior
- Same. View-only for reps (unless current UI allows edits).

### Problems Found
- **P1**: No role guard — reps can create/edit/delete zones.
- **P2**: RLS policy is `true` — no workspace or user scoping.

### Fixes Applied
- ✅ `territoriesRepo` created.
- ✅ Address search functional.

### Remaining TODOs
- [ ] Add role guards: reps view-only, owner/manager can edit
- [ ] Fix RLS policies to scope by workspace_id
- [ ] Add workspace_id column to map_zones table

---

## 10) Marketing Leads

### Current Behavior
- **Already wired to Supabase** via `useMarketingLeads.ts`.
- CRUD with status pipeline, rep assignment, attempts tracking.
- "Appointment Booked" status triggers appointment creation.
- KPI cards at top.

### Intended Behavior
- Same. FB webhook creates leads, pipeline tracks to conversion.

### Problems Found
- **P1**: `handleBookAppointment()` creates appointment in Zustand AND updates lead in Supabase — mixed data stores.
- **P2**: `created_by_user_id` set to role string, not actual user ID.
- **P3**: RLS policy is `true` — insecure.
- **P4**: Status values use English strings — should use `MarketingLeadStatus` enum.

### Fixes Applied
- ✅ `marketingRepo` created with `convertToAppointment()` signature.
- ✅ Domain `MarketingLeadStatus` enum with legacy mapping.

### Remaining TODOs
- [ ] Migrate appointment creation to Supabase (not Zustand)
- [ ] Fix `created_by_user_id` to use real user ID
- [ ] Fix RLS policies
- [ ] Wire `convertToAppointment()` as DB transaction or n8n automation

---

## 11) Backlog

### Current Behavior
- Filters appointments with `status === "Backlog"`.
- Rep sees only their backlog items.
- "Convertir" button navigates to AddAppointmentPage with `?backlog=id`.
- Delete available for owner/manager.

### Intended Behavior
- Same. Backlog is a staging area for incomplete leads.

### Problems Found
- **P1**: Backlog uses same Appointment type/table — should ideally be a flag or separate table.
- **P2**: Reads from Zustand.

### Fixes Applied
- ✅ Acknowledged in domain types — Backlog could be a status or separate entity.

### Remaining TODOs
- [ ] Decide: Backlog as appointment status or separate `backlog` table
- [ ] Migrate to repo pattern
- [ ] Add workspace_id scoping

---

## 12) Classement + Stats/KPIs

### Current Behavior
- **LeaderboardPage**: Daily/Weekly/Monthly/All-time ranking by booked + confirmed count per rep.
- **StatisticsPage**: Date range filters, KPI cards, status chart, rep performance table, leads performance, detailed appointment table.

### Intended Behavior
- Same UI. KPI definitions standardized.

### KPI Definitions (TODO — implement consistently):
- **Created appointments**: count of appointments in period
- **Confirmed**: count where status = confirmed OR closed
- **At risk**: count where status = at_risk
- **Cancelled**: count where status = cancelled
- **Closed (sales)**: count where status = closed
- **Confirmation rate**: (confirmed + closed) / total * 100
- **Closing rate**: closed / (closed + cancelled) * 100
- **Avg attempts**: sum(attempts) / count(hot_calls)
- **Total rebooks**: count of rebook events (from activity log)
- **Performance by rep**: same metrics grouped by rep_id

### Problems Found
- **P1**: Confirmation rate inconsistently includes "Closed" in some places, not others.
- **P2**: Closing rate in Calendar includes "Confirmé" as closed — incorrect.
- **P3**: Stats read from Zustand — should use repos.
- **P4**: LeaderboardPage uses static `DAILY_GOAL` calculation — fragile.

### Fixes Applied
- ✅ KPI definitions documented above.

### Remaining TODOs
- [ ] Standardize KPI calculations across all pages using formulas above
- [ ] Migrate to repo pattern for data fetching
- [ ] Create Supabase views or functions for aggregated stats
- [ ] Fix closing rate calculation everywhere
