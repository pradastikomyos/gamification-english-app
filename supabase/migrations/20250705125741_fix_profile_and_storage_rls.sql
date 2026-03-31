-- Step 1: Drop the old, ineffective policy for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Step 2: Create a new, correct policy for profiles
CREATE POLICY "Allow users to read their own profile" ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Step 3: Update the storage policy to use the 'profiles' table
DROP POLICY IF EXISTS "Teachers and admins can upload question media" ON storage.objects;

CREATE POLICY "Teachers and admins can upload question media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'question-media' AND
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('teacher', 'admin')
  )
);
