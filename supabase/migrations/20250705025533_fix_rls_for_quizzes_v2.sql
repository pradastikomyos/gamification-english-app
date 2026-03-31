-- Hapus kebijakan yang bermasalah
DROP POLICY IF EXISTS "Teachers can manage their own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Teachers can view their own quizzes" ON quizzes;

-- Buat kebijakan baru yang sesuai dengan struktur saat ini
CREATE POLICY "Teachers can manage their own quizzes"
ON quizzes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM teachers
    WHERE teachers.id = quizzes.teacher_id AND teachers.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM teachers
    WHERE teachers.id = quizzes.teacher_id AND teachers.user_id = auth.uid()
  )
);
