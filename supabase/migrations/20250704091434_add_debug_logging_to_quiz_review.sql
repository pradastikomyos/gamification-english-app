-- Add better error handling and debug info to get_quiz_review_details
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
    v_questions jsonb;
    v_quiz_title text;
BEGIN
    -- Check if user is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Get student_id from user_id
    SELECT id INTO v_student_id 
    FROM public.students 
    WHERE user_id = v_user_id;
    
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'User is not a student or student record not found for user_id: %', v_user_id;
    END IF;

    -- Dapatkan percobaan terakhir untuk kuis dan siswa ini
    SELECT * INTO v_attempt
    FROM public.quiz_attempts
    WHERE quiz_id = p_quiz_id AND student_id = v_student_id
    ORDER BY completed_at DESC
    LIMIT 1;

    IF v_attempt IS NULL THEN
        RAISE EXCEPTION 'No quiz attempt found for quiz_id: % and student_id: %', p_quiz_id, v_student_id;
    END IF;

    -- Dapatkan judul kuis
    SELECT title INTO v_quiz_title FROM public.quizzes WHERE id = p_quiz_id;
    
    IF v_quiz_title IS NULL THEN
        RAISE EXCEPTION 'Quiz not found for quiz_id: %', p_quiz_id;
    END IF;

    -- Rekonstruksi rincian hasil dari data pertanyaan dan jawaban yang disimpan
    SELECT jsonb_agg(
        jsonb_build_object(
            'question_id', q.id,
            'question_text', q.question_text,
            'difficulty', q.difficulty,
            'options', COALESCE(q.options, jsonb_build_object('A', q.option_a, 'B', q.option_b, 'C', q.option_c, 'D', q.option_d)),
            'explanation', q.explanation,
            'student_answer', v_attempt.answers->>q.id::text,
            'correct_answer', q.correct_answer,
            'is_correct', (v_attempt.answers->>q.id::text = q.correct_answer),
            'order_number', COALESCE(q.order_number, 1)
        ) ORDER BY COALESCE(q.order_number, 1), q.id
    )
    INTO v_questions
    FROM public.questions q
    WHERE q.quiz_id = p_quiz_id;

    IF v_questions IS NULL THEN
        RAISE EXCEPTION 'No questions found for quiz_id: %', p_quiz_id;
    END IF;

    -- Kembalikan semua data yang dikumpulkan
    RETURN QUERY
    SELECT
        v_quiz_title,
        v_attempt.final_score,
        v_attempt.base_score,
        v_attempt.bonus_points,
        v_attempt.time_taken_seconds,
        v_attempt.completed_at AS submitted_at,
        v_questions;
END;
$$;
