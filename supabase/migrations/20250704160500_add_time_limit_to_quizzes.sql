ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS time_limit INTEGER DEFAULT 3600; -- Default 60 menit
