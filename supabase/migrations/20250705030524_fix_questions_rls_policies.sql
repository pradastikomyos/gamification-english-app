-- Drop existing policies for questions
DROP POLICY IF EXISTS "Teachers can create questions for their own quizzes" ON questions;
DROP POLICY IF EXISTS "Teachers can delete questions for their own quizzes" ON questions;
DROP POLICY IF EXISTS "Teachers can update questions for their own quizzes" ON questions;
DROP POLICY IF EXISTS "Teachers can view their own quiz questions" ON questions;

-- Create consistent policies that use teacher_id properly
CREATE POLICY "Teachers can view their own quiz questions" ON questions
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 
      FROM quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND quizzes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can create questions for their own quizzes" ON questions
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND quizzes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update questions for their own quizzes" ON questions
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 
      FROM quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND quizzes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete questions for their own quizzes" ON questions
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 
      FROM quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND quizzes.teacher_id = auth.uid()
    )
  );
