CREATE OR REPLACE FUNCTION get_students_for_teacher(p_teacher_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  class_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function retrieves all students assigned to classes taught by a specific teacher.
  -- It joins classes with students, and then with users to get the student details.
  RETURN QUERY
  SELECT
    s.user_id AS id,
    u.raw_user_meta_data->>'full_name' AS name,
    u.email::text, -- Cast to TEXT to match the return type and fix the error
    c.name::text AS class_name -- Cast to TEXT for consistency
  FROM
    public.classes c
  JOIN
    public.students s ON c.id = s.class_id
  JOIN
    auth.users u ON s.user_id = u.id
  WHERE
    c.teacher_id = p_teacher_id;
END;
$$;    students s ON u.id = s.user_id
  JOIN
    classes c ON s.class_id = c.id
  WHERE
    ur.role = 'student' AND
    c.teacher_id = p_teacher_id;
END;
$$;
