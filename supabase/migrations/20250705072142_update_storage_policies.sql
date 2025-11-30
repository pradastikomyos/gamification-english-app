-- Cek current policies untuk storage
SELECT * FROM storage.policies WHERE bucket_id = 'question-media';

-- Drop existing policies jika ada
DROP POLICY IF EXISTS "Allow teachers to upload question media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to question media" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Allow authenticated users to upload question media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'question-media');

CREATE POLICY "Allow authenticated users to read question media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'question-media');

CREATE POLICY "Allow teachers to delete their question media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'question-media');

-- Create bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('question-media', 'question-media', true)
ON CONFLICT (id) DO NOTHING;

-- Update bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'question-media';
