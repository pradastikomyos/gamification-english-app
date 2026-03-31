-- Drop existing policies if any
DROP POLICY IF EXISTS "Teachers can upload question media" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can update their question media" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete their question media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view question media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view question media" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Teachers can upload question media" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'question-media' 
    AND EXISTS (
      SELECT 1 
      FROM teachers 
      WHERE teachers.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update question media" ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id = 'question-media' 
    AND EXISTS (
      SELECT 1 
      FROM teachers 
      WHERE teachers.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete question media" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'question-media' 
    AND EXISTS (
      SELECT 1 
      FROM teachers 
      WHERE teachers.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view question media" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'question-media');
