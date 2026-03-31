DROP FUNCTION IF EXISTS public.get_quiz_details_for_student(uuid);

CREATE OR REPLACE FUNCTION public.get_quiz_details_for_student(p_quiz_id uuid)
 RETURNS TABLE(quiz_title character varying, quiz_description text, time_limit_seconds integer, questions jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        q.title AS quiz_title,
        q.description AS quiz_description,
        COALESCE(q.time_limit, q.time_limit_seconds) AS time_limit_seconds,
        jsonb_agg(
            jsonb_build_object(
                'id', qs.id,
                'question_text', qs.question_text,
                'media_url', qs.media_url,
                'difficulty', qs.difficulty, -- Ditambahkan untuk gamifikasi
                'options', CASE 
                    WHEN qs.options IS NOT NULL THEN qs.options
                    ELSE jsonb_build_object(
                        'A', qs.option_a,
                        'B', qs.option_b,
                        'C', qs.option_c,
                        'D', qs.option_d
                    )
                END,
                'correct_answer', qs.correct_answer,
                'explanation', qs.explanation
            )
            ORDER BY qs.question_order ASC -- Memastikan urutan soal konsisten
        ) AS questions
    FROM
        public.quizzes q
    JOIN
        public.questions qs ON q.id = qs.quiz_id
    WHERE
        q.id = p_quiz_id
    GROUP BY
        q.id, q.title, q.description, q.time_limit, q.time_limit_seconds;
END;
$function$
