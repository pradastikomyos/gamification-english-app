-- Migration: Create get_study_materials_with_status RPC Function

CREATE OR REPLACE FUNCTION public.get_study_materials_with_status(p_material_id UUID, p_user_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    type TEXT,
    category TEXT,
    difficulty TEXT,
    estimated_time INTEGER,
    rating NUMERIC,
    content_url TEXT,
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
        m.id,
        m.title,
        m.description,
        m.type,
        m.category,
        m.difficulty,
        m.estimated_time,
        m.rating,
        m.content_url,
        m.content,
        CASE WHEN ums.material_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_completed
    FROM
        public.materials m
    LEFT JOIN
        public.user_material_status ums ON m.id = ums.material_id AND ums.user_id = p_user_id
    WHERE
        m.id = p_material_id;
END;
$$;
