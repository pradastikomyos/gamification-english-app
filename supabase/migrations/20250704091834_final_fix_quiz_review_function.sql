-- Final fix for get_quiz_review_details function without complex aggregation
CREATE OR REPLACE FUNCTION public.get_quiz_review_details(p_quiz_id uuid)
RETURNS TABLE(
    quiz_title text,
    final_score numeric,
    base_score numeric,
    bonus_points integer,
    time_taken_seconds integer,
    submitted_at timestamp with time zone,
    results_breakdown jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_student_id uuid;
    v_attempt record;
    v_quiz_title text;
    v_results jsonb := '[]'::jsonb;
    v_question record;
BEGIN
    -- Check if user is authenticated
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    -- Get student_id from user_id
    SELECT id INTO v_student_id 
    FROM public.students 
    WHERE user_id = v_user_id;
    
    IF v_student_id IS NULL THEN
        RETURN;
    END IF;

    -- Get latest quiz attempt for this quiz and student
    SELECT * INTO v_attempt
    FROM public.quiz_attempts
    WHERE quiz_id = p_quiz_id AND student_id = v_student_id
    ORDER BY completed_at DESC
    LIMIT 1;

    IF v_attempt IS NULL THEN
        RETURN;
    END IF;

    -- Get quiz title
    SELECT title INTO v_quiz_title FROM public.quizzes WHERE id = p_quiz_id;
    
    IF v_quiz_title IS NULL THEN
        RETURN;
    END IF;

    -- Build results breakdown manually to avoid GROUP BY issues
    FOR v_question IN 
        SELECT 
            q.id,
            q.question_text,
            q.difficulty,
            q.option_a,
            q.option_b,
            q.option_c,
            q.option_d,
            q.options,
            q.explanation,
            q.correct_answer,
            COALESCE(q.order_number, 1) as order_number
        FROM public.questions q
        WHERE q.quiz_id = p_quiz_id
        ORDER BY COALESCE(q.order_number, 1), q.id
    LOOP
        v_results := v_results || jsonb_build_object(
            'question_id', v_question.id,
            'question_text', v_question.question_text,
            'difficulty', v_question.difficulty,
            'options', COALESCE(
                v_question.options, 
                jsonb_build_object(
                    'A', v_question.option_a, 
                    'B', v_question.option_b, 
                    'C', v_question.option_c, 
                    'D', v_question.option_d
                )
            ),
            'explanation', v_question.explanation,
            'student_answer', v_attempt.answers->>v_question.id::text,
            'correct_answer', v_question.correct_answer,
            'is_correct', (v_attempt.answers->>v_question.id::text = v_question.correct_answer)
        );
    END LOOP;

    -- Return all collected data
    RETURN QUERY
    SELECT
        v_quiz_title,
        v_attempt.final_score,
        v_attempt.base_score,
        v_attempt.bonus_points,
        v_attempt.time_taken_seconds,
        v_attempt.completed_at,
        v_results;
END;
$$;
