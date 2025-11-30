-- Migration: Create get_study_material_details RPC Function

CREATE OR REPLACE FUNCTION public.get_study_material_details(p_material_id UUID)
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
    storage_path TEXT,
    content TEXT,
    is_completed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the current authenticated user's ID
    SELECT auth.uid() INTO current_user_id;

    RETURN QUERY
    SELECT
        m.id,
        m.title,
        m.description,
        m.type::TEXT, -- Explicitly cast to TEXT to resolve mismatch
        m.category,
        m.difficulty,
        m.estimated_time,
        m.rating,
        m.url AS content_url,
        m.storage_path,
        m.content,
        CASE WHEN ums.material_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_completed
    FROM
        public.study_materials m
    LEFT JOIN
        public.user_material_status ums ON m.id = ums.material_id AND ums.user_id = current_user_id
    WHERE
        m.id = p_material_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_study_material_details(UUID) TO authenticated;
