-- Create function to automatically set teacher_id when quiz is created
CREATE OR REPLACE FUNCTION set_quiz_teacher_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If teacher_id is not set, get it from the created_by field
    IF NEW.teacher_id IS NULL AND NEW.created_by IS NOT NULL THEN
        SELECT user_id INTO NEW.teacher_id 
        FROM teachers 
        WHERE id = NEW.created_by;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
