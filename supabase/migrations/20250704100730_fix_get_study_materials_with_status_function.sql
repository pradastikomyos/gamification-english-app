-- Drop existing functions and create correct one for study_materials table
DROP FUNCTION IF EXISTS public.get_study_materials_with_status();
DROP FUNCTION IF EXISTS public.get_study_materials_with_status(uuid);

-- Create correct RPC function for study_materials
CREATE OR REPLACE FUNCTION public.get_study_materials_with_status()
RETURNS TABLE(
    id uuid,
    title text,
    description text,
    type text,
    category text,
    difficulty text,
    estimated_time integer,
    rating numeric,
    url text,
    content text,
    status text
)
LANGUAGE plpgsql
SECURITY DEFINER
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
        0::numeric as rating, -- Default rating since we don't have rating in study_materials yet
        sm.url,
        sm.content,
        'not_started'::text as status -- Default status since we don't have user_material_status yet
    FROM
        public.study_materials sm
    ORDER BY sm.created_at DESC;
END;
$$;
