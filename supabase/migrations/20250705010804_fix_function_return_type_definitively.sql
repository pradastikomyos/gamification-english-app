-- Step 1: Drop the old, faulty function that returns a SETOF/TABLE.
DROP FUNCTION IF EXISTS public.get_or_create_profile();

-- Step 2: Create the new, correct function that returns a single composite record.
CREATE OR REPLACE FUNCTION public.get_or_create_profile()
RETURNS profiles -- This tells PostgreSQL to return a single, complete 'profiles' record.
LANGUAGE plpgsql
AS $$
DECLARE
    profile_record profiles;
BEGIN
    -- Attempt to select the user's profile directly into the record variable.
    SELECT * INTO profile_record FROM public.profiles WHERE id = auth.uid();

    -- If the record is not found (the variable is NULL), then we create it.
    IF profile_record IS NULL THEN
        -- Insert the new profile and use RETURNING * to capture the new row into our variable.
        INSERT INTO public.profiles (id, role)
        VALUES (auth.uid(), COALESCE(auth.jwt()->'user_metadata'->>'role', 'student'))
        RETURNING * INTO profile_record;
    END IF;

    -- Return the record. It is now guaranteed to exist and be correctly typed.
    RETURN profile_record;
END;
$$;

-- Step 3: Grant permission for authenticated users to execute this function.
GRANT EXECUTE ON FUNCTION public.get_or_create_profile() TO authenticated;
