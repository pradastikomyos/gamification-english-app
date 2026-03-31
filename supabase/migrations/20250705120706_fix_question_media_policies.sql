-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can upload question media" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can update question media" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete question media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view question media" ON storage.objects;

-- Create policy for teachers to upload question media
CREATE POLICY "Teachers can upload question media" ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'question-media' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('teacher', 'admin')
  )
);

-- Create policy for teachers to update question media
CREATE POLICY "Teachers can update question media" ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'question-media' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('teacher', 'admin')
  )
)
WITH CHECK (
  bucket_id = 'question-media' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('teacher', 'admin')
  )
);

-- Create policy for teachers to delete question media
CREATE POLICY "Teachers can delete question media" ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'question-media' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('teacher', 'admin')
  )
);

-- Create policy for anyone to view question media (public bucket)
CREATE POLICY "Anyone can view question media" ON storage.objects 
FOR SELECT 
USING (bucket_id = 'question-media');

-- Update bucket configuration
UPDATE storage.buckets 
SET 
  allowed_mime_types = ARRAY[
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/gif', 
    'image/webp',
    'image/svg+xml',
    'audio/mpeg', 
    'audio/wav', 
    'audio/mp3',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo'
  ],
  file_size_limit = 10485760, -- 10MB limit
  public = true
WHERE id = 'question-media';
