-- supabase/migrations/20250704110000_create_admin_user_rpc.sql

create or replace function public.create_admin_user(
  p_name text,
  p_email text,
  p_password text
)
returns table (
  id uuid,
  user_id uuid,
  name text,
  email text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_user_id uuid := gen_random_uuid(); -- Generate UUID here
  new_admin_id uuid;
begin
  -- 1. Create the user in Supabase Auth
  insert into auth.users (id, email, encrypted_password, raw_user_meta_data, email_confirmed_at)
  values (new_user_id, p_email, crypt(p_password, gen_salt('bf')), jsonb_build_object('name', p_name, 'role', 'admin', 'requires_password_change', true), now());

  -- 2. Create the admin profile in the 'admins' table (assuming an 'admins' table exists or will be created)
  -- For now, we'll just link to the user_roles table directly as there's no dedicated 'admins' table in the schema.
  -- If a dedicated 'admins' table is needed, this part should be updated.

  -- 3. Link the user to the 'admin' role in 'user_roles'
  insert into public.user_roles (user_id, role, profile_id)
  values (new_user_id, 'admin', new_user_id) -- Using user_id as profile_id for admin for simplicity
  returning id into new_admin_id;

  -- 4. Return the new admin's data
  return query
    select
      new_admin_id as id,
      new_user_id as user_id,
      p_name as name,
      p_email as email,
      now() as created_at;
end;
$$;

-- Grant execute permission to the service_role (or a specific admin role if available)
-- For initial setup, granting to service_role is common.
-- In production, consider a more granular permission model.
GRANT EXECUTE ON FUNCTION create_admin_user(text, text, text) TO service_role;