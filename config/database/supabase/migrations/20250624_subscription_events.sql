-- SUBSCRIPTION EVENTS TABLE
-- Track all subscription lifecycle events for analytics and debugging

CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at);
CREATE INDEX IF NOT EXISTS idx_subscription_events_user_type ON subscription_events(user_id, event_type);

-- Enable RLS
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subscription events" ON subscription_events
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policy (service role can access all)
CREATE POLICY "Service role can manage subscription events" ON subscription_events
  FOR ALL USING (auth.role() = 'service_role');

-- Add helpful comment
COMMENT ON TABLE subscription_events IS 'Track subscription lifecycle events including payments, upgrades, cancellations';
COMMENT ON COLUMN subscription_events.event_type IS 'Event types: subscription_created, subscription_updated, subscription_canceled, payment_succeeded, payment_failed, trial_ending, invoice_upcoming, customer_created, customer_updated';
COMMENT ON COLUMN subscription_events.metadata IS 'Additional event data such as subscription_id, amount, currency, etc.';

-- Create function to clean up old events (optional)
CREATE OR REPLACE FUNCTION cleanup_old_subscription_events()
RETURNS void AS $$
BEGIN
  DELETE FROM subscription_events 
  WHERE created_at < NOW() - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job to run cleanup monthly (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-subscription-events', '0 0 1 * *', 'SELECT cleanup_old_subscription_events();');