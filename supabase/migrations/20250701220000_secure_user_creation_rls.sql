-- supabase/migrations/20250701220000_secure_user_creation_rls.sql

-- Helper function to check current user's role. Returns 'public' if not authenticated.
CREATE OR REPLACE FUNCTION public.get_my_role() 
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 'public';
  END IF;
  RETURN (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1)::text;
EXCEPTION 
  WHEN OTHERS THEN
    RETURN 'public';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- Drop existing open policies if they exist, to be replaced by stricter ones.
-- Note: It's often better to ALTER policies, but for clarity in this migration, we'll drop and create.

-- Secure TEACHERS table
-- 1. Admins can do anything.
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;
CREATE POLICY "Admins can manage teachers" ON public.teachers
  FOR ALL
  USING (public.get_my_role() = 'admin');

-- 2. Teachers can view their own profile.
DROP POLICY IF EXISTS "Teachers can view their own data" ON public.teachers;
CREATE POLICY "Teachers can view their own data" ON public.teachers
  FOR SELECT
  USING (public.get_my_role() = 'teacher' AND (SELECT profile_id FROM user_roles WHERE user_id = auth.uid()) = id);

-- 3. Teachers can update their own profile.
DROP POLICY IF EXISTS "Teachers can update their own data" ON public.teachers;
CREATE POLICY "Teachers can update their own data" ON public.teachers
  FOR UPDATE
  USING (public.get_my_role() = 'teacher' AND (SELECT profile_id FROM user_roles WHERE user_id = auth.uid()) = id);

-- Secure STUDENTS table
-- 1. Admins can do anything.
DROP POLICY IF EXISTS "Admins can manage students" ON public.students;
CREATE POLICY "Admins can manage students" ON public.students
  FOR ALL
  USING (public.get_my_role() = 'admin');

-- 2. Teachers can view students in their classes.
DROP POLICY IF EXISTS "Teachers can view their students" ON public.students;
CREATE POLICY "Teachers can view their students" ON public.students
  FOR SELECT
  USING (public.get_my_role() = 'teacher' AND class_id IN (SELECT id FROM classes WHERE teacher_id = (SELECT profile_id FROM user_roles WHERE user_id = auth.uid())));

-- 3. Students can view their own profile.
DROP POLICY IF EXISTS "Students can view their own data" ON public.students;
CREATE POLICY "Students can view their own data" ON public.students
  FOR SELECT
  USING (public.get_my_role() = 'student' AND user_id = auth.uid());

-- 4. Students can update their own profile.
DROP POLICY IF EXISTS "Students can update their own data" ON public.students;
CREATE POLICY "Students can update their own data" ON public.students
  FOR UPDATE
  USING (public.get_my_role() = 'student' AND user_id = auth.uid());

-- Ensure default is DENY
-- By having specified policies for ALL, SELECT, UPDATE, any action not matching is denied.
-- No explicit INSERT policy for non-admins means they cannot insert.
