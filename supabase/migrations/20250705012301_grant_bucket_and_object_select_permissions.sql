-- Grant permission for all authenticated users to see the list of buckets.
-- This is the primary fix for the 'Storage buckets not found' error.
GRANT SELECT ON TABLE storage.buckets TO authenticated;

-- Grant permission for authenticated users to list objects within buckets.
-- RLS policies will still control WHICH specific objects they can see.
GRANT SELECT ON TABLE storage.objects TO authenticated;

-- Re-apply a comprehensive INSERT policy to ensure teachers can upload.
-- This also ensures any previous faulty policies are overwritten.
DROP POLICY IF EXISTS "Allow teachers to upload to question-media" ON storage.objects;
CREATE POLICY "Allow teachers to upload to question-media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'question-media' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'teacher'
);
