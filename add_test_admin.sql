-- Create admin user manually in auth.users and user_roles
-- This script is meant to be run manually for development purposes

-- This will be used to manually create admin user through Supabase Auth Dashboard
-- For now, we'll create a user_roles entry for testing with a mock UUID
-- In practice, you should create the admin user through Supabase Dashboard first

-- Create admin role entry (to be connected to actual auth user later)
INSERT INTO user_roles (user_id, role, profile_id) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin', NULL);
