-- Drop the old, incorrect policy first
DROP POLICY IF EXISTS "Allow students to view quizzes assigned to their class" ON public.class_quizzes;

-- Create the new, correct policy using the correct user_id join
CREATE POLICY "Allow students to view quizzes assigned to their class" 
ON public.class_quizzes FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.user_id = auth.uid() AND s.class_id = class_quizzes.class_id
  )
);
