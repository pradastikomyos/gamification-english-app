-- Drop existing problematic policy
DROP POLICY IF EXISTS "Teachers can manage their own quizzes" ON quizzes;

-- Create correct policies for teachers to manage their quizzes
-- Since teacher_id now stores the auth.uid() directly
CREATE POLICY "Teachers can view their quizzes"
ON quizzes FOR SELECT
TO authenticated
USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can create quizzes"
ON quizzes FOR INSERT
TO authenticated
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their quizzes"
ON quizzes FOR UPDATE
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their quizzes"
ON quizzes FOR DELETE
TO authenticated
USING (teacher_id = auth.uid());
