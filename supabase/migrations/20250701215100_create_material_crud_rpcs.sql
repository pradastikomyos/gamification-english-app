-- Migration: Create CRUD RPC Functions for Materials

-- 1. Function to create a new material
CREATE OR REPLACE FUNCTION public.create_material(p_title TEXT, p_description TEXT, p_content_url TEXT)
RETURNS public.materials
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_material public.materials;
BEGIN
  -- Ensure the user is an admin
  IF (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can create materials.';
  END IF;

  INSERT INTO public.materials (title, description, content_url)
  VALUES (p_title, p_description, p_content_url)
  RETURNING * INTO new_material;

  RETURN new_material;
END;
$$;

-- 2. Function to update an existing material
CREATE OR REPLACE FUNCTION public.update_material(p_material_id UUID, p_title TEXT, p_description TEXT, p_content_url TEXT)
RETURNS public.materials
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_material public.materials;
BEGIN
  -- Ensure the user is an admin
  IF (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can update materials.';
  END IF;

  UPDATE public.materials
  SET
    title = p_title,
    description = p_description,
    content_url = p_content_url,
    updated_at = now()
  WHERE id = p_material_id
  RETURNING * INTO updated_material;

  RETURN updated_material;
END;
$$;

-- 3. Function to delete a material
CREATE OR REPLACE FUNCTION public.delete_material(p_material_id UUID)
RETURNS public.materials
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_material public.materials;
BEGIN
  -- Ensure the user is an admin
  IF (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete materials.';
  END IF;

  DELETE FROM public.materials
  WHERE id = p_material_id
  RETURNING * INTO deleted_material;

  RETURN deleted_material;
END;
$$;
