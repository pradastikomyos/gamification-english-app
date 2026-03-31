CREATE POLICY "Allow authenticated users to view quizzes" 
ON public.quizzes FOR SELECT 
USING (auth.role() = 'authenticated');
