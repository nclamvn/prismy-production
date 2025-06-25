-- =====================================================
-- PRISMY AUTONOMOUS AGENT SYSTEM - DATABASE SCHEMA
-- Revolutionary persistent storage for AI document agents
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- ENUMS AND TYPES
-- =====================================================

-- Agent personality types
CREATE TYPE agent_personality AS ENUM (
  'legal', 'financial', 'project', 'research', 'general'
);

-- Agent status types
CREATE TYPE agent_status AS ENUM (
  'active', 'thinking', 'idle', 'paused', 'error', 'retired'
);

-- Collaboration status types
CREATE TYPE collaboration_status AS ENUM (
  'forming', 'active', 'completed', 'failed', 'cancelled'
);

-- Goal types for agents
CREATE TYPE agent_goal_type AS ENUM (
  'monitor', 'notify', 'execute', 'collaborate', 'learn'
);

-- Goal status types
CREATE TYPE goal_status AS ENUM (
  'active', 'completed', 'paused', 'cancelled'
);

-- Task result types
CREATE TYPE task_result_type AS ENUM (
  'analysis', 'summary', 'translation', 'extraction', 'recommendation'
);

-- =====================================================
-- CORE AGENT TABLES
-- =====================================================

-- Main agent registry
CREATE TABLE document_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL,
  document_title VARCHAR(500) NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  
  -- Agent configuration
  personality agent_personality NOT NULL DEFAULT 'general',
  name VARCHAR(200) NOT NULL,
  name_vi VARCHAR(200) NOT NULL,
  specialty TEXT NOT NULL,
  specialty_vi TEXT NOT NULL,
  avatar VARCHAR(10) NOT NULL DEFAULT '🤖',
  
  -- Agent state
  status agent_status NOT NULL DEFAULT 'active',
  autonomy_level INTEGER NOT NULL DEFAULT 75 CHECK (autonomy_level >= 0 AND autonomy_level <= 100),
  efficiency INTEGER NOT NULL DEFAULT 85 CHECK (efficiency >= 0 AND efficiency <= 100),
  
  -- Performance metrics
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  tasks_in_progress INTEGER NOT NULL DEFAULT 0,
  
  -- Agent memory storage (JSONB for flexibility)
  memory_data JSONB NOT NULL DEFAULT '{"shortTerm": [], "longTerm": [], "lastActivity": null}',
  goals JSONB NOT NULL DEFAULT '[]',
  capabilities JSONB NOT NULL DEFAULT '[]',
  
  -- Cultural and language context
  cultural_context VARCHAR(50) NOT NULL DEFAULT 'Vietnam',
  language VARCHAR(5) NOT NULL DEFAULT 'vi',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, document_id)
);

-- Agent memory events (for detailed memory tracking)
CREATE TABLE agent_memory_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES document_agents(id) ON DELETE CASCADE,
  
  -- Event details
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  importance DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Indexes will be created below
  INDEX (agent_id, created_at DESC),
  INDEX (event_type),
  INDEX (importance DESC)
);

-- Agent long-term memory patterns
CREATE TABLE agent_memory_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES document_agents(id) ON DELETE CASCADE,
  
  -- Pattern details
  pattern TEXT NOT NULL,
  frequency INTEGER NOT NULL DEFAULT 1,
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.1 CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Timestamps
  first_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(agent_id, pattern)
);

-- Agent task results storage
CREATE TABLE agent_task_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES document_agents(id) ON DELETE CASCADE,
  
  -- Task details
  task_type VARCHAR(100) NOT NULL,
  result_type task_result_type NOT NULL,
  content TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Rich metadata storage
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Processing information
  processing_time INTEGER, -- in milliseconds
  ai_provider VARCHAR(50),
  ai_model VARCHAR(100),
  tokens_used INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Indexes
  INDEX (agent_id, created_at DESC),
  INDEX (task_type),
  INDEX (confidence DESC)
);

-- =====================================================
-- COLLABORATION SYSTEM TABLES
-- =====================================================

-- Agent collaborations
CREATE TABLE agent_collaborations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Collaboration details
  objective TEXT NOT NULL,
  status collaboration_status NOT NULL DEFAULT 'forming',
  priority DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (priority >= 0 AND priority <= 1),
  
  -- Participant information
  participant_ids UUID[] NOT NULL,
  participant_count INTEGER GENERATED ALWAYS AS (array_length(participant_ids, 1)) STORED,
  
  -- Results and outcomes
  results JSONB,
  success_metrics JSONB,
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CHECK (array_length(participant_ids, 1) >= 2),
  CHECK (completed_at IS NULL OR completed_at >= started_at)
);

