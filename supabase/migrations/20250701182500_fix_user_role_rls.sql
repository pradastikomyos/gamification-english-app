-- supabase/migrations/20250701182500_fix_user_role_rls.sql

-- First, ensure RLS is enabled on the user_roles table.
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop the existing policy if it exists, to avoid errors on re-running.
DROP POLICY IF EXISTS "Users can view their own role." ON public.user_roles;

-- Create the policy that allows users to select their own role information.
CREATE POLICY "Users can view their own role." 
ON public.user_roles
FOR SELECT 
USING (auth.uid() = user_id);

-- Grant select access to the authenticated role
-- This is crucial as it's the role used by logged-in users.
GRANT SELECT ON TABLE public.user_roles TO authenticated;
