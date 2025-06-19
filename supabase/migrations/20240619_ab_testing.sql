-- Create A/B test configuration table
CREATE TABLE IF NOT EXISTS ab_test_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id VARCHAR(255) UNIQUE NOT NULL,
  test_type VARCHAR(100) NOT NULL,
  traffic_split DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  config JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create A/B test results table
CREATE TABLE IF NOT EXISTS ab_test_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id VARCHAR(255) NOT NULL REFERENCES ab_test_configs(test_id) ON DELETE CASCADE,
  variant VARCHAR(50) NOT NULL,
  response_time INTEGER NOT NULL, -- in milliseconds
  cache_hit BOOLEAN NOT NULL DEFAULT FALSE,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ab_test_configs_test_id ON ab_test_configs(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_configs_status ON ab_test_configs(status);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_test_id ON ab_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_variant ON ab_test_results(variant);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_recorded_at ON ab_test_results(recorded_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for ab_test_configs
CREATE TRIGGER update_ab_test_configs_updated_at
  BEFORE UPDATE ON ab_test_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE ab_test_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access (you may want to adjust these based on your auth setup)
CREATE POLICY "Admin can manage A/B test configs" ON ab_test_configs
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can view A/B test results" ON ab_test_results
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Allow service role to access everything
CREATE POLICY "Service role full access to ab_test_configs" ON ab_test_configs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to ab_test_results" ON ab_test_results
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant necessary permissions
GRANT ALL ON ab_test_configs TO authenticated;
GRANT ALL ON ab_test_results TO authenticated;
GRANT ALL ON ab_test_configs TO service_role;
GRANT ALL ON ab_test_results TO service_role;