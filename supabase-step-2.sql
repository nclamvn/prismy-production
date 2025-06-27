-- STEP 2: Enable RLS and add policies for credits table
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" ON credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert credits" ON credits FOR INSERT WITH CHECK (true);

-- STEP 3: Create the view now that credits table exists
CREATE VIEW user_credit_balances AS
SELECT 
  user_id,
  COALESCE(SUM(amount), 0) as current_balance,
  COUNT(*) as transaction_count,
  MAX(created_at) as last_transaction_at
FROM credits 
GROUP BY user_id;

-- STEP 4: Add missing columns to invitations table
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS credit_amount INTEGER DEFAULT 15000;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';