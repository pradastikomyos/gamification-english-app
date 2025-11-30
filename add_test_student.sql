-- Insert test student manually
-- Ganti class_id dengan ID kelas yang ada di database

INSERT INTO students (
  name,
  email, 
  student_id,
  class_id,
  total_points,
  level,
  current_streak
) VALUES (
  'Ahmad Rizki',
  'ahmad.rizki@gmail.com',
  '12345',
  '30d609e4-5b6f-47a5-9b51-91c301801fa5', -- Ganti dengan class ID yang benar
  0,
  1,
  0
);

-- Cek hasil
SELECT * FROM students;
