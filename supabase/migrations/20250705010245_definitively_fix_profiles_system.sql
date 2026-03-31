-- Step 1: Drop the existing function to ensure it's recreated against the current table schema.
DROP FUNCTION IF EXISTS public.ensure_user_profile_exists();

-- Step 2: Recreate the function to ensure a user profile exists.
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
    -- Get role from JWT user_metadata, default to 'student'. This is the correct way to access it.
    user_role := COALESCE(auth.jwt()->'user_metadata'->>'role', 'student');

    -- Insert the new profile
    INSERT INTO public.profiles (id, role)
    VALUES (user_id, user_role);
  END IF;

  RETURN user_id;
END;
$$;

-- Step 3: Grant execute permission on the function.
GRANT EXECUTE ON FUNCTION public.ensure_user_profile_exists() TO authenticated;

-- Step 4: Drop ALL potentially conflicting RLS policies on the profiles table for a clean slate.
DROP POLICY IF EXISTS "Profiles are viewable by the user that owns it" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Step 5: Re-create the definitive RLS policies.
CREATE POLICY "Profiles are viewable by the user that owns it"
ON public.profiles FOR SELECT
TO authenticated
USING ( auth.uid() = id );

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING ( auth.uid() = id );
