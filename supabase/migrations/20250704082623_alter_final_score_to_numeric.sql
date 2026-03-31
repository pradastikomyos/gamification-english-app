ALTER TABLE public.quiz_attempts
ALTER COLUMN final_score TYPE NUMERIC USING final_score::NUMERIC,
ALTER COLUMN final_score SET NOT NULL;
