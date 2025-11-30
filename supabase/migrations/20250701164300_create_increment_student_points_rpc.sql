CREATE OR REPLACE FUNCTION increment_student_points(student_uuid uuid, points_to_add integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.students
  SET total_points = total_points + points_to_add
  WHERE id = student_uuid;
END;
$$;
