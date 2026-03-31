-- Create new get_student_scores_for_teacher function
CREATE OR REPLACE FUNCTION get_student_scores_for_teacher(p_teacher_id UUID)
RETURNS TABLE(
    student_id UUID,
    student_name TEXT,
    total_score BIGINT,
    class_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ensure the user is authorized to view the scores
    IF NOT EXISTS (
        SELECT 1
        FROM teachers t
        WHERE t.id = p_teacher_id AND t.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You are not authorized to view these scores.';
    END IF;

    RETURN QUERY
    SELECT
        s.id AS student_id,
        s.name::TEXT AS student_name,
        COALESCE(SUM(qa.final_score), 0)::BIGINT AS total_score,
        c.name::TEXT AS class_name
    FROM
        students s
    LEFT JOIN
        quiz_attempts qa ON qa.student_id = s.id
    LEFT JOIN
        classes c ON s.class_id = c.id
    WHERE
        c.teacher_id = p_teacher_id
    GROUP BY
        s.id, s.name, c.name
    ORDER BY
        total_score DESC;
END;
$$;

-- Create new get_leaderboard_for_teacher function
CREATE OR REPLACE FUNCTION get_leaderboard_for_teacher(p_teacher_id UUID)
RETURNS TABLE(
    student_id UUID,
    student_name TEXT,
    total_score BIGINT,
    class_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ensure the user is authorized to view the leaderboard
    IF NOT EXISTS (
        SELECT 1
        FROM teachers t
        WHERE t.id = p_teacher_id AND t.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You are not authorized to view this leaderboard.';
    END IF;

    RETURN QUERY
    SELECT
        s.id AS student_id,
        s.name::TEXT AS student_name,
        COALESCE(SUM(qa.final_score), 0)::BIGINT AS total_score,
        c.name::TEXT AS class_name
    FROM
        students s
    LEFT JOIN
        quiz_attempts qa ON qa.student_id = s.id
    LEFT JOIN
        classes c ON s.class_id = c.id
    WHERE
        c.teacher_id = p_teacher_id
    GROUP BY
        s.id, s.name, c.name
    ORDER BY
        total_score DESC
    LIMIT 10;
END;
$$;
