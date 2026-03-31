-- Drop and recreate the function with correct columns
DROP FUNCTION IF EXISTS get_quizzes_for_teacher(UUID);

CREATE OR REPLACE FUNCTION get_quizzes_for_teacher(teacher_id_param UUID)
RETURNS TABLE(
  id UUID,
  title VARCHAR,
  description TEXT,
  difficulty difficulty_level,
  time_limit INTEGER,
  points_per_question INTEGER,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_questions INTEGER,
  total_points INTEGER,
  status quiz_status,
  teacher_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.title,
    q.description,
    q.difficulty,
    q.time_limit,
    q.points_per_question,
    q.created_by,
    q.created_at,
    q.updated_at,
    q.total_questions,
    q.total_points,
    q.status,
    q.teacher_id
  FROM
    public.quizzes q
  WHERE
    q.teacher_id = teacher_id_param
  ORDER BY
    q.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
