DROP FUNCTION IF EXISTS public.get_class_leaderboard(UUID);
CREATE OR REPLACE FUNCTION public.get_class_leaderboard(p_class_id UUID)
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
        c.name::text AS class_name
    FROM
        public.students s
    LEFT JOIN
        public.classes c ON s.class_id = c.id
    WHERE
        s.class_id = p_class_id
    ORDER BY
        s.total_points DESC;
END;
$BODY$;

GRANT EXECUTE ON FUNCTION public.get_class_leaderboard(UUID) TO authenticated;
