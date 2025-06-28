-- PRISMY DATABASE MIGRATION 003
-- Security enhancements and performance optimizations

-- Add audit trail for sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for audit logs
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        created_at
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        CASE 
            WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)
            ELSE NULL
        END,
        CASE 
            WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)
            ELSE NULL
        END,
        NOW()
    );
    
    RETURN CASE
        WHEN TG_OP = 'DELETE' THEN OLD
        ELSE NEW
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers for sensitive tables
CREATE TRIGGER audit_subscriptions
    AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_payments
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_api_keys
    AFTER INSERT OR UPDATE OR DELETE ON public.api_keys
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Add rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier TEXT NOT NULL, -- Can be user_id, ip_address, or api_key
    endpoint TEXT NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    request_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(identifier, endpoint, window_start)
);

-- Create index for rate limiting
CREATE INDEX idx_rate_limits_identifier ON public.rate_limits(identifier);
CREATE INDEX idx_rate_limits_window_start ON public.rate_limits(window_start);

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier TEXT,
    p_endpoint TEXT,
    p_limit INTEGER,
    p_window_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
    v_window_start TIMESTAMPTZ;
BEGIN
    v_window_start := date_trunc('hour', NOW()) + 
        (EXTRACT(MINUTE FROM NOW())::INTEGER / p_window_minutes) * (p_window_minutes || ' minutes')::INTERVAL;
    
    -- Insert or update rate limit count
    INSERT INTO public.rate_limits (identifier, endpoint, window_start, request_count)
    VALUES (p_identifier, p_endpoint, v_window_start, 1)
    ON CONFLICT (identifier, endpoint, window_start)
    DO UPDATE SET request_count = rate_limits.request_count + 1
    RETURNING request_count INTO v_count;
    
    -- Clean up old entries
    DELETE FROM public.rate_limits
    WHERE window_start < NOW() - INTERVAL '24 hours';
    
    RETURN v_count <= p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add IP blocking table for security
CREATE TABLE IF NOT EXISTS public.blocked_ips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address INET NOT NULL UNIQUE,
    reason TEXT,
    blocked_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    blocked_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

-- Create index for blocked IPs
CREATE INDEX idx_blocked_ips_ip_address ON public.blocked_ips(ip_address);
CREATE INDEX idx_blocked_ips_is_active ON public.blocked_ips(is_active) WHERE is_active = true;

-- Function to check if IP is blocked
CREATE OR REPLACE FUNCTION is_ip_blocked(p_ip_address INET)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.blocked_ips
        WHERE ip_address = p_ip_address
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add session management table
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for sessions
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- Performance optimization: Add partial indexes
CREATE INDEX idx_translations_pending ON public.translations(created_at DESC) 
    WHERE status = 'pending';

CREATE INDEX idx_documents_processing ON public.documents(created_at DESC) 
    WHERE status = 'processing';

CREATE INDEX idx_subscriptions_active ON public.subscriptions(user_id) 
    WHERE status = 'active';

CREATE INDEX idx_api_keys_active ON public.api_keys(key_hash) 
    WHERE is_active = true;

-- Add composite indexes for common queries
CREATE INDEX idx_translations_user_date ON public.translations(user_id, created_at DESC);
CREATE INDEX idx_documents_user_status ON public.documents(user_id, status);
CREATE INDEX idx_activity_logs_user_action ON public.activity_logs(user_id, action, created_at DESC);

-- Create function for cleaning up expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data() RETURNS VOID AS $$
BEGIN
    -- Clean up expired sessions
    UPDATE public.user_sessions
    SET is_active = false
    WHERE expires_at < NOW()
    AND is_active = true;
    
    -- Clean up expired blocked IPs
    UPDATE public.blocked_ips
    SET is_active = false
    WHERE expires_at < NOW()
    AND is_active = true;
    
    -- Clean up old rate limit entries
    DELETE FROM public.rate_limits
    WHERE window_start < NOW() - INTERVAL '24 hours';
    
    -- Clean up old audit logs (keep 1 year)
    DELETE FROM public.audit_logs
    WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Add data retention policies
