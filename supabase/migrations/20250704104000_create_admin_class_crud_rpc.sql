-- Function to get all classes with teacher names
CREATE OR REPLACE FUNCTION admin_get_all_classes()
RETURNS TABLE (
  id uuid,
  name text,
  teacher_id uuid,
  teacher_name text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can access this function';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.teacher_id,
    t.name AS teacher_name,
    c.created_at
  FROM
    classes c
  LEFT JOIN
    teachers t ON c.teacher_id = t.id;
END;
$$;

-- Function to create a class
CREATE OR REPLACE FUNCTION admin_create_class(p_name text, p_teacher_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_class_id uuid;
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can perform this action';
  END IF;

  INSERT INTO classes (name, teacher_id)
  VALUES (p_name, p_teacher_id)
  RETURNING id INTO new_class_id;

  RETURN new_class_id;
END;
$$;

-- Function to update a class
CREATE OR REPLACE FUNCTION admin_update_class(p_class_id uuid, p_name text, p_teacher_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can perform this action';
  END IF;

  UPDATE classes
  SET
    name = p_name,
    teacher_id = p_teacher_id
  WHERE
    id = p_class_id;
END;
$$;

-- Function to delete a class
CREATE OR REPLACE FUNCTION admin_delete_class(p_class_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can perform this action';
  END IF;

  DELETE FROM classes WHERE id = p_class_id;
END;
$$;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION admin_get_all_classes() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_create_class(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_class(uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_class(uuid) TO authenticated;
