ALTER TABLE public.questions
ADD COLUMN options JSONB,
ADD COLUMN explanation TEXT,
ADD COLUMN correct_answer TEXT,
ADD COLUMN points INTEGER;
