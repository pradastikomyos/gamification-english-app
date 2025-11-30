-- Drop the incorrect policies from the previous migration
DROP POLICY IF EXISTS "Allow teachers and admins to manage media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;

-- Recreate the policies with the correct bucket name 'question-media'
CREATE POLICY "Allow teachers and admins to manage media" ON storage.objects FOR ALL
USING ( bucket_id = 'question-media' AND (get_user_role(auth.uid()) = 'teacher'::user_role OR get_user_role(auth.uid()) = 'admin'::user_role) )
WITH CHECK ( bucket_id = 'question-media' AND (get_user_role(auth.uid()) = 'teacher'::user_role OR get_user_role(auth.uid()) = 'admin'::user_role) );

CREATE POLICY "Allow public read access" ON storage.objects FOR SELECT
USING ( bucket_id = 'question-media' );
