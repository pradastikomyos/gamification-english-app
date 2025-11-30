ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.teachers(user_id) ON DELETE SET NULL;

COMMENT ON COLUMN public.quizzes.teacher_id IS 'ID pengguna dari guru yang membuat kuis.';
