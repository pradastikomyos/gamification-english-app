-- Migration: Fix RLS Infinite Recursion
-- This migration replaces the direct subquery in RLS policies with a SECURITY DEFINER function
-- to prevent infinite recursion errors when querying tables with admin-only access.

-- 1. Drop the existing, problematic policies.
DROP POLICY IF EXISTS "Admins can view all students" ON public.students;
DROP POLICY IF EXISTS "Admins can view all teachers" ON public.teachers;

-- 2. Create a SECURITY DEFINER function to check for admin role.
-- This function runs with the permissions of the user who defined it (the owner),
-- bypassing the RLS checks of the calling user and breaking the recursion cycle.
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = p_user_id AND role = 'admin'
  );
$$;

-- 3. Recreate the policies using the new function.
CREATE POLICY "Admins can view all students"
ON public.students FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can view all teachers"
ON public.teachers FOR SELECT
TO authenticated
USING (public.is_admin());
