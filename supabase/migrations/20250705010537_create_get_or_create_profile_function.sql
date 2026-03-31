-- First, drop the old, ineffective function
DROP FUNCTION IF EXISTS public.ensure_user_profile_exists();

-- Create the new, robust "get or create" function
CREATE OR REPLACE FUNCTION public.get_or_create_profile()
RETURNS TABLE(id uuid, role text) -- Returns a table with the profile data
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id uuid := auth.uid();
    current_user_role text;
BEGIN
    -- Attempt to get the role from an existing profile
    SELECT p.role INTO current_user_role FROM public.profiles p WHERE p.id = current_user_id;

    -- If profile doesn't exist (role is null), create it
    IF current_user_role IS NULL THEN
        -- Get role from JWT, default to 'student'
        current_user_role := COALESCE(auth.jwt()->'user_metadata'->>'role', 'student');
        
        -- Insert the new profile
        INSERT INTO public.profiles (id, role)
        VALUES (current_user_id, current_user_role);
    END IF;

    -- Return the profile data, which is now guaranteed to exist
    RETURN QUERY SELECT p.id, p.role FROM public.profiles p WHERE p.id = current_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_or_create_profile() TO authenticated;
