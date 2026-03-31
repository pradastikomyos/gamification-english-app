-- Script untuk fix auth user yang hilang
-- Jalankan di Supabase SQL Editor

-- 1. Cek user yang ada di auth
SELECT email FROM auth.users;

-- 2. Cek students yang tidak punya auth user
SELECT s.email, s.name 
FROM students s 
LEFT JOIN auth.users au ON s.email = au.email 
WHERE au.email IS NULL;

-- 3. Manual insert auth user (gunakan Supabase Dashboard)
-- Atau buat signup manual untuk ahmad.rizki@gmail.com

-- 4. Setelah auth user dibuat, link dengan user_roles
INSERT INTO user_roles (user_id, role, profile_id) 
SELECT au.id, 'student', s.id
FROM auth.users au
JOIN students s ON au.email = s.email
WHERE au.email = 'ahmad.rizki@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = au.id
);
