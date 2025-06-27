-- Safe MVP Credit & Invitation System Schema
-- This checks for existing tables and handles conflicts safely

-- First, let's check what credit-related tables already exist
DO $$
BEGIN
    -- Check if credits table exists and its structure
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credits') THEN
        RAISE NOTICE 'Credits table already exists, checking structure...';
        
        -- Check if the existing credits table has the expected columns
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'credits' 
            AND column_name = 'amount'
        ) THEN
            RAISE NOTICE 'Existing credits table has different structure. Creating backup and recreating...';
            
            -- Backup existing credits table
            EXECUTE 'CREATE TABLE IF NOT EXISTS credits_backup_' || to_char(now(), 'YYYYMMDD_HH24MISS') || ' AS SELECT * FROM credits';
            
            -- Drop existing credits table
            DROP TABLE credits CASCADE;
        END IF;
    END IF;
END $$;

-- Now create our tables with IF NOT EXISTS to be safe
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  credit_amount INTEGER DEFAULT 15000,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credits table for tracking user credits
CREATE TABLE IF NOT EXISTS credits (
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

-- Tasks table for translation operations
CREATE TABLE IF NOT EXISTS tasks (
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

-- Drop existing view if it exists to recreate it
DROP VIEW IF EXISTS user_credit_balances;

-- User credit balance view (computed from credits table)
CREATE VIEW user_credit_balances AS
SELECT 
  user_id,
  COALESCE(SUM(amount), 0) as current_balance,
  COUNT(*) as transaction_count,
  MAX(created_at) as last_transaction_at
FROM credits 
GROUP BY user_id;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(code);
CREATE INDEX IF NOT EXISTS idx_invitations_active ON invitations(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_created_at ON credits(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);

-- Row Level Security
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can manage invitations" ON invitations;
DROP POLICY IF EXISTS "Anyone can read active invitations" ON invitations;
DROP POLICY IF EXISTS "Users can view own credits" ON credits;
DROP POLICY IF EXISTS "System can insert credits" ON credits;
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create own tasks" ON tasks;
DROP POLICY IF EXISTS "System can update tasks" ON tasks;

-- RLS Policies for invitations
CREATE POLICY "Admin can manage invitations" ON invitations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND subscription_tier = 'enterprise'
  )
);

CREATE POLICY "Anyone can read active invitations" ON invitations FOR SELECT USING (
  is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())
);

-- RLS Policies for credits
CREATE POLICY "Users can view own credits" ON credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert credits" ON credits FOR INSERT WITH CHECK (true);

-- RLS Policies for tasks
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "System can update tasks" ON tasks FOR UPDATE USING (true);

-- Function to get user credit balance with p_ prefix for RPC compatibility
CREATE OR REPLACE FUNCTION get_user_credit_balance(p_user_id UUID)
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

-- Function to redeem invitation code
CREATE OR REPLACE FUNCTION redeem_invitation_code(
  invitation_code TEXT,
  redeeming_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  invitation_record invitations%ROWTYPE;
  current_balance INTEGER;
  result JSONB;
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

-- Function to create invitation code (admin only)
CREATE OR REPLACE FUNCTION create_invitation_code(
  creator_user_id UUID,
  code_text TEXT,
  max_uses_val INTEGER DEFAULT 1,
  expires_at_val TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  credit_amount_val INTEGER DEFAULT 15000
) RETURNS JSONB AS $$
DECLARE
  is_admin BOOLEAN := FALSE;
  user_tier TEXT;
BEGIN
  -- Check if user is admin (enterprise tier) or if no users exist yet (first user)
  SELECT subscription_tier INTO user_tier
  FROM user_profiles
  WHERE user_id = creator_user_id;

  -- If user doesn't exist in profiles, check if they're the first user
  IF user_tier IS NULL THEN
    -- If no users exist, make this user an admin
    IF NOT EXISTS (SELECT 1 FROM user_profiles LIMIT 1) THEN
      INSERT INTO user_profiles (user_id, subscription_tier, usage_limit)
      VALUES (creator_user_id, 'enterprise', 999999)
      ON CONFLICT (user_id) DO UPDATE SET
        subscription_tier = 'enterprise',
        usage_limit = 999999;
      is_admin := TRUE;
    END IF;
  ELSIF user_tier = 'enterprise' THEN
    is_admin := TRUE;
  END IF;

  IF NOT is_admin THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Unauthorized: Admin access required'
    );
  END IF;

  -- Insert invitation
  INSERT INTO invitations (code, created_by, max_uses, expires_at, credit_amount)
  VALUES (code_text, creator_user_id, max_uses_val, expires_at_val, credit_amount_val);

  RETURN jsonb_build_object(
    'success', TRUE,
    'code', code_text,
    'max_uses', max_uses_val,
    'credit_amount', credit_amount_val,
    'message', 'Invitation code created successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to make user admin (for first setup)
CREATE OR REPLACE FUNCTION make_user_admin(target_user_id UUID)
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

-- Create a welcome invitation code for testing
INSERT INTO invitations (code, max_uses, credit_amount, metadata) 
VALUES (
  'PRISMY2024', 
  100, 
  15000,
  '{"description": "Welcome to Prismy - Beta Access", "type": "beta_welcome"}'
) ON CONFLICT (code) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Schema setup completed successfully!';
  RAISE NOTICE 'Created invitation code: PRISMY2024 (15,000 credits, 100 uses)';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Make your first user admin: SELECT make_user_admin(''your-user-id'');';
  RAISE NOTICE '2. Test invitation redemption with code: PRISMY2024';
END $$;