ALTER TABLE public.quiz_attempts
ADD COLUMN IF NOT EXISTS base_score NUMERIC,
ADD COLUMN IF NOT EXISTS bonus_points NUMERIC,
ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER,
ADD COLUMN IF NOT EXISTS answers JSONB;

COMMENT ON COLUMN public.quiz_attempts.base_score IS 'Score calculated from correct answers only, without bonuses.';
COMMENT ON COLUMN public.quiz_attempts.bonus_points IS 'Bonus points awarded, e.g., for speed.';
COMMENT ON COLUMN public.quiz_attempts.time_taken_seconds IS 'Total time the student took to complete the quiz in seconds.';
COMMENT ON COLUMN public.quiz_attempts.answers IS 'A JSONB object storing the student''s answers, e.g., { "question_id": "selected_option_id" }.';

-- Rename 'score' to 'final_score' for consistency if it exists
DO $$
BEGIN
   IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='quiz_attempts' AND column_name='score')
   AND NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='quiz_attempts' AND column_name='final_score')
   THEN
      ALTER TABLE public.quiz_attempts RENAME COLUMN score TO final_score;
   END IF;
END $$;
