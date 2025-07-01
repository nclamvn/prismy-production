-- Check existing schema and show what we have
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('invitations', 'credits', 'tasks', 'user_profiles')
ORDER BY tablename;

-- Check existing functions
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_credit_balance', 'get_user_credits', 'redeem_invitation_code')
ORDER BY routine_name;

-- Check invitations table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'invitations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check credits table structure if it exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'credits' 
AND table_schema = 'public'
ORDER BY ordinal_position;