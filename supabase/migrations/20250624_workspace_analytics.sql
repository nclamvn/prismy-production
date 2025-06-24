-- Workspace Analytics Tables
-- Comprehensive tracking for AI workspace adoption and usage

-- Main analytics events table
CREATE TABLE IF NOT EXISTS workspace_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  metadata JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id VARCHAR(100) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  cultural_rhythm VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspace_analytics_event_type ON workspace_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_workspace_analytics_user_id ON workspace_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_analytics_session_id ON workspace_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_workspace_analytics_timestamp ON workspace_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_workspace_analytics_cultural_rhythm ON workspace_analytics(cultural_rhythm);

-- Agent performance tracking
CREATE TABLE IF NOT EXISTS agent_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id VARCHAR(50) NOT NULL,
  agent_name VARCHAR(100) NOT NULL,
  total_interactions INTEGER DEFAULT 0,
  successful_interactions INTEGER DEFAULT 0,
  total_response_time INTEGER DEFAULT 0, -- in milliseconds
  user_satisfaction_sum INTEGER DEFAULT 0,
  user_satisfaction_count INTEGER DEFAULT 0,
  last_interaction TIMESTAMPTZ,
  cultural_relevance_score INTEGER DEFAULT 80,
  popular_tasks JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint for agent performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_performance_agent_id ON agent_performance(agent_id);

-- Document processing metrics
CREATE TABLE IF NOT EXISTS document_processing_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  document_type VARCHAR(50),
  document_size INTEGER, -- in bytes
  processing_time INTEGER, -- in milliseconds
  success BOOLEAN DEFAULT true,
  insights_generated INTEGER DEFAULT 0,
  agent_ids JSONB DEFAULT '[]',
  cultural_context VARCHAR(50) DEFAULT 'vietnamese',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for document metrics
CREATE INDEX IF NOT EXISTS idx_document_metrics_user_id ON document_processing_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_document_metrics_document_type ON document_processing_metrics(document_type);
CREATE INDEX IF NOT EXISTS idx_document_metrics_timestamp ON document_processing_metrics(timestamp);

-- Feedback collection table
CREATE TABLE IF NOT EXISTS workspace_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  feedback_type VARCHAR(50) NOT NULL, -- 'agent', 'document_processing', 'general', etc.
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  category VARCHAR(100),
  feedback_text TEXT,
  metadata JSONB DEFAULT '{}',
  cultural_context VARCHAR(50) DEFAULT 'vietnamese',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for feedback
CREATE INDEX IF NOT EXISTS idx_workspace_feedback_user_id ON workspace_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_feedback_type ON workspace_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_workspace_feedback_rating ON workspace_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_workspace_feedback_created_at ON workspace_feedback(created_at);

-- User session tracking
CREATE TABLE IF NOT EXISTS workspace_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(100) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  device_type VARCHAR(20), -- 'desktop', 'tablet', 'mobile'
  user_agent TEXT,
  cultural_rhythm VARCHAR(20),
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration INTEGER, -- in seconds
  events_count INTEGER DEFAULT 0,
  workspace_modes JSONB DEFAULT '[]', -- modes visited during session
  agents_interacted JSONB DEFAULT '[]',
  documents_processed INTEGER DEFAULT 0
);

-- Indexes for sessions
CREATE INDEX IF NOT EXISTS idx_workspace_sessions_user_id ON workspace_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_sessions_device_type ON workspace_sessions(device_type);
CREATE INDEX IF NOT EXISTS idx_workspace_sessions_start_time ON workspace_sessions(start_time);

-- Real-time analytics view for dashboard
CREATE OR REPLACE VIEW workspace_analytics_summary AS
SELECT 
  date_trunc('day', timestamp) as date,
  event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions,
  cultural_rhythm,
  metadata->>'deviceType' as device_type
FROM workspace_analytics 
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY date_trunc('day', timestamp), event_type, cultural_rhythm, metadata->>'deviceType'
ORDER BY date DESC;

