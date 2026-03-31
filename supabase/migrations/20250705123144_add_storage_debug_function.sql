-- Create a debug function to check storage access
CREATE OR REPLACE FUNCTION debug_storage_access()
RETURNS jsonb 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  result jsonb := '{}';
  user_id uuid;
  user_role text;
  user_email text;
BEGIN
  -- Get current user info
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    result := result || jsonb_build_object('error', 'No authenticated user');
    RETURN result;
  END IF;

  -- Get user role from user_roles table
  SELECT role INTO user_role FROM user_roles WHERE user_roles.user_id = auth.uid();
  
  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  result := result || jsonb_build_object(
    'user_id', user_id,
    'user_role', user_role,
    'user_email', user_email,
    'auth_role', auth.role()
  );

  -- Check if question-media bucket exists and is accessible
  result := result || jsonb_build_object(
    'bucket_exists', EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'question-media'),
    'bucket_public', (SELECT public FROM storage.buckets WHERE id = 'question-media' LIMIT 1)
  );

  -- Check policies
  result := result || jsonb_build_object(
    'insert_policies', (
      SELECT jsonb_agg(jsonb_build_object('name', policyname, 'roles', roles))
      FROM pg_policies 
      WHERE schemaname = 'storage' AND tablename = 'objects' AND cmd = 'INSERT'
      AND (policyname ILIKE '%question%' OR policyname ILIKE '%teacher%')
    )
  );

  RETURN result;
END;
$$;
