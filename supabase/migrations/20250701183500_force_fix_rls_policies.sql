-- supabase/migrations/20250701183500_force_fix_rls_policies.sql

-- Forcefully drop all existing policies to ensure a clean slate.
DROP POLICY IF EXISTS "Admins can manage all user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can modify user roles." ON public.user_roles; -- Drop the new one too, just in case
DROP POLICY IF EXISTS "Users can view their own role." ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles." ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update user roles." ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles." ON public.user_roles;


-- Create the essential SELECT policy for all authenticated users.
-- This is the key to fixing the login loop.
CREATE POLICY "Users can view their own role."
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create explicit policies for admin modifications. This avoids syntax errors.

-- Policy for INSERT
CREATE POLICY "Admins can insert user roles."
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK ( (get_user_role(auth.uid()) = 'admin'::user_role) );

-- Policy for UPDATE
CREATE POLICY "Admins can update user roles."
ON public.user_roles
FOR UPDATE
TO authenticated
USING ( (get_user_role(auth.uid()) = 'admin'::user_role) )
WITH CHECK ( (get_user_role(auth.uid()) = 'admin'::user_role) );

-- Policy for DELETE
CREATE POLICY "Admins can delete user roles."
ON public.user_roles
FOR DELETE
TO authenticated
USING ( (get_user_role(auth.uid()) = 'admin'::user_role) );
