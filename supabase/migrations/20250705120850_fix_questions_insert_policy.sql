-- Drop existing policy and create new one that works correctly
DROP POLICY IF EXISTS "Allow teachers to insert questions" ON questions;

-- Create new policy that allows teachers to insert questions for their quizzes
CREATE POLICY "Allow teachers to insert questions" ON questions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quizzes q
    WHERE q.id = questions.quiz_id 
    AND (
      -- Check if current user is the creator (for backward compatibility)
      q.created_by IN (
        SELECT ur.profile_id 
        FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('teacher', 'admin')
      )
      OR
      -- Check if current user is the teacher via teacher_id field
      q.teacher_id = auth.uid()
      OR
      -- Check if user is admin
      EXISTS (
        SELECT 1 FROM user_roles ur2
        WHERE ur2.user_id = auth.uid() 
        AND ur2.role = 'admin'
      )
    )
  )
);

-- Also update data to ensure teacher_id is properly set for existing quizzes
UPDATE quizzes 
SET teacher_id = (
  SELECT ur.user_id 
  FROM user_roles ur 
  WHERE ur.profile_id = quizzes.created_by 
  AND ur.role = 'teacher'
  LIMIT 1
)
WHERE teacher_id IS NULL AND created_by IS NOT NULL;
