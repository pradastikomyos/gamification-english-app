-- Ensure proper permissions for get_quiz_review_details function
-- Check if students can access their own quiz attempts
DO $$
BEGIN
    -- Grant execute permissions to authenticated users for the review function
    GRANT EXECUTE ON FUNCTION public.get_quiz_review_details(uuid) TO authenticated;
    
    -- Make sure students can access questions for review (read-only)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'questions' 
        AND policyname = 'Students can view questions for review'
    ) THEN
        CREATE POLICY "Students can view questions for review" ON public.questions
            FOR SELECT USING (
                quiz_id IN (
                    SELECT qa.quiz_id 
                    FROM quiz_attempts qa 
                    JOIN students s ON qa.student_id = s.id 
                    WHERE s.user_id = auth.uid()
                )
            );
    END IF;
END $$;
