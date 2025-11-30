-- supabase/migrations/20250701221500_qa_fixes_rls_indexes_policies.sql

BEGIN;

-- 1. Enable RLS on all tables that were missed.
-- The linter caught that some tables had policies but RLS was not enabled.
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
-- Re-asserting on others just in case.
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Add missing indexes to foreign keys for performance.
CREATE INDEX IF NOT EXISTS idx_class_quizzes_quiz_id ON public.class_quizzes(quiz_id);
CREATE INDEX IF NOT EXISTS idx_materials_teacher_id ON public.materials(teacher_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON public.questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_student_id ON public.user_achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON public.user_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_student_id ON public.user_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_quiz_id ON public.user_progress(quiz_id);

-- 3. Consolidate and fix RLS policies to be more efficient and secure.

-- TEACHERS TABLE
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;
DROP POLICY IF EXISTS "Teachers can view their own data" ON public.teachers;
DROP POLICY IF EXISTS "Teachers can update their own data" ON public.teachers;
CREATE POLICY "Enable all access for admins" ON public.teachers FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "Enable read access for teachers (self)" ON public.teachers FOR SELECT USING (public.get_my_role() = 'teacher' AND (SELECT profile_id FROM user_roles WHERE user_id = auth.uid()) = id);
CREATE POLICY "Enable update for teachers (self)" ON public.teachers FOR UPDATE USING (public.get_my_role() = 'teacher' AND (SELECT profile_id FROM user_roles WHERE user_id = auth.uid()) = id);

-- STUDENTS TABLE
DROP POLICY IF EXISTS "Admins can manage students" ON public.students;
DROP POLICY IF EXISTS "Teachers can view their students" ON public.students;
DROP POLICY IF EXISTS "Students can view their own data" ON public.students;
DROP POLICY IF EXISTS "Students can update their own data" ON public.students;
CREATE POLICY "Enable all access for admins" ON public.students FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "Enable read access for teachers and students (self)" ON public.students FOR SELECT USING (
  (public.get_my_role() = 'teacher' AND class_id IN (SELECT id FROM classes WHERE teacher_id = (SELECT profile_id FROM user_roles WHERE user_id = auth.uid()))) OR
  (public.get_my_role() = 'student' AND user_id = auth.uid())
);
CREATE POLICY "Enable update for students (self)" ON public.students FOR UPDATE USING (public.get_my_role() = 'student' AND user_id = auth.uid());

-- CLASSES TABLE
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can manage their own classes" ON public.classes;
CREATE POLICY "Enable all access for admins" ON public.classes FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "Enable all access for teachers (own classes)" ON public.classes FOR ALL USING (public.get_my_role() = 'teacher' AND (SELECT profile_id FROM user_roles WHERE user_id = auth.uid()) = teacher_id);

-- USER_ROLES TABLE
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "Enable all access for admins" ON public.user_roles FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "Enable read access for users (self)" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

COMMIT;
