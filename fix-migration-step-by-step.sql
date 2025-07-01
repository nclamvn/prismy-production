-- =====================================
-- STEP-BY-STEP DATABASE MIGRATION FIX
-- =====================================
-- Copy từng block SQL này và execute riêng biệt trong Supabase SQL Editor

-- STEP 1: Check if user_credits table exists và có đúng structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_credits' 
  AND table_schema = 'public';

-- Nếu table không có, tạo table user_credits:
-- CREATE TABLE IF NOT EXISTS public.user_credits (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   credits_left INTEGER NOT NULL DEFAULT 0,
--   credits_used INTEGER NOT NULL DEFAULT 0,
--   tier TEXT NOT NULL DEFAULT 'free',
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW(),
--   UNIQUE(user_id)
-- );

-- STEP 2: Create the function (execute this first)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create user credits entry with 20 free credits
  INSERT INTO public.user_credits (user_id, credits_left, credits_used, tier)
  VALUES (NEW.id, 20, 0, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: Drop existing trigger if any (execute this second)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- STEP 4: Create the trigger (execute this third)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 5: Grant permissions (execute this fourth)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- STEP 6: Add comment (execute this fifth)
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user_credits entry for new users with 20 free credits';

-- STEP 7: Verify the function was created (execute this last to verify)
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'handle_new_user';

-- STEP 8: Verify the trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  trigger_schema,
  trigger_table
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';