-- Add storage policies for study-materials bucket
-- Allow teachers to upload files
CREATE POLICY "Teachers can upload study materials" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'study-materials' AND 
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow teachers to view their own files
CREATE POLICY "Teachers can view their own study materials" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'study-materials' AND 
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow teachers to delete their own files
CREATE POLICY "Teachers can delete their own study materials" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'study-materials' AND 
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow students to view study materials
CREATE POLICY "Students can view study materials" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'study-materials' AND 
        auth.role() = 'authenticated'
    );
