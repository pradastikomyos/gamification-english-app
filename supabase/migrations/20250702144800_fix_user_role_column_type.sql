ALTER TABLE public.user_roles
ALTER COLUMN role TYPE user_role USING role::user_role;
