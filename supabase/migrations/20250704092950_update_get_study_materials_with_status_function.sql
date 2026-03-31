CREATE OR REPLACE FUNCTION public.get_study_materials_with_status()
 RETURNS TABLE(id uuid, title text, description text, type text, category text, difficulty text, estimated_time integer, is_completed boolean, rating numeric, url text, content text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
        -- For now, assume not completed. In a full implementation, this would join with user progress tables.
        FALSE AS is_completed,
        -- For now, assume a default rating or calculate from a ratings table.
        0.0::numeric AS rating,
        sm.url,
        sm.content
    FROM
        public.study_materials sm;
END;
$function$;
