CREATE POLICY "Allow teachers and admins to manage media" ON storage.objects FOR ALL
USING ( bucket_id = 'question_media' AND (get_user_role(auth.uid()) = 'teacher'::user_role OR get_user_role(auth.uid()) = 'admin'::user_role) )
WITH CHECK ( bucket_id = 'question_media' AND (get_user_role(auth.uid()) = 'teacher'::user_role OR get_user_role(auth.uid()) = 'admin'::user_role) );

CREATE POLICY "Allow public read access" ON storage.objects FOR SELECT
USING ( bucket_id = 'question_media' );
