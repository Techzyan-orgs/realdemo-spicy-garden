-- =============================================================================
-- HELPER: How to promote or assign the first ADMIN user
-- =============================================================================

-- OPTION 1: Promote an existing registered user by their email:
-- 1. Sign up on the website or via Supabase Dashboard -> Authentication -> Users -> "Add User" (Invite/Create).
-- 2. Run this SQL snippet in Supabase SQL Editor:

UPDATE public.profiles
SET role = 'admin'
WHERE id = (
    SELECT id FROM auth.users
    WHERE email = 'YOUR_ADMIN_EMAIL@example.com' -- Replace with your actual email
);

-- Verify the admin role:
SELECT p.id, u.email, p.role, p.full_name
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'admin';


-- OPTION 2: Create an admin directly via SQL (if you want to create both auth user and profile via SQL):
-- Note: It is generally easiest to create the user in the Supabase Dashboard UI,
-- then run OPTION 1 above to set role = 'admin'.
