-- Update auth users metadata to match user_roles
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', ur.role::text)
FROM user_roles ur
WHERE auth.users.id = ur.user_id 
AND (
  raw_user_meta_data->>'role' IS NULL 
  OR raw_user_meta_data->>'role' != ur.role::text
);
