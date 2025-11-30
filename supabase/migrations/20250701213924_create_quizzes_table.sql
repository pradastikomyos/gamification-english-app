-- Migration: Create Quizzes Table and RLS Policies

-- 1. Create the 'quizzes' table
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  -- The teacher_id can be used to track who created the quiz. It's nullable in case the teacher is deleted.
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
--    - Admins can perform any action on quizzes.
--    - All authenticated users (teachers, students) can view quizzes.
CREATE POLICY "Admins can manage all quizzes" 
ON public.quizzes FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin'
);

CREATE POLICY "Authenticated users can view quizzes" 
ON public.quizzes FOR SELECT
TO authenticated
USING (true);


-- 4. Create a trigger function to automatically update 'updated_at'
CREATE OR REPLACE FUNCTION public.handle_quiz_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 5. Apply the trigger to the 'quizzes' table
CREATE TRIGGER on_quiz_update
BEFORE UPDATE ON public.quizzes
FOR EACH ROW
EXECUTE PROCEDURE public.handle_quiz_update();
