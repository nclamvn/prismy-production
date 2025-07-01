-- ============================================
-- ENTERPRISE ANALYTICS & REPORTING DATABASE SETUP
-- Advanced metrics, dashboards, and business intelligence
-- ============================================

-- Create analytics dashboards table
CREATE TABLE IF NOT EXISTS public.analytics_dashboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  widgets JSONB NOT NULL DEFAULT '[]',
  is_public BOOLEAN DEFAULT false,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create metric definitions table
CREATE TABLE IF NOT EXISTS public.metric_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('count', 'sum', 'avg', 'rate', 'ratio', 'unique')),
  category TEXT NOT NULL CHECK (category IN ('usage', 'performance', 'business', 'quality', 'security')),
  query_template TEXT NOT NULL,
  dimensions TEXT[] DEFAULT '{}',
  filters JSONB DEFAULT '{}',
  aggregation TEXT NOT NULL CHECK (aggregation IN ('hourly', 'daily', 'weekly', 'monthly')),
  unit TEXT,
  description TEXT,
  is_custom BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create metric values table for storing calculated metrics
CREATE TABLE IF NOT EXISTS public.metric_values (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_id TEXT NOT NULL REFERENCES public.metric_definitions(id) ON DELETE CASCADE,
  value DECIMAL(20,6) NOT NULL,
  dimensions JSONB DEFAULT '{}',
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  aggregation_level TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(metric_id, period_start, period_end, aggregation_level, organization_id, user_id)
);

-- Create analytics reports table
CREATE TABLE IF NOT EXISTS public.analytics_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('scheduled', 'adhoc', 'alert')),
  query_config JSONB NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('pdf', 'excel', 'csv', 'json')),
  schedule_config JSONB,
  recipients TEXT[],
  is_active BOOLEAN DEFAULT true,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create report executions table
CREATE TABLE IF NOT EXISTS public.report_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.analytics_reports(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  file_path TEXT,
  file_size INTEGER,
  execution_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create data insights table
CREATE TABLE IF NOT EXISTS public.data_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('trend', 'anomaly', 'recommendation', 'alert')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  category TEXT NOT NULL,
  data_source TEXT NOT NULL,
  insight_data JSONB NOT NULL,
  confidence_score DECIMAL(3,2),
  is_read BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage analytics table for detailed tracking
CREATE TABLE IF NOT EXISTS public.usage_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  event_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  properties JSONB DEFAULT '{}',
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(12,4) NOT NULL,
  metric_unit TEXT,
  dimensions JSONB DEFAULT '{}',
  service_name TEXT,
  endpoint TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create business intelligence views
CREATE OR REPLACE VIEW public.v_daily_usage_summary AS
SELECT 
  DATE(created_at) as date,
  organization_id,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(*) FILTER (WHERE event_type = 'document_upload') as documents_uploaded,
  COUNT(*) FILTER (WHERE event_type = 'translation_start') as translations_started,
  COUNT(*) FILTER (WHERE event_type = 'translation_complete') as translations_completed,
  COUNT(*) FILTER (WHERE event_type = 'api_call') as api_calls
FROM public.usage_analytics
GROUP BY DATE(created_at), organization_id;

CREATE OR REPLACE VIEW public.v_performance_summary AS
SELECT 
  DATE(recorded_at) as date,
  metric_name,
  AVG(metric_value) as avg_value,
  MIN(metric_value) as min_value,
  MAX(metric_value) as max_value,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY metric_value) as median_value,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) as p95_value,
  COUNT(*) as sample_count
FROM public.performance_metrics
GROUP BY DATE(recorded_at), metric_name;

CREATE OR REPLACE VIEW public.v_revenue_analytics AS
SELECT 
  DATE(created_at) as date,
  organization_id,
  subscription_tier,
  SUM(amount) FILTER (WHERE event_type = 'payment_succeeded') as revenue,
  SUM(amount) FILTER (WHERE event_type = 'refund_issued') as refunds,
  COUNT(*) FILTER (WHERE event_type = 'subscription_created') as new_subscriptions,
  COUNT(*) FILTER (WHERE event_type = 'subscription_cancelled') as cancelled_subscriptions
