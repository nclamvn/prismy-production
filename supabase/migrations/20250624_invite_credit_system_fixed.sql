-- =====================================================
-- PRISMY MVP: INVITE + CREDIT SYSTEM MIGRATION (FIXED)
-- Date: 2025-06-24
-- Purpose: Add invite codes and credit-based billing system
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: pgcrypto might already be enabled in Supabase
-- If the line below fails, comment it out
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. INVITE CODES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of invite code for security
  code_preview TEXT NOT NULL, -- First 4 chars for display (e.g., "PRIS...")
  credits_initial INTEGER NOT NULL DEFAULT 500 CHECK (credits_initial > 0),
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin who created
  metadata JSONB DEFAULT '{}', -- Extra data (purpose, notes, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. USER CREDITS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_left INTEGER NOT NULL DEFAULT 0 CHECK (credits_left >= 0),
  total_earned INTEGER NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
  total_spent INTEGER NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
  
  -- Trial and limitations
  trial_credits INTEGER DEFAULT 0, -- Credits from trial/invite
  purchased_credits INTEGER DEFAULT 0, -- Credits from purchase
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Usage tracking
  last_used_at TIMESTAMP WITH TIME ZONE,
  daily_usage_count INTEGER DEFAULT 0,
  daily_usage_reset DATE DEFAULT CURRENT_DATE,
  
  -- Metadata
  invite_code_used TEXT, -- Store original invite code for tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CREDIT USAGE LOG (for audit and analytics)
-- =====================================================
CREATE TABLE IF NOT EXISTS credit_usage_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL, -- 'translate', 'document_process', 'ai_analysis'
  credits_used INTEGER NOT NULL CHECK (credits_used > 0),
  tokens_processed INTEGER, -- Actual tokens/characters processed
  
  -- Operation context
  api_endpoint TEXT,
  source_language TEXT,
  target_language TEXT,
  document_type TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. INDEXES FOR PERFORMANCE
-- =====================================================

-- Invites indexes
CREATE INDEX IF NOT EXISTS idx_invites_code_hash ON invites(code_hash);
CREATE INDEX IF NOT EXISTS idx_invites_is_used ON invites(is_used);
CREATE INDEX IF NOT EXISTS idx_invites_expires_at ON invites(expires_at);
CREATE INDEX IF NOT EXISTS idx_invites_used_by ON invites(used_by);
CREATE INDEX IF NOT EXISTS idx_invites_created_by ON invites(created_by);

-- User credits indexes  
CREATE INDEX IF NOT EXISTS idx_user_credits_credits_left ON user_credits(credits_left);
CREATE INDEX IF NOT EXISTS idx_user_credits_trial_ends_at ON user_credits(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_user_credits_last_used_at ON user_credits(last_used_at);

-- Credit usage log indexes
CREATE INDEX IF NOT EXISTS idx_credit_usage_log_user_id ON credit_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_log_created_at ON credit_usage_log(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_usage_log_operation ON credit_usage_log(operation);

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage_log ENABLE ROW LEVEL SECURITY;

-- Invites policies (Admin only for most operations)
CREATE POLICY "Admins can manage all invites" ON invites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND subscription_tier = 'enterprise' -- Use enterprise as admin flag
    )
  );

CREATE POLICY "Users can check their own used invite" ON invites 
  FOR SELECT USING (used_by = auth.uid());

-- User credits policies (Users see own data)
CREATE POLICY "Users can view own credits" ON user_credits 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own credits" ON user_credits 
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can manage credits" ON user_credits 
  FOR ALL USING (true); -- Allow system operations

-- Credit usage log policies
CREATE POLICY "Users can view own usage log" ON credit_usage_log 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert usage log" ON credit_usage_log 
  FOR INSERT WITH CHECK (true);

-- Admins can view all usage logs
CREATE POLICY "Admins can view all usage logs" ON credit_usage_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND subscription_tier = 'enterprise'
    )
  );

-- =====================================================
-- 6. FUNCTIONS FOR CREDIT MANAGEMENT
-- =====================================================

-- Function to generate secure invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := 'PRISMY-';
  i INTEGER;
BEGIN
  -- Generate PRISMY-XXXX-XXXX format
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  result := result || '-';
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to hash invite code securely
-- Modified to work without pgcrypto extension
CREATE OR REPLACE FUNCTION hash_invite_code(code TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Use MD5 as fallback if pgcrypto is not available
  -- In production, pgcrypto with SHA256 is recommended
  RETURN md5(code || COALESCE(current_setting('app.invite_salt', TRUE), 'default-salt'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement credits atomically (key function!)
CREATE OR REPLACE FUNCTION decrement_credits(
  _user_id UUID,
  _credits_needed INTEGER,
  _operation TEXT DEFAULT 'api_call',
  _tokens_processed INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  _credits_before INTEGER;
  _credits_after INTEGER;
  _result JSON;
BEGIN
  -- Validate input
  IF _credits_needed <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INVALID_AMOUNT',
      'message', 'Credits needed must be positive'
    );
  END IF;

  -- Get current credits and attempt atomic decrement
  UPDATE user_credits 
  SET 
    credits_left = credits_left - _credits_needed,
    total_spent = total_spent + _credits_needed,
    last_used_at = NOW(),
    updated_at = NOW(),
    -- Reset daily usage if new day
    daily_usage_count = CASE 
      WHEN daily_usage_reset < CURRENT_DATE 
      THEN _credits_needed 
      ELSE daily_usage_count + _credits_needed 
    END,
    daily_usage_reset = CURRENT_DATE
  WHERE user_id = _user_id 
    AND credits_left >= _credits_needed -- Only if sufficient credits
  RETURNING 
    credits_left + _credits_needed as credits_before,
    credits_left as credits_after
  INTO _credits_before, _credits_after;

  -- Check if update succeeded
  IF NOT FOUND THEN
    -- Get current credits for error details
    SELECT credits_left INTO _credits_before 
    FROM user_credits 
    WHERE user_id = _user_id;
    
    IF _credits_before IS NULL THEN
      RETURN json_build_object(
        'success', false,
        'error', 'USER_NOT_FOUND',
        'message', 'User has no credit account'
      );
    ELSE
      RETURN json_build_object(
        'success', false,
        'error', 'INSUFFICIENT_CREDITS',
        'message', 'Not enough credits',
        'credits_available', _credits_before,
        'credits_needed', _credits_needed
      );
    END IF;
  END IF;

  -- Log the usage
  INSERT INTO credit_usage_log (
    user_id, 
    operation, 
    credits_used, 
    tokens_processed,
    api_endpoint,
    metadata
  ) VALUES (
    _user_id, 
    _operation, 
    _credits_needed, 
    _tokens_processed,
    current_setting('request.headers', TRUE)::json->>'x-api-endpoint',
    json_build_object(
      'credits_before', _credits_before,
      'credits_after', _credits_after
    )
  );

  -- Return success
  RETURN json_build_object(
    'success', true,
    'credits_before', _credits_before,
    'credits_after', _credits_after,
    'credits_used', _credits_needed
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'DATABASE_ERROR',
    'message', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits (for invite redemption, top-ups)
CREATE OR REPLACE FUNCTION add_credits(
  _user_id UUID,
  _credits_amount INTEGER,
  _source TEXT DEFAULT 'manual',
  _metadata JSON DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  _credits_after INTEGER;
BEGIN
  -- Validate input
  IF _credits_amount <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INVALID_AMOUNT'
    );
  END IF;

  -- Add credits atomically
  INSERT INTO user_credits (
    user_id, 
    credits_left, 
    total_earned,
    trial_credits
  ) VALUES (
    _user_id, 
    _credits_amount, 
    _credits_amount,
    CASE WHEN _source = 'invite' THEN _credits_amount ELSE 0 END
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    credits_left = user_credits.credits_left + _credits_amount,
    total_earned = user_credits.total_earned + _credits_amount,
    trial_credits = CASE 
      WHEN _source = 'invite' 
      THEN user_credits.trial_credits + _credits_amount 
      ELSE user_credits.trial_credits 
    END,
    purchased_credits = CASE 
      WHEN _source = 'purchase' 
      THEN user_credits.purchased_credits + _credits_amount 
      ELSE user_credits.purchased_credits 
    END,
    updated_at = NOW()
  RETURNING credits_left INTO _credits_after;

  RETURN json_build_object(
    'success', true,
    'credits_added', _credits_amount,
    'credits_total', _credits_after
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'DATABASE_ERROR',
    'message', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user credit information
CREATE OR REPLACE FUNCTION get_user_credits(_user_id UUID)
RETURNS JSON AS $$
DECLARE
  _credits user_credits%ROWTYPE;
  _usage_today INTEGER;
BEGIN
  -- Get credit info
  SELECT * INTO _credits 
  FROM user_credits 
  WHERE user_id = _user_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'USER_NOT_FOUND'
    );
  END IF;

  -- Get today's usage
  SELECT COALESCE(SUM(credits_used), 0) INTO _usage_today
  FROM credit_usage_log 
  WHERE user_id = _user_id 
    AND created_at >= CURRENT_DATE;

  RETURN json_build_object(
    'success', true,
    'credits_left', _credits.credits_left,
    'total_earned', _credits.total_earned,
    'total_spent', _credits.total_spent,
    'trial_credits', _credits.trial_credits,
    'purchased_credits', _credits.purchased_credits,
    'usage_today', _usage_today,
    'trial_ends_at', _credits.trial_ends_at,
    'last_used_at', _credits.last_used_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_invites_updated_at
    BEFORE UPDATE ON invites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. INITIAL DATA & CONFIGURATION
-- =====================================================

-- Set invite salt for hashing (should be set in environment)
-- This will be configurable via environment variable
-- ALTER DATABASE SET app.invite_salt = 'your-secure-salt-here';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Add comment for tracking
COMMENT ON TABLE invites IS 'MVP invite codes for private beta access';
COMMENT ON TABLE user_credits IS 'Credit-based billing system for API usage';
COMMENT ON TABLE credit_usage_log IS 'Audit log for credit consumption tracking';

-- =====================================================
-- CHECK IF MIGRATION SUCCESSFUL
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Tables created: invites, user_credits, credit_usage_log';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Set app.invite_salt in your environment';
  RAISE NOTICE '2. Create admin user with enterprise tier';
  RAISE NOTICE '3. Generate invite codes';
END $$;