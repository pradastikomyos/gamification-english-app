-- Add storage_path column to study_materials table
ALTER TABLE public.study_materials 
ADD COLUMN storage_path text;
