-- Trigger function to auto-update student level based on total_points
CREATE OR REPLACE FUNCTION public.update_student_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level := GREATEST(1, FLOOR(NEW.total_points / 100) + 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS trg_update_student_level ON public.students;

-- Create trigger to update level before update on students
CREATE TRIGGER trg_update_student_level
BEFORE UPDATE OF total_points ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_student_level();
