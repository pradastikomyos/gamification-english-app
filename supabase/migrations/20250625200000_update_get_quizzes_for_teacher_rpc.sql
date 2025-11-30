CREATE OR REPLACE FUNCTION public.get_quizzes_for_teacher(teacher_id_param uuid)
RETURNS TABLE (
  id uuid,
  title character varying,
  description text,
  difficulty text,
  time_limit integer,
  points_per_question integer,
  created_by uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  total_questions integer,
  total_points integer,
  gamification jsonb,
  status text
)
LANGUAGE plpgsql
AS $$
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
    q.gamification,
    q.status
  FROM
    public.quizzes q
  WHERE
    q.created_by = teacher_id_param
  ORDER BY
    q.created_at DESC;
END;
$$;