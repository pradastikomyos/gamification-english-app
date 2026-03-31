-- Create RPC function to get detailed quiz submissions for teacher
CREATE OR REPLACE FUNCTION public.get_quiz_submissions_for_teacher(
    p_teacher_id UUID
)
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    quiz_id UUID,
    quiz_title TEXT,
    score NUMERIC,
    submitted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qa.student_id,
        s.name::TEXT as student_name,
        qa.quiz_id,
        q.title::TEXT as quiz_title,
        qa.final_score as score,
        qa.completed_at as submitted_at
    FROM public.quiz_attempts qa
    INNER JOIN public.students s ON qa.student_id = s.id
    INNER JOIN public.quizzes q ON qa.quiz_id = q.id
    WHERE q.teacher_id = (
        SELECT user_id FROM public.teachers WHERE id = p_teacher_id
    )
    ORDER BY qa.completed_at DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_quiz_submissions_for_teacher(UUID) TO authenticated;
