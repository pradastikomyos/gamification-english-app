-- Recreate the function WITHOUT the problematic SET LOCAL statement.
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- The SECURITY DEFINER property makes this function run with the permissions of the owner (a superuser),
  -- which bypasses the RLS policy on the profiles table, thus preventing recursion.
  -- The SET LOCAL role = 'service_role' was incorrect and is not allowed by PostgreSQL.
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
