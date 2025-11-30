-- supabase/migrations/20250701220500_secure_classes_and_roles_rls.sql

-- Secure CLASSES table
-- 1. Admins can do anything.
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
CREATE POLICY "Admins can manage classes" ON public.classes
  FOR ALL
  USING (public.get_my_role() = 'admin');

-- 2. Teachers can manage their own classes (but not create/delete if admin-only is desired).
-- We will combine the previous ALL policy with this one under a single name.
DROP POLICY IF EXISTS "Teachers can manage their own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view their own classes" ON public.classes;
CREATE POLICY "Teachers can manage their own classes" ON public.classes
  FOR ALL
  USING (public.get_my_role() = 'teacher' AND (SELECT profile_id FROM user_roles WHERE user_id = auth.uid()) = teacher_id);

-- Secure USER_ROLES table
-- 1. Admins can do anything.
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL
  USING (public.get_my_role() = 'admin');

-- 2. Users can view their own role.
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);
