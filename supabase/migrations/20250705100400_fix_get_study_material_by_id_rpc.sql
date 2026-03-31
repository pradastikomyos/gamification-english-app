DROP FUNCTION IF EXISTS get_study_material_by_id(UUID);
CREATE OR REPLACE FUNCTION public.get_study_material_by_id(p_material_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    type TEXT,
    category TEXT,
    difficulty TEXT,
    estimated_time INTEGER,
    rating NUMERIC,
    url TEXT,
    content TEXT,
    is_completed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        sm.id,
        sm.title,
        sm.description,
        sm.type,
        sm.category,
        sm.difficulty,
        sm.estimated_time,
        sm.rating,
        sm.url,
        sm.content,
        COALESCE(ums.is_completed, false) as is_completed
    FROM
        public.study_materials sm
    LEFT JOIN
        public.user_material_status ums ON sm.id = ums.material_id AND ums.user_id = auth.uid()
    WHERE
        sm.id = p_material_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_study_material_by_id(UUID) TO authenticated;
