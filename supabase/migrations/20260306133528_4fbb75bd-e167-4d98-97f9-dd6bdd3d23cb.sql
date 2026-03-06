
DROP FUNCTION IF EXISTS public.get_user_role(text);

CREATE FUNCTION public.get_user_role(p_tenant_id text DEFAULT 'default'::text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles
  WHERE user_id = auth.uid() AND tenant_id = p_tenant_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, tenant_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'tenant_id', 'default')
  );
  RETURN NEW;
END;
$$;
