-- Drop existing policies and recreate them with proper logic
DROP POLICY IF EXISTS "Teachers can manage questions for their quizzes" ON questions;
DROP POLICY IF EXISTS "Teachers can view questions for their quizzes" ON questions;

-- Policy for teachers to view questions for their quizzes
CREATE POLICY "Teachers can view questions for their quizzes" ON questions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM quizzes q
    WHERE q.id = questions.quiz_id 
    AND (
      -- Check if current user is the creator (backward compatibility)
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

-- Policy for teachers to update questions for their quizzes
CREATE POLICY "Teachers can update questions for their quizzes" ON questions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM quizzes q
    WHERE q.id = questions.quiz_id 
    AND (
      -- Check if current user is the creator (backward compatibility)
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
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quizzes q
    WHERE q.id = questions.quiz_id 
    AND (
      -- Check if current user is the creator (backward compatibility)
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

-- Policy for teachers to delete questions for their quizzes
CREATE POLICY "Teachers can delete questions for their quizzes" ON questions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM quizzes q
    WHERE q.id = questions.quiz_id 
    AND (
      -- Check if current user is the creator (backward compatibility)
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
