-- Perbaiki kebijakan SELECT untuk tabel questions
DROP POLICY IF EXISTS "Teachers can view their own quiz questions" ON questions;

CREATE POLICY "Teachers can view their own quiz questions"
ON questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM quizzes
    JOIN teachers ON teachers.id = quizzes.teacher_id
    WHERE quizzes.id = questions.quiz_id AND teachers.user_id = auth.uid()
  )
);
