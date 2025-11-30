CREATE OR REPLACE FUNCTION get_all_teachers_admin()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name VARCHAR,
  email VARCHAR,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user is an admin
  IF NOT EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Forbidden: You must be an admin to access this resource.';
  END IF;

  RETURN QUERY
  SELECT
    t.id,
    t.user_id,
    t.name,
    t.email,
    t.created_at
  FROM teachers t
  ORDER BY t.created_at DESC;
END;
$$;