CREATE OR REPLACE FUNCTION apply_data_retention() RETURNS VOID AS $$
BEGIN
    -- Archive old translations (soft delete after 2 years)
    UPDATE public.translations
    SET status = 'archived'
    WHERE created_at < NOW() - INTERVAL '2 years'
    AND status != 'archived';
    
    -- Delete old activity logs (hard delete after 180 days)
    DELETE FROM public.activity_logs
    WHERE created_at < NOW() - INTERVAL '180 days';
    
    -- Delete old webhook logs (hard delete after 90 days)
    DELETE FROM public.webhook_logs
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Clean up orphaned documents
    DELETE FROM public.documents
    WHERE user_id NOT IN (SELECT id FROM public.users)
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create statistics tracking table
CREATE TABLE IF NOT EXISTS public.system_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stat_date DATE NOT NULL,
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    total_translations INTEGER DEFAULT 0,
    total_documents INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    avg_translation_time_ms INTEGER,
    cache_hit_rate DECIMAL(3,2),
    error_rate DECIMAL(3,2),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stat_date)
);

-- Function to calculate daily statistics
CREATE OR REPLACE FUNCTION calculate_daily_stats(p_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.system_stats (
        stat_date,
        total_users,
        active_users,
        new_users,
        total_translations,
        total_documents,
        total_revenue,
        avg_translation_time_ms,
        cache_hit_rate,
        error_rate
    )
    SELECT 
        p_date,
        (SELECT COUNT(*) FROM public.users WHERE created_at <= p_date + INTERVAL '1 day'),
        (SELECT COUNT(DISTINCT user_id) FROM public.activity_logs 
         WHERE DATE(created_at) = p_date),
        (SELECT COUNT(*) FROM public.users WHERE DATE(created_at) = p_date),
        (SELECT COUNT(*) FROM public.translations WHERE DATE(created_at) = p_date),
        (SELECT COUNT(*) FROM public.documents WHERE DATE(created_at) = p_date),
        (SELECT COALESCE(SUM(amount), 0) FROM public.payments 
         WHERE DATE(created_at) = p_date AND status = 'succeeded'),
        (SELECT AVG(translation_time_ms)::INTEGER FROM public.translations 
         WHERE DATE(created_at) = p_date AND status = 'completed'),
        (SELECT COUNT(CASE WHEN is_cached THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0) 
         FROM public.translations WHERE DATE(created_at) = p_date),
        (SELECT COUNT(CASE WHEN status = 'failed' THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0) 
         FROM public.translations WHERE DATE(created_at) = p_date)
    ON CONFLICT (stat_date) DO UPDATE SET
        total_users = EXCLUDED.total_users,
        active_users = EXCLUDED.active_users,
        new_users = EXCLUDED.new_users,
        total_translations = EXCLUDED.total_translations,
        total_documents = EXCLUDED.total_documents,
        total_revenue = EXCLUDED.total_revenue,
        avg_translation_time_ms = EXCLUDED.avg_translation_time_ms,
        cache_hit_rate = EXCLUDED.cache_hit_rate,
        error_rate = EXCLUDED.error_rate;
END;
$$ LANGUAGE plpgsql;

-- Add database-level constraints
ALTER TABLE public.translations 
    ADD CONSTRAINT check_confidence_score 
    CHECK (confidence_score >= 0 AND confidence_score <= 1);

ALTER TABLE public.usage_tracking
    ADD CONSTRAINT check_positive_counts
    CHECK (
        translations_count >= 0 AND
        documents_count >= 0 AND
        characters_count >= 0 AND
        api_calls_count >= 0 AND
        storage_used_mb >= 0
    );

-- Create scheduled job commands (to be run with pg_cron if available)
/*
-- Run these commands to schedule regular maintenance tasks:
SELECT cron.schedule('cleanup-expired-data', '*/15 * * * *', 'SELECT cleanup_expired_data();');
SELECT cron.schedule('apply-data-retention', '0 3 * * *', 'SELECT apply_data_retention();');
SELECT cron.schedule('calculate-daily-stats', '0 1 * * *', 'SELECT calculate_daily_stats();');
*/

-- Grant necessary permissions
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT SELECT ON public.system_stats TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION is_ip_blocked(INET) TO authenticated;