-- Agent performance view
CREATE OR REPLACE VIEW agent_performance_summary AS
SELECT 
  agent_id,
  agent_name,
  total_interactions,
  CASE 
    WHEN total_interactions > 0 
    THEN ROUND((successful_interactions::float / total_interactions * 100), 2)
    ELSE 0 
  END as success_rate,
  CASE 
    WHEN total_interactions > 0 
    THEN ROUND(total_response_time::float / total_interactions, 2)
    ELSE 0 
  END as avg_response_time,
  CASE 
    WHEN user_satisfaction_count > 0 
    THEN ROUND(user_satisfaction_sum::float / user_satisfaction_count, 2)
    ELSE 0 
  END as avg_satisfaction,
  cultural_relevance_score,
  popular_tasks,
  last_interaction,
  updated_at
FROM agent_performance
ORDER BY total_interactions DESC;

-- Functions for updating metrics

-- Function to update agent performance
CREATE OR REPLACE FUNCTION update_agent_performance(
  p_agent_id VARCHAR(50),
  p_agent_name VARCHAR(100),
  p_success BOOLEAN DEFAULT true,
  p_response_time INTEGER DEFAULT NULL,
  p_satisfaction INTEGER DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO agent_performance (
    agent_id, 
    agent_name, 
    total_interactions, 
    successful_interactions,
    total_response_time,
    user_satisfaction_sum,
    user_satisfaction_count,
    last_interaction
  ) VALUES (
    p_agent_id, 
    p_agent_name, 
    1, 
    CASE WHEN p_success THEN 1 ELSE 0 END,
    COALESCE(p_response_time, 0),
    COALESCE(p_satisfaction, 0),
    CASE WHEN p_satisfaction IS NOT NULL THEN 1 ELSE 0 END,
    NOW()
  )
  ON CONFLICT (agent_id) DO UPDATE SET
    total_interactions = agent_performance.total_interactions + 1,
    successful_interactions = agent_performance.successful_interactions + 
      CASE WHEN p_success THEN 1 ELSE 0 END,
    total_response_time = agent_performance.total_response_time + 
      COALESCE(p_response_time, 0),
    user_satisfaction_sum = agent_performance.user_satisfaction_sum + 
      COALESCE(p_satisfaction, 0),
    user_satisfaction_count = agent_performance.user_satisfaction_count + 
      CASE WHEN p_satisfaction IS NOT NULL THEN 1 ELSE 0 END,
    last_interaction = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update session
CREATE OR REPLACE FUNCTION update_workspace_session(
  p_session_id VARCHAR(100),
  p_user_id UUID DEFAULT NULL,
  p_device_type VARCHAR(20) DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_cultural_rhythm VARCHAR(20) DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO workspace_sessions (
    session_id,
    user_id,
    device_type,
    user_agent,
    cultural_rhythm,
    events_count
  ) VALUES (
    p_session_id,
    p_user_id,
    p_device_type,
    p_user_agent,
    p_cultural_rhythm,
    1
  )
  ON CONFLICT (session_id) DO UPDATE SET
    events_count = workspace_sessions.events_count + 1,
    end_time = NOW(),
    duration = EXTRACT(EPOCH FROM (NOW() - workspace_sessions.start_time))::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE workspace_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_processing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics (allow all authenticated users to read/write their own data)
CREATE POLICY "Users can insert their own analytics" ON workspace_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own analytics" ON workspace_analytics
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow service role to access all data for admin dashboard
CREATE POLICY "Service role can access all analytics" ON workspace_analytics
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Similar policies for other tables
CREATE POLICY "Users can access their feedback" ON workspace_feedback
  FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can access their sessions" ON workspace_sessions
  FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can access their document metrics" ON document_processing_metrics
  FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

-- Agent performance is public for dashboard
CREATE POLICY "Agent performance is publicly readable" ON agent_performance
  FOR SELECT USING (true);

CREATE POLICY "Service role can update agent performance" ON agent_performance
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions
GRANT ALL ON workspace_analytics TO authenticated;
GRANT ALL ON agent_performance TO authenticated;
GRANT ALL ON document_processing_metrics TO authenticated;
GRANT ALL ON workspace_feedback TO authenticated;
GRANT ALL ON workspace_sessions TO authenticated;

-- Grant access to views
GRANT SELECT ON workspace_analytics_summary TO authenticated;
GRANT SELECT ON agent_performance_summary TO authenticated;