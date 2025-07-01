-- ============================================
-- EDGE FUNCTIONS MONITORING SETUP
-- Tables for tracking Edge Function deployments and performance
-- ============================================

-- Create Edge Function deployments tracking table
CREATE TABLE IF NOT EXISTS public.edge_function_deployments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  deployed_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('deploying', 'deployed', 'failed', 'inactive')),
  version TEXT,
  metadata JSONB,
  deployment_size_kb INTEGER,
  deployment_duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Edge Function invocations tracking table
CREATE TABLE IF NOT EXISTS public.edge_function_invocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  invoked_by UUID REFERENCES auth.users(id),
  success BOOLEAN NOT NULL DEFAULT false,
  response_status INTEGER,
  latency_ms INTEGER,
  memory_used_mb DECIMAL(8,2),
  payload JSONB,
  result JSONB,
  error_message TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Edge Function performance metrics table (aggregated data)
CREATE TABLE IF NOT EXISTS public.edge_function_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hour INTEGER CHECK (hour >= 0 AND hour <= 23),
  total_invocations INTEGER DEFAULT 0,
  successful_invocations INTEGER DEFAULT 0,
  failed_invocations INTEGER DEFAULT 0,
  avg_latency_ms DECIMAL(8,2),
  p95_latency_ms DECIMAL(8,2),
  avg_memory_mb DECIMAL(8,2),
  total_errors INTEGER DEFAULT 0,
  error_rate DECIMAL(5,2),
  uptime_percentage DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(function_name, date, hour)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_edge_deployments_function ON public.edge_function_deployments(function_name);
CREATE INDEX IF NOT EXISTS idx_edge_deployments_status ON public.edge_function_deployments(status);
CREATE INDEX IF NOT EXISTS idx_edge_deployments_created_at ON public.edge_function_deployments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_edge_invocations_function ON public.edge_function_invocations(function_name);
CREATE INDEX IF NOT EXISTS idx_edge_invocations_created_at ON public.edge_function_invocations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_edge_invocations_success ON public.edge_function_invocations(success);
CREATE INDEX IF NOT EXISTS idx_edge_invocations_user ON public.edge_function_invocations(invoked_by);

CREATE INDEX IF NOT EXISTS idx_edge_metrics_function_date ON public.edge_function_metrics(function_name, date DESC);
CREATE INDEX IF NOT EXISTS idx_edge_metrics_hour ON public.edge_function_metrics(date, hour);

-- Enable RLS on all tables
ALTER TABLE public.edge_function_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edge_function_invocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edge_function_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for Edge Function deployments (admin only)
CREATE POLICY "Admins can manage deployments" ON public.edge_function_deployments
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view deployments" ON public.edge_function_deployments
  FOR SELECT 
  TO authenticated
  USING (true);

-- RLS policies for Edge Function invocations
CREATE POLICY "Users can view own invocations" ON public.edge_function_invocations
  FOR SELECT 
  USING (auth.uid() = invoked_by OR auth.role() = 'service_role');

CREATE POLICY "System can insert invocations" ON public.edge_function_invocations
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() = invoked_by);

-- RLS policies for metrics (read-only for authenticated users)
CREATE POLICY "Authenticated users can view metrics" ON public.edge_function_metrics
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "System can manage metrics" ON public.edge_function_metrics
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Function to aggregate invocation metrics
CREATE OR REPLACE FUNCTION public.aggregate_edge_function_metrics()
RETURNS void AS $$
DECLARE
  current_hour INTEGER := EXTRACT(hour FROM NOW());
  current_date DATE := CURRENT_DATE;
  function_record RECORD;
BEGIN
  -- Aggregate metrics for the current hour for each function
  FOR function_record IN 
    SELECT DISTINCT function_name 
    FROM public.edge_function_invocations 
    WHERE created_at >= CURRENT_DATE + (current_hour || ' hours')::INTERVAL
      AND created_at < CURRENT_DATE + ((current_hour + 1) || ' hours')::INTERVAL
  LOOP
    -- Calculate metrics for this function and hour
    INSERT INTO public.edge_function_metrics (
      function_name,
      date,
      hour,
      total_invocations,
      successful_invocations,
      failed_invocations,
      avg_latency_ms,
      p95_latency_ms,
      avg_memory_mb,
      total_errors,
      error_rate,
      uptime_percentage
    )
    SELECT 
      function_record.function_name,
      current_date,
      current_hour,
      COUNT(*) as total_invocations,
      COUNT(*) FILTER (WHERE success = true) as successful_invocations,
      COUNT(*) FILTER (WHERE success = false) as failed_invocations,
      AVG(latency_ms) as avg_latency_ms,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency_ms,
      AVG(memory_used_mb) as avg_memory_mb,
      COUNT(*) FILTER (WHERE success = false) as total_errors,
      (COUNT(*) FILTER (WHERE success = false) * 100.0 / COUNT(*)) as error_rate,
      (COUNT(*) FILTER (WHERE success = true) * 100.0 / COUNT(*)) as uptime_percentage
    FROM public.edge_function_invocations
    WHERE function_name = function_record.function_name
      AND created_at >= CURRENT_DATE + (current_hour || ' hours')::INTERVAL
      AND created_at < CURRENT_DATE + ((current_hour + 1) || ' hours')::INTERVAL
    ON CONFLICT (function_name, date, hour) 
    DO UPDATE SET
      total_invocations = EXCLUDED.total_invocations,
      successful_invocations = EXCLUDED.successful_invocations,
      failed_invocations = EXCLUDED.failed_invocations,
      avg_latency_ms = EXCLUDED.avg_latency_ms,
      p95_latency_ms = EXCLUDED.p95_latency_ms,
      avg_memory_mb = EXCLUDED.avg_memory_mb,
      total_errors = EXCLUDED.total_errors,
      error_rate = EXCLUDED.error_rate,
      uptime_percentage = EXCLUDED.uptime_percentage,
      updated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track Edge Function performance
