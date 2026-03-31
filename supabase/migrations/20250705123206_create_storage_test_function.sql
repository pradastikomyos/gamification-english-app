-- Create a function that can be called by authenticated users to test storage access
CREATE OR REPLACE FUNCTION test_storage_access()
RETURNS jsonb 
LANGUAGE plpgsql 
SECURITY INVOKER
AS $$
DECLARE
  result jsonb := '{}';
  user_id uuid;
  user_role text;
  user_email text;
  bucket_exists boolean;
  bucket_public boolean;
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
  
  -- Check bucket
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'question-media') INTO bucket_exists;
  SELECT public INTO bucket_public FROM storage.buckets WHERE id = 'question-media' LIMIT 1;
  
  result := result || jsonb_build_object(
    'user_id', user_id,
    'user_role', user_role,  
    'user_email', user_email,
    'auth_role', auth.role(),
    'bucket_exists', bucket_exists,
    'bucket_public', bucket_public,
    'can_insert_test', (
      -- Test if user can theoretically insert to question-media bucket
      -- This simulates the RLS check without actually inserting
      CASE 
        WHEN auth.role() = 'authenticated' AND EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.uid() 
          AND ur.role IN ('teacher', 'admin')
        ) THEN true
        ELSE false
      END
    )
  );

  RETURN result;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION test_storage_access() TO authenticated;
