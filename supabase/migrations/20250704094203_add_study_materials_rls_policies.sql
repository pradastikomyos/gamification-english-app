-- Enable RLS on study_materials table
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for study_materials
CREATE POLICY "Teachers can view their own study materials" ON public.study_materials
    FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can insert their own study materials" ON public.study_materials
    FOR INSERT WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own study materials" ON public.study_materials
    FOR UPDATE USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own study materials" ON public.study_materials
    FOR DELETE USING (teacher_id = auth.uid());

-- Allow students to view study materials from their teachers (if needed)
CREATE POLICY "Students can view study materials" ON public.study_materials
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s 
            WHERE s.user_id = auth.uid()
        )
    );
