-- This script creates a function and trigger to automatically update the
-- total_questions and total_points columns in the quizzes table whenever
-- a question is inserted, updated, or deleted.

-- 1. Create the function to update quiz statistics
CREATE OR REPLACE FUNCTION public.update_quiz_stats()
RETURNS TRIGGER AS $$
DECLARE
    quiz_id_to_update UUID;
BEGIN
    -- Determine the quiz_id to update based on the operation
    IF (TG_OP = 'DELETE') THEN
        quiz_id_to_update := OLD.quiz_id;
    ELSE
        quiz_id_to_update := NEW.quiz_id;
    END IF;

    -- Recalculate and update total_questions and total_points for the affected quiz
    UPDATE public.quizzes
    SET
        total_questions = (
            SELECT COUNT(*)
            FROM public.questions
            WHERE quiz_id = quiz_id_to_update
        ),
        total_points = (
            SELECT COALESCE(SUM(points), 0)
            FROM public.questions
            WHERE quiz_id = quiz_id_to_update
        )
    WHERE id = quiz_id_to_update;

    -- If a question's quiz_id was changed, we also need to update the old quiz's stats
    IF (TG_OP = 'UPDATE' AND OLD.quiz_id IS DISTINCT FROM NEW.quiz_id) THEN
        UPDATE public.quizzes
        SET
            total_questions = (
                SELECT COUNT(*)
                FROM public.questions
                WHERE quiz_id = OLD.quiz_id
            ),
            total_points = (
                SELECT COALESCE(SUM(points), 0)
                FROM public.questions
                WHERE quiz_id = OLD.quiz_id
            )
        WHERE id = OLD.quiz_id;
    END IF;

    RETURN NULL; -- The result is ignored for AFTER triggers
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger to call the function on any change to the questions table
-- Drop the trigger first if it exists to make the script idempotent
DROP TRIGGER IF EXISTS on_question_change_update_quiz_stats ON public.questions;

CREATE TRIGGER on_question_change_update_quiz_stats
AFTER INSERT OR UPDATE OR DELETE ON public.questions
FOR EACH ROW
EXECUTE FUNCTION public.update_quiz_stats();

-- 3. Backfill stats for all existing quizzes to ensure data consistency
-- This runs once when the migration is applied.
UPDATE public.quizzes q
SET
    total_questions = (
        SELECT COUNT(*)
        FROM public.questions
        WHERE quiz_id = q.id
    ),
    total_points = (
        SELECT COALESCE(SUM(points), 0)
        FROM public.questions
        WHERE quiz_id = q.id
    )
WHERE q.total_questions IS NULL OR q.total_points IS NULL OR q.total_questions != (
    SELECT COUNT(*) FROM public.questions WHERE quiz_id = q.id
);

