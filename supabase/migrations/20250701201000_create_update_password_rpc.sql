-- supabase/migrations/20250701201000_create_update_password_rpc.sql

create or replace function public.update_user_password(
  new_password text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- This function can only be called by an authenticated user.
  -- The user's ID is automatically available via auth.uid().
  if auth.uid() is null then
    raise exception 'User not authenticated';
  end if;

  -- Update the user's password in the auth.users table.
  update auth.users
  set
    encrypted_password = crypt(new_password, gen_salt('bf'))
  where
    id = auth.uid();
end;
$$;
