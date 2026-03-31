-- Function to ensure a user profile exists, creating it if it doesn't.
CREATE OR REPLACE FUNCTION public.ensure_user_profile_exists()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid := auth.uid();
  user_role TEXT;
  profile_exists BOOLEAN;
BEGIN
  -- Check if a profile already exists for the current user
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) INTO profile_exists;

  -- If no profile exists, create one
  IF NOT profile_exists THEN
    -- Determine the role from the user's metadata, default to 'student'
    user_role := COALESCE(auth.jwt()->>'user_role', 'student'); -- Assuming role is stored in JWT claims

    -- Insert the new profile
    INSERT INTO public.profiles (id, role)
    VALUES (user_id, user_role);
  END IF;

  RETURN user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_user_profile_exists() TO authenticated;
