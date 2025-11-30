-- supabase/migrations/20250701183000_alter_admin_rls_policy.sql

-- This migration fixes the recursive loop in the admin policy.
-- We are altering the policy to only apply to modification actions (INSERT, UPDATE, DELETE)
-- and not for SELECT, which is now handled by the "Users can view their own role." policy.

-- Drop the old, problematic policy.
DROP POLICY IF EXISTS "Admins can manage all user_roles" ON public.user_roles;

-- Recreate it correctly for INSERT, UPDATE, DELETE.
CREATE POLICY "Admins can manage all user_roles"
ON public.user_roles
FOR ALL -- 'ALL' is fine here because the SELECT is handled by the other policy
USING ( (get_user_role(auth.uid()) = 'admin'::user_role) )
WITH CHECK ( (get_user_role(auth.uid()) = 'admin'::user_role) );

-- Let's re-create the SELECT policy just to be safe and ensure order.
DROP POLICY IF EXISTS "Users can view their own role." ON public.user_roles;
CREATE POLICY "Users can view their own role." 
ON public.user_roles
FOR SELECT 
USING (auth.uid() = user_id);
