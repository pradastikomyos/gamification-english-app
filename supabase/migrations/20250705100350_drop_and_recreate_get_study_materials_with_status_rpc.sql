DROP FUNCTION IF EXISTS get_study_materials_with_status();
CREATE OR REPLACE FUNCTION get_study_materials_with_status()
RETURNS TABLE (
  id uuid,
  title character varying,
  description text,
  type character varying,
  category character varying,
  difficulty character varying,
  estimated_time integer,
  is_completed boolean,
  rating numeric,
  url text,
  content text
) 
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
    COALESCE(ums.is_completed, false) as is_completed,
    COALESCE(sm.rating, 0)::numeric as rating,
    sm.url,
    sm.content
  FROM 
    public.study_materials sm
  LEFT JOIN 
    public.user_material_status ums ON sm.id = ums.material_id AND ums.user_id = auth.uid()
  ORDER BY 
    sm.created_at DESC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_study_materials_with_status() TO authenticated;
