-- Drop the old, incorrect policy first
DROP POLICY IF EXISTS "Allow students to view their own data" ON public.students;

-- Create the new, correct policy using user_id
CREATE POLICY "Allow students to view their own data" 
ON public.students FOR SELECT 
USING (user_id = auth.uid());
