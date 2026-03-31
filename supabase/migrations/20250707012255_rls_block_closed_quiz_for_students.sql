-- Update RLS policy to block students from accessing closed quizzes
DROP POLICY IF EXISTS "Allow authenticated users to view quizzes" ON public.quizzes;
CREATE POLICY "Allow authenticated users to view open quizzes only" ON public.quizzes
FOR SELECT USING (
  auth.role() = 'authenticated' AND status = 'open'
);
-- Ensure only open quizzes are accessible to students
