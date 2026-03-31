-- Drop temp policies
DROP POLICY IF EXISTS "temp_allow_all_authenticated_uploads" ON storage.objects;
DROP POLICY IF EXISTS "temp_allow_public_read" ON storage.objects;

-- Create very simple policies
CREATE POLICY "simple_question_media_upload" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'question-media' 
    AND auth.uid() IS NOT NULL
);

CREATE POLICY "simple_question_media_read" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'question-media');

CREATE POLICY "simple_question_media_update_delete" ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'question-media' 
    AND auth.uid() IS NOT NULL
);

CREATE POLICY "simple_question_media_delete" ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'question-media' 
    AND auth.uid() IS NOT NULL
);
