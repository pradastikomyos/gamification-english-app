-- Add user_id to user_progress table
ALTER TABLE public.user_progress
ADD COLUMN user_id UUID;

-- Populate the new user_id column from the students table
UPDATE public.user_progress up
SET user_id = s.user_id
FROM public.students s
WHERE up.student_id = s.id;

-- Add foreign key constraint to auth.users
ALTER TABLE public.user_progress
ADD CONSTRAINT user_progress_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make the user_id column not nullable as it's essential
ALTER TABLE public.user_progress
ALTER COLUMN user_id SET NOT NULL;

-- Drop the old RLS policies that are based on student_id
DROP POLICY "Students can view their own progress" ON public.user_progress;
DROP POLICY "Students can insert their own progress" ON public.user_progress;

-- Create new RLS policies using the new user_id column for direct authorization
CREATE POLICY "Students can view their own progress" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can insert their own progress" ON public.user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
