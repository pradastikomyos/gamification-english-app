-- Migration: Fix get_study_materials_with_status RPC Function to work with study_materials table

-- Drop the old function if it exists
DROP FUNCTION IF EXISTS public.get_study_materials_with_status(UUID, UUID);

-- Create function that returns all study materials without requiring parameters
CREATE OR REPLACE FUNCTION public.get_study_materials_with_status()
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
    status TEXT
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
        'not_started'::TEXT as status  -- Default status for now since we don't have user progress tracking yet
    FROM
        public.study_materials sm
    ORDER BY sm.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_study_materials_with_status() TO authenticated;

-- Create function that returns specific study material (for MaterialViewer)
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
        FALSE as is_completed  -- Default to false since we don't have user progress tracking yet
    FROM
        public.study_materials sm
    WHERE
        sm.id = p_material_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_study_material_by_id(UUID) TO authenticated;
