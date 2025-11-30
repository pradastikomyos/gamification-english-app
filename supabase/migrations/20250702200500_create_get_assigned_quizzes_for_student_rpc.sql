DROP FUNCTION IF EXISTS get_assigned_quizzes_for_student(UUID);
-- Create the get_assigned_quizzes_for_student RPC function
CREATE OR REPLACE FUNCTION get_assigned_quizzes_for_student(student_uuid UUID)
RETURNS TABLE (
    assignment_id UUID,
    quiz_id UUID,
    class_id UUID,
    assigned_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    quiz JSONB,
    completion JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER SET SEARCH_PATH = public
AS $$
DECLARE
    v_student_id UUID;
    v_class_id UUID;
BEGIN
    -- Get the student_id and class_id for the currently authenticated user
    SELECT s.id, s.class_id INTO v_student_id, v_class_id
    FROM public.students s
    WHERE s.id = student_uuid;

    -- If the user is not a student or has no class, return empty
    IF v_student_id IS NULL OR v_class_id IS NULL THEN
        RETURN;
    END IF;

    -- Return the assigned quizzes with their completion status
    RETURN QUERY
    SELECT
        cq.id AS assignment_id,
        cq.quiz_id,
        cq.class_id,
        cq.assigned_at,
        cq.due_date,
        jsonb_build_object(
            'title', q.title,
            'description', q.description,
            'teacher_name', COALESCE(t.name, 'Guru Tidak Dikenal'),
            'question_count', (SELECT COUNT(*) FROM public.questions WHERE public.questions.quiz_id = q.id)
        ) AS quiz,
        (
            SELECT jsonb_build_object(
                'completed_at', qa.completed_at,
                'final_score', qa.final_score
            )
            FROM public.quiz_attempts qa
            WHERE qa.quiz_id = cq.quiz_id AND qa.student_id = v_student_id
            LIMIT 1
        ) AS completion
    FROM
        public.class_quizzes cq
    JOIN
        public.quizzes q ON cq.quiz_id = q.id
    LEFT JOIN
        public.teachers t ON q.teacher_id = t.user_id
    WHERE
        cq.class_id = v_class_id
    ORDER BY cq.assigned_at DESC;
END;
$$;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION get_assigned_quizzes_for_student(UUID) TO authenticated;
