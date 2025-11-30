-- supabase/migrations/20250701201500_create_delete_user_rpcs.sql

-- Function to delete a student and their auth user
create or replace function public.delete_student_user(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- This function can only be called by an authenticated admin.
  -- We'll enforce this with RLS on the frontend call, but adding a check here is good practice.
  if not exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin') then
    raise exception 'Only admins can delete users.';
  end if;

  -- Delete the user from the auth schema.
  -- The corresponding profiles in `students` and `user_roles` should be deleted automatically
  -- if you have set up "ON DELETE CASCADE" on your foreign key constraints.
  delete from auth.users where id = p_user_id;
end;
$$;

-- Function to delete a teacher and their auth user
create or replace function public.delete_teacher_user(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin') then
    raise exception 'Only admins can delete users.';
  end if;

  delete from auth.users where id = p_user_id;
end;
$$;
