DROP FUNCTION IF EXISTS public.get_study_materials_with_status();

CREATE OR REPLACE FUNCTION get_study_materials_with_status()
RETURNS TABLE(
    id UUID,
    title TEXT,
    description TEXT,
    content_url TEXT,
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
        COALESCE(ums.status, 'not_started') AS status
    FROM
        public.materials m
    LEFT JOIN
        public.user_material_status ums ON m.id = ums.material_id AND ums.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;
