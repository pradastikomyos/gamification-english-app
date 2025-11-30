BEGIN;

-- Drop dependent policies
DROP POLICY IF EXISTS "Admins can manage all teachers" ON "public"."teachers";
DROP POLICY IF EXISTS "Admins can manage all classes" ON "public"."classes";
DROP POLICY IF EXISTS "Admins can manage all quizzes" ON "public"."quizzes";
DROP POLICY IF EXISTS "Admins can manage all questions" ON "public"."questions";
DROP POLICY IF EXISTS "Admins can manage all class_quizzes" ON "public"."class_quizzes";
DROP POLICY IF EXISTS "Admins can view all user_progress" ON "public"."user_progress";
DROP POLICY IF EXISTS "Admins can insert user roles." ON "public"."user_roles";
DROP POLICY IF EXISTS "Admins can update user roles." ON "public"."user_roles";
DROP POLICY IF EXISTS "Admins can delete user roles." ON "public"."user_roles";
DROP POLICY IF EXISTS "Admins can manage all materials" ON "public"."materials";
DROP POLICY IF EXISTS "admin_students_access" ON "public"."students";

-- Alter the column type
ALTER TABLE public.user_roles
ALTER COLUMN role TYPE user_role USING role::text::user_role;

-- Recreate policies
CREATE POLICY "Admins can manage all teachers" ON "public"."teachers" AS PERMISSIVE FOR ALL TO public USING ((get_user_role(auth.uid()) = 'admin'::user_role)) WITH CHECK ((get_user_role(auth.uid()) = 'admin'::user_role));
CREATE POLICY "Admins can manage all classes" ON "public"."classes" AS PERMISSIVE FOR ALL TO public USING ((get_user_role(auth.uid()) = 'admin'::user_role)) WITH CHECK ((get_user_role(auth.uid()) = 'admin'::user_role));
CREATE POLICY "Admins can manage all quizzes" ON "public"."quizzes" AS PERMISSIVE FOR ALL TO public USING ((get_user_role(auth.uid()) = 'admin'::user_role)) WITH CHECK ((get_user_role(auth.uid()) = 'admin'::user_role));
CREATE POLICY "Admins can manage all questions" ON "public"."questions" AS PERMISSIVE FOR ALL TO public USING ((get_user_role(auth.uid()) = 'admin'::user_role)) WITH CHECK ((get_user_role(auth.uid()) = 'admin'::user_role));
CREATE POLICY "Admins can manage all class_quizzes" ON "public"."class_quizzes" AS PERMISSIVE FOR ALL TO public USING ((get_user_role(auth.uid()) = 'admin'::user_role)) WITH CHECK ((get_user_role(auth.uid()) = 'admin'::user_role));
CREATE POLICY "Admins can view all user_progress" ON "public"."user_progress" AS PERMISSIVE FOR ALL TO public USING ((get_user_role(auth.uid()) = 'admin'::user_role)) WITH CHECK ((get_user_role(auth.uid()) = 'admin'::user_role));
CREATE POLICY "Admins can insert user roles." ON public.user_roles FOR INSERT TO authenticated WITH CHECK ((get_user_role(auth.uid()) = 'admin'::user_role));
CREATE POLICY "Admins can update user roles." ON "public"."user_roles" AS PERMISSIVE FOR UPDATE TO authenticated USING ((get_user_role(auth.uid()) = 'admin'::user_role)) WITH CHECK ((get_user_role(auth.uid()) = 'admin'::user_role));
CREATE POLICY "Admins can delete user roles." ON "public"."user_roles" AS PERMISSIVE FOR DELETE TO authenticated USING ((get_user_role(auth.uid()) = 'admin'::user_role));
CREATE POLICY "Admins can manage all materials" ON "public"."materials" AS PERMISSIVE FOR ALL TO authenticated USING ((get_user_role(auth.uid()) = 'admin'::user_role)) WITH CHECK ((get_user_role(auth.uid()) = 'admin'::user_role));
CREATE POLICY "admin_students_access" ON "public"."students" AS PERMISSIVE FOR ALL TO authenticated USING ((get_user_role(auth.uid()) = 'admin'::user_role));

COMMIT;
