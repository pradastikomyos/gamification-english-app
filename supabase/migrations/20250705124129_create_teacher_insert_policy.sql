CREATE POLICY "Teachers can insert media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'question-media' AND 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'teacher'
);
