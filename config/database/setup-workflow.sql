-- ============================================
-- ADVANCED WORKFLOW AUTOMATION DATABASE SETUP
-- Comprehensive workflow management and automation
-- ============================================

-- Create workflow rules table
CREATE TABLE IF NOT EXISTS public.workflow_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  triggers JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow executions table
CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflow_rules(id) ON DELETE CASCADE,
  triggered_by TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  context JSONB NOT NULL DEFAULT '{}',
  results JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  execution_time_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  parent_execution_id UUID REFERENCES public.workflow_executions(id),
  metadata JSONB DEFAULT '{}'
);

-- Create workflow templates table
CREATE TABLE IF NOT EXISTS public.workflow_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  template_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create approval requests table
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_execution_id UUID NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id),
  approvers TEXT[] NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  timeout_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow schedules table
CREATE TABLE IF NOT EXISTS public.workflow_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflow_rules(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('cron', 'interval', 'once')),
  schedule_config JSONB NOT NULL,
  next_run_at TIMESTAMP WITH TIME ZONE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  enabled BOOLEAN DEFAULT true,
  timezone TEXT DEFAULT 'UTC',
  max_executions INTEGER,
  execution_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow action logs table
CREATE TABLE IF NOT EXISTS public.workflow_action_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id UUID NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  action_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'skipped')),
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  execution_time_ms INTEGER,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create document analysis results table
CREATE TABLE IF NOT EXISTS public.document_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  result JSONB NOT NULL,
  confidence_score DECIMAL(5,4),
  model_used TEXT,
  execution_time_ms INTEGER,
  triggered_by TEXT,
  workflow_execution_id UUID REFERENCES public.workflow_executions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow metrics table
