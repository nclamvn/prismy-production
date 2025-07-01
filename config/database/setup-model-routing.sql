-- ============================================
-- MODEL ROUTING TABLES SETUP
-- Tables for tracking AI model selection and optimization
-- ============================================

-- Create model routing logs table
CREATE TABLE IF NOT EXISTS public.model_routing_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  task_type TEXT NOT NULL CHECK (task_type IN ('translation', 'document_processing', 'ocr', 'embedding', 'chat')),
  complexity INTEGER NOT NULL CHECK (complexity >= 1 AND complexity <= 4),
  user_tier TEXT NOT NULL CHECK (user_tier IN ('free', 'standard', 'premium', 'enterprise')),
  selected_provider TEXT NOT NULL,
  selected_model TEXT NOT NULL,
  estimated_cost DECIMAL(10,6) NOT NULL,
  actual_cost DECIMAL(10,6),
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  reason_code TEXT NOT NULL,
  request_metadata JSONB,
  performance_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for model routing logs
CREATE INDEX IF NOT EXISTS idx_model_routing_user_id ON public.model_routing_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_model_routing_task_type ON public.model_routing_logs(task_type);
CREATE INDEX IF NOT EXISTS idx_model_routing_provider ON public.model_routing_logs(selected_provider);
CREATE INDEX IF NOT EXISTS idx_model_routing_created_at ON public.model_routing_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_model_routing_user_tier ON public.model_routing_logs(user_tier);

-- Create provider performance tracking table
CREATE TABLE IF NOT EXISTS public.provider_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  total_latency_ms BIGINT DEFAULT 0,
  total_cost DECIMAL(10,6) DEFAULT 0,
  avg_quality_score DECIMAL(5,2),
  error_rate DECIMAL(5,2),
  avg_latency_ms DECIMAL(8,2),
  cost_per_request DECIMAL(8,6),
  uptime_percentage DECIMAL(5,2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, model, date)
);

-- Create indexes for provider performance
CREATE INDEX IF NOT EXISTS idx_provider_performance_provider ON public.provider_performance(provider);
CREATE INDEX IF NOT EXISTS idx_provider_performance_date ON public.provider_performance(date DESC);
CREATE INDEX IF NOT EXISTS idx_provider_performance_model ON public.provider_performance(provider, model);

