-- supabase/migrations/20250703131500_fix_get_leaderboard_rpc.sql

-- Drop the old function first
DROP FUNCTION IF EXISTS public.get_leaderboard(uuid);

-- Create a new, more flexible function to get the leaderboard
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_class_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  name text,
  total_points integer,
  level integer,
  current_streak integer,
  class_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET SEARCH_PATH = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.total_points,
    s.level,
    s.current_streak,
    c.name AS class_name
  FROM students s
  LEFT JOIN classes c ON s.class_id = c.id
  -- Filter by class_id if p_class_id is provided, otherwise return all students
  WHERE (p_class_id IS NULL OR s.class_id = p_class_id)
  ORDER BY s.total_points DESC, s.level DESC, s.current_streak DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_leaderboard(uuid) TO authenticated;
