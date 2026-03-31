-- Update RLS policy to block students from accessing closed quizzes via class_quizzes
DROP POLICY IF EXISTS "Allow students to view quizzes assigned to their class" ON public.class_quizzes;
CREATE POLICY "Allow students to view open quizzes assigned to their class" ON public.class_quizzes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.status = 'open'
  )
);
