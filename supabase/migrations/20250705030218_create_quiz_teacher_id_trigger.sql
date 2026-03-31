-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_set_quiz_teacher_id ON quizzes;

-- Create trigger to automatically set teacher_id before insert/update
CREATE TRIGGER trigger_set_quiz_teacher_id
    BEFORE INSERT OR UPDATE ON quizzes
    FOR EACH ROW
    EXECUTE FUNCTION set_quiz_teacher_id();
