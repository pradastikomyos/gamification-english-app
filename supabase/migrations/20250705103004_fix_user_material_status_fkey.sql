-- Fix foreign key reference in user_material_status table
-- Should reference study_materials instead of materials

-- Drop the existing constraint
ALTER TABLE public.user_material_status 
DROP CONSTRAINT user_material_status_material_id_fkey;

-- Add the correct foreign key constraint
ALTER TABLE public.user_material_status 
ADD CONSTRAINT user_material_status_material_id_fkey 
FOREIGN KEY (material_id) REFERENCES public.study_materials(id) ON DELETE CASCADE;
