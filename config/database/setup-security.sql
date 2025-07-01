-- ============================================
-- ADVANCED SECURITY DATABASE SETUP
-- Two-Factor Authentication, Audit Logging, and Security Features
-- ============================================

-- Create user two-factor authentication table
CREATE TABLE IF NOT EXISTS public.user_two_factor (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  backup_codes TEXT[],
  is_enabled BOOLEAN DEFAULT false,
  enabled_at TIMESTAMP WITH TIME ZONE,
  disabled_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create security audit logs table
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  operation TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security alerts table
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('brute_force', 'suspicious_login', 'data_breach', 'privilege_escalation', 'unusual_activity')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  affected_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  source_ip INET,
  detection_data JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')) DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  location_data JSONB,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create password history table for password reuse prevention
CREATE TABLE IF NOT EXISTS public.password_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create API keys table for secure API access
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  permissions JSONB DEFAULT '{}',
  rate_limit INTEGER DEFAULT 1000,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security settings table for organization-level security policies
CREATE TABLE IF NOT EXISTS public.security_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  require_2fa BOOLEAN DEFAULT false,
  password_min_length INTEGER DEFAULT 8,
  password_require_uppercase BOOLEAN DEFAULT true,
  password_require_lowercase BOOLEAN DEFAULT true,
  password_require_numbers BOOLEAN DEFAULT true,
  password_require_symbols BOOLEAN DEFAULT false,
  password_max_age_days INTEGER DEFAULT 90,
  max_login_attempts INTEGER DEFAULT 5,
  lockout_duration_minutes INTEGER DEFAULT 30,
  allowed_ip_ranges INET[],
  session_timeout_minutes INTEGER DEFAULT 480,
  require_email_verification BOOLEAN DEFAULT true,
  allow_api_keys BOOLEAN DEFAULT true,
  webhook_security_enabled BOOLEAN DEFAULT true,
  audit_log_retention_days INTEGER DEFAULT 365,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Create device trust table for device-based security
CREATE TABLE IF NOT EXISTS public.trusted_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  browser_info JSONB,
  is_trusted BOOLEAN DEFAULT false,
  trust_expires_at TIMESTAMP WITH TIME ZONE,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_fingerprint)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_two_factor_user ON public.user_two_factor(user_id);
CREATE INDEX IF NOT EXISTS idx_user_two_factor_enabled ON public.user_two_factor(is_enabled);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user ON public.security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_org ON public.security_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_operation ON public.security_audit_logs(operation);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON public.security_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_ip ON public.security_audit_logs(ip_address);

CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON public.security_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON public.security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON public.security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_user ON public.security_alerts(affected_user_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_org ON public.security_alerts(affected_organization_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON public.security_alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_password_history_user ON public.password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_created_at ON public.password_history(created_at);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON public.api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON public.api_keys(is_active);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON public.trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON public.trusted_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_trusted ON public.trusted_devices(is_trusted);

-- Enable RLS on all security tables
ALTER TABLE public.user_two_factor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_two_factor
CREATE POLICY "Users can manage their own 2FA" ON public.user_two_factor
  FOR ALL 
  USING (user_id = auth.uid());

-- RLS policies for security_audit_logs
CREATE POLICY "Users can view their own audit logs" ON public.security_audit_logs
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Organization admins can view org audit logs" ON public.security_audit_logs
  FOR SELECT 
  USING (
    organization_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = security_audit_logs.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- RLS policies for security_alerts
CREATE POLICY "Organization security team can manage alerts" ON public.security_alerts
  FOR ALL 
  USING (
    affected_organization_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = security_alerts.affected_organization_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- RLS policies for user_sessions
CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
  FOR ALL 
  USING (user_id = auth.uid());

-- RLS policies for password_history
CREATE POLICY "Users can view their own password history" ON public.password_history
  FOR SELECT 
  USING (user_id = auth.uid());

-- RLS policies for api_keys
CREATE POLICY "Users can manage their own API keys" ON public.api_keys
  FOR ALL 
  USING (user_id = auth.uid());

CREATE POLICY "Organization API key access" ON public.api_keys
  FOR ALL 
  USING (
    organization_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = api_keys.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- RLS policies for security_settings
CREATE POLICY "Organization admins can manage security settings" ON public.security_settings
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = security_settings.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- RLS policies for trusted_devices
CREATE POLICY "Users can manage their own trusted devices" ON public.trusted_devices
  FOR ALL 
  USING (user_id = auth.uid());

-- System role policies
CREATE POLICY "System can manage all security data" ON public.user_two_factor
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "System can manage all audit logs" ON public.security_audit_logs
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "System can manage all security alerts" ON public.security_alerts
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "System can manage all sessions" ON public.user_sessions
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "System can manage all password history" ON public.password_history
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "System can manage all API keys" ON public.api_keys
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "System can manage all security settings" ON public.security_settings
  FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "System can manage all trusted devices" ON public.trusted_devices
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Security functions
CREATE OR REPLACE FUNCTION public.log_security_audit(
  p_user_id UUID,
  p_operation TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id, operation, resource_type, resource_id, metadata,
    ip_address, user_agent, organization_id
  )
  VALUES (
    p_user_id, p_operation, p_resource_type, p_resource_id, p_metadata,
    p_ip_address, p_user_agent, p_organization_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.create_security_alert(
  p_alert_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_description TEXT,
  p_affected_user_id UUID DEFAULT NULL,
  p_affected_organization_id UUID DEFAULT NULL,
  p_source_ip INET DEFAULT NULL,
  p_detection_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  alert_id UUID;
BEGIN
  INSERT INTO public.security_alerts (
    alert_type, severity, title, description, affected_user_id,
    affected_organization_id, source_ip, detection_data
  )
  VALUES (
    p_alert_type, p_severity, p_title, p_description, p_affected_user_id,
    p_affected_organization_id, p_source_ip, p_detection_data
  )
  RETURNING id INTO alert_id;
  
  RETURN alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  -- Mark expired sessions as inactive
  UPDATE public.user_sessions 
  SET is_active = false, updated_at = NOW()
  WHERE expires_at < NOW() AND is_active = true;
  
  -- Delete very old expired sessions (older than 30 days)
  DELETE FROM public.user_sessions 
  WHERE expires_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void AS $$
DECLARE
  retention_days INTEGER;
BEGIN
  -- Get retention period from security settings (default 365 days)
  SELECT COALESCE(MIN(audit_log_retention_days), 365) 
  INTO retention_days
  FROM public.security_settings;
  
  -- Delete old audit logs
  DELETE FROM public.security_audit_logs 
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_security_summary(
  p_organization_id UUID DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
  total_events BIGINT,
  failed_logins BIGINT,
  suspicious_events BIGINT,
  active_alerts BIGINT,
  users_with_2fa BIGINT,
  total_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.security_audit_logs 
     WHERE (p_organization_id IS NULL OR organization_id = p_organization_id)
     AND created_at >= NOW() - (p_days || ' days')::INTERVAL) as total_events,
    
    (SELECT COUNT(*) FROM public.security_audit_logs 
     WHERE (p_organization_id IS NULL OR organization_id = p_organization_id)
     AND operation = 'login_failed'
     AND created_at >= NOW() - (p_days || ' days')::INTERVAL) as failed_logins,
    
    (SELECT COUNT(*) FROM public.security_audit_logs 
     WHERE (p_organization_id IS NULL OR organization_id = p_organization_id)
     AND metadata->>'outcome' = 'suspicious'
     AND created_at >= NOW() - (p_days || ' days')::INTERVAL) as suspicious_events,
    
    (SELECT COUNT(*) FROM public.security_alerts 
     WHERE (p_organization_id IS NULL OR affected_organization_id = p_organization_id)
     AND status = 'open') as active_alerts,
    
    (SELECT COUNT(*) FROM public.user_two_factor utf
     JOIN public.organization_members om ON utf.user_id = om.user_id
     WHERE (p_organization_id IS NULL OR om.organization_id = p_organization_id)
     AND utf.is_enabled = true
     AND om.status = 'active') as users_with_2fa,
    
    (SELECT COUNT(*) FROM public.organization_members
     WHERE (p_organization_id IS NULL OR organization_id = p_organization_id)
     AND status = 'active') as total_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.log_security_audit(UUID, TEXT, TEXT, TEXT, JSONB, INET, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_security_alert(TEXT, TEXT, TEXT, TEXT, UUID, UUID, INET, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_sessions() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_audit_logs() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_security_summary(UUID, INTEGER) TO authenticated;

-- Create triggers for automatic cleanup
CREATE OR REPLACE FUNCTION trigger_session_cleanup()
RETURNS trigger AS $$
BEGIN
  -- Cleanup expired sessions when a new session is created
  PERFORM public.cleanup_expired_sessions();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_cleanup_trigger
  AFTER INSERT ON public.user_sessions
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_session_cleanup();

-- Insert default security settings for existing organizations
INSERT INTO public.security_settings (organization_id)
SELECT id FROM public.organizations
WHERE id NOT IN (SELECT organization_id FROM public.security_settings)
ON CONFLICT (organization_id) DO NOTHING;