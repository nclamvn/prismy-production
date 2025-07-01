-- ============================================
-- API MANAGEMENT & WEBHOOKS DATABASE SETUP
-- API keys, webhooks, rate limiting, and usage tracking
-- ============================================

-- Create webhooks table
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  headers JSONB DEFAULT '{}',
  retry_config JSONB DEFAULT '{
    "maxRetries": 3,
    "retryDelay": 1000,
    "backoffMultiplier": 2
  }',
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create webhook events table
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'delivered', 'failed', 'cancelled')) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create API usage logs table for detailed tracking
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  request_size INTEGER,
  response_size INTEGER,
  ip_address INET,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- API key ID, user ID, or IP address
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('api_key', 'user', 'ip', 'organization')),
  endpoint_pattern TEXT NOT NULL,
  window_size INTEGER NOT NULL, -- in seconds
  max_requests INTEGER NOT NULL,
  current_requests INTEGER DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(identifier, identifier_type, endpoint_pattern)
);

-- Create API documentation table
CREATE TABLE IF NOT EXISTS public.api_documentation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',
  openapi_spec JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  custom_domain TEXT,
  theme_config JSONB DEFAULT '{}',
  access_control JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create webhook delivery logs for debugging
CREATE TABLE IF NOT EXISTS public.webhook_delivery_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_event_id UUID NOT NULL REFERENCES public.webhook_events(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  request_headers JSONB,
  request_body TEXT,
  response_status INTEGER,
  response_headers JSONB,
  response_body TEXT,
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create API rate limit violations table
CREATE TABLE IF NOT EXISTS public.rate_limit_violations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  identifier_type TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  violation_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create API endpoint analytics table
CREATE TABLE IF NOT EXISTS public.api_endpoint_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  date DATE NOT NULL,
  hour INTEGER CHECK (hour >= 0 AND hour <= 23),
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  avg_response_time_ms DECIMAL(10,2),
  p95_response_time_ms DECIMAL(10,2),
  total_data_transferred BIGINT DEFAULT 0,
  unique_clients INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, endpoint, method, date, hour)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhooks_user ON public.webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_org ON public.webhooks(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON public.webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON public.webhooks USING GIN(events);

CREATE INDEX IF NOT EXISTS idx_webhook_events_webhook ON public.webhook_events(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON public.webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_next_retry ON public.webhook_events(next_retry_at) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_api_key ON public.api_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user ON public.api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_org ON public.api_usage_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_endpoint ON public.api_usage_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON public.api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_status ON public.api_usage_logs(status_code);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits(identifier, identifier_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_pattern ON public.rate_limits(endpoint_pattern);

CREATE INDEX IF NOT EXISTS idx_api_documentation_org ON public.api_documentation(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_documentation_public ON public.api_documentation(is_public);

CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_event ON public.webhook_delivery_logs(webhook_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_created_at ON public.webhook_delivery_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_identifier ON public.rate_limit_violations(identifier, identifier_type);
CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_window ON public.rate_limit_violations(window_start, window_end);

CREATE INDEX IF NOT EXISTS idx_api_endpoint_analytics_org_date ON public.api_endpoint_analytics(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_api_endpoint_analytics_endpoint ON public.api_endpoint_analytics(endpoint, method);

-- Enable RLS on all API/webhook tables
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_endpoint_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for webhooks
CREATE POLICY "Users can manage their own webhooks" ON public.webhooks
  FOR ALL 
  USING (user_id = auth.uid());

CREATE POLICY "Organization webhook access" ON public.webhooks
  FOR ALL 
  USING (
    organization_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = webhooks.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- RLS policies for webhook events
CREATE POLICY "Webhook event access via webhook ownership" ON public.webhook_events
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.webhooks 
      WHERE id = webhook_events.webhook_id 
      AND (
        user_id = auth.uid() OR
        (organization_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.organization_members 
          WHERE organization_id = webhooks.organization_id 
          AND user_id = auth.uid() 
          AND role IN ('owner', 'admin')
          AND status = 'active'
        ))
      )
    )
  );

-- RLS policies for API usage logs
CREATE POLICY "Users can view their own API usage" ON public.api_usage_logs
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Organization API usage access" ON public.api_usage_logs
  FOR SELECT 
  USING (
    organization_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = api_usage_logs.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- RLS policies for API documentation
CREATE POLICY "Users can manage their org API docs" ON public.api_documentation
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = api_documentation.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

CREATE POLICY "Public API docs viewable by all" ON public.api_documentation
  FOR SELECT 
  USING (is_public = true);

-- RLS policies for endpoint analytics
CREATE POLICY "Organization analytics access" ON public.api_endpoint_analytics
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = api_endpoint_analytics.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- System role policies
CREATE POLICY "System can manage all webhooks" ON public.webhooks
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "System can manage all webhook events" ON public.webhook_events
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "System can manage all API usage" ON public.api_usage_logs
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "System can manage all rate limits" ON public.rate_limits
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "System can manage all webhook logs" ON public.webhook_delivery_logs
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "System can manage all rate violations" ON public.rate_limit_violations
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "System can manage all endpoint analytics" ON public.api_endpoint_analytics
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Functions for API and webhook management
CREATE OR REPLACE FUNCTION public.log_api_usage(
  p_api_key_id UUID,
  p_user_id UUID,
  p_organization_id UUID,
  p_endpoint TEXT,
  p_method TEXT,
  p_status_code INTEGER,
  p_response_time_ms INTEGER DEFAULT NULL,
  p_request_size INTEGER DEFAULT NULL,
  p_response_size INTEGER DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.api_usage_logs (
    api_key_id, user_id, organization_id, endpoint, method, status_code,
    response_time_ms, request_size, response_size, ip_address, user_agent, error_message
  )
  VALUES (
    p_api_key_id, p_user_id, p_organization_id, p_endpoint, p_method, p_status_code,
    p_response_time_ms, p_request_size, p_response_size, p_ip_address, p_user_agent, p_error_message
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_identifier_type TEXT,
  p_endpoint_pattern TEXT,
  p_window_size INTEGER,
  p_max_requests INTEGER
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, reset_time TIMESTAMP WITH TIME ZONE) AS $$
DECLARE
  current_window_start TIMESTAMP WITH TIME ZONE;
  current_requests INTEGER;
  rate_limit_record RECORD;
BEGIN
  -- Calculate current window start
  current_window_start := DATE_TRUNC('second', NOW()) - 
    INTERVAL '1 second' * (EXTRACT(EPOCH FROM NOW())::INTEGER % p_window_size);

  -- Get or create rate limit record
  SELECT * INTO rate_limit_record
  FROM public.rate_limits
  WHERE identifier = p_identifier 
    AND identifier_type = p_identifier_type 
    AND endpoint_pattern = p_endpoint_pattern;

  IF NOT FOUND THEN
    -- Create new rate limit record
    INSERT INTO public.rate_limits (
      identifier, identifier_type, endpoint_pattern, window_size, max_requests,
      current_requests, window_start
    )
    VALUES (
      p_identifier, p_identifier_type, p_endpoint_pattern, p_window_size, p_max_requests,
      1, current_window_start
    );
    
    RETURN QUERY SELECT true, p_max_requests - 1, current_window_start + INTERVAL '1 second' * p_window_size;
    RETURN;
  END IF;

  -- Check if we're in a new window
  IF rate_limit_record.window_start < current_window_start THEN
    -- Reset for new window
    UPDATE public.rate_limits
    SET current_requests = 1,
        window_start = current_window_start,
        updated_at = NOW()
    WHERE id = rate_limit_record.id;
    
    RETURN QUERY SELECT true, p_max_requests - 1, current_window_start + INTERVAL '1 second' * p_window_size;
    RETURN;
  END IF;

  -- Check if limit exceeded
  IF rate_limit_record.current_requests >= p_max_requests THEN
    -- Log rate limit violation
    INSERT INTO public.rate_limit_violations (
      identifier, identifier_type, endpoint, violation_count,
      window_start, window_end
    )
    VALUES (
      p_identifier, p_identifier_type, p_endpoint_pattern, 1,
      rate_limit_record.window_start, 
      rate_limit_record.window_start + INTERVAL '1 second' * p_window_size
    )
    ON CONFLICT (identifier, identifier_type, window_start, window_end, endpoint)
    DO UPDATE SET violation_count = rate_limit_violations.violation_count + 1;
    
    RETURN QUERY SELECT 
      false, 
      0, 
      rate_limit_record.window_start + INTERVAL '1 second' * p_window_size;
    RETURN;
  END IF;

  -- Increment request count
  UPDATE public.rate_limits
  SET current_requests = current_requests + 1,
      updated_at = NOW()
  WHERE id = rate_limit_record.id;

  RETURN QUERY SELECT 
    true, 
    p_max_requests - (rate_limit_record.current_requests + 1),
    rate_limit_record.window_start + INTERVAL '1 second' * p_window_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_endpoint_analytics(
  p_organization_id UUID,
  p_endpoint TEXT,
  p_method TEXT,
  p_status_code INTEGER,
  p_response_time_ms INTEGER,
  p_data_size INTEGER
)
RETURNS void AS $$
DECLARE
  current_date DATE := CURRENT_DATE;
  current_hour INTEGER := EXTRACT(HOUR FROM NOW());
  is_successful BOOLEAN := p_status_code >= 200 AND p_status_code < 300;
BEGIN
  INSERT INTO public.api_endpoint_analytics (
    organization_id, endpoint, method, date, hour,
    total_requests, successful_requests, failed_requests,
    avg_response_time_ms, p95_response_time_ms, total_data_transferred, unique_clients
  )
  VALUES (
    p_organization_id, p_endpoint, p_method, current_date, current_hour,
    1, 
    CASE WHEN is_successful THEN 1 ELSE 0 END,
    CASE WHEN is_successful THEN 0 ELSE 1 END,
    p_response_time_ms, p_response_time_ms, p_data_size, 1
  )
  ON CONFLICT (organization_id, endpoint, method, date, hour)
  DO UPDATE SET
    total_requests = api_endpoint_analytics.total_requests + 1,
    successful_requests = api_endpoint_analytics.successful_requests + 
      CASE WHEN is_successful THEN 1 ELSE 0 END,
    failed_requests = api_endpoint_analytics.failed_requests + 
      CASE WHEN is_successful THEN 0 ELSE 1 END,
    avg_response_time_ms = (
      (api_endpoint_analytics.avg_response_time_ms * api_endpoint_analytics.total_requests) + p_response_time_ms
    ) / (api_endpoint_analytics.total_requests + 1),
    total_data_transferred = api_endpoint_analytics.total_data_transferred + p_data_size,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_events()
RETURNS void AS $$
BEGIN
  -- Delete webhook events older than 30 days
  DELETE FROM public.webhook_events 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Delete webhook delivery logs older than 7 days
  DELETE FROM public.webhook_delivery_logs 
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  -- Clean up old rate limit records (older than 1 hour)
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '1 hour';
  
  -- Clean up old API usage logs (older than 90 days)
  DELETE FROM public.api_usage_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_webhook_statistics(
  p_organization_id UUID DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
  total_webhooks BIGINT,
  active_webhooks BIGINT,
  total_events BIGINT,
  delivered_events BIGINT,
  failed_events BIGINT,
  pending_events BIGINT,
  avg_delivery_time_ms DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.webhooks 
     WHERE (p_organization_id IS NULL OR organization_id = p_organization_id)) as total_webhooks,
    
    (SELECT COUNT(*) FROM public.webhooks 
     WHERE (p_organization_id IS NULL OR organization_id = p_organization_id)
     AND is_active = true) as active_webhooks,
    
    (SELECT COUNT(*) FROM public.webhook_events we
     JOIN public.webhooks w ON we.webhook_id = w.id
     WHERE (p_organization_id IS NULL OR w.organization_id = p_organization_id)
     AND we.created_at >= NOW() - (p_days || ' days')::INTERVAL) as total_events,
    
    (SELECT COUNT(*) FROM public.webhook_events we
     JOIN public.webhooks w ON we.webhook_id = w.id
     WHERE (p_organization_id IS NULL OR w.organization_id = p_organization_id)
     AND we.status = 'delivered'
     AND we.created_at >= NOW() - (p_days || ' days')::INTERVAL) as delivered_events,
    
    (SELECT COUNT(*) FROM public.webhook_events we
     JOIN public.webhooks w ON we.webhook_id = w.id
     WHERE (p_organization_id IS NULL OR w.organization_id = p_organization_id)
     AND we.status = 'failed'
     AND we.created_at >= NOW() - (p_days || ' days')::INTERVAL) as failed_events,
    
    (SELECT COUNT(*) FROM public.webhook_events we
     JOIN public.webhooks w ON we.webhook_id = w.id
     WHERE (p_organization_id IS NULL OR w.organization_id = p_organization_id)
     AND we.status = 'pending'
     AND we.created_at >= NOW() - (p_days || ' days')::INTERVAL) as pending_events,
    
    (SELECT AVG(wdl.duration_ms) FROM public.webhook_delivery_logs wdl
     JOIN public.webhook_events we ON wdl.webhook_event_id = we.id
     JOIN public.webhooks w ON we.webhook_id = w.id
     WHERE (p_organization_id IS NULL OR w.organization_id = p_organization_id)
     AND wdl.created_at >= NOW() - (p_days || ' days')::INTERVAL) as avg_delivery_time_ms;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.log_api_usage(UUID, UUID, UUID, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INET, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_endpoint_analytics(UUID, TEXT, TEXT, INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_webhook_events() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_webhook_statistics(UUID, INTEGER) TO authenticated;

-- Create function to increment usage count for API keys
CREATE OR REPLACE FUNCTION increment_usage_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN 1;  -- This would typically increment the existing value
END;
$$ LANGUAGE plpgsql;