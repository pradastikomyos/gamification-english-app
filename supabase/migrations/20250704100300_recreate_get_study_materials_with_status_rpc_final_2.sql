DROP FUNCTION IF EXISTS public.get_study_materials_with_status();

CREATE OR REPLACE FUNCTION get_study_materials_with_status()
RETURNS TABLE(
    id UUID,
    title TEXT,
    description TEXT,
    content_url TEXT,
    type TEXT,
    category TEXT,
    difficulty TEXT,
    estimated_time INTEGER,
    rating NUMERIC,
    status TEXT
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.title,
        m.description,
        m.content_url,
        m.type,
        m.category,
        m.difficulty,
        m.estimated_time,
        m.rating,
        COALESCE(ums.status, 'not_started') AS status
    FROM
        public.materials m
    LEFT JOIN
        public.user_material_status ums ON m.id = ums.material_id AND ums.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;
