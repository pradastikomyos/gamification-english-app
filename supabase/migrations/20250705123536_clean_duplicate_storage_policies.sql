-- Clean up duplicate policies
DO $$ 
BEGIN
    -- Drop duplicate policies
    DROP POLICY IF EXISTS "Public read question media" ON storage.objects;
    DROP POLICY IF EXISTS "Teachers delete question media" ON storage.objects;
    DROP POLICY IF EXISTS "Teachers update question media" ON storage.objects;
    DROP POLICY IF EXISTS "Teachers upload question media" ON storage.objects;
EXCEPTION 
    WHEN others THEN 
        -- Policies might not exist, that's ok
        NULL;
END $$;
