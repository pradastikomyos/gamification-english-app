-- Prevent students from inserting quiz_attempts for closed quizzes
DROP POLICY IF EXISTS "Students can insert their own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Students can insert quiz attempts only for open quizzes" ON public.quiz_attempts
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.status = 'open'
  )
);
