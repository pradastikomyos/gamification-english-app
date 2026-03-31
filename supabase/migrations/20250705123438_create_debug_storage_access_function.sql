-- Create function to debug storage access for current user
CREATE OR REPLACE FUNCTION debug_storage_access()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  user_role_info text;
  user_metadata jsonb;
  result jsonb;
BEGIN
  -- Get current user info
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'User not authenticated',
      'user_id', null,
      'role', null
    );
  END IF;
  
  -- Get user role from user_roles table
  SELECT ur.role INTO user_role_info
  FROM user_roles ur
  WHERE ur.user_id = current_user_id;
  
  -- Get user metadata from auth.users
  SELECT au.raw_user_meta_data INTO user_metadata
  FROM auth.users au
  WHERE au.id = current_user_id;
  
  -- Build result
  result := jsonb_build_object(
    'user_id', current_user_id,
    'role_from_table', user_role_info,
    'metadata', user_metadata,
    'auth_role', auth.role(),
    'can_access_question_media', (
      current_user_id IS NOT NULL AND 
      user_role_info IN ('teacher', 'admin')
    )
  );
  
  RETURN result;
END;
$$;
