-- Migration: Fix study materials RPC to work with existing materials table

-- Drop the problematic function versions
DROP FUNCTION IF EXISTS public.get_study_materials_with_status();
DROP FUNCTION IF EXISTS public.get_study_materials_with_status(UUID, UUID);

-- Create a simple function that works with the existing materials table structure
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
        m.id,
        m.title,
        m.description,
        'article'::TEXT as type,  -- Default type since materials table might not have this
        'general'::TEXT as category,  -- Default category since materials table might not have this
        'intermediate'::TEXT as difficulty,  -- Default difficulty since materials table might not have this
        30 as estimated_time,  -- Default estimated time
        0::NUMERIC as rating,  -- Default rating
        m.content_url as url,  -- Use content_url as url
        ''::TEXT as content,  -- Empty content for now
        'not_started'::TEXT as status  -- Default status
    FROM
        public.materials m
    ORDER BY m.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_study_materials_with_status() TO authenticated;
