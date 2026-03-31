-- Ensure all teacher users have proper teacher_id populated in their quizzes
UPDATE quizzes 
SET teacher_id = ur.user_id
FROM user_roles ur 
WHERE quizzes.created_by = ur.profile_id 
AND ur.role IN ('teacher', 'admin')
AND quizzes.teacher_id IS NULL;

-- Create a simplified policy for question insertion that's easier to debug
DROP POLICY IF EXISTS "Allow teachers to insert questions" ON questions;

CREATE POLICY "Teachers and admins can insert questions" ON questions 
FOR INSERT 
WITH CHECK (
  -- Simple check: user must be teacher or admin, and quiz must belong to them
  EXISTS (
    SELECT 1 
    FROM quizzes q
    JOIN user_roles ur ON (q.teacher_id = ur.user_id OR q.created_by = ur.profile_id)
    WHERE q.id = questions.quiz_id 
    AND ur.user_id = auth.uid() 
    AND ur.role IN ('teacher', 'admin')
  )
  OR
  -- Allow admins to insert to any quiz
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);

-- Test function to check permissions (for debugging)
CREATE OR REPLACE FUNCTION test_question_insert_permission(p_quiz_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM quizzes q
    JOIN user_roles ur ON (q.teacher_id = ur.user_id OR q.created_by = ur.profile_id)
    WHERE q.id = p_quiz_id 
    AND ur.user_id = auth.uid() 
    AND ur.role IN ('teacher', 'admin')
  )
  OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION test_question_insert_permission(uuid) TO authenticated;
