-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Teachers can create quizzes" ON quizzes;
DROP POLICY IF EXISTS "Teachers can update their quizzes" ON quizzes;
DROP POLICY IF EXISTS "Teachers can delete their quizzes" ON quizzes;
DROP POLICY IF EXISTS "Teachers can view their quizzes" ON quizzes;

-- Create new policies that work with the foreign key constraints
CREATE POLICY "Teachers can create quizzes" ON quizzes
FOR INSERT TO authenticated
WITH CHECK (
    teacher_id = auth.uid() AND
    created_by IN (
        SELECT t.id FROM teachers t WHERE t.user_id = auth.uid()
    )
);

CREATE POLICY "Teachers can update their quizzes" ON quizzes
FOR UPDATE TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their quizzes" ON quizzes
FOR DELETE TO authenticated
USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can view their quizzes" ON quizzes
FOR SELECT TO authenticated
USING (teacher_id = auth.uid());

-- Also create a policy for admins to manage all quizzes
CREATE POLICY "Admins can manage all quizzes" ON quizzes
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
);
