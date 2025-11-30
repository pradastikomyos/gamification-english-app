-- supabase/migrations/20250703130500_fix_delete_user_rpcs.sql

-- Function to delete a student and their auth user, now also deletes their role
create or replace function public.delete_student_user(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Enforce admin-only access
  if not exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin') then
    raise exception 'Only admins can delete users.';
  end if;

  -- Delete the user's role first to satisfy foreign key constraints
  delete from public.user_roles where user_id = p_user_id;

  -- Now, delete the user from the auth schema.
  delete from auth.users where id = p_user_id;
end;
$$;

-- Function to delete a teacher and their auth user, now also deletes their role
create or replace function public.delete_teacher_user(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Enforce admin-only access
  if not exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin') then
    raise exception 'Only admins can delete users.';
  end if;

  -- Delete the user's role first to satisfy foreign key constraints
  delete from public.user_roles where user_id = p_user_id;

  -- Now, delete the user from the auth schema.
  delete from auth.users where id = p_user_id;
end;
$$;
