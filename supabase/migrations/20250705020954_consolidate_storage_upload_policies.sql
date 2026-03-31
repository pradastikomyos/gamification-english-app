-- Drop all existing INSERT policies for 'question-media' bucket
DROP POLICY IF EXISTS "Allow teachers to upload question media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to question media" ON storage.objects; -- This is a SELECT policy, but dropping it just in case of name conflict
DROP POLICY IF EXISTS "Allow authenticated users to upload question media" ON storage.objects;
DROP POLICY IF EXISTS "Allow teachers to delete their question media" ON storage.objects; -- This is a DELETE policy, but dropping it just in case of name conflict
DROP POLICY IF EXISTS "Temporary: Allow all authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow all authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Teachers and admins can upload question media" ON storage.objects;

-- Recreate only the correct and precise INSERT policy
CREATE POLICY "Teachers and admins can upload question media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'question-media' AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['teacher', 'admin']::text[])
));

-- Recreate the SELECT policy for question-media (if it was dropped)
CREATE POLICY "Allow public read access to question media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'question-media');

-- Recreate the DELETE policy for question-media (if it was dropped)
CREATE POLICY "Allow teachers to delete their question media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'question-media' AND EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['teacher', 'admin']::text[])
));
