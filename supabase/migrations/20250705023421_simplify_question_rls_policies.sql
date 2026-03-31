BEGIN;

-- Drop all existing policies on the 'questions' table to avoid conflicts.
DROP POLICY IF EXISTS "Allow teachers to create questions" ON public.questions;
DROP POLICY IF EXISTS "Allow teachers to view their questions" ON public.questions;
DROP POLICY IF EXISTS "Allow teachers to update their questions" ON public.questions;
DROP POLICY IF EXISTS "Teachers can update questions for their quizzes" ON public.questions;
DROP POLICY IF EXISTS "Teachers can delete questions for their quizzes" ON public.questions;
DROP POLICY IF EXISTS "Students can view questions for review" ON public.questions;
DROP POLICY IF EXISTS "Teachers and admins can insert questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can manage all questions" ON public.questions;

-- Create a simple, unified set of policies for teachers based on quiz ownership.

-- Teachers can view questions of quizzes they own.
CREATE POLICY "Teachers can view their own quiz questions" ON public.questions
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = questions.quiz_id AND quizzes.teacher_id = auth.uid()));

-- Teachers can insert questions into quizzes they own.
CREATE POLICY "Teachers can create questions for their own quizzes" ON public.questions
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = questions.quiz_id AND quizzes.teacher_id = auth.uid()));

-- Teachers can update questions of quizzes they own.
CREATE POLICY "Teachers can update questions for their own quizzes" ON public.questions
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = questions.quiz_id AND quizzes.teacher_id = auth.uid()));

-- Teachers can delete questions of quizzes they own.
CREATE POLICY "Teachers can delete questions for their own quizzes" ON public.questions
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = questions.quiz_id AND quizzes.teacher_id = auth.uid()));

-- Admins can do anything.
CREATE POLICY "Admins can manage all questions" ON public.questions
FOR ALL TO authenticated
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');

COMMIT;
