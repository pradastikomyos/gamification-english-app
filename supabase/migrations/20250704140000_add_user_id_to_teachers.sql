-- Add user_id to teachers table
ALTER TABLE public.teachers
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing teachers with corresponding user_id from user_roles
UPDATE public.teachers t
SET user_id = ur.user_id
FROM public.user_roles ur
WHERE ur.profile_id = t.id AND ur.role = 'teacher';

-- Add a unique constraint to ensure one-to-one mapping
ALTER TABLE public.teachers
ADD CONSTRAINT unique_user_id UNIQUE (user_id);

-- Re-create RLS policies to use user_id
DROP POLICY IF EXISTS "Teachers can view their own data" ON public.teachers;
CREATE POLICY "Teachers can view their own data" ON public.teachers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Teachers can update their own data" ON public.teachers;
CREATE POLICY "Teachers can update their own data" ON public.teachers
  FOR UPDATE USING (auth.uid() = user_id);
