CREATE OR REPLACE FUNCTION public.get_assigned_quizzes_for_student(student_uuid uuid)
RETURNS TABLE(assignment_id uuid, quiz_id uuid, class_id uuid, assigned_at timestamp with time zone, due_date timestamp with time zone, quiz jsonb, completion jsonb)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cq.id AS assignment_id,
        cq.quiz_id,
        cq.class_id,
        cq.assigned_at,
        q.due_date,
        jsonb_build_object(
            'id', q.id,
            'title', q.title,
            'description', q.description,
            'difficulty', q.difficulty,
            'time_limit', q.time_limit,
            'points_per_question', q.points_per_question,
            'status', q.status
        ) AS quiz,
        (
            SELECT jsonb_build_object(
                'id', qa.id,
                'score', qa.final_score,
                'completed_at', qa.completed_at,
                'total_questions', qa.total_questions
            )
            FROM public.quiz_attempts qa
            WHERE qa.quiz_id = cq.quiz_id AND qa.student_id = student_uuid
            LIMIT 1
        ) AS completion
    FROM
        public.class_quizzes cq
    JOIN
        public.students s ON s.class_id = cq.class_id
    JOIN
        public.quizzes q ON cq.quiz_id = q.id
    WHERE
        s.id = student_uuid;
END;
$$;
