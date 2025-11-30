-- Function to update total_questions in quizzes table
CREATE OR REPLACE FUNCTION update_quiz_total_questions()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.quizzes
        SET total_questions = (SELECT COUNT(*) FROM public.questions WHERE quiz_id = NEW.quiz_id)
        WHERE id = NEW.quiz_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.quizzes
        SET total_questions = (SELECT COUNT(*) FROM public.questions WHERE quiz_id = OLD.quiz_id)
        WHERE id = OLD.quiz_id;
    END IF;
    RETURN NULL; -- Result ignored for after triggers
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function after insert or delete on questions table
CREATE TRIGGER trg_update_quiz_total_questions
AFTER INSERT OR DELETE ON public.questions
FOR EACH ROW
EXECUTE FUNCTION update_quiz_total_questions();

-- Backfill existing total_questions
UPDATE public.quizzes q
SET total_questions = (SELECT COUNT(*) FROM public.questions WHERE quiz_id = q.id);