CREATE TABLE IF NOT EXISTS public.workflow_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.workflow_rules(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  executions_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  avg_execution_time_ms INTEGER DEFAULT 0,
  total_execution_time_ms BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workflow_id, metric_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_rules_organization ON public.workflow_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_rules_user ON public.workflow_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_rules_enabled ON public.workflow_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_workflow_rules_priority ON public.workflow_rules(priority DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_rules_tags ON public.workflow_rules USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON public.workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON public.workflow_executions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_completed_at ON public.workflow_executions(completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON public.workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_public ON public.workflow_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_tags ON public.workflow_templates USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_approval_requests_execution ON public.approval_requests(workflow_execution_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON public.approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_approvers ON public.approval_requests USING GIN(approvers);

CREATE INDEX IF NOT EXISTS idx_workflow_schedules_workflow ON public.workflow_schedules(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_next_run ON public.workflow_schedules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_enabled ON public.workflow_schedules(enabled);

CREATE INDEX IF NOT EXISTS idx_workflow_action_logs_execution ON public.workflow_action_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_action_logs_action_type ON public.workflow_action_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_workflow_action_logs_status ON public.workflow_action_logs(status);

CREATE INDEX IF NOT EXISTS idx_document_analyses_document ON public.document_analyses(document_id);
CREATE INDEX IF NOT EXISTS idx_document_analyses_type ON public.document_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_document_analyses_workflow ON public.document_analyses(workflow_execution_id);

CREATE INDEX IF NOT EXISTS idx_workflow_metrics_workflow_date ON public.workflow_metrics(workflow_id, metric_date);

-- Enable RLS on all workflow tables
ALTER TABLE public.workflow_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for workflow rules
CREATE POLICY "Users can manage own workflows" ON public.workflow_rules
  FOR ALL 
  USING (user_id = auth.uid());

CREATE POLICY "Organization workflows access" ON public.workflow_rules
  FOR ALL 
  USING (
    organization_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = workflow_rules.organization_id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );

-- RLS policies for workflow executions
CREATE POLICY "Users can view own workflow executions" ON public.workflow_executions
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_rules 
      WHERE id = workflow_executions.workflow_id 
      AND (
        user_id = auth.uid() OR
        (organization_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.organization_members 
          WHERE organization_id = workflow_rules.organization_id 
          AND user_id = auth.uid() 
          AND status = 'active'
        ))
      )
    )
  );

-- RLS policies for workflow templates
CREATE POLICY "Users can manage own templates" ON public.workflow_templates
  FOR ALL 
  USING (created_by = auth.uid());

CREATE POLICY "Anyone can view public templates" ON public.workflow_templates
  FOR SELECT 
  USING (is_public = true);

-- RLS policies for approval requests
CREATE POLICY "Approvers can view requests" ON public.approval_requests
  FOR ALL 
  USING (
    requester_id = auth.uid() OR
    auth.uid()::text = ANY(approvers) OR
    approved_by = auth.uid()
  );

-- System role policies
CREATE POLICY "System can manage all workflows" ON public.workflow_rules
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "System can manage all executions" ON public.workflow_executions
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "System can manage all logs" ON public.workflow_action_logs
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Functions for workflow management
CREATE OR REPLACE FUNCTION public.trigger_workflow(
  p_workflow_id UUID,
  p_context JSONB DEFAULT '{}',
  p_triggered_by TEXT DEFAULT 'manual'
)
RETURNS UUID AS $$
DECLARE
  execution_id UUID;
BEGIN
  -- Check if workflow exists and is enabled
  IF NOT EXISTS (
    SELECT 1 FROM public.workflow_rules 
    WHERE id = p_workflow_id AND enabled = true
  ) THEN
    RAISE EXCEPTION 'Workflow not found or disabled: %', p_workflow_id;
  END IF;

  -- Create execution record
  INSERT INTO public.workflow_executions (
    workflow_id, triggered_by, status, context
  )
  VALUES (
    p_workflow_id, p_triggered_by, 'pending', p_context
  )
  RETURNING id INTO execution_id;

  -- Trigger workflow processing (this would be handled by the application)
  PERFORM pg_notify('workflow_trigger', json_build_object(
    'execution_id', execution_id,
    'workflow_id', p_workflow_id,
    'context', p_context
  )::text);

  RETURN execution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update workflow metrics
CREATE OR REPLACE FUNCTION public.update_workflow_metrics(
  p_workflow_id UUID,
  p_status TEXT,
  p_execution_time_ms INTEGER DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  metric_date DATE := CURRENT_DATE;
BEGIN
  INSERT INTO public.workflow_metrics (
    workflow_id, metric_date, executions_count, success_count, 
    failure_count, total_execution_time_ms
  )
  VALUES (
    p_workflow_id, metric_date, 1,
    CASE WHEN p_status = 'completed' THEN 1 ELSE 0 END,
    CASE WHEN p_status = 'failed' THEN 1 ELSE 0 END,
    COALESCE(p_execution_time_ms, 0)
  )
  ON CONFLICT (workflow_id, metric_date)
  DO UPDATE SET
    executions_count = workflow_metrics.executions_count + 1,
    success_count = workflow_metrics.success_count + 
      CASE WHEN p_status = 'completed' THEN 1 ELSE 0 END,
    failure_count = workflow_metrics.failure_count + 
      CASE WHEN p_status = 'failed' THEN 1 ELSE 0 END,
    total_execution_time_ms = workflow_metrics.total_execution_time_ms + 
      COALESCE(p_execution_time_ms, 0),
    avg_execution_time_ms = CASE 
      WHEN workflow_metrics.executions_count + 1 > 0 THEN
        (workflow_metrics.total_execution_time_ms + COALESCE(p_execution_time_ms, 0)) / 
        (workflow_metrics.executions_count + 1)
      ELSE 0
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old executions
CREATE OR REPLACE FUNCTION public.cleanup_workflow_executions()
RETURNS void AS $$
BEGIN
  -- Delete execution logs older than 90 days
  DELETE FROM public.workflow_action_logs
  WHERE started_at < NOW() - INTERVAL '90 days';
  
  -- Delete completed executions older than 30 days
  DELETE FROM public.workflow_executions
  WHERE status IN ('completed', 'failed', 'cancelled')
    AND completed_at < NOW() - INTERVAL '30 days';
    
  -- Archive old metrics (keep 1 year)
  DELETE FROM public.workflow_metrics
  WHERE metric_date < CURRENT_DATE - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.trigger_workflow(UUID, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_workflow_metrics(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_workflow_executions() TO service_role;

-- Insert sample workflow templates
INSERT INTO public.workflow_templates (
  name, description, category, template_data, is_public, created_by, tags
) VALUES 
  (
    'Auto-translate Documents',
    'Automatically translate uploaded documents to multiple languages',
    'translation',
    '{
      "triggers": [
        {
          "type": "document_upload",
          "conditions": {"file_types": ["pdf", "docx", "txt"]},
          "enabled": true
        }
      ],
      "actions": [
        {
          "type": "translate",
          "config": {
            "targetLanguages": ["es", "fr", "de"],
            "translationService": "openai"
          },
          "order": 1
        },
        {
          "type": "notify",
          "config": {
            "message": "Document {{documentName}} has been translated",
            "channels": ["email"]
          },
          "order": 2
        }
      ]
    }',
    true,
    (SELECT id FROM auth.users LIMIT 1),
    ARRAY['translation', 'automation', 'documents']
  ),
  (
    'Document Analysis & Summary',
    'Analyze documents and generate AI summaries',
    'analysis',
    '{
      "triggers": [
        {
          "type": "document_upload",
          "conditions": {"min_size": 1000},
          "enabled": true
        }
      ],
      "actions": [
        {
          "type": "analyze",
          "config": {
            "analysisType": "summary",
            "prompt": "Provide a detailed summary of this document"
          },
          "order": 1
        },
        {
          "type": "ai_process",
          "config": {
            "prompt": "Extract key topics and entities",
            "inputField": "content",
            "outputField": "entities"
          },
          "order": 2
        }
      ]
    }',
    true,
    (SELECT id FROM auth.users LIMIT 1),
    ARRAY['analysis', 'ai', 'summary']
  ),
  (
    'Approval Workflow',
    'Route documents through approval process',
    'approval',
    '{
      "triggers": [
        {
          "type": "manual",
          "conditions": {},
          "enabled": true
        }
      ],
      "actions": [
        {
          "type": "approval",
          "config": {
            "approvers": ["manager@company.com"],
            "message": "Please review document: {{documentName}}",
            "timeout": 86400
          },
          "order": 1
        },
        {
          "type": "notify",
          "config": {
            "message": "Document {{documentName}} has been approved",
            "channels": ["email"]
          },
          "order": 2,
          "conditional": {
            "field": "approvalStatus",
            "operator": "equals",
            "value": "approved"
          }
        }
      ]
    }',
    true,
    (SELECT id FROM auth.users LIMIT 1),
    ARRAY['approval', 'workflow', 'review']
  )
ON CONFLICT DO NOTHING;

-- Create triggers for automatic metrics updates
CREATE OR REPLACE FUNCTION update_execution_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'failed') AND OLD.status != NEW.status THEN
    PERFORM public.update_workflow_metrics(
      NEW.workflow_id,
      NEW.status,
      NEW.execution_time_ms
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_execution_metrics
  AFTER UPDATE ON public.workflow_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_execution_metrics();