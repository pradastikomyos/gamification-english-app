CREATE POLICY "Allow students to view quizzes assigned to their class" 
ON public.class_quizzes FOR SELECT 
USING ( 
  EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.class_id = class_quizzes.class_id AND s.id = auth.uid()
  )
);

