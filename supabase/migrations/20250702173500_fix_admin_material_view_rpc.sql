CREATE OR REPLACE FUNCTION get_all_materials_admin()
RETURNS TABLE(
    id uuid,
    title text,
    description text,
    content_url text,
    created_at timestamptz,
    teacher_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.title,
        m.description,
        m.content_url,
        m.created_at,
        t.name AS teacher_name
    FROM
        public.materials m
    LEFT JOIN
        public.teachers t ON m.created_by = t.id
    ORDER BY
        m.created_at DESC;
END;
$$;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION get_all_materials_admin() TO authenticated;
