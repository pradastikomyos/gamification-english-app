-- Drop all conflicting storage policies for question-media
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow teachers to upload to question-media" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can insert media" ON storage.objects;
DROP POLICY IF EXISTS "Teachers and admins can upload question media" ON storage.objects;

-- Create a single, clear upload policy for teachers
CREATE POLICY "teachers_can_upload_question_media" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'question-media' 
    AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('teacher', 'admin')
    )
);

-- Ensure we have proper read access
DROP POLICY IF EXISTS "Allow public read access to question media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view media" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for question media" ON storage.objects;

CREATE POLICY "public_read_question_media" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'question-media');

-- Allow teachers to delete and update their own files
DROP POLICY IF EXISTS "Allow teachers to delete their question media" ON storage.objects;
DROP POLICY IF EXISTS "Teachers and admins can delete question media" ON storage.objects;
DROP POLICY IF EXISTS "Teachers and admins can update question media" ON storage.objects;

CREATE POLICY "teachers_can_manage_question_media" ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'question-media' 
    AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('teacher', 'admin')
    )
);

-- Ensure bucket exists and is configured correctly
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'question-media',
    'question-media',
    true,
    10485760, -- 10MB
    ARRAY[
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/aac',
        'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
