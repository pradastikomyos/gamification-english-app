-- Drop the existing function to allow for parameter renaming
DROP FUNCTION IF EXISTS delete_quiz_for_teacher(UUID, UUID);

-- Recreate the function with the corrected parameter name
CREATE OR REPLACE FUNCTION delete_quiz_for_teacher(p_quiz_id UUID, p_teacher_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Check if the quiz exists and belongs to the teacher
  IF NOT EXISTS (
    SELECT 1
    FROM quizzes
    WHERE id = p_quiz_id AND teacher_id = p_teacher_id
  ) THEN
    RAISE EXCEPTION 'Quiz not found or you do not have permission to delete it.';
  END IF;

  -- Perform the deletion
  DELETE FROM quizzes
  WHERE id = p_quiz_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION delete_quiz_for_teacher(UUID, UUID) TO authenticated;
