-- Drop semua fungsi get_study_materials_with_status
DROP FUNCTION IF EXISTS get_study_materials_with_status();
DROP FUNCTION IF EXISTS get_study_materials_with_status(uuid);

-- Buat ulang fungsi dengan parameter yang tepat
CREATE OR REPLACE FUNCTION get_study_materials_with_status()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  type text,
  category text,
  difficulty text,
  estimated_time integer,
  is_completed boolean,
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
    COALESCE(ums.is_completed, false) as is_completed,
    COALESCE(sm.rating, 0)::numeric as rating,
    sm.url,
    sm.content,
    CASE 
      WHEN ums.is_completed = true THEN 'completed'
      ELSE 'not_started'
    END as status
  FROM 
    public.study_materials sm
  LEFT JOIN 
    public.user_material_status ums ON sm.id = ums.material_id AND ums.user_id = auth.uid()
  ORDER BY 
    sm.created_at DESC;
END;
$$;
