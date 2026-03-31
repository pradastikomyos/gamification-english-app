CREATE OR REPLACE FUNCTION create_quiz_for_teacher(
  p_title TEXT,
  p_description TEXT,
  p_time_limit INTEGER,
  p_teacher_user_id UUID
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  time_limit INTEGER,
  teacher_id UUID,
  created_by UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_teacher_id UUID;
  v_teacher_record_id UUID;
  new_quiz_id UUID;
BEGIN
  -- Get teacher information
  SELECT t.id, t.user_id INTO v_teacher_record_id, v_teacher_id
  FROM teachers t
  WHERE t.user_id = p_teacher_user_id;
  
  IF v_teacher_record_id IS NULL THEN
    RAISE EXCEPTION 'Teacher record not found for user_id: %', p_teacher_user_id;
  END IF;
  
  -- Insert quiz
  INSERT INTO quizzes (title, description, time_limit, teacher_id, created_by)
  VALUES (p_title, p_description, p_time_limit, v_teacher_id, v_teacher_record_id)
  RETURNING quizzes.id INTO new_quiz_id;
  
  -- Return the created quiz
  RETURN QUERY
  SELECT 
    new_quiz_id,
    p_title,
    p_description,
    p_time_limit,
    v_teacher_id,
    v_teacher_record_id;
END;
$$;
