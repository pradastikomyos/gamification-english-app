DROP FUNCTION IF EXISTS public.admin_delete_student;

CREATE OR REPLACE FUNCTION public.admin_delete_student(p_student_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user_id from the students table using the profile_id
  SELECT user_id INTO v_user_id FROM public.students WHERE id = p_student_profile_id;

  -- Check if an associated auth user exists
  IF v_user_id IS NOT NULL THEN
    -- 1. Delete from user_roles first to satisfy the foreign key constraint
    DELETE FROM public.user_roles WHERE user_id = v_user_id;

    -- 2. Delete the student's profile from the public schema
    DELETE FROM public.students WHERE id = p_student_profile_id;

    -- 3. Finally, delete the user from the auth schema
    -- This requires elevated privileges, which SECURITY DEFINER provides.
    DELETE FROM auth.users WHERE id = v_user_id;
  ELSE
    -- If for some reason there's no auth user, just delete the profile
    DELETE FROM public.students WHERE id = p_student_profile_id;
  END IF;

END;
$$;