-- Create cost optimization insights table
CREATE TABLE IF NOT EXISTS public.cost_optimization_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  insight_type TEXT NOT NULL CHECK (insight_type IN ('model_recommendation', 'usage_pattern', 'cost_saving', 'tier_upgrade')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  potential_savings DECIMAL(8,2),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  action_required BOOLEAN DEFAULT false,
  metadata JSONB,
  is_acknowledged BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for cost optimization insights
CREATE INDEX IF NOT EXISTS idx_cost_insights_user_id ON public.cost_optimization_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_cost_insights_type ON public.cost_optimization_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_cost_insights_acknowledged ON public.cost_optimization_insights(is_acknowledged);
CREATE INDEX IF NOT EXISTS idx_cost_insights_expires_at ON public.cost_optimization_insights(expires_at);

-- Enable RLS on all tables
ALTER TABLE public.model_routing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_optimization_insights ENABLE ROW LEVEL SECURITY;

-- RLS policies for model routing logs
CREATE POLICY "Users can view own routing logs" ON public.model_routing_logs
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage routing logs" ON public.model_routing_logs
  FOR ALL 
  USING (auth.role() = 'service_role');

-- RLS policies for provider performance (read-only for authenticated users)
CREATE POLICY "Authenticated users can view provider performance" ON public.provider_performance
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "System can manage provider performance" ON public.provider_performance
  FOR ALL 
  USING (auth.role() = 'service_role');

-- RLS policies for cost optimization insights
CREATE POLICY "Users can view own insights" ON public.cost_optimization_insights
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own insights" ON public.cost_optimization_insights
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage insights" ON public.cost_optimization_insights
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Function to update provider performance metrics
CREATE OR REPLACE FUNCTION public.update_provider_performance(
  p_provider TEXT,
  p_model TEXT,
  p_success BOOLEAN,
  p_latency_ms INTEGER,
  p_cost DECIMAL,
  p_quality_score INTEGER DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  current_date DATE := CURRENT_DATE;
BEGIN
  INSERT INTO public.provider_performance (
    provider, model, date, total_requests, successful_requests, 
    failed_requests, total_latency_ms, total_cost, avg_quality_score
  )
  VALUES (
    p_provider, p_model, current_date, 1, 
    CASE WHEN p_success THEN 1 ELSE 0 END,
    CASE WHEN p_success THEN 0 ELSE 1 END,
    p_latency_ms, p_cost, p_quality_score
  )
  ON CONFLICT (provider, model, date) 
  DO UPDATE SET
    total_requests = provider_performance.total_requests + 1,
    successful_requests = provider_performance.successful_requests + 
      CASE WHEN p_success THEN 1 ELSE 0 END,
    failed_requests = provider_performance.failed_requests + 
      CASE WHEN p_success THEN 0 ELSE 1 END,
    total_latency_ms = provider_performance.total_latency_ms + p_latency_ms,
    total_cost = provider_performance.total_cost + p_cost,
    avg_quality_score = CASE 
      WHEN p_quality_score IS NOT NULL THEN 
        (COALESCE(provider_performance.avg_quality_score, 0) + p_quality_score) / 2
      ELSE provider_performance.avg_quality_score
    END,
    error_rate = (provider_performance.failed_requests + 
      CASE WHEN p_success THEN 0 ELSE 1 END) * 100.0 / 
      (provider_performance.total_requests + 1),
    avg_latency_ms = (provider_performance.total_latency_ms + p_latency_ms) / 
      (provider_performance.total_requests + 1),
    cost_per_request = (provider_performance.total_cost + p_cost) / 
      (provider_performance.total_requests + 1),
    uptime_percentage = (provider_performance.successful_requests + 
      CASE WHEN p_success THEN 1 ELSE 0 END) * 100.0 / 
      (provider_performance.total_requests + 1),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate cost optimization insights
CREATE OR REPLACE FUNCTION public.generate_cost_insights(p_user_id UUID)
RETURNS void AS $$
DECLARE
  user_spending DECIMAL;
  user_tier TEXT;
  avg_cost_per_request DECIMAL;
  expensive_model_usage INTEGER;
BEGIN
  -- Get user's current tier and spending
  SELECT 
    COALESCE(SUM(metadata->>'cost')::DECIMAL, 0),
    (SELECT subscription_tier FROM user_subscriptions WHERE user_id = p_user_id LIMIT 1)
  INTO user_spending, user_tier
  FROM usage_logs 
  WHERE user_id = p_user_id 
    AND created_at >= NOW() - INTERVAL '30 days';

  -- Check for expensive model usage patterns
  SELECT COUNT(*)
  INTO expensive_model_usage
  FROM model_routing_logs
  WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '7 days'
    AND selected_model IN ('gpt-4', 'claude-3-opus')
    AND estimated_cost > 0.01;

  -- Generate insights based on patterns
  
  -- High cost model usage insight
  IF expensive_model_usage > 10 AND user_tier IN ('free', 'standard') THEN
    INSERT INTO public.cost_optimization_insights (
      user_id, insight_type, title, description, potential_savings, 
      confidence_score, action_required, metadata
    )
    VALUES (
      p_user_id, 'model_recommendation', 
      'Switch to Cost-Effective Models',
      'You''ve been using premium models frequently. Consider using Claude-3-Sonnet or GPT-3.5-Turbo for routine tasks to save up to 80% on costs.',
      user_spending * 0.6,
      85,
      true,
      jsonb_build_object('expensive_usage_count', expensive_model_usage)
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Tier upgrade recommendation
  IF user_spending > 50 AND user_tier = 'free' THEN
    INSERT INTO public.cost_optimization_insights (
      user_id, insight_type, title, description, potential_savings,
      confidence_score, action_required, metadata
    )
    VALUES (
      p_user_id, 'tier_upgrade',
      'Consider Premium Tier',
      'Your usage patterns suggest upgrading to Premium tier would provide better value and access to advanced features.',
      0,
      75,
      false,
      jsonb_build_object('monthly_spending', user_spending)
    )
    ON CONFLICT DO NOTHING;
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old logs
CREATE OR REPLACE FUNCTION public.cleanup_old_routing_logs()
RETURNS void AS $$
BEGIN
  -- Delete routing logs older than 90 days
  DELETE FROM public.model_routing_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Delete provider performance data older than 1 year
  DELETE FROM public.provider_performance
  WHERE date < CURRENT_DATE - INTERVAL '1 year';
  
  -- Delete expired insights
  DELETE FROM public.cost_optimization_insights
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  -- Delete acknowledged insights older than 30 days
  DELETE FROM public.cost_optimization_insights
  WHERE is_acknowledged = true AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_provider_performance(TEXT, TEXT, BOOLEAN, INTEGER, DECIMAL, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_cost_insights(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_routing_logs() TO service_role;

-- Create trigger to auto-generate insights
CREATE OR REPLACE FUNCTION public.trigger_generate_insights()
RETURNS trigger AS $$
BEGIN
  -- Generate insights for users who have significant usage
  IF (NEW.estimated_cost > 0.05 OR 
      (SELECT COUNT(*) FROM model_routing_logs WHERE user_id = NEW.user_id AND created_at >= NOW() - INTERVAL '1 day') > 20) THEN
    PERFORM public.generate_cost_insights(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_insights
  AFTER INSERT ON public.model_routing_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_generate_insights();

-- Create scheduled cleanup job (if pg_cron is available)
-- SELECT cron.schedule('cleanup-routing-logs', '0 3 * * *', 'SELECT public.cleanup_old_routing_logs();');