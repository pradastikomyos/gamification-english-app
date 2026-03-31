-- Fix foreign key relation for study_materials.teacher_id
-- Drop existing constraint
ALTER TABLE public.study_materials 
DROP CONSTRAINT IF EXISTS study_materials_teacher_id_fkey;

-- Add new constraint pointing to teachers.user_id
ALTER TABLE public.study_materials 
ADD CONSTRAINT study_materials_teacher_id_fkey 
FOREIGN KEY (teacher_id) REFERENCES public.teachers(user_id);