FROM public.billing_records
GROUP BY DATE(created_at), organization_id, subscription_tier;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_user ON public.analytics_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_org ON public.analytics_dashboards(organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_public ON public.analytics_dashboards(is_public);

CREATE INDEX IF NOT EXISTS idx_metric_definitions_category ON public.metric_definitions(category);
CREATE INDEX IF NOT EXISTS idx_metric_definitions_type ON public.metric_definitions(type);

CREATE INDEX IF NOT EXISTS idx_metric_values_metric_period ON public.metric_values(metric_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_metric_values_org_period ON public.metric_values(organization_id, period_start);
CREATE INDEX IF NOT EXISTS idx_metric_values_aggregation ON public.metric_values(aggregation_level);

CREATE INDEX IF NOT EXISTS idx_analytics_reports_user ON public.analytics_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_org ON public.analytics_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_active ON public.analytics_reports(is_active);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_next_run ON public.analytics_reports(next_run_at);

CREATE INDEX IF NOT EXISTS idx_report_executions_report ON public.report_executions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_status ON public.report_executions(status);

CREATE INDEX IF NOT EXISTS idx_data_insights_org ON public.data_insights(organization_id);
CREATE INDEX IF NOT EXISTS idx_data_insights_type ON public.data_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_data_insights_severity ON public.data_insights(severity);
CREATE INDEX IF NOT EXISTS idx_data_insights_unread ON public.data_insights(is_read) WHERE NOT is_read;

CREATE INDEX IF NOT EXISTS idx_usage_analytics_user_date ON public.usage_analytics(user_id, DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_usage_analytics_org_date ON public.usage_analytics(organization_id, DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_usage_analytics_event_type ON public.usage_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_created_at ON public.usage_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_name_date ON public.performance_metrics(metric_name, DATE(recorded_at));
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded_at ON public.performance_metrics(recorded_at);

-- Enable RLS on all analytics tables
ALTER TABLE public.analytics_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metric_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metric_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for analytics dashboards
CREATE POLICY "Users can manage own dashboards" ON public.analytics_dashboards
  FOR ALL 
  USING (user_id = auth.uid());

CREATE POLICY "Organization dashboard access" ON public.analytics_dashboards
  FOR ALL 
  USING (
    organization_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = analytics_dashboards.organization_id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );

CREATE POLICY "Public dashboards viewable" ON public.analytics_dashboards
  FOR SELECT 
  USING (is_public = true);

-- RLS policies for metric definitions
CREATE POLICY "Users can manage own custom metrics" ON public.metric_definitions
  FOR ALL 
  USING (created_by = auth.uid() AND is_custom = true);

CREATE POLICY "Anyone can view default metrics" ON public.metric_definitions
  FOR SELECT 
  USING (is_custom = false);

-- RLS policies for metric values
CREATE POLICY "Users can view own metric values" ON public.metric_values
  FOR SELECT 
  USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = metric_values.organization_id 
      AND user_id = auth.uid() 
      AND status = 'active'
    ))
  );

-- RLS policies for analytics reports
CREATE POLICY "Users can manage own reports" ON public.analytics_reports
  FOR ALL 
  USING (user_id = auth.uid());

CREATE POLICY "Organization report access" ON public.analytics_reports
  FOR ALL 
  USING (
    organization_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = analytics_reports.organization_id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- RLS policies for data insights
CREATE POLICY "Organization insights access" ON public.data_insights
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = data_insights.organization_id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- RLS policies for usage analytics
CREATE POLICY "Users can view own usage data" ON public.usage_analytics
  FOR SELECT 
  USING (
    user_id = auth.uid() OR
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = usage_analytics.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    ))
  );

