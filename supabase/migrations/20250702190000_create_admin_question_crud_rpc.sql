-- Function to get all questions for a specific quiz (Admin only)
create or replace function get_questions_for_quiz_admin(p_quiz_id uuid)
returns table (like questions)
language plpgsql
security definer set search_path = public
as $$
begin
    -- Check if the user is an admin
    if not is_admin(auth.uid()) then
        raise exception 'You are not authorized to perform this action.';
    end if;

    return query
    select *
    from questions
    where quiz_id = p_quiz_id
    order by question_order;
end;
$$;

-- Function to create a question (Admin only)
create or replace function create_question_admin(
    p_quiz_id uuid,
    p_question_text text,
    p_options jsonb,
    p_correct_answer text,
    p_explanation text,
    p_points integer,
    p_difficulty text,
    p_media_url text
)
returns questions
language plpgsql
security definer set search_path = public
as $$
declare
    new_question questions;
begin
    if not is_admin(auth.uid()) then
        raise exception 'You are not authorized to perform this action.';
    end if;

    insert into questions (quiz_id, question_text, options, correct_answer, explanation, points, difficulty, media_url)
    values (p_quiz_id, p_question_text, p_options, p_correct_answer, p_explanation, p_points, p_difficulty, p_media_url)
    returning * into new_question;

    return new_question;
end;
$$;

-- Function to update a question (Admin only)
create or replace function update_question_admin(
    p_question_id uuid,
    p_question_text text,
    p_options jsonb,
    p_correct_answer text,
    p_explanation text,
    p_points integer,
    p_difficulty text,
    p_media_url text
)
returns questions
language plpgsql
security definer set search_path = public
as $$
declare
    updated_question questions;
begin
    if not is_admin(auth.uid()) then
        raise exception 'You are not authorized to perform this action.';
    end if;

    update questions
    set
        question_text = p_question_text,
        options = p_options,
        correct_answer = p_correct_answer,
        explanation = p_explanation,
        points = p_points,
        difficulty = p_difficulty,
        media_url = p_media_url
    where id = p_question_id
    returning * into updated_question;

    return updated_question;
end;
$$;

-- Function to delete a question (Admin only)
create or replace function delete_question_admin(p_question_id uuid)
returns questions
language plpgsql
security definer set search_path = public
as $$
declare
    deleted_question questions;
begin
    if not is_admin(auth.uid()) then
        raise exception 'You are not authorized to perform this action.';
    end if;

    delete from questions
    where id = p_question_id
    returning * into deleted_question;

    return deleted_question;
end;
$$;

grant execute on function get_questions_for_quiz_admin(uuid) to authenticated;
grant execute on function create_question_admin(uuid, text, jsonb, text, text, integer, text, text) to authenticated;
grant execute on function update_question_admin(uuid, text, jsonb, text, text, integer, text, text) to authenticated;
grant execute on function delete_question_admin(uuid) to authenticated;
