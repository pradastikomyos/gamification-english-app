-- Fix the RPC function to get teacher's quizzes for leaderboard selection
DROP FUNCTION IF EXISTS public.get_teacher_quizzes_for_leaderboard(UUID);

CREATE OR REPLACE FUNCTION public.get_teacher_quizzes_for_leaderboard(
    p_teacher_id UUID
)
RETURNS TABLE (
    quiz_id UUID,
    quiz_title TEXT,
    total_questions INTEGER,
    total_attempts BIGINT,
    avg_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id as quiz_id,
        q.title::TEXT as quiz_title,
        COALESCE(q.total_questions, 0) as total_questions,
        COUNT(qa.id) as total_attempts,
        ROUND(AVG(qa.final_score), 2) as avg_score
    FROM public.quizzes q
    LEFT JOIN public.quiz_attempts qa ON q.id = qa.quiz_id
    WHERE q.teacher_id = (
        SELECT user_id FROM public.teachers WHERE id = p_teacher_id
    )
    GROUP BY q.id, q.title, q.total_questions
    HAVING COALESCE(q.total_questions, 0) > 0 -- Only show quizzes with questions
    ORDER BY q.created_at DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_teacher_quizzes_for_leaderboard(UUID) TO authenticated;
