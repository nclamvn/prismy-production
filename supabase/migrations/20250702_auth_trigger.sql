-- =====================================================
-- AUTO-CREATE USER CREDITS ON AUTH.USERS INSERT
-- Migration: 20250702_auth_trigger  
-- Description: Automatically create user credits when a new user signs up
-- =====================================================

-- Create function to handle new user signup
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

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user_credits entry for new users with 20 free credits';