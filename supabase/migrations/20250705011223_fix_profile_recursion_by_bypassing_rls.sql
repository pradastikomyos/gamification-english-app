-- Step 1: Drop the old, faulty function that causes recursion.
DROP FUNCTION IF EXISTS public.get_or_create_profile();

-- Step 2: Create the new, correct function that explicitly bypasses RLS to prevent loops.
CREATE OR REPLACE FUNCTION public.get_or_create_profile()
RETURNS profiles -- Returns a single, complete 'profiles' record.
LANGUAGE plpgsql
SECURITY DEFINER
-- Set a specific, safe search path.
SET search_path = public
AS $$
DECLARE
    profile_record profiles;
    caller_uid uuid := auth.uid();
BEGIN
    -- This is the critical fix: execute the function's logic with RLS temporarily bypassed
    -- for the superuser running the function. This breaks the recursion loop.
    SET LOCAL rls.bypass_rls = on;

    -- Attempt to select the user's profile directly into the record variable.
    SELECT * INTO profile_record FROM public.profiles WHERE id = caller_uid;

    -- If the record is not found, create it.
    IF profile_record IS NULL THEN
        -- Insert the new profile and use RETURNING * to capture the new row into our variable.
        INSERT INTO public.profiles (id, role)
        VALUES (caller_uid, COALESCE(auth.jwt()->'user_metadata'->>'role', 'student'))
        RETURNING * INTO profile_record;
    END IF;

    -- The function will now return the correct record.
    RETURN profile_record;
END;
$$;

-- Step 3: Grant permission for authenticated users to execute this function.
GRANT EXECUTE ON FUNCTION public.get_or_create_profile() TO authenticated;