-- Collaboration participants (normalized table for better querying)
CREATE TABLE collaboration_participants (
  collaboration_id UUID NOT NULL REFERENCES agent_collaborations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES document_agents(id) ON DELETE CASCADE,
  
  -- Participation details
  role VARCHAR(50) DEFAULT 'participant',
  contribution_score DECIMAL(3,2) DEFAULT 0.5 CHECK (contribution_score >= 0 AND contribution_score <= 1),
  
  -- Timestamps
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  PRIMARY KEY (collaboration_id, agent_id)
);

-- =====================================================
-- SWARM INTELLIGENCE TABLES
-- =====================================================

-- Swarm queries (collective intelligence queries)
CREATE TABLE swarm_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Query details
  query TEXT NOT NULL,
  timeout INTEGER NOT NULL DEFAULT 30000, -- milliseconds
  required_agents UUID[],
  
  -- Aggregated results
  aggregated_result JSONB,
  average_confidence DECIMAL(3,2),
  response_count INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'processing',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CHECK (status IN ('processing', 'completed', 'timeout', 'failed'))
);

-- Individual agent responses to swarm queries
CREATE TABLE swarm_query_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_id UUID NOT NULL REFERENCES swarm_queries(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES document_agents(id) ON DELETE CASCADE,
  
  -- Response details
  response JSONB NOT NULL,
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  response_time INTEGER, -- milliseconds
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(query_id, agent_id)
);

-- =====================================================
-- ANALYTICS AND METRICS TABLES
-- =====================================================

-- Agent performance metrics (time-series data)
CREATE TABLE agent_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES document_agents(id) ON DELETE CASCADE,
  
  -- Performance data
  efficiency INTEGER NOT NULL CHECK (efficiency >= 0 AND efficiency <= 100),
  tasks_completed_delta INTEGER NOT NULL DEFAULT 0,
  average_confidence DECIMAL(3,2),
  collaboration_rate DECIMAL(3,2),
  specialization_focus DECIMAL(3,2),
  
  -- Context when measured
  measurement_context JSONB DEFAULT '{}',
  
  -- Timestamps
  measured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Partitioning hint for time-series optimization
  INDEX (measured_at DESC),
  INDEX (agent_id, measured_at DESC)
);

-- Swarm-level metrics
CREATE TABLE swarm_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Swarm statistics
  total_agents INTEGER NOT NULL DEFAULT 0,
  active_agents INTEGER NOT NULL DEFAULT 0,
  total_collaborations INTEGER NOT NULL DEFAULT 0,
  average_efficiency DECIMAL(5,2) NOT NULL DEFAULT 0,
  emergent_behaviors INTEGER NOT NULL DEFAULT 0,
  collective_intelligence INTEGER NOT NULL DEFAULT 0,
  
  -- Swarm health indicators
  collaboration_frequency DECIMAL(3,2) DEFAULT 0,
  knowledge_sharing_rate DECIMAL(3,2) DEFAULT 0,
  cross_specialty_interactions INTEGER DEFAULT 0,
  
  -- Timestamps
  measured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- One measurement per user per hour
  UNIQUE(user_id, DATE_TRUNC('hour', measured_at))
);

-- =====================================================
-- KNOWLEDGE SHARING TABLES
-- =====================================================

-- Collective knowledge base (cross-agent learning)
CREATE TABLE agent_knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_agent_id UUID NOT NULL REFERENCES document_agents(id) ON DELETE CASCADE,
  
  -- Knowledge details
  knowledge_type VARCHAR(100) NOT NULL, -- 'insight', 'pattern', 'best_practice', 'warning'
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Categorization
  domain VARCHAR(100), -- 'legal', 'financial', 'project', 'research', 'general'
  tags TEXT[],
  applicable_contexts JSONB DEFAULT '{}',
  
  -- Knowledge validation
  validation_score DECIMAL(3,2) DEFAULT 0.5,
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(3,2) DEFAULT 0.5,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Full-text search
  USING GIN (to_tsvector('english', title || ' ' || content)),
  INDEX (domain),
  INDEX (knowledge_type),
  INDEX (confidence DESC),
  INDEX (usage_count DESC)
);

