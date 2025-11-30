-- Migration: Create Materials Table and RLS Policies

-- 1. Create the 'materials' table
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content_url TEXT, -- URL to the material content (e.g., PDF, video link)
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
--    - Admins can perform any action on materials.
--    - All authenticated users can view materials.
CREATE POLICY "Admins can manage all materials" 
ON public.materials FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin'
);

CREATE POLICY "Authenticated users can view materials" 
ON public.materials FOR SELECT
TO authenticated
USING (true);


-- 4. Create a trigger function to automatically update 'updated_at'
CREATE OR REPLACE FUNCTION public.handle_material_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 5. Apply the trigger to the 'materials' table
CREATE TRIGGER on_material_update
BEFORE UPDATE ON public.materials
FOR EACH ROW
EXECUTE PROCEDURE public.handle_material_update();