CREATE OR REPLACE FUNCTION public.track_edge_function_call(
  p_function_name TEXT,
  p_user_id UUID DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_response_status INTEGER DEFAULT 200,
  p_latency_ms INTEGER DEFAULT NULL,
  p_memory_mb DECIMAL DEFAULT NULL,
  p_payload JSONB DEFAULT NULL,
  p_result JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.edge_function_invocations (
    function_name,
    invoked_by,
    success,
    response_status,
    latency_ms,
    memory_used_mb,
    payload,
    result,
    error_message
  )
  VALUES (
    p_function_name,
    p_user_id,
    p_success,
    p_response_status,
    p_latency_ms,
    p_memory_mb,
    p_payload,
    p_result,
    p_error_message
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get Edge Function health status
CREATE OR REPLACE FUNCTION public.get_edge_function_health(p_function_name TEXT)
RETURNS TABLE (
  function_name TEXT,
  is_healthy BOOLEAN,
  last_successful_call TIMESTAMP WITH TIME ZONE,
  error_rate_24h DECIMAL,
  avg_latency_24h DECIMAL,
  total_calls_24h INTEGER,
  uptime_percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p_function_name as function_name,
    CASE 
      WHEN COUNT(*) FILTER (WHERE success = false AND created_at >= NOW() - INTERVAL '1 hour') = 0 
      THEN true 
      ELSE false 
    END as is_healthy,
    MAX(created_at) FILTER (WHERE success = true) as last_successful_call,
    (COUNT(*) FILTER (WHERE success = false AND created_at >= NOW() - INTERVAL '24 hours') * 100.0 / 
     NULLIF(COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours'), 0)) as error_rate_24h,
    AVG(latency_ms) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as avg_latency_24h,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as total_calls_24h,
    (COUNT(*) FILTER (WHERE success = true AND created_at >= NOW() - INTERVAL '24 hours') * 100.0 / 
     NULLIF(COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours'), 0)) as uptime_percentage
  FROM public.edge_function_invocations
  WHERE function_name = p_function_name
    AND created_at >= NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old invocation logs
CREATE OR REPLACE FUNCTION public.cleanup_edge_function_logs()
RETURNS void AS $$
BEGIN
  -- Delete invocation logs older than 7 days
  DELETE FROM public.edge_function_invocations
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  -- Delete hourly metrics older than 90 days
  DELETE FROM public.edge_function_metrics
  WHERE date < CURRENT_DATE - INTERVAL '90 days';
  
  -- Delete deployment logs older than 1 year
  DELETE FROM public.edge_function_deployments
  WHERE created_at < NOW() - INTERVAL '1 year'
    AND status IN ('failed', 'inactive');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.aggregate_edge_function_metrics() TO service_role;
GRANT EXECUTE ON FUNCTION public.track_edge_function_call(TEXT, UUID, BOOLEAN, INTEGER, INTEGER, DECIMAL, JSONB, JSONB, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_edge_function_health(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_edge_function_logs() TO service_role;

-- Create trigger to auto-aggregate metrics every hour
CREATE OR REPLACE FUNCTION public.trigger_aggregate_metrics()
RETURNS trigger AS $$
BEGIN
  -- Only trigger aggregation if we have significant activity
  IF (SELECT COUNT(*) FROM public.edge_function_invocations 
      WHERE created_at >= NOW() - INTERVAL '1 hour') > 10 THEN
    PERFORM public.aggregate_edge_function_metrics();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to aggregate metrics on new invocations (with throttling)
CREATE TRIGGER auto_aggregate_metrics
  AFTER INSERT ON public.edge_function_invocations
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_aggregate_metrics();

-- Sample data for development/testing
INSERT INTO public.edge_function_deployments (function_name, deployed_by, status, version, metadata) 
VALUES 
  (
    'document-processor', 
    (SELECT id FROM auth.users LIMIT 1), 
    'deployed', 
    'v1.0.0',
    '{"size_kb": 245, "memory_limit": "128MB", "timeout": "30s"}'::jsonb
  )
ON CONFLICT DO NOTHING;

-- Create scheduled cleanup job (if pg_cron is available)
-- SELECT cron.schedule('cleanup-edge-function-logs', '0 4 * * *', 'SELECT public.cleanup_edge_function_logs();');
-- SELECT cron.schedule('aggregate-edge-metrics', '0 * * * *', 'SELECT public.aggregate_edge_function_metrics();');