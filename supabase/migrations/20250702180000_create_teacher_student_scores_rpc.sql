create or replace function get_student_scores_for_teacher(p_teacher_id uuid)
returns table (
    student_id uuid,
    student_name text,
    quiz_id uuid,
    quiz_title text,
    score integer,
    submitted_at timestamptz
)
language plpgsql
security definer set search_path = public
as $$
begin
    -- Ensure the user is authorized to view the scores
    if not exists (
        select 1
        from teachers t
        where t.id = p_teacher_id and t.user_id = auth.uid()
    ) then
        raise exception 'You are not authorized to view these scores.';
    end if;

    return query
    select
        s.id as student_id,
        s.name as student_name,
        q.id as quiz_id,
        q.title as quiz_title,
        sa.score,
        sa.submitted_at
    from
        student_attempts sa
    join
        students s on sa.student_id = s.id
    join
        quizzes q on sa.quiz_id = q.id
    join
        quiz_assignments qa on sa.quiz_id = qa.quiz_id and s.class_id = qa.class_id
    join
        classes c on qa.class_id = c.id
    where
        c.teacher_id = p_teacher_id
    order by
        sa.submitted_at desc;
end;
$$;

grant execute on function get_student_scores_for_teacher(uuid) to authenticated;
