-- supabase/migrations/20250701202000_create_update_user_rpcs.sql

-- Function to update a student's details
create or replace function public.update_student_details(
  p_profile_id uuid,
  p_name text,
  p_email text,
  p_student_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin') then
    raise exception 'Only admins can update users.';
  end if;

  -- Get the user_id from the profile id
  select user_id into v_user_id from public.students where id = p_profile_id;

  -- Update the profile table
  update public.students
  set
    name = p_name,
    email = p_email,
    student_id = p_student_id
  where
    id = p_profile_id;

  -- Update the auth.users table
  update auth.users
  set
    email = p_email,
    raw_user_meta_data = raw_user_meta_data || jsonb_build_object('name', p_name)
  where
    id = v_user_id;
end;
$$;

-- Function to update a teacher's details
create or replace function public.update_teacher_details(
  p_profile_id uuid,
  p_name text,
  p_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin') then
    raise exception 'Only admins can update users.';
  end if;

  -- Get the user_id from the profile id
  select user_id into v_user_id from public.teachers where id = p_profile_id;

  -- Update the profile table
  update public.teachers
  set
    name = p_name,
    email = p_email
  where
    id = p_profile_id;

  -- Update the auth.users table
  update auth.users
  set
    email = p_email,
    raw_user_meta_data = raw_user_meta_data || jsonb_build_object('name', p_name)
  where
    id = v_user_id;
end;
$$;
