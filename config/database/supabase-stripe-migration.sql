-- Add Stripe-related columns to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subscription_current_period_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP WITH TIME ZONE;

-- Add indexes for Stripe fields
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer_id ON user_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_subscription_id ON user_profiles(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);

-- Add constraint for subscription status
ALTER TABLE user_profiles ADD CONSTRAINT IF NOT EXISTS check_subscription_status 
  CHECK (subscription_status IS NULL OR subscription_status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete', 'incomplete_expired'));

-- Create payment transactions table for Vietnamese payment gateways
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'vnpay', 'momo')),
  plan_key TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'VND' CHECK (currency IN ('VND', 'USD')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'canceled')),
  transaction_id TEXT,
  payment_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for payment transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_method ON payment_transactions(payment_method);

-- Row Level Security for payment transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Payment transactions policies
CREATE POLICY "Users can view own transactions" ON payment_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON payment_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update the UserProfile type in TypeScript by adding these fields:
-- stripe_customer_id?: string | null
-- stripe_subscription_id?: string | null  
-- subscription_status?: string | null
-- subscription_plan?: string | null
-- subscription_current_period_start?: string | null
-- subscription_current_period_end?: string | null