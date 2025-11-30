-- supabase/migrations/20250701200500_create_teacher_user_rpc.sql

create or replace function public.create_teacher_user(
  p_name text,
  p_email text
)
returns table (
  id uuid,
  user_id uuid,
  name text,
  email text,
  created_at timestamptz,
  temporary_password text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_user_id uuid;
  new_teacher_id uuid;
  temp_password text;
begin
  -- 1. Generate a random temporary password
  temp_password := substr(md5(random()::text), 0, 9);

  -- 2. Create the user in Supabase Auth
  new_user_id := auth.uid() from auth.users where raw_user_meta_data->>'email' = p_email;

  if new_user_id is null then
    insert into auth.users (email, password, raw_user_meta_data, email_confirmed_at)
    values (p_email, crypt(temp_password, gen_salt('bf')), jsonb_build_object('name', p_name, 'role', 'teacher', 'requires_password_change', true), now())
    returning id into new_user_id;
  end if;

  -- 3. Create the teacher profile in the 'teachers' table
  insert into public.teachers (user_id, name, email)
  values (new_user_id, p_name, p_email)
  returning id into new_teacher_id;

  -- 4. Link the user to the 'teacher' role in 'user_roles'
  insert into public.user_roles (user_id, role, profile_id)
  values (new_user_id, 'teacher', new_teacher_id);

  -- 5. Return the new teacher's data
  return query
    select
      t.id,
      t.user_id,
      t.name,
      t.email,
      t.created_at,
      temp_password as temporary_password
    from public.teachers t
    where t.id = new_teacher_id;
end;
$$;
