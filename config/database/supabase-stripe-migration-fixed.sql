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

-- Add constraint for subscription status (without IF NOT EXISTS)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'check_subscription_status'
    ) THEN
        ALTER TABLE user_profiles ADD CONSTRAINT check_subscription_status 
            CHECK (subscription_status IS NULL OR subscription_status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete', 'incomplete_expired'));
    END IF;
END $$;

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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for payment transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);

-- Enable RLS on payment transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment transactions
CREATE POLICY "Users can view their own payment transactions" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment transactions" ON payment_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment transactions" ON payment_transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for payment transactions updated_at
DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create subscription analytics table
CREATE TABLE IF NOT EXISTS subscription_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('subscription_created', 'subscription_updated', 'subscription_canceled', 'payment_succeeded', 'payment_failed')),
  subscription_id TEXT,
  plan_key TEXT,
  amount DECIMAL(12,2),
  currency TEXT DEFAULT 'VND',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for subscription analytics
CREATE INDEX IF NOT EXISTS idx_subscription_analytics_user_id ON subscription_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_analytics_event_type ON subscription_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_analytics_created_at ON subscription_analytics(created_at);

-- Enable RLS on subscription analytics
ALTER TABLE subscription_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subscription analytics
CREATE POLICY "Users can view their own subscription analytics" ON subscription_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscription analytics" ON subscription_analytics
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');