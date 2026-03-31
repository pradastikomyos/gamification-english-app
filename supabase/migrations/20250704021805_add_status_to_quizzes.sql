CREATE TYPE public.quiz_status AS ENUM ('open', 'closed');

ALTER TABLE public.quizzes
ADD COLUMN status public.quiz_status NOT NULL DEFAULT 'open';

COMMENT ON COLUMN public.quizzes.status IS 'The status of the quiz, determining if it can be taken.';
