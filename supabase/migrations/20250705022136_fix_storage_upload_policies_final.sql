-- Drop all existing conflicting policies first
DROP POLICY IF EXISTS "teachers_can_upload_question_media" ON storage.objects;
DROP POLICY IF EXISTS "teachers_can_manage_question_media" ON storage.objects;

-- Create a more permissive policy for authenticated users to upload to question-media
CREATE POLICY "authenticated_users_can_upload_question_media" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'question-media');

-- Separate policy for managing (update/delete) - only for teachers and admins
CREATE POLICY "teachers_can_manage_question_media" ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'question-media' 
    AND (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('teacher', 'admin')
        )
        OR auth.uid()::text = (storage.foldername(name))[1]
    )
);

-- Ensure bucket is properly configured
UPDATE storage.buckets 
SET 
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/aac',
        'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
    ]
WHERE id = 'question-media';
