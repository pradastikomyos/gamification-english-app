-- Fungsi untuk menghitung level berdasarkan total points
CREATE OR REPLACE FUNCTION calculate_student_level()
RETURNS TRIGGER AS $$
BEGIN
    -- Update level berdasarkan total_points
    -- Setiap 100 poin = 1 level, minimum level 1
    NEW.level = GREATEST(1, (NEW.total_points / 100) + 1);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger yang akan dipanggil setiap kali total_points berubah
CREATE TRIGGER update_student_level_on_points_change
    BEFORE UPDATE OF total_points ON students
    FOR EACH ROW
    WHEN (OLD.total_points IS DISTINCT FROM NEW.total_points)
    EXECUTE FUNCTION calculate_student_level();

-- Trigger yang akan dipanggil saat INSERT student baru
CREATE TRIGGER update_student_level_on_insert
    BEFORE INSERT ON students
    FOR EACH ROW
    EXECUTE FUNCTION calculate_student_level();

-- Update level untuk data yang sudah ada
UPDATE students 
SET level = GREATEST(1, (total_points / 100) + 1)
WHERE level != GREATEST(1, (total_points / 100) + 1);
