create or replace function get_leaderboard_for_teacher(p_teacher_id uuid)
returns table (
    student_id uuid,
    student_name text,
    total_score bigint,
    class_name text
)
language plpgsql
security definer set search_path = public
as $$
begin
    -- Ensure the user is authorized to view the leaderboard
    if not exists (
        select 1
        from teachers t
        where t.id = p_teacher_id and t.user_id = auth.uid()
    ) then
        raise exception 'You are not authorized to view this leaderboard.';
    end if;

    return query
    select
        s.id as student_id,
        s.name as student_name,
        sum(sa.score)::bigint as total_score,
        c.name as class_name
    from
        student_attempts sa
    join
        students s on sa.student_id = s.id
    join
        classes c on s.class_id = c.id
    where
        c.teacher_id = p_teacher_id
    group by
        s.id, s.name, c.name
    order by
        total_score desc
    limit 10;
end;
$$;

grant execute on function get_leaderboard_for_teacher(uuid) to authenticated;
