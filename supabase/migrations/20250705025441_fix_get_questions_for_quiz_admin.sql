CREATE OR REPLACE FUNCTION public.get_questions_for_quiz_admin(p_quiz_id uuid)
RETURNS TABLE("like" questions)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    user_id uuid;
BEGIN
    -- Get user ID from JWT
    user_id := (current_setting('request.jwt.claims', true)::json->>'sub')::uuid;
    
    -- Check if the user is an admin
    IF NOT public.is_admin(user_id) THEN
        RAISE EXCEPTION 'You are not authorized to perform this action.';
    END IF;

    RETURN QUERY
    SELECT *
    FROM public.questions
    WHERE quiz_id = p_quiz_id
    ORDER BY question_order;
END;
$function$;
