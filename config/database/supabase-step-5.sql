-- STEP 5: Final setup and testing

-- Show your user ID (you'll need this for the next step)
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users 
ORDER BY created_at 
LIMIT 5;

-- Show available invitation codes
SELECT 
  code,
  max_uses,
  current_uses,
  credit_amount,
  is_active,
  created_at
FROM invitations 
WHERE is_active = TRUE;