-- STEP 3: Create essential functions

-- Function to get user credit balance (for your API)
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

-- Function to get user credits (for credit manager)
CREATE OR REPLACE FUNCTION get_user_credits(_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  total_balance INTEGER;
  total_earned INTEGER;
  total_spent INTEGER;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_balance
  FROM credits WHERE user_id = _user_id;

  SELECT COALESCE(SUM(amount), 0) INTO total_earned
  FROM credits WHERE user_id = _user_id AND amount > 0;

  SELECT COALESCE(ABS(SUM(amount)), 0) INTO total_spent
  FROM credits WHERE user_id = _user_id AND amount < 0;
  
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

-- Function to make user admin
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