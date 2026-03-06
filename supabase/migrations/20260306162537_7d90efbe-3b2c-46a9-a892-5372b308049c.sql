
-- Fix profiles RLS policies that still reference team_members
-- Replace with direct profiles-based checks

DROP POLICY IF EXISTS "Managers can update rep profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owners can update any profile" ON public.profiles;

-- Owners can update any profile (check role directly in profiles)
CREATE POLICY "Owners can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'owner'
    )
  );

-- Managers can update rep profiles
CREATE POLICY "Managers can update rep profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'manager'
    )
    AND role = 'rep'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'manager'
    )
    AND role = 'rep'
  );
