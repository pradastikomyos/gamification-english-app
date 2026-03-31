-- Drop all existing policies for storage.objects
DROP POLICY IF EXISTS "All authenticated users can view study materials" ON storage.objects;
DROP POLICY IF EXISTS "Public can view question media" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete question media" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete their own study materials" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can update question media" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload question media" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload study materials" ON storage.objects;
DROP POLICY IF EXISTS "simple_question_media_delete" ON storage.objects;
DROP POLICY IF EXISTS "simple_question_media_read" ON storage.objects;
DROP POLICY IF EXISTS "simple_question_media_update_delete" ON storage.objects;
DROP POLICY IF EXISTS "simple_question_media_upload" ON storage.objects;

-- Create simple and clear policies for question-media bucket
CREATE POLICY "Anyone can view question media"
ON storage.objects FOR SELECT
USING (bucket_id = 'question-media');

CREATE POLICY "Authenticated users can upload question media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'question-media' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can update question media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'question-media' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can delete question media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'question-media' 
  AND auth.uid() IS NOT NULL
);

-- Create policies for study-materials bucket
CREATE POLICY "Authenticated users can view study materials"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'study-materials' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can upload study materials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'study-materials' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can update study materials"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'study-materials' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can delete study materials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'study-materials' 
  AND auth.uid() IS NOT NULL
);
