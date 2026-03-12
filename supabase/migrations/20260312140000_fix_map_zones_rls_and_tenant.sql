
-- Fix map_zones: add tenant_id column, replace permissive policies with
-- proper authenticated + tenant-scoped policies matching the appointments pattern,
-- and add explicit GRANT for the authenticated role.

-- 1. Add tenant_id column (existing rows get 'default')
ALTER TABLE public.map_zones
  ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';

-- 2. Drop old permissive policies
DROP POLICY IF EXISTS "Allow all access to map_zones" ON public.map_zones;
DROP POLICY IF EXISTS "Allow all access to map_zone_status_logs" ON public.map_zone_status_logs;

-- 3. Proper tenant-scoped policies for map_zones (matching appointments pattern)
CREATE POLICY "Users can read own tenant map zones"
  ON public.map_zones FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert map zones in own tenant"
  ON public.map_zones FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update map zones in own tenant"
  ON public.map_zones FOR UPDATE TO authenticated
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete map zones in own tenant"
  ON public.map_zones FOR DELETE TO authenticated
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );

-- 4. Status logs: all operations allowed if the parent zone belongs to the user's tenant
CREATE POLICY "Users can access own tenant zone logs"
  ON public.map_zone_status_logs FOR ALL TO authenticated
  USING (
    zone_id IN (
      SELECT id FROM public.map_zones
      WHERE tenant_id IN (
        SELECT p.tenant_id FROM public.profiles p WHERE p.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    zone_id IN (
      SELECT id FROM public.map_zones
      WHERE tenant_id IN (
        SELECT p.tenant_id FROM public.profiles p WHERE p.user_id = auth.uid()
      )
    )
  );

-- 5. Explicit table-level GRANTs for the authenticated role
--    (required in addition to RLS policies — missing grants caused the creation failure)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.map_zones TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.map_zone_status_logs TO authenticated;
