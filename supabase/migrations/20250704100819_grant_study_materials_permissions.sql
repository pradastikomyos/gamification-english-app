-- Grant execute permission on the RPC function to authenticated users
GRANT EXECUTE ON FUNCTION public.get_study_materials_with_status() TO authenticated;

-- Also make sure students can read from study_materials table if using direct queries
GRANT SELECT ON public.study_materials TO authenticated;