-- Knowledge sharing events (track learning propagation)
CREATE TABLE knowledge_sharing_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  knowledge_id UUID NOT NULL REFERENCES agent_knowledge_base(id) ON DELETE CASCADE,
  source_agent_id UUID NOT NULL REFERENCES document_agents(id) ON DELETE CASCADE,
  target_agent_id UUID NOT NULL REFERENCES document_agents(id) ON DELETE CASCADE,
  
  -- Sharing details
  sharing_context VARCHAR(100), -- 'collaboration', 'similarity', 'request', 'broadcast'
  effectiveness_score DECIMAL(3,2),
  
  -- Timestamps
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate sharing
  UNIQUE(knowledge_id, source_agent_id, target_agent_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Agent-related indexes
CREATE INDEX idx_document_agents_user_status ON document_agents(user_id, status);
CREATE INDEX idx_document_agents_personality ON document_agents(personality);
CREATE INDEX idx_document_agents_efficiency ON document_agents(efficiency DESC);
CREATE INDEX idx_document_agents_last_activity ON document_agents(last_activity DESC);

-- Memory and events indexes
CREATE INDEX idx_agent_memory_events_type_time ON agent_memory_events(event_type, created_at DESC);
CREATE INDEX idx_agent_memory_events_importance ON agent_memory_events(importance DESC, created_at DESC);

-- Collaboration indexes
CREATE INDEX idx_collaborations_user_status ON agent_collaborations(user_id, status);
CREATE INDEX idx_collaborations_status_time ON agent_collaborations(status, started_at DESC);
CREATE INDEX idx_collaboration_participants_agent ON collaboration_participants(agent_id);

-- Performance indexes
CREATE INDEX idx_performance_metrics_time ON agent_performance_metrics(measured_at DESC);
CREATE INDEX idx_swarm_metrics_user_time ON swarm_metrics(user_id, measured_at DESC);

-- Knowledge sharing indexes
CREATE INDEX idx_knowledge_base_domain_confidence ON agent_knowledge_base(domain, confidence DESC);
CREATE INDEX idx_knowledge_events_target_time ON knowledge_sharing_events(target_agent_id, shared_at DESC);

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_document_agents_updated_at 
    BEFORE UPDATE ON document_agents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_knowledge_base_updated_at 
    BEFORE UPDATE ON agent_knowledge_base 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update last_activity when agent state changes
CREATE OR REPLACE FUNCTION update_agent_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != NEW.status OR 
       OLD.tasks_completed != NEW.tasks_completed OR 
       OLD.efficiency != NEW.efficiency THEN
        NEW.last_activity = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agent_last_activity_trigger
    BEFORE UPDATE ON document_agents 
    FOR EACH ROW EXECUTE FUNCTION update_agent_last_activity();

-- Auto-complete collaborations when all participants are done
CREATE OR REPLACE FUNCTION check_collaboration_completion()
RETURNS TRIGGER AS $$
DECLARE
    active_participants INTEGER;
BEGIN
    -- Count active participants in this collaboration
    SELECT COUNT(*) INTO active_participants
    FROM collaboration_participants cp
    JOIN document_agents da ON cp.agent_id = da.id
    WHERE cp.collaboration_id = NEW.collaboration_id 
    AND da.status IN ('active', 'thinking');
    
    -- If no active participants, mark collaboration as completed
    IF active_participants = 0 THEN
        UPDATE agent_collaborations 
        SET status = 'completed', completed_at = NOW()
        WHERE id = NEW.collaboration_id AND status = 'active';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE document_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_task_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE swarm_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE swarm_query_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE swarm_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sharing_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user data isolation

-- Document agents - users can only access their own agents
CREATE POLICY "Users can manage their own agents" ON document_agents
    FOR ALL USING (auth.uid() = user_id);

-- Agent memory events - through agent ownership
CREATE POLICY "Users can access memory of their agents" ON agent_memory_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM document_agents 
            WHERE id = agent_memory_events.agent_id 
            AND user_id = auth.uid()
        )
    );

-- Agent memory patterns - through agent ownership
CREATE POLICY "Users can access patterns of their agents" ON agent_memory_patterns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM document_agents 
            WHERE id = agent_memory_patterns.agent_id 
            AND user_id = auth.uid()
        )
    );

-- Agent task results - through agent ownership
CREATE POLICY "Users can access task results of their agents" ON agent_task_results
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM document_agents 
            WHERE id = agent_task_results.agent_id 
            AND user_id = auth.uid()
        )
    );

-- Collaborations - users can access their own collaborations
CREATE POLICY "Users can manage their own collaborations" ON agent_collaborations
    FOR ALL USING (auth.uid() = user_id);

-- Collaboration participants - through collaboration ownership
CREATE POLICY "Users can access participants of their collaborations" ON collaboration_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM agent_collaborations 
            WHERE id = collaboration_participants.collaboration_id 
            AND user_id = auth.uid()
        )
    );

-- Swarm queries - users can access their own queries
CREATE POLICY "Users can manage their own swarm queries" ON swarm_queries
    FOR ALL USING (auth.uid() = user_id);

-- Swarm query responses - through query ownership
CREATE POLICY "Users can access responses to their queries" ON swarm_query_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM swarm_queries 
            WHERE id = swarm_query_responses.query_id 
            AND user_id = auth.uid()
        )
    );

