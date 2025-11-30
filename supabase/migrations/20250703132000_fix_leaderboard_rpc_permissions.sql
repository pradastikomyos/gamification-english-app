-- supabase/migrations/20250703132000_fix_leaderboard_rpc_permissions.sql

-- The previous migration only granted permission for the function signature with one argument.
-- This adds the grant for the no-argument version, which is used for the school-wide leaderboard.
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;
