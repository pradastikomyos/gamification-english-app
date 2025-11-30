-- Migration: Fix Admin RLS Policies for SELECT
-- This migration adds policies to allow users with the 'admin' role to view all records
-- in the 'students' and 'teachers' tables, fixing the Internal Server Error.

-- 1. Create policy for admins to view all students
CREATE POLICY "Admins can view all students"
ON public.students FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin'
);

-- 2. Create policy for admins to view all teachers
CREATE POLICY "Admins can view all teachers"
ON public.teachers FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin'
);
