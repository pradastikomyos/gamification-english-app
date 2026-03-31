CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
    p_quiz_id uuid,
    p_student_answers jsonb,
    p_time_taken_seconds integer
)
RETURNS TABLE(final_score numeric, base_score numeric, bonus_points numeric, results_breakdown jsonb)
LANGUAGE plpgsql
AS $function$
DECLARE
    v_student_id uuid := auth.uid();
    v_quiz_attempt_id uuid;
    v_base_score numeric := 0;
    v_bonus_points numeric := 0;
    v_final_score numeric;
    v_time_limit integer;
    v_time_percentage numeric;
    rec record;
    v_results jsonb := '[]'::jsonb;
BEGIN
    -- 1. Check if the student has already attempted this quiz
    IF EXISTS (SELECT 1 FROM quiz_attempts WHERE quiz_id = p_quiz_id AND student_id = v_student_id) THEN
        RAISE EXCEPTION 'You have already attempted this quiz.';
    END IF;

    -- 2. Calculate base score and create results breakdown
    FOR rec IN
        SELECT
            q.id AS question_id,
            q.question_text,
            q.correct_answer,
            q.difficulty,
            p_student_answers->>q.id::text AS student_answer
        FROM questions q
        WHERE q.quiz_id = p_quiz_id
    LOOP
        IF rec.student_answer = rec.correct_answer THEN
            CASE rec.difficulty
                WHEN 'easy' THEN v_base_score := v_base_score + 2;
                WHEN 'medium' THEN v_base_score := v_base_score + 3;
                WHEN 'hard' THEN v_base_score := v_base_score + 5;
            END CASE;
        END IF;

        v_results := v_results || jsonb_build_object(
            'question_id', rec.question_id,
            'question_text', rec.question_text,
            'difficulty', rec.difficulty,
            'student_answer', rec.student_answer,
            'correct_answer', rec.correct_answer,
            'is_correct', (rec.student_answer = rec.correct_answer)
        );
    END LOOP;

    -- 3. Calculate time bonus
    SELECT COALESCE(time_limit, time_limit_seconds) INTO v_time_limit FROM quizzes WHERE id = p_quiz_id;
    IF v_time_limit IS NOT NULL AND v_time_limit > 0 THEN
        v_time_percentage := (p_time_taken_seconds::numeric / v_time_limit::numeric) * 100;
        IF v_time_percentage <= 25 THEN
            v_bonus_points := 30;
        ELSIF v_time_percentage <= 50 THEN
            v_bonus_points := 20;
        ELSIF v_time_percentage <= 75 THEN
            v_bonus_points := 10;
        ELSE
            v_bonus_points := 0;
        END IF;
    ELSE
        v_bonus_points := 0; -- No time limit means no bonus
    END IF;

    -- 4. Calculate final score
    v_final_score := v_base_score + v_bonus_points;

    -- 5. Insert the result into quiz_attempts table
    INSERT INTO quiz_attempts (quiz_id, student_id, final_score, base_score, bonus_points, answers, time_taken_seconds)
    VALUES (p_quiz_id, v_student_id, v_final_score, v_base_score, v_bonus_points, p_student_answers, p_time_taken_seconds)
    RETURNING id INTO v_quiz_attempt_id;

    -- 6. Update student's total points
    UPDATE students
    SET total_points = total_points + v_final_score
    WHERE id = v_student_id;

    -- 7. Return the results
    RETURN QUERY SELECT v_final_score, v_base_score, v_bonus_points, v_results;
END;
$function$;
