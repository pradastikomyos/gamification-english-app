ALTER TABLE public.study_materials
ADD COLUMN teacher_id UUID REFERENCES public.teachers(id);
