-- Drop the existing function to allow changing the return type and logic.
DROP FUNCTION IF EXISTS get_or_create_profile();

-- Recreate the function with the corrected logic.
CREATE OR REPLACE FUNCTION get_or_create_profile()
RETURNS json AS $$
DECLARE
  profile_data public.profiles;
  user_role TEXT;
  user_email TEXT;
  user_name TEXT;
  teacher_record public.teachers;
BEGIN
  -- Get the current user's ID
  SELECT * INTO profile_data FROM public.profiles WHERE id = auth.uid();

  -- If no profile exists, create one
  IF profile_data IS NULL THEN
    -- Get user metadata from auth.users
    SELECT raw_user_meta_data ->> 'role', email, raw_user_meta_data ->> 'name' 
    INTO user_role, user_email, user_name
    FROM auth.users WHERE id = auth.uid();

    -- Insert into public.profiles
    INSERT INTO public.profiles (id, role, name, email)
    VALUES (auth.uid(), user_role::user_role, user_name, user_email)
    RETURNING * INTO profile_data;
  END IF;

  -- NEW LOGIC: If the user is a teacher, ensure a record exists in the teachers table
  IF profile_data.role = 'teacher' THEN
    -- Check if a teacher record already exists for this user_id
    SELECT * INTO teacher_record FROM public.teachers WHERE user_id = auth.uid();

    -- If no teacher record exists, create one
    IF teacher_record IS NULL THEN
        -- Get email and name again in case the profile already existed
        SELECT email, raw_user_meta_data ->> 'name' 
        INTO user_email, user_name
        FROM auth.users WHERE id = auth.uid();

        INSERT INTO public.teachers (user_id, name, email)
        VALUES (auth.uid(), user_name, user_email);
    END IF;
  END IF;

  -- Return the profile data as a single JSON object
  RETURN row_to_json(profile_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
