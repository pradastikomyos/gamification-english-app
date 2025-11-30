-- Create the get_assigned_quizzes_for_student RPC function
CREATE OR REPLACE FUNCTION get_assigned_quizzes_for_student()
RETURNS TABLE (
    id UUID,
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
    SELECT id, class_id INTO v_student_id, v_class_id
    FROM public.students
    WHERE user_id = auth.uid();

    -- If the user is not a student or has no class, return empty
    IF v_student_id IS NULL OR v_class_id IS NULL THEN
        RETURN;
    END IF;

    -- Return the assigned quizzes with their completion status
    RETURN QUERY
    SELECT
        cq.id,
        cq.quiz_id,
        cq.class_id,
        cq.assigned_at,
        cq.due_date,
        jsonb_build_object(
            'id', q.id,
            'title', q.title,
            'description', q.description,
            'difficulty', q.difficulty,
            'time_limit', q.time_limit,
            'points_per_question', q.points_per_question,
            'status', q.status
        ) AS quiz,
        (SELECT jsonb_agg(up_agg.completion_data)->0
         FROM (
             SELECT jsonb_build_object(
                 'id', up.id,
                 'score', up.score,
                 'completed_at', up.completed_at,
                 'total_questions', up.total_questions,
                 'time_taken', up.time_taken
             ) as completion_data
             FROM public.user_progress up
             WHERE up.quiz_id = q.id AND up.user_id = auth.uid()
         ) AS up_agg
        ) AS completion
    FROM public.class_quizzes cq
    JOIN public.quizzes q ON cq.quiz_id = q.id
    WHERE cq.class_id = v_class_id
    ORDER BY cq.assigned_at DESC;
END;
$$;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION get_assigned_quizzes_for_student() TO authenticated;
