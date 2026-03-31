DROP FUNCTION IF EXISTS public.submit_quiz_attempt(uuid, jsonb, integer);

CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(p_quiz_id uuid, p_student_answers jsonb, p_time_taken_seconds integer)
 RETURNS TABLE(final_score numeric, base_score numeric, bonus_points numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_student_id UUID;
    v_user_id UUID := auth.uid();
    v_question RECORD;
    v_selected_option_id TEXT;
    v_is_correct BOOLEAN;
    v_base_score NUMERIC := 0;
    v_bonus_points NUMERIC := 0;
    v_final_score NUMERIC := 0;
    v_time_limit_seconds INTEGER;
    v_time_taken_percentage NUMERIC;
    v_attempt_id UUID;
BEGIN
    -- Get the student profile ID from the user_id
    SELECT id INTO v_student_id FROM public.students WHERE user_id = v_user_id;
    
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Student profile not found for authenticated user';
    END IF;

    -- Check if quiz attempt already exists (prevent duplicate submissions)
    IF EXISTS (SELECT 1 FROM public.quiz_attempts WHERE quiz_id = p_quiz_id AND student_id = v_student_id) THEN
        RAISE EXCEPTION 'Quiz has already been attempted by this student';
    END IF;

    -- Get quiz time limit
    SELECT COALESCE(time_limit, time_limit_seconds) INTO v_time_limit_seconds 
    FROM public.quizzes WHERE id = p_quiz_id;

    -- Calculate base score based on question difficulty
    FOR v_question IN
        SELECT id, correct_answer, difficulty FROM public.questions WHERE quiz_id = p_quiz_id
    LOOP
        v_selected_option_id := p_student_answers ->> v_question.id::TEXT;
        v_is_correct := v_selected_option_id = v_question.correct_answer;

        IF v_is_correct THEN
            CASE v_question.difficulty
                WHEN 'easy' THEN v_base_score := v_base_score + 2;
                WHEN 'medium' THEN v_base_score := v_base_score + 3;
                WHEN 'hard' THEN v_base_score := v_base_score + 5;
                ELSE v_base_score := v_base_score + 0;
            END CASE;
        END IF;
    END LOOP;

    -- Calculate tiered time bonus
    IF v_time_limit_seconds IS NOT NULL AND v_time_limit_seconds > 0 THEN
        v_time_taken_percentage := (p_time_taken_seconds::NUMERIC / v_time_limit_seconds) * 100;
        
        IF v_time_taken_percentage <= 25 THEN
            v_bonus_points := 30;
        ELSIF v_time_taken_percentage <= 50 THEN
            v_bonus_points := 20;
        ELSIF v_time_taken_percentage <= 75 THEN
            v_bonus_points := 10;
        ELSE
            v_bonus_points := 0;
        END IF;
    END IF;
    
    v_final_score := v_base_score + v_bonus_points;

    -- Insert into quiz_attempts
    INSERT INTO public.quiz_attempts (quiz_id, student_id, final_score, base_score, bonus_points, time_taken_seconds, completed_at, answers)
    VALUES (p_quiz_id, v_student_id, v_final_score, v_base_score, v_bonus_points, p_time_taken_seconds, NOW(), p_student_answers)
    RETURNING id INTO v_attempt_id;

    -- Update student's total points
    UPDATE public.students
    SET total_points = total_points + v_final_score
    WHERE id = v_student_id;

    RETURN QUERY SELECT v_final_score, v_base_score, v_bonus_points;
END;
$function$
