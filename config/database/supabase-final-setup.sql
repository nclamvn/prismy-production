-- Final setup script - fixes order of operations
-- Creates tables first, then views and functions

-- Step 1: Create credits table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credits') THEN
        CREATE TABLE credits (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          amount INTEGER NOT NULL, -- Positive for additions, negative for deductions
          balance_after INTEGER NOT NULL, -- Running balance after this transaction
          reason TEXT NOT NULL, -- Description of the credit change
          reference_id UUID, -- Reference to task, invitation, etc.
          reference_type TEXT, -- 'invitation', 'task', 'purchase', 'refund', etc.
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Add indexes
        CREATE INDEX idx_credits_user_id ON credits(user_id);
        CREATE INDEX idx_credits_created_at ON credits(created_at);
        
        -- Enable RLS
        ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
        
        -- Add policies
        CREATE POLICY "Users can view own credits" ON credits FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "System can insert credits" ON credits FOR INSERT WITH CHECK (true);
        
        RAISE NOTICE 'Created credits table successfully';
    ELSE
        RAISE NOTICE 'Credits table already exists';
    END IF;
END $$;

-- Step 2: Create tasks table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        CREATE TABLE tasks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('translate', 'summarize', 'qa', 'document')),
          status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
          cost INTEGER NOT NULL DEFAULT 0,
          metadata JSONB DEFAULT '{}',
          result JSONB,
          error_message TEXT,
          started_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Add indexes
        CREATE INDEX idx_tasks_user_id ON tasks(user_id);
        CREATE INDEX idx_tasks_status ON tasks(status);
        CREATE INDEX idx_tasks_type ON tasks(type);
        
        -- Enable RLS
        ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
        
        -- Add policies
        CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can create own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "System can update tasks" ON tasks FOR UPDATE USING (true);
        
        RAISE NOTICE 'Created tasks table successfully';
    ELSE
        RAISE NOTICE 'Tasks table already exists';
    END IF;
END $$;

-- Step 3: Add missing columns to invitations table if needed
DO $$
BEGIN
    -- Add credit_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invitations' AND column_name = 'credit_amount'
    ) THEN
        ALTER TABLE invitations ADD COLUMN credit_amount INTEGER DEFAULT 15000;
        RAISE NOTICE 'Added credit_amount column to invitations';
    END IF;
    
    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invitations' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE invitations ADD COLUMN metadata JSONB DEFAULT '{}';
        RAISE NOTICE 'Added metadata column to invitations';
    END IF;
END $$;

-- Step 4: Now create the view (only after credits table exists)
DO $$
BEGIN
    -- Only create view if credits table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credits') THEN
        DROP VIEW IF EXISTS user_credit_balances;
        CREATE VIEW user_credit_balances AS
        SELECT 
          user_id,
          COALESCE(SUM(amount), 0) as current_balance,
          COUNT(*) as transaction_count,
          MAX(created_at) as last_transaction_at
        FROM credits 
        GROUP BY user_id;
        
        RAISE NOTICE 'Created user_credit_balances view';
    END IF;
END $$;

-- Step 5: Drop and recreate functions
DROP FUNCTION IF EXISTS get_user_credit_balance(UUID);
DROP FUNCTION IF EXISTS get_user_credits(UUID);
DROP FUNCTION IF EXISTS decrement_credits(UUID, INTEGER, TEXT, INTEGER);
DROP FUNCTION IF EXISTS redeem_invitation_code(TEXT, UUID);
DROP FUNCTION IF EXISTS make_user_admin(UUID);

