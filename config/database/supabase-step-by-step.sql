-- Step-by-step setup: Run each section one at a time

-- STEP 1: Create credits table (run this first)
CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for credits
CREATE INDEX idx_credits_user_id ON credits(user_id);
CREATE INDEX idx_credits_created_at ON credits(created_at);