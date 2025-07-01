-- =====================================================
-- PRISMY AUTH SYSTEM - USER CREDITS INITIALIZATION
-- Migration: 20250702_init_credits
-- Description: Initialize user credits system for authenticated users
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User credits table (if not exists from previous migration)
-- Supports both authenticated (user_id) and anonymous (session_id) users
CREATE TABLE IF NOT EXISTS user_credits (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id     text,
  credits_left   int DEFAULT 20 CHECK (credits_left >= 0),
  credits_used   int DEFAULT 0 CHECK (credits_used >= 0),
  tier           text DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'pro', 'enterprise')),
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now(),
  
  -- Ensure either user_id OR session_id is present, not both
  CONSTRAINT user_credits_identity_check 
    CHECK ((user_id IS NOT NULL AND session_id IS NULL) OR 
           (user_id IS NULL AND session_id IS NOT NULL))
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS user_credits_user_id_idx 
  ON user_credits(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_credits_session_id_idx 
  ON user_credits(session_id) WHERE session_id IS NOT NULL;

-- Regular indexes for performance
CREATE INDEX IF NOT EXISTS user_credits_tier_idx ON user_credits(tier);
CREATE INDEX IF NOT EXISTS user_credits_created_at_idx ON user_credits(created_at DESC);

-- Update trigger for updated_at column
CREATE OR REPLACE FUNCTION update_user_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER user_credits_updated_at_trigger
  BEFORE UPDATE ON user_credits 
  FOR EACH ROW EXECUTE FUNCTION update_user_credits_updated_at();

-- Function to get or create user credits for authenticated users
CREATE OR REPLACE FUNCTION get_or_create_user_credits(p_user_id uuid)
RETURNS TABLE(
  id uuid,
  credits_left int, 
  credits_used int, 
  tier text,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  -- Try to get existing credits
  SELECT uc.id, uc.credits_left, uc.credits_used, uc.tier, uc.created_at, uc.updated_at
  INTO id, credits_left, credits_used, tier, created_at, updated_at
  FROM user_credits uc 
  WHERE uc.user_id = p_user_id;
  
  -- Create if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, credits_left, credits_used, tier)
    VALUES (p_user_id, 20, 0, 'free')
    RETURNING user_credits.id, user_credits.credits_left, user_credits.credits_used, 
              user_credits.tier, user_credits.created_at, user_credits.updated_at
    INTO id, credits_left, credits_used, tier, created_at, updated_at;
  END IF;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct credits atomically
CREATE OR REPLACE FUNCTION deduct_user_credits(
  p_user_id uuid,
  p_cost int DEFAULT 1
)
RETURNS TABLE(
  success boolean,
  credits_left int,
  credits_used int,
  message text
) AS $$
DECLARE
  current_credits int;
BEGIN
  -- Atomic credit deduction with row locking
  UPDATE user_credits 
  SET credits_left = credits_left - p_cost,
      credits_used = credits_used + p_cost,
      updated_at = now()
  WHERE user_id = p_user_id 
    AND credits_left >= p_cost
  RETURNING user_credits.credits_left, user_credits.credits_used
  INTO credits_left, credits_used;
  
  -- Check if update was successful
  IF FOUND THEN
    success := true;
    message := 'Credits deducted successfully';
  ELSE
    -- Get current credits to return in error case
    SELECT uc.credits_left, uc.credits_used
    INTO credits_left, credits_used
    FROM user_credits uc 
    WHERE uc.user_id = p_user_id;
    
    success := false;
    message := 'Insufficient credits';
  END IF;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on user_credits
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own credits
CREATE POLICY "Users can manage own credits" ON user_credits
  FOR ALL USING (
    auth.uid() = user_id OR
    auth.uid() IS NULL  -- Allow service role access
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_credits TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_or_create_user_credits(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION deduct_user_credits(uuid, int) TO authenticated, anon;

-- Comments for documentation
COMMENT ON TABLE user_credits IS 'User credits for AI-powered features, supports both authenticated and anonymous users';
COMMENT ON FUNCTION get_or_create_user_credits IS 'Gets existing credits or creates new entry with 20 free credits for authenticated users';
COMMENT ON FUNCTION deduct_user_credits IS 'Atomically deducts credits and returns updated balance';

-- Insert default credits for existing users (if any)
INSERT INTO user_credits (user_id, credits_left, credits_used, tier)
SELECT 
  au.id,
  20,
  0,
  'free'
FROM auth.users au
LEFT JOIN user_credits uc ON au.id = uc.user_id
WHERE uc.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;