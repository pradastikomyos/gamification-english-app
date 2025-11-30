-- supabase/migrations/20250701194500_create_student_user_rpc.sql

create or replace function public.create_student_user(
  p_name text,
  p_email text,
  p_student_id text
)
returns table (
  id uuid,
  user_id uuid,
  name text,
  email text,
  student_id text,
  points integer,
  created_at timestamptz,
  temporary_password text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_user_id uuid;
  new_student_profile_id uuid;
  temp_password text;
  existing_student_id uuid;
begin
  -- Check if a student with this email already exists in the students table
  select id into existing_student_id from public.students where email = p_email;
  if existing_student_id is not null then
    raise exception 'A student with this email already exists.';
  end if;

  -- Check if a user with this email already exists in auth.users
  select auth.users.id into new_user_id from auth.users where auth.users.email = p_email;

  -- If user does not exist in auth.users, create them
  if new_user_id is null then
    temp_password := substr(md5(random()::text), 0, 9);
    
    insert into auth.users (email, password, raw_user_meta_data, email_confirmed_at)
    values (p_email, crypt(temp_password, gen_salt('bf')), jsonb_build_object('name', p_name, 'role', 'student'), now())
    returning id into new_user_id;
  else
    -- User exists, but we will not return a password
    temp_password := 'EXISTING_USER';
  end if;

  -- Create the student profile
  insert into public.students (user_id, name, email, student_id)
  values (new_user_id, p_name, p_email, p_student_id)
  returning id into new_student_profile_id;

  -- Link user to the 'student' role
  insert into public.user_roles (user_id, role, profile_id)
  values (new_user_id, 'student', new_student_profile_id);

  -- Return the new student's data
  return query
    select
      s.id,
      s.user_id,
      s.name,
      s.email,
      s.student_id,
      s.points,
      s.created_at,
      temp_password as temporary_password
    from public.students s
    where s.id = new_student_profile_id;
end;
$$;
