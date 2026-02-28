# Next Steps — Supabase Migration Checklist

## 1. Tables to Create

### Priority 1 — Auth & Team
```sql
-- profiles (auto-created on signup)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- workspaces
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- workspace_members (roles stored here, NOT on profiles)
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('proprietaire', 'gestionnaire', 'representant')),
  manager_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);
```

### Priority 2 — Appointments
```sql
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  origin TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  rep_id UUID REFERENCES auth.users(id),
  pre_qual_1 TEXT DEFAULT '',
  pre_qual_2 TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  source TEXT,
  sms_scheduled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Status change log
CREATE TABLE public.appointment_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id) NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT now()
);
```

### Priority 3 — Notes (generic)
```sql
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) NOT NULL,
  entity_type TEXT NOT NULL, -- 'appointment', 'hot_call', 'marketing_lead'
  entity_id UUID NOT NULL,
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Priority 4 — Activity Log
```sql
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Already Existing Tables (need workspace_id column added)
- `hot_calls` — add `workspace_id`
- `hot_call_notes` — OK as-is
- `marketing_leads` — add `workspace_id`
- `map_zones` — add `workspace_id`
- `map_zone_status_logs` — OK as-is
- `client_photos` — add `workspace_id`

---

## 2. RLS Policies Needed

### Pattern: Workspace-scoped access
```sql
-- Security definer function to check workspace membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  )
$$;

-- Security definer function to check role
CREATE OR REPLACE FUNCTION public.get_workspace_role(_user_id UUID, _workspace_id UUID)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.workspace_members
  WHERE user_id = _user_id AND workspace_id = _workspace_id
  LIMIT 1
$$;
```

### Per-table RLS:
- **appointments**: workspace members can SELECT; reps filtered by `rep_id = auth.uid()`; owner/manager can INSERT/UPDATE/DELETE
- **hot_calls**: workspace members can SELECT; claim/release requires matching user_id; owner/manager can reassign
- **marketing_leads**: workspace members can SELECT; owner/manager can INSERT/UPDATE/DELETE
- **map_zones**: workspace members can SELECT; owner/manager can INSERT/UPDATE/DELETE
- **notes**: workspace members can SELECT; author can INSERT; owner/manager can DELETE
- **profiles**: users can read all in workspace; users can update own profile only

---

## 3. Repo Functions to Replace First (Priority Order)

1. **`authRepo.signIn()`** → `supabase.auth.signInWithPassword()`
2. **`authRepo.signOut()`** → `supabase.auth.signOut()`
3. **`authRepo.onAuthStateChange()`** → `supabase.auth.onAuthStateChange()`
4. **`useBootstrap.fetchMembership()`** → query `workspace_members` table
5. **`usersRepo.listReps()`** → query `profiles` + `workspace_members`
6. **`appointmentsRepo.list()`** → query `appointments` table (replace Zustand)
7. **`appointmentsRepo.create()`** → insert into `appointments`
8. **`appointmentsRepo.updateStatus()`** → update + log
9. Remove Zustand `useCrm` store for appointments (keep for local UI state only)

---

## 4. Migration Sequence

### Phase 1 — Auth (Week 1)
1. Create `profiles` + `workspaces` + `workspace_members` tables
2. Replace `authRepo` with real Supabase Auth
3. Replace `useBootstrap` with real workspace query
4. Test login → dashboard flow

### Phase 2 — Appointments (Week 2)
1. Create `appointments` + `appointment_status_log` tables
2. Replace Zustand appointment state with Supabase queries
3. Wire all pages: Dashboard, Calendar, Appointments, FicheClient, AddAppointment
4. Create notes table, wire FicheClient

### Phase 3 — Existing Tables (Week 3)
1. Add `workspace_id` to `hot_calls`, `marketing_leads`, `map_zones`, `client_photos`
2. Fix RLS policies (currently all `true` — CRITICAL SECURITY)
3. Wire `currentRepId` to real user IDs

### Phase 4 — Automations (Week 4)
1. Wire n8n triggers: appointment creation, status changes, cancelled → hot call
2. Auto status rules: 10h at-risk, 2h post-time cancelled
3. Facebook webhook → marketing_leads (already exists, needs workspace_id)

---

## 5. Security Priorities (CRITICAL)

Current state: **ALL tables have `true` RLS policies** — any authenticated user can read/write everything.

Fix immediately when connecting real auth:
1. Replace all `USING (true)` policies with workspace-scoped policies
2. Add `workspace_id` to all tables
3. Create `has_role()` and `is_workspace_member()` security definer functions
4. Test with rep role to ensure they cannot see other reps' data
