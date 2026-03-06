
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text DEFAULT '' NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email, tenant_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'tenant_id', 'default')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;
