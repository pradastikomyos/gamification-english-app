-- Create the assign_quiz_to_classes_admin RPC function
CREATE OR REPLACE FUNCTION assign_quiz_to_classes_admin(
    p_quiz_id UUID,
    p_class_ids UUID[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET SEARCH_PATH = public
AS $$
DECLARE
    class_id_elem UUID;
    quiz_exists BOOLEAN;
BEGIN
    -- Check if the user is an admin
    IF NOT is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only administrators can assign quizzes.';
    END IF;

    -- Verify that the quiz exists
    SELECT EXISTS(SELECT 1 FROM public.quizzes WHERE id = p_quiz_id) INTO quiz_exists;
    IF NOT quiz_exists THEN
        RAISE EXCEPTION 'Quiz with id % does not exist.', p_quiz_id;
    END IF;

    -- Loop through the array of class IDs and insert into class_quizzes
    FOREACH class_id_elem IN ARRAY p_class_ids
    LOOP
        INSERT INTO public.class_quizzes (quiz_id, class_id, assigned_at)
        VALUES (p_quiz_id, class_id_elem, now())
        ON CONFLICT (quiz_id, class_id) DO NOTHING; -- Avoid duplicates
    END LOOP;
END;
$$;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION assign_quiz_to_classes_admin(UUID, UUID[]) TO authenticated;
