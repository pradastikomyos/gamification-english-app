DROP FUNCTION IF EXISTS public.get_school_leaderboard();
CREATE OR REPLACE FUNCTION public.get_school_leaderboard()
RETURNS TABLE(
    id uuid,
    name text,
    total_points integer,
    level integer,
    current_streak integer,
    class_name text
)
LANGUAGE 'plpgsql'
AS $BODY$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.name::text,
        s.total_points,
        s.level,
        s.current_streak,
        c.name AS class_name
    FROM
        public.students s
    LEFT JOIN
        public.classes c ON s.class_id = c.id
    ORDER BY
        s.total_points DESC;
END;
$BODY$;

GRANT EXECUTE ON FUNCTION public.get_school_leaderboard() TO authenticated;
