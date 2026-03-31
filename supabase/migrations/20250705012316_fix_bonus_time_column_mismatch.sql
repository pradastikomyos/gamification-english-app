-- Fix function submit_quiz_attempt to read from correct time_limit column
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(p_quiz_id uuid, p_student_answers jsonb, p_time_taken_seconds integer)
 RETURNS TABLE(final_score numeric, base_score numeric, bonus_points numeric, results_breakdown jsonb)
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
    v_attempt_id UUID;
    v_results_breakdown JSONB := '[]'::JSONB;
    v_time_percentage NUMERIC;
BEGIN
    -- Get the student_id from the students table using the authenticated user's id
    SELECT id INTO v_student_id FROM public.students WHERE user_id = v_user_id;

    -- Get quiz time limit from the correct column (time_limit, not time_limit_seconds)
    SELECT time_limit INTO v_time_limit_seconds FROM public.quizzes WHERE id = p_quiz_id;

    -- Calculate base score and build results breakdown
    FOR v_question IN
        SELECT id, question_text, difficulty, correct_answer, points FROM public.questions WHERE quiz_id = p_quiz_id
    LOOP
        v_selected_option_id := p_student_answers ->> v_question.id::TEXT;
        v_is_correct := v_selected_option_id = v_question.correct_answer;

        IF v_is_correct THEN
            v_base_score := v_base_score + v_question.points;
        END IF;

        v_results_breakdown := v_results_breakdown || jsonb_build_object(
            'question_id', v_question.id,
            'question_text', v_question.question_text,
            'difficulty', v_question.difficulty,
            'student_answer', v_selected_option_id,
            'correct_answer', v_question.correct_answer,
            'is_correct', v_is_correct
        );
    END LOOP;

    -- Calculate bonus points dengan logika baru:
    -- 25% waktu tersisa (â‰¤25% waktu terpakai) = +30 poin
    -- 50% waktu tersisa (â‰¤50% waktu terpakai) = +20 poin  
    -- 75% waktu tersisa (â‰¤75% waktu terpakai) = +10 poin
    IF v_time_limit_seconds IS NOT NULL AND v_time_limit_seconds > 0 THEN
        v_time_percentage := (p_time_taken_seconds::NUMERIC / v_time_limit_seconds) * 100;
        
        IF v_time_percentage <= 25 THEN
            v_bonus_points := 30;
        ELSIF v_time_percentage <= 50 THEN
            v_bonus_points := 20;
        ELSIF v_time_percentage <= 75 THEN
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

    RETURN QUERY SELECT v_final_score, v_base_score, v_bonus_points, v_results_breakdown;
END;
$function$;
