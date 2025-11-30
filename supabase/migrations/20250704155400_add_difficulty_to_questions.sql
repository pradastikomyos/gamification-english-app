ALTER TABLE public.questions ADD COLUMN difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard'));
