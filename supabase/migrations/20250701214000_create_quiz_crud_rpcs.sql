-- Migration: Create CRUD RPC Functions for Quizzes

-- 1. Function to create a new quiz
CREATE OR REPLACE FUNCTION public.create_quiz(p_title TEXT, p_description TEXT)
RETURNS public.quizzes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_quiz public.quizzes;
BEGIN
  -- Ensure the user is an admin
  IF (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can create quizzes.';
  END IF;

  INSERT INTO public.quizzes (title, description)
  VALUES (p_title, p_description)
  RETURNING * INTO new_quiz;

  RETURN new_quiz;
END;
$$;

-- 2. Function to update an existing quiz
CREATE OR REPLACE FUNCTION public.update_quiz(p_quiz_id UUID, p_title TEXT, p_description TEXT)
RETURNS public.quizzes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_quiz public.quizzes;
BEGIN
  -- Ensure the user is an admin
  IF (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can update quizzes.';
  END IF;

  UPDATE public.quizzes
  SET
    title = p_title,
    description = p_description,
    updated_at = now()
  WHERE id = p_quiz_id
  RETURNING * INTO updated_quiz;

  RETURN updated_quiz;
END;
$$;

-- 3. Function to delete a quiz
CREATE OR REPLACE FUNCTION public.delete_quiz(p_quiz_id UUID)
RETURNS public.quizzes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_quiz public.quizzes;
BEGIN
  -- Ensure the user is an admin
  IF (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete quizzes.';
  END IF;

  DELETE FROM public.quizzes
  WHERE id = p_quiz_id
  RETURNING * INTO deleted_quiz;

  RETURN deleted_quiz;
END;
$$;
