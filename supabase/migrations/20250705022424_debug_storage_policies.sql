-- Temporarily disable all storage policies for debugging
DROP POLICY IF EXISTS "authenticated_users_can_upload_question_media" ON storage.objects;
DROP POLICY IF EXISTS "public_read_question_media" ON storage.objects;
DROP POLICY IF EXISTS "teachers_can_manage_question_media" ON storage.objects;

-- Create a very permissive policy for testing
CREATE POLICY "temp_allow_all_authenticated_uploads" ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'question-media')
WITH CHECK (bucket_id = 'question-media');

-- Also allow public access for reading
CREATE POLICY "temp_allow_public_read" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'question-media');

-- Check if RLS is enabled on storage.objects
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';
