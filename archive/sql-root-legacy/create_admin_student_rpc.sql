-- Create RPC function for admin to get all students, bypassing RLS
CREATE OR REPLACE FUNCTION get_all_students_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name varchar,
  email varchar,
  student_id varchar,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Return all students (bypassing RLS)
  RETURN QUERY
  SELECT s.id, s.user_id, s.name, s.email, s.student_id, s.created_at
  FROM students s
  ORDER BY s.created_at DESC;
END;
$$;
