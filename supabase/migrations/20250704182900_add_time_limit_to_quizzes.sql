ALTER TABLE public.quizzes
ADD COLUMN time_limit_seconds INTEGER;

COMMENT ON COLUMN public.quizzes.time_limit_seconds IS 'Time limit for the quiz in seconds. NULL means no time limit.';
