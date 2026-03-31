-- This is the definitive fix for the 'No buckets found' error.
-- It allows any authenticated user to see the 'question-media' bucket in the list of buckets.
DROP POLICY IF EXISTS "Allow authenticated users to see question-media bucket" ON storage.buckets;
CREATE POLICY "Allow authenticated users to see question-media bucket"
ON storage.buckets FOR SELECT
TO authenticated
USING ( id = 'question-media' );
