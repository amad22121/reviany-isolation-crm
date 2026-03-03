
-- Profiles table linked to auth.users
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  phone text DEFAULT NULL,
  avatar_url text DEFAULT NULL,
  role text NOT NULL DEFAULT 'representant' CHECK (role IN ('proprietaire', 'gestionnaire', 'representant')),
  disabled_at timestamp with time zone DEFAULT NULL,
  invited_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read profiles in their team
CREATE POLICY "Authenticated users can read profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- Users can update their own profile (name, phone, avatar)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only service_role inserts profiles (via edge function)
-- No insert policy for regular users

-- Team members table for workspace membership
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL DEFAULT 'default',
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'representant' CHECK (role IN ('proprietaire', 'gestionnaire', 'representant')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read team members in their workspace
CREATE POLICY "Authenticated users can read team members"
  ON public.team_members FOR SELECT TO authenticated
  USING (
    workspace_id IN (
      SELECT tm.workspace_id FROM public.team_members tm WHERE tm.user_id = auth.uid()
    )
  );

-- Function to get current user's role in a workspace
CREATE OR REPLACE FUNCTION public.get_user_role(p_workspace_id text DEFAULT 'default')
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.team_members
  WHERE user_id = auth.uid() AND workspace_id = p_workspace_id
  LIMIT 1;
$$;

-- Policy for owners to manage profiles (disable/enable)
CREATE POLICY "Owners can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = auth.uid() AND tm.role = 'proprietaire'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = auth.uid() AND tm.role = 'proprietaire'
    )
  );

-- Policy for managers to update rep profiles only
CREATE POLICY "Managers can update rep profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = auth.uid() AND tm.role = 'gestionnaire'
    )
    AND role = 'representant'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = auth.uid() AND tm.role = 'gestionnaire'
    )
    AND role = 'representant'
  );

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