-- Performance metrics - through agent ownership
CREATE POLICY "Users can access metrics of their agents" ON agent_performance_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM document_agents 
            WHERE id = agent_performance_metrics.agent_id 
            AND user_id = auth.uid()
        )
    );

-- Swarm metrics - users can access their own swarm metrics
CREATE POLICY "Users can access their own swarm metrics" ON swarm_metrics
    FOR ALL USING (auth.uid() = user_id);

-- Knowledge base - agents can share knowledge within user's swarm
CREATE POLICY "Users can access knowledge from their agents" ON agent_knowledge_base
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM document_agents 
            WHERE id = agent_knowledge_base.source_agent_id 
            AND user_id = auth.uid()
        )
    );

-- Knowledge sharing events - through agent ownership
CREATE POLICY "Users can access knowledge sharing of their agents" ON knowledge_sharing_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM document_agents 
            WHERE id = knowledge_sharing_events.source_agent_id 
            AND user_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM document_agents 
            WHERE id = knowledge_sharing_events.target_agent_id 
            AND user_id = auth.uid()
        )
    );

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Active agents with recent activity
CREATE VIEW active_agents_with_metrics AS
SELECT 
    da.*,
    COALESCE(recent_tasks.task_count, 0) as recent_task_count,
    COALESCE(recent_tasks.avg_confidence, 0.5) as recent_avg_confidence,
    COALESCE(collaborations.collaboration_count, 0) as active_collaborations
FROM document_agents da
LEFT JOIN (
    SELECT 
        agent_id,
        COUNT(*) as task_count,
        AVG(confidence) as avg_confidence
    FROM agent_task_results 
    WHERE created_at > NOW() - INTERVAL '24 hours'
    GROUP BY agent_id
) recent_tasks ON da.id = recent_tasks.agent_id
LEFT JOIN (
    SELECT 
        agent_id,
        COUNT(*) as collaboration_count
    FROM collaboration_participants cp
    JOIN agent_collaborations ac ON cp.collaboration_id = ac.id
    WHERE ac.status = 'active'
    GROUP BY agent_id
) collaborations ON da.id = collaborations.agent_id
WHERE da.status IN ('active', 'thinking');

-- Swarm intelligence summary
CREATE VIEW swarm_intelligence_summary AS
SELECT 
    user_id,
    COUNT(*) as total_agents,
    COUNT(*) FILTER (WHERE status = 'active') as active_agents,
    AVG(efficiency) as average_efficiency,
    SUM(tasks_completed) as total_tasks_completed,
    COUNT(DISTINCT personality) as personality_diversity,
    MAX(last_activity) as most_recent_activity
FROM document_agents
GROUP BY user_id;

-- =====================================================
-- SAMPLE DATA SETUP (FOR DEVELOPMENT)
-- =====================================================

-- Insert sample agent capabilities for different personalities
INSERT INTO agent_knowledge_base (source_agent_id, knowledge_type, title, content, domain, confidence) VALUES
(uuid_generate_v4(), 'best_practice', 'Contract Review Checklist', 'Always check for termination clauses, payment terms, and liability limitations', 'legal', 0.9),
(uuid_generate_v4(), 'pattern', 'Budget Variance Indicator', 'Budget variance >15% typically indicates project risk or opportunity', 'financial', 0.8),
(uuid_generate_v4(), 'insight', 'Vietnamese Business Culture', 'In Vietnam, hierarchy and consensus-building are crucial for project success', 'project', 0.85),
(uuid_generate_v4(), 'warning', 'Data Privacy Compliance', 'Vietnam Personal Data Protection Decree requires explicit consent for data processing', 'legal', 0.95);

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE document_agents IS 'Core table storing autonomous document agents with their state, memory, and configuration';
COMMENT ON TABLE agent_memory_events IS 'Detailed event log for agent short-term memory and activity tracking';
COMMENT ON TABLE agent_memory_patterns IS 'Long-term memory patterns extracted from agent experiences';
COMMENT ON TABLE agent_collaborations IS 'Multi-agent collaboration sessions with objectives and outcomes';
COMMENT ON TABLE swarm_queries IS 'Collective intelligence queries processed by agent swarms';
COMMENT ON TABLE agent_knowledge_base IS 'Shared knowledge repository for cross-agent learning';

COMMENT ON COLUMN document_agents.autonomy_level IS 'Agent autonomy level (0-100) controlling how independently the agent acts';
COMMENT ON COLUMN document_agents.memory_data IS 'JSONB storage for agent memory structure with short-term events and long-term patterns';
COMMENT ON COLUMN agent_collaborations.participant_ids IS 'Array of agent UUIDs participating in this collaboration';
COMMENT ON COLUMN agent_knowledge_base.applicable_contexts IS 'JSONB defining when this knowledge is most relevant';