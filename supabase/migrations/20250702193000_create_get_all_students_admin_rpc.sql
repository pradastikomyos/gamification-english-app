DROP FUNCTION IF EXISTS get_all_students_admin();

create or replace function get_all_students_admin()
returns table (
    profile_id uuid, -- Renamed 'id' to 'profile_id'
    user_id uuid,
    name text,
    email text,
    student_id text,
    created_at timestamptz
)
language plpgsql
security definer set search_path = public
as $$
begin
    if not is_admin(auth.uid()) then
        raise exception 'You are not authorized to perform this action.';
    end if;

    return query
    select
        s.id as profile_id,
        u.id as user_id,
        s.name,
        s.email,
        s.student_id,
        s.created_at
    from students s
    join auth.users u on s.user_id = u.id
    order by s.created_at desc;
end;
$$;

grant execute on function get_all_students_admin() to authenticated;
