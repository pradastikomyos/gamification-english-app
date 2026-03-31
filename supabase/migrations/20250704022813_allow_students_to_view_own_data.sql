CREATE POLICY "Allow students to view their own data" 
ON public.students FOR SELECT 
USING (id = auth.uid());
