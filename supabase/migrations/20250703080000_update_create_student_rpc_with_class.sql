-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS create_student_user(p_name text, p_email text, p_student_id text);

-- Create the updated function with class_id
CREATE OR REPLACE FUNCTION create_student_user(
  p_name TEXT,
  p_email TEXT,
  p_student_id TEXT,
  p_class_id UUID
)
RETURNS TABLE (id uuid, name text, email text, student_id text, temporary_password text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
  temp_password TEXT;
  encrypted_password TEXT;
  student_profile_id uuid;
BEGIN
  -- Generate a more secure temporary password
  temp_password := substr(md5(random()::text), 0, 9);

  -- Create the user in auth.users
  new_user_id := auth.uid() FROM auth.users WHERE auth.users.email = p_email;

  IF new_user_id IS NULL THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_sent_at, confirmed_at)
    VALUES (current_setting('app.instance_id')::uuid, uuid_generate_v4(), 'authenticated', 'authenticated', p_email, crypt(temp_password, gen_salt('bf')), now(), '', '1970-01-01', '1970-01-01', jsonb_build_object('provider', 'email', 'providers', '["email"]'), jsonb_build_object('name', p_name, 'requires_password_change', true), now(), now(), '', '', '1970-01-01', now())
    RETURNING id INTO new_user_id;
  END IF;

  -- Insert into the public students table and get the new profile id
  INSERT INTO public.students (user_id, name, email, student_id, class_id)
  VALUES (new_user_id, p_name, p_email, p_student_id, p_class_id)
  RETURNING id INTO student_profile_id;

  -- Return the details including the temporary password
  RETURN QUERY
  SELECT u.id, s.name, s.email, s.student_id, temp_password
  FROM auth.users u
  JOIN public.students s ON u.id = s.user_id
  WHERE u.id = new_user_id;
END;
$$;
