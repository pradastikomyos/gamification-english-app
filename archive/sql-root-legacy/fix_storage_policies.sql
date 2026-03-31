-- Fix storage policies untuk study materials
-- File ini memperbaiki masalah akses download untuk siswa

-- Hapus policy lama yang bermasalah
DROP POLICY IF EXISTS "Students can view study materials" ON storage.objects;

-- Buat policy baru yang benar untuk semua authenticated users
CREATE POLICY "All authenticated users can view study materials" ON storage.objects
FOR SELECT 
TO public
USING (
  bucket_id = 'study-materials' 
  AND auth.role() = 'authenticated'
);

-- Pastikan policy untuk upload masih ada untuk teachers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Teachers can upload study materials'
  ) THEN
    CREATE POLICY "Teachers can upload study materials" ON storage.objects
    FOR INSERT 
    TO public
    WITH CHECK (
      bucket_id = 'study-materials' 
      AND auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'teacher'
      )
    );
  END IF;
END $$;

-- Pastikan policy untuk delete masih ada untuk teachers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Teachers can delete their own study materials'
  ) THEN
    CREATE POLICY "Teachers can delete their own study materials" ON storage.objects
    FOR DELETE 
    TO public
    USING (
      bucket_id = 'study-materials' 
      AND auth.role() = 'authenticated'
      AND (storage.foldername(name))[1] = auth.uid()::text
      AND EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'teacher'
      )
    );
  END IF;
END $$;
