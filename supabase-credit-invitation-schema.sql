-- MVP Credit & Invitation System Schema
-- This adds the missing tables for the free trial pipeline

-- Invitation codes table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  credit_amount INTEGER DEFAULT 15000, -- Credits to grant upon redemption
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}', -- For additional invitation data
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
  cost INTEGER NOT NULL DEFAULT 0, -- Credits consumed
  metadata JSONB DEFAULT '{}', -- Task-specific data (file_url, options, etc.)
  result JSONB, -- Task result data
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User credit balance view (computed from credits table)
CREATE OR REPLACE VIEW user_credit_balances AS
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

-- RLS Policies for invitations (admin only create, public read for redemption)
CREATE POLICY "Admin can manage invitations" ON invitations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND subscription_tier = 'enterprise' -- Use enterprise tier as admin marker
  )
);

CREATE POLICY "Anyone can read active invitations" ON invitations FOR SELECT USING (
  is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())
);

-- RLS Policies for credits
CREATE POLICY "Users can view own credits" ON credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert credits" ON credits FOR INSERT WITH CHECK (true); -- Handled by functions

-- RLS Policies for tasks
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "System can update tasks" ON tasks FOR UPDATE USING (true); -- Handled by functions

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
    'message', 'Invitation redeemed successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user credit balance
CREATE OR REPLACE FUNCTION get_user_credit_balance(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  balance INTEGER;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO balance
  FROM credits
  WHERE user_id = user_uuid;
  
  RETURN balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct credits for tasks
CREATE OR REPLACE FUNCTION deduct_credits_for_task(
  user_uuid UUID,
  task_id UUID,
  credit_cost INTEGER,
  task_description TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT get_user_credit_balance(user_uuid) INTO current_balance;

  -- Check if user has enough credits
  IF current_balance < credit_cost THEN
    RETURN FALSE;
  END IF;

  -- Calculate new balance
  new_balance := current_balance - credit_cost;

  -- Insert credit deduction
  INSERT INTO credits (user_id, amount, balance_after, reason, reference_id, reference_type)
  VALUES (
    user_uuid,
    -credit_cost,
    new_balance,
    task_description,
    task_id,
    'task'
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refund credits for failed tasks
CREATE OR REPLACE FUNCTION refund_credits_for_failed_task(
  user_uuid UUID,
  task_id UUID,
  credit_amount INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT get_user_credit_balance(user_uuid) INTO current_balance;
  new_balance := current_balance + credit_amount;

  -- Insert credit refund
  INSERT INTO credits (user_id, amount, balance_after, reason, reference_id, reference_type)
  VALUES (
    user_uuid,
    credit_amount,
    new_balance,
    'Refund for failed task',
    task_id,
    'refund'
  );

  RETURN TRUE;
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
  is_admin BOOLEAN;
BEGIN
  -- Check if user is admin (enterprise tier)
  SELECT subscription_tier = 'enterprise' INTO is_admin
  FROM user_profiles
  WHERE user_id = creator_user_id;

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
    'credit_amount', credit_amount_val
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update triggers
CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional)
-- INSERT INTO invitations (code, max_uses, credit_amount) 
-- VALUES ('WELCOME2024', 100, 15000);