-- Create performance benchmarks table
CREATE TABLE IF NOT EXISTS performance_benchmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_name VARCHAR(255) NOT NULL,
  config JSONB NOT NULL,
  results JSONB NOT NULL,
  sample_count INTEGER NOT NULL DEFAULT 0,
  benchmark_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_performance_benchmarks_test_name ON performance_benchmarks(test_name);
CREATE INDEX IF NOT EXISTS idx_performance_benchmarks_created_at ON performance_benchmarks(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_benchmarks_sample_count ON performance_benchmarks(sample_count);

-- Create trigger for updated_at
CREATE TRIGGER update_performance_benchmarks_updated_at
  BEFORE UPDATE ON performance_benchmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE performance_benchmarks ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin can manage performance benchmarks" ON performance_benchmarks
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Allow service role to access everything
CREATE POLICY "Service role full access to performance benchmarks" ON performance_benchmarks
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant necessary permissions
GRANT ALL ON performance_benchmarks TO authenticated;
GRANT ALL ON performance_benchmarks TO service_role;

-- Create view for benchmark summary statistics
CREATE OR REPLACE VIEW benchmark_summary AS
SELECT 
  test_name,
  COUNT(*) as total_runs,
  AVG((results->>'averageResponseTime')::numeric) as avg_response_time,
  AVG((results->>'cacheHitRate')::numeric) as avg_cache_hit_rate,
  AVG((results->>'throughput')::numeric) as avg_throughput,
  MIN(created_at) as first_run,
  MAX(created_at) as last_run
FROM performance_benchmarks
GROUP BY test_name
ORDER BY last_run DESC;

-- Grant access to the view
GRANT SELECT ON benchmark_summary TO authenticated;
GRANT SELECT ON benchmark_summary TO service_role;