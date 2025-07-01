-- ===========================================
-- CREATE FIRST ADMIN USER
-- ===========================================
-- Run this after signing up with your admin email
-- Replace 'your-admin-email@example.com' with your actual email

-- Method 1: If you already signed up via the app
UPDATE users 
SET role = 'admin', 
    trial_credits = 100000  -- Give admin more credits
WHERE email = 'your-admin-email@example.com';

-- Method 2: Update via auth.users metadata (if Method 1 doesn't work)
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'), 
  '{role}', 
  '"admin"'
)
WHERE email = 'your-admin-email@example.com';

-- Method 3: Manual insert (if user doesn't exist in users table)
-- First get the user ID from auth.users
INSERT INTO users (id, email, role, trial_credits)
SELECT id, email, 'admin', 100000
FROM auth.users
WHERE email = 'your-admin-email@example.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  trial_credits = 100000;

-- Verify the admin user was created
SELECT 
  u.id,
  u.email,
  u.role,
  u.trial_credits,
  u.created_at,
  COALESCE(SUM(c.change), 0) as current_balance
FROM users u
LEFT JOIN credits c ON c.user_id = u.id
WHERE u.role = 'admin'
GROUP BY u.id, u.email, u.role, u.trial_credits, u.created_at;

-- ===========================================
-- INSTRUCTIONS:
-- 1. Replace 'your-admin-email@example.com' with your actual email
-- 2. Make sure you've signed up via the app first
-- 3. Run this script in Supabase SQL Editor
-- 4. Verify the query result shows your admin user
-- ===========================================