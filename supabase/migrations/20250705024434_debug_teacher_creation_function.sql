DROP FUNCTION IF EXISTS get_or_create_profile();

CREATE OR REPLACE FUNCTION get_or_create_profile()
RETURNS TEXT AS $$
DECLARE
  profile_data public.profiles;
  user_role TEXT;
  user_email TEXT;
  user_name TEXT;
  teacher_record public.teachers;
  debug_message TEXT := 'START';
BEGIN
  SELECT * INTO profile_data FROM public.profiles WHERE id = auth.uid();
  debug_message := debug_message || ' | PROFILE_SELECTED';

  IF profile_data IS NULL THEN
    debug_message := debug_message || ' | PROFILE_IS_NULL';
    SELECT raw_user_meta_data ->> 'role', email, raw_user_meta_data ->> 'name' 
    INTO user_role, user_email, user_name
    FROM auth.users WHERE id = auth.uid();

    INSERT INTO public.profiles (id, role, name, email)
    VALUES (auth.uid(), user_role::user_role, user_name, user_email)
    RETURNING * INTO profile_data;
    debug_message := debug_message || ' | PROFILE_CREATED';
  END IF;

  IF profile_data.role = 'teacher' THEN
    debug_message := debug_message || ' | ROLE_IS_TEACHER';
    SELECT * INTO teacher_record FROM public.teachers WHERE user_id = auth.uid();

    IF teacher_record IS NULL THEN
        debug_message := debug_message || ' | TEACHER_IS_NULL';
        SELECT email, raw_user_meta_data ->> 'name' 
        INTO user_email, user_name
        FROM auth.users WHERE id = auth.uid();

        INSERT INTO public.teachers (user_id, name, email)
        VALUES (auth.uid(), user_name, user_email);
        debug_message := debug_message || ' | TEACHER_INSERTED';
    ELSE
        debug_message := debug_message || ' | TEACHER_EXISTS';
    END IF;
  ELSE
      debug_message := debug_message || ' | ROLE_IS_NOT_TEACHER';
  END IF;

  RETURN debug_message || ' | END';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
