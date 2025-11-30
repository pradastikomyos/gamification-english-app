-- Insert admin test data
-- WARNING: This is for development only. In production, admins should be created through proper authentication flows.

-- Create test teachers
INSERT INTO teachers (id, name, email, created_at) VALUES 
  (gen_random_uuid(), 'John Smith', 'john.smith@school.com', NOW()),
  (gen_random_uuid(), 'Sarah Johnson', 'sarah.johnson@school.com', NOW()),
  (gen_random_uuid(), 'Michael Brown', 'michael.brown@school.com', NOW());

-- Create test classes
INSERT INTO classes (name, teacher_id, created_at) VALUES 
  ('Mathematics Grade 10', (SELECT id FROM teachers WHERE email = 'john.smith@school.com' LIMIT 1), NOW()),
  ('English Grade 9', (SELECT id FROM teachers WHERE email = 'sarah.johnson@school.com' LIMIT 1), NOW()),
  ('Science Grade 11', (SELECT id FROM teachers WHERE email = 'michael.brown@school.com' LIMIT 1), NOW());

-- Create some test students (without user_id for now since we don't have auth users)
INSERT INTO students (name, email, student_id, class_id, total_points, level, current_streak, created_at) VALUES 
  ('Alice Cooper', 'alice.cooper@student.com', 'STU001', (SELECT id FROM classes WHERE name = 'Mathematics Grade 10' LIMIT 1), 150, 2, 5, NOW()),
  ('Bob Wilson', 'bob.wilson@student.com', 'STU002', (SELECT id FROM classes WHERE name = 'English Grade 9' LIMIT 1), 200, 3, 8, NOW()),
  ('Charlie Davis', 'charlie.davis@student.com', 'STU003', (SELECT id FROM classes WHERE name = 'Science Grade 11' LIMIT 1), 100, 1, 3, NOW()),
  ('Diana Miller', 'diana.miller@student.com', 'STU004', (SELECT id FROM classes WHERE name = 'Mathematics Grade 10' LIMIT 1), 180, 2, 6, NOW());
