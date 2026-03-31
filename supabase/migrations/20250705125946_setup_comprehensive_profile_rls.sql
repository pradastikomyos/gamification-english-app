-- Drop the policy I created before to ensure a clean slate
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;

-- 1. New, clearer policy: Authenticated users can read their own profile.
CREATE POLICY "Profiles are viewable by the user that owns it" 
ON public.profiles FOR SELECT
TO authenticated
USING ( auth.uid() = id );

-- 2. Good practice: Allow users to update their own profile.
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE
TO authenticated
USING ( auth.uid() = id );