-- Function to get user credit balance with p_ prefix for RPC compatibility
CREATE FUNCTION get_user_credit_balance(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  balance INTEGER;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO balance
  FROM credits
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'balance', balance,
    'user_id', p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user credits (alternative function for credit manager)
CREATE FUNCTION get_user_credits(_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  total_balance INTEGER;
  total_earned INTEGER;
  total_spent INTEGER;
BEGIN
  -- Get current balance
  SELECT COALESCE(SUM(amount), 0) INTO total_balance
  FROM credits
  WHERE user_id = _user_id;

  -- Get total earned (positive amounts)
  SELECT COALESCE(SUM(amount), 0) INTO total_earned
  FROM credits
  WHERE user_id = _user_id AND amount > 0;

  -- Get total spent (negative amounts, make positive)
  SELECT COALESCE(ABS(SUM(amount)), 0) INTO total_spent
  FROM credits
  WHERE user_id = _user_id AND amount < 0;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'credits_left', total_balance,
    'total_earned', total_earned,
    'total_spent', total_spent,
    'trial_credits', CASE WHEN total_balance > 0 THEN total_balance ELSE 0 END,
    'purchased_credits', 0,
    'trial_ends_at', NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement credits (for credit manager compatibility)
CREATE FUNCTION decrement_credits(
  _user_id UUID,
  _credits_needed INTEGER,
  _operation TEXT,
  _tokens_processed INTEGER DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT COALESCE(SUM(amount), 0) INTO current_balance
  FROM credits
  WHERE user_id = _user_id;

  -- Check if user has enough credits
  IF current_balance < _credits_needed THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'INSUFFICIENT_CREDITS',
      'message', 'Not enough credits',
      'credits_available', current_balance
    );
  END IF;

  -- Calculate new balance
  new_balance := current_balance - _credits_needed;

  -- Insert credit deduction
  INSERT INTO credits (user_id, amount, balance_after, reason, reference_type, metadata)
  VALUES (
    _user_id,
    -_credits_needed,
    new_balance,
    _operation,
    'api_usage',
    jsonb_build_object(
      'tokens_processed', _tokens_processed,
      'operation', _operation
    )
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'credits_before', current_balance,
    'credits_after', new_balance,
    'credits_used', _credits_needed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to redeem invitation code
CREATE FUNCTION redeem_invitation_code(
  invitation_code TEXT,
  redeeming_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  invitation_record invitations%ROWTYPE;
  current_balance INTEGER;
BEGIN
  -- Get invitation details with lock
  SELECT * INTO invitation_record 
  FROM invitations 
  WHERE code = invitation_code 
  AND is_active = TRUE 
  AND (expires_at IS NULL OR expires_at > NOW())
  AND current_uses < max_uses
  FOR UPDATE;

  -- Check if invitation exists and is valid
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Invalid or expired invitation code'
    );
  END IF;

  -- Check if user already has credits (prevent double redemption)
  SELECT COALESCE(SUM(amount), 0) INTO current_balance
  FROM credits
  WHERE user_id = redeeming_user_id;

  IF current_balance > 0 THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'User already has credits'
    );
  END IF;

  -- Increment invitation usage
  UPDATE invitations 
  SET 
    current_uses = current_uses + 1,
    updated_at = NOW()
  WHERE id = invitation_record.id;

  -- Add credits to user
  INSERT INTO credits (user_id, amount, balance_after, reason, reference_id, reference_type)
  VALUES (
    redeeming_user_id,
    invitation_record.credit_amount,
    invitation_record.credit_amount,
    'Invitation code redemption: ' || invitation_code,
    invitation_record.id,
    'invitation'
  );

  -- Update or create user profile
  INSERT INTO user_profiles (user_id, subscription_tier, usage_limit)
  VALUES (redeeming_user_id, 'free', invitation_record.credit_amount)
  ON CONFLICT (user_id) 
  DO UPDATE SET
    subscription_tier = 'free',
    usage_limit = GREATEST(user_profiles.usage_limit, invitation_record.credit_amount),
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', TRUE,
    'credits_granted', invitation_record.credit_amount,
    'total_balance', invitation_record.credit_amount,
    'message', 'Invitation redeemed successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to make user admin (for first setup)
CREATE FUNCTION make_user_admin(target_user_id UUID)
RETURNS JSONB AS $$
BEGIN
  INSERT INTO user_profiles (user_id, subscription_tier, usage_limit)
  VALUES (target_user_id, 'enterprise', 999999)
  ON CONFLICT (user_id) 
  DO UPDATE SET
    subscription_tier = 'enterprise',
    usage_limit = 999999,
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'User promoted to admin successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create invitation code (only if it doesn't exist)
INSERT INTO invitations (code, max_uses, credit_amount, metadata) 
VALUES (
  'PRISMY2024', 
  100, 
  15000,
  '{"description": "Welcome to Prismy - Beta Access", "type": "beta_welcome"}'
) ON CONFLICT (code) DO NOTHING;

-- Step 7: Show results
DO $$
BEGIN
  RAISE NOTICE '=== SETUP COMPLETED SUCCESSFULLY ===';
  RAISE NOTICE 'Database schema is ready for MVP credit system!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Make your first user admin: SELECT make_user_admin(''your-user-id'');';
  RAISE NOTICE '2. Test invitation: PRISMY2024';
END $$;

-- Show available invitation codes
SELECT 
  'Available invitation codes:' as info,
  code, 
  max_uses, 
  current_uses, 
  credit_amount, 
  is_active 
FROM invitations 
WHERE is_active = TRUE;