-- Clean up storage policies and create new ones that work properly
-- First, enable RLS on storage.objects if not already enabled
-- (This might fail if already enabled, which is fine)
DO $$ 
BEGIN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    -- Ignore error if RLS is already enabled
    NULL;
END $$;

-- Drop conflicting policies for question-media bucket
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow authenticated users to upload question media" ON storage.objects;
    DROP POLICY IF EXISTS "Teachers can upload question media" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to read question media" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can view question media" ON storage.objects;
    DROP POLICY IF EXISTS "Teachers can delete question media" ON storage.objects;
    DROP POLICY IF EXISTS "Allow teachers to delete their question media" ON storage.objects;
    DROP POLICY IF EXISTS "Teachers can update question media" ON storage.objects;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if policies don't exist
    NULL;
END $$;

-- Create simple and clear policies for question-media bucket
-- 1. Allow teachers and admins to upload question media
CREATE POLICY "Teachers upload question media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'question-media' AND
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('teacher', 'admin')
  )
);

-- 2. Allow everyone to view question media (public bucket)
CREATE POLICY "Public read question media" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'question-media');

-- 3. Allow teachers to delete their uploaded question media
CREATE POLICY "Teachers delete question media" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'question-media' AND
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('teacher', 'admin')
  )
);

-- 4. Allow teachers to update question media
CREATE POLICY "Teachers update question media" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'question-media' AND
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('teacher', 'admin')
  )
)
WITH CHECK (
  bucket_id = 'question-media' AND
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('teacher', 'admin')
  )
);
