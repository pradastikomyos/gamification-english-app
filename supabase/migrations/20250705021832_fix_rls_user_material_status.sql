-- Enable RLS on user_material_status table
ALTER TABLE public.user_material_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_material_status
CREATE POLICY "Users can view their own material status" ON public.user_material_status
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own material status" ON public.user_material_status
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own material status" ON public.user_material_status
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Teachers and admins can view all material status
CREATE POLICY "Teachers and admins can view all material status" ON public.user_material_status
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('teacher', 'admin')
    )
);
