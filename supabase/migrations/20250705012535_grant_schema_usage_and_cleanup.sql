-- The definitive fix: Grant USAGE permission on the storage schema to authenticated users.
-- This allows them to see the tables (like 'buckets' and 'objects') inside the schema.
GRANT USAGE ON SCHEMA storage TO authenticated;

-- Re-grant SELECT on buckets and objects to be absolutely certain.
GRANT SELECT ON TABLE storage.buckets TO authenticated;
GRANT SELECT ON TABLE storage.objects TO authenticated;

-- Remove the confusing and unnecessary test function that was causing its own errors.
DROP FUNCTION IF EXISTS public.test_storage_access();
