-- First, let's check if storage.objects has RLS enabled
-- and create proper policies for question-media bucket

-- Drop any existing conflicting policies for question-media
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow authenticated users to upload question media" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to read question media" ON storage.objects;
    DROP POLICY IF EXISTS "Teachers can upload question media" ON storage.objects;
    DROP POLICY IF EXISTS "Teachers can delete question media" ON storage.objects;
    DROP POLICY IF EXISTS "Teachers can update question media" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can view question media" ON storage.objects;
    DROP POLICY IF EXISTS "Allow teachers to delete their question media" ON storage.objects;
EXCEPTION 
    WHEN others THEN 
        -- Policies might not exist, that's ok
        NULL;
END $$;

-- Create comprehensive policies for question-media bucket
-- 1. SELECT policy (read access) - anyone can read from public bucket
CREATE POLICY "Public read access for question media" 
ON storage.objects FOR SELECT 
TO public
USING (bucket_id = 'question-media');

-- 2. INSERT policy (upload) - only teachers and admins
CREATE POLICY "Teachers and admins can upload question media" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
    bucket_id = 'question-media' AND
    EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('teacher', 'admin')
    )
);

-- 3. UPDATE policy - only teachers and admins
CREATE POLICY "Teachers and admins can update question media" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (
    bucket_id = 'question-media' AND
    EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('teacher', 'admin')
    )
)
WITH CHECK (
    bucket_id = 'question-media' AND
    EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('teacher', 'admin')
    )
);

-- 4. DELETE policy - only teachers and admins
CREATE POLICY "Teachers and admins can delete question media" 
ON storage.objects FOR DELETE 
TO authenticated
USING (
    bucket_id = 'question-media' AND
    EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('teacher', 'admin')
    )
);
