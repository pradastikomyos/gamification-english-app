-- Drop the policy that uses a subquery, which is causing recursion.
DROP POLICY IF EXISTS "Teachers and admins can upload question media" ON storage.objects;

-- Recreate the policy using the get_user_role() function, which is hardened against RLS recursion.
CREATE POLICY "Teachers and admins can upload question media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'question-media' AND get_user_role(auth.uid()) = ANY (ARRAY['teacher', 'admin']));
