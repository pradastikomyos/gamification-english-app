CREATE POLICY "Temporary: Allow all authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'question-media');
