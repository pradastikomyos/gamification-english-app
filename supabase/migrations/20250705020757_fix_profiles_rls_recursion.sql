-- Drop the problematic policy
DROP POLICY IF EXISTS "Teachers/admins can manage profiles" ON public.profiles;

-- Recreate the policy using the safe get_user_role function
CREATE POLICY "Teachers/admins can manage profiles"
ON public.profiles FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = ANY (ARRAY['teacher', 'admin']::text[]))
WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['teacher', 'admin']::text[]));
