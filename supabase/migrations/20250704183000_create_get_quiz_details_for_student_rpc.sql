CREATE OR REPLACE FUNCTION public.get_quiz_details_for_student(p_quiz_id UUID)
RETURNS TABLE (
    quiz_title TEXT,
    quiz_description TEXT,
    time_limit_seconds INT,
    questions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.title AS quiz_title,
        q.description AS quiz_description,
        q.time_limit_seconds,
        jsonb_agg(
            jsonb_build_object(
                'id', qs.id,
                'question_text', qs.question_text,
                'media_url', qs.media_url,
                'points', qs.points,
                'options', qs.options
            )
        ) AS questions
    FROM
        public.quizzes q
    JOIN
        public.questions qs ON q.id = qs.quiz_id
    WHERE
        q.id = p_quiz_id
    GROUP BY
        q.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_quiz_details_for_student(UUID) TO authenticated;
