-- Cek current policies untuk questions table
SELECT * FROM pg_policies WHERE tablename = 'questions';

-- Update questions policies
DROP POLICY IF EXISTS "Teachers can create questions for their quizzes" ON questions;
DROP POLICY IF EXISTS "Teachers can view questions for their quizzes" ON questions;

-- Create comprehensive questions policies
CREATE POLICY "Allow teachers to create questions"
ON questions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quizzes 
    WHERE quizzes.id = questions.quiz_id 
    AND quizzes.teacher_id = auth.uid()
  )
);

CREATE POLICY "Allow teachers to view their questions"
ON questions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quizzes 
    WHERE quizzes.id = questions.quiz_id 
    AND quizzes.teacher_id = auth.uid()
  )
);

CREATE POLICY "Allow teachers to update their questions"
ON questions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quizzes 
    WHERE quizzes.id = questions.quiz_id 
    AND quizzes.teacher_id = auth.uid()
  )
);
