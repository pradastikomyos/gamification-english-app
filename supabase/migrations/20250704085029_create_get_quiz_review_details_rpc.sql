CREATE OR REPLACE FUNCTION public.get_quiz_review_details(p_quiz_id uuid)
RETURNS TABLE (
    quiz_title text,
    final_score numeric,
    base_score numeric,
    bonus_points numeric,
    time_taken_seconds integer,
    submitted_at timestamptz,
    results_breakdown jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_student_id uuid := auth.uid();
    v_attempt record;
    v_questions jsonb;
    v_quiz_title text;
BEGIN
    -- Dapatkan percobaan terakhir untuk kuis dan siswa ini
    SELECT * INTO v_attempt
    FROM public.quiz_attempts
    WHERE quiz_id = p_quiz_id AND student_id = v_student_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_attempt IS NULL THEN
        -- Mengembalikan set kosong jika tidak ada percobaan yang ditemukan, bukan error
        RETURN;
    END IF;

    -- Dapatkan judul kuis
    SELECT title INTO v_quiz_title FROM public.quizzes WHERE id = p_quiz_id;

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
            'is_correct', (v_attempt.answers->>q.id::text = q.correct_answer)
        )
    )
    INTO v_questions
    FROM public.questions q
    WHERE q.quiz_id = p_quiz_id;

    -- Kembalikan semua data yang dikumpulkan
    RETURN QUERY
    SELECT
        v_quiz_title,
        v_attempt.final_score,
        v_attempt.base_score,
        v_attempt.bonus_points,
        v_attempt.time_taken_seconds,
        v_attempt.created_at,
        v_questions;
END;
$function$
