BEGIN;

-- Step 1: Drop the dependent policies
DROP POLICY IF EXISTS "Admins can insert user roles." ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update user roles." ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles." ON public.user_roles;

-- Step 2: Drop the existing function
DROP FUNCTION IF EXISTS public.get_user_role(p_user_id uuid);

-- Step 3: Recreate the function with the fix
CREATE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL role = 'service_role';
  RETURN (SELECT role FROM public.profiles WHERE user_id = p_user_id);
  RESET role;
END;
$$;

-- Step 4: Recreate the policies exactly as they were
CREATE POLICY "Admins can insert user roles." ON public.user_roles FOR INSERT TO authenticated WITH CHECK ((get_user_role(auth.uid()) = 'admin'::text));
CREATE POLICY "Admins can update user roles." ON public.user_roles FOR UPDATE TO authenticated USING ((get_user_role(auth.uid()) = 'admin'::text)) WITH CHECK ((get_user_role(auth.uid()) = 'admin'::text));
CREATE POLICY "Admins can delete user roles." ON public.user_roles FOR DELETE TO authenticated USING ((get_user_role(auth.uid()) = 'admin'::text));

COMMIT;