-- System role policies
CREATE POLICY "System can manage all analytics" ON public.analytics_dashboards
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "System can manage all metrics" ON public.metric_definitions
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "System can manage all values" ON public.metric_values
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "System can manage all usage" ON public.usage_analytics
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "System can manage all performance" ON public.performance_metrics
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Functions for analytics
CREATE OR REPLACE FUNCTION public.track_usage_event(
  p_user_id UUID,
  p_organization_id UUID,
  p_event_type TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_properties JSONB DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.usage_analytics (
    user_id, organization_id, event_type, resource_type, resource_id,
    properties, session_id, ip_address, user_agent
  )
  VALUES (
    p_user_id, p_organization_id, p_event_type, p_resource_type, p_resource_id,
    p_properties, p_session_id, p_ip_address, p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.record_performance_metric(
  p_metric_name TEXT,
  p_metric_value DECIMAL,
  p_metric_unit TEXT DEFAULT NULL,
  p_dimensions JSONB DEFAULT NULL,
  p_service_name TEXT DEFAULT NULL,
  p_endpoint TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.performance_metrics (
    metric_name, metric_value, metric_unit, dimensions, service_name, endpoint
  )
  VALUES (
    p_metric_name, p_metric_value, p_metric_unit, p_dimensions, p_service_name, p_endpoint
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.calculate_metric_value(
  p_metric_id TEXT,
  p_period_start TIMESTAMP WITH TIME ZONE,
  p_period_end TIMESTAMP WITH TIME ZONE,
  p_organization_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS DECIMAL AS $$
DECLARE
  metric_def RECORD;
  result DECIMAL;
BEGIN
  -- Get metric definition
  SELECT * INTO metric_def
  FROM public.metric_definitions
  WHERE id = p_metric_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Metric definition not found: %', p_metric_id;
  END IF;
  
  -- Execute the metric query (simplified implementation)
  -- In production, this would use a more sophisticated query builder
  EXECUTE metric_def.query_template 
  USING p_period_start, p_period_end, p_organization_id, p_user_id
  INTO result;
  
  -- Store the calculated value
  INSERT INTO public.metric_values (
    metric_id, value, period_start, period_end, aggregation_level,
    organization_id, user_id
  )
  VALUES (
    p_metric_id, result, p_period_start, p_period_end, metric_def.aggregation,
    p_organization_id, p_user_id
  )
  ON CONFLICT (metric_id, period_start, period_end, aggregation_level, organization_id, user_id)
  DO UPDATE SET value = EXCLUDED.value, created_at = NOW();
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.execute_analytics_query(
  query_text TEXT,
  query_params TEXT[] DEFAULT NULL
)
RETURNS TABLE(result JSONB) AS $$
BEGIN
  -- Security: This function should be restricted and validated in production
  -- For now, it's a placeholder for executing dynamic analytics queries
  RETURN QUERY
  SELECT '{"placeholder": "Dynamic query execution not implemented"}'::JSONB;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.generate_insight(
  p_organization_id UUID,
  p_insight_type TEXT,
  p_title TEXT,
  p_description TEXT,
  p_severity TEXT,
  p_category TEXT,
  p_data_source TEXT,
  p_insight_data JSONB,
  p_confidence_score DECIMAL DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  insight_id UUID;
BEGIN
  INSERT INTO public.data_insights (
    organization_id, insight_type, title, description, severity,
    category, data_source, insight_data, confidence_score
  )
  VALUES (
    p_organization_id, p_insight_type, p_title, p_description, p_severity,
    p_category, p_data_source, p_insight_data, p_confidence_score
  )
  RETURNING id INTO insight_id;
  
  RETURN insight_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.track_usage_event(UUID, UUID, TEXT, TEXT, TEXT, JSONB, TEXT, INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_performance_metric(TEXT, DECIMAL, TEXT, JSONB, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_metric_value(TEXT, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_analytics_query(TEXT, TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_insight(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, DECIMAL) TO service_role;

-- Insert default metric definitions
INSERT INTO public.metric_definitions (
  id, name, type, category, query_template, dimensions, aggregation, unit, description
) VALUES 
  (
    'documents_uploaded',
    'Documents Uploaded',
    'count',
    'usage',
    'SELECT COUNT(*) FROM documents WHERE created_at BETWEEN $1 AND $2',
    ARRAY['user_id', 'organization_id', 'document_type'],
    'daily',
    'documents',
    'Total number of documents uploaded'
  ),
  (
    'translations_completed',
    'Translations Completed',
    'count',
    'usage',
    'SELECT COUNT(*) FROM translations WHERE status = ''completed'' AND completed_at BETWEEN $1 AND $2',
    ARRAY['source_language', 'target_language', 'user_id', 'organization_id'],
    'daily',
    'translations',
    'Number of completed translations'
  ),
  (
    'active_users',
    'Active Users',
    'unique',
    'usage',
    'SELECT COUNT(DISTINCT user_id) FROM usage_analytics WHERE event_type = ''login'' AND created_at BETWEEN $1 AND $2',
    ARRAY['organization_id'],
    'daily',
    'users',
    'Number of unique active users'
  ),
  (
    'revenue',
    'Revenue',
    'sum',
    'business',
    'SELECT COALESCE(SUM(amount), 0) FROM billing_records WHERE status = ''completed'' AND created_at BETWEEN $1 AND $2',
    ARRAY['subscription_tier', 'organization_id'],
    'daily',
    'currency',
    'Total revenue generated'
  ),
  (
    'error_rate',
    'Error Rate',
    'rate',
    'quality',
    'SELECT COUNT(*) FROM error_logs WHERE created_at BETWEEN $1 AND $2',
    ARRAY['error_type', 'service'],
    'hourly',
    'percentage',
    'System error rate'
  )
ON CONFLICT (id) DO NOTHING;

-- Create sample dashboard
INSERT INTO public.analytics_dashboards (
  name, description, widgets, is_public, user_id
) VALUES (
  'Default Dashboard',
  'Overview of key metrics and performance indicators',
  '[
    {
      "id": "usage-overview",
      "type": "chart",
      "title": "Usage Overview",
      "query": {
        "metrics": ["documents_uploaded", "translations_completed"],
        "granularity": "day"
      },
      "config": {"chartType": "line"},
      "position": {"x": 0, "y": 0, "w": 6, "h": 3}
    },
    {
      "id": "active-users",
      "type": "metric",
      "title": "Active Users",
      "query": {
        "metrics": ["active_users"],
        "granularity": "day"
      },
      "config": {"format": "number"},
      "position": {"x": 6, "y": 0, "w": 3, "h": 2}
    },
    {
      "id": "revenue-chart",
      "type": "chart",
      "title": "Revenue Trend",
      "query": {
        "metrics": ["revenue"],
        "granularity": "day"
      },
      "config": {"chartType": "area"},
      "position": {"x": 0, "y": 3, "w": 9, "h": 3}
    }
  ]'::JSONB,
  true,
  (SELECT id FROM auth.users LIMIT 1)
) ON CONFLICT DO NOTHING;