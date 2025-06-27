-- STEP 4: Add invitation redemption function and test data

-- Function to redeem invitation code
CREATE OR REPLACE FUNCTION redeem_invitation_code(
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

-- Create test invitation code
INSERT INTO invitations (code, max_uses, credit_amount, metadata) 
VALUES (
  'PRISMY2024', 
  100, 
  15000,
  '{"description": "Welcome to Prismy - Beta Access", "type": "beta_welcome"}'
) ON CONFLICT (code) DO NOTHING;