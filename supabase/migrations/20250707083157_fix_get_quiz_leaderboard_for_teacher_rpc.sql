-- Fix the RPC function to get leaderboard for a specific quiz by teacher
DROP FUNCTION IF EXISTS public.get_quiz_leaderboard_for_teacher(UUID, UUID);

CREATE OR REPLACE FUNCTION public.get_quiz_leaderboard_for_teacher(
    p_teacher_id UUID,
    p_quiz_id UUID
)
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    class_name TEXT,
    final_score NUMERIC,
    base_score NUMERIC,
    bonus_points NUMERIC,
    time_taken_seconds INTEGER,
    completed_at TIMESTAMPTZ,
    rank INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH quiz_attempts_with_student AS (
        SELECT 
            qa.student_id,
            s.name::TEXT as student_name,
            c.name::TEXT as class_name,
            qa.final_score,
            qa.base_score,
            qa.bonus_points,
            qa.time_taken_seconds,
            qa.completed_at
        FROM public.quiz_attempts qa
        INNER JOIN public.students s ON qa.student_id = s.id
        INNER JOIN public.classes c ON s.class_id = c.id
        INNER JOIN public.quizzes q ON qa.quiz_id = q.id
        WHERE q.teacher_id = (
            SELECT user_id FROM public.teachers WHERE id = p_teacher_id
        )
        AND qa.quiz_id = p_quiz_id
    ),
    ranked_students AS (
        SELECT 
            qaws.*,
            ROW_NUMBER() OVER (ORDER BY qaws.final_score DESC, qaws.time_taken_seconds ASC) as student_rank
        FROM quiz_attempts_with_student qaws
    )
    SELECT 
        rs.student_id,
        rs.student_name,
        rs.class_name,
        rs.final_score,
        rs.base_score,
        rs.bonus_points,
        rs.time_taken_seconds,
        rs.completed_at,
        rs.student_rank::INTEGER as rank
    FROM ranked_students rs
    ORDER BY rs.student_rank;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_quiz_leaderboard_for_teacher(UUID, UUID) TO authenticated;
