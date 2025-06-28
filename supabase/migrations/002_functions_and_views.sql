-- PRISMY DATABASE MIGRATION 002
-- Functions, views, and stored procedures

-- Function to get user's current usage
CREATE OR REPLACE FUNCTION get_user_usage(p_user_id UUID)
RETURNS TABLE (
    translations_count INTEGER,
    documents_count INTEGER,
    characters_count INTEGER,
    api_calls_count INTEGER,
    storage_used_mb DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ut.translations_count, 0)::INTEGER,
        COALESCE(ut.documents_count, 0)::INTEGER,
        COALESCE(ut.characters_count, 0)::INTEGER,
        COALESCE(ut.api_calls_count, 0)::INTEGER,
        COALESCE(ut.storage_used_mb, 0)::DECIMAL
    FROM public.usage_tracking ut
    WHERE ut.user_id = p_user_id
    AND ut.period_start <= NOW()
    AND ut.period_end >= NOW()
    ORDER BY ut.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has reached usage limits
CREATE OR REPLACE FUNCTION check_usage_limits(p_user_id UUID, p_usage_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_subscription_id UUID;
    v_current_usage INTEGER;
    v_limit INTEGER;
BEGIN
    -- Get user's subscription
    SELECT s.id INTO v_subscription_id
    FROM public.subscriptions s
    WHERE s.user_id = p_user_id
    AND s.status = 'active'
    LIMIT 1;
    
    IF v_subscription_id IS NULL THEN
        -- No active subscription, use free tier limits
        CASE p_usage_type
            WHEN 'translations' THEN v_limit := 10;
            WHEN 'documents' THEN v_limit := 0;
            WHEN 'characters' THEN v_limit := 10000;
            WHEN 'api_calls' THEN v_limit := 100;
            ELSE v_limit := 0;
        END CASE;
    ELSE
        -- Get limits from subscription
        CASE p_usage_type
            WHEN 'translations' THEN 
                SELECT ul.translations_limit INTO v_limit
                FROM public.usage_limits ul
                WHERE ul.subscription_id = v_subscription_id;
            WHEN 'documents' THEN 
                SELECT ul.documents_limit INTO v_limit
                FROM public.usage_limits ul
                WHERE ul.subscription_id = v_subscription_id;
            WHEN 'characters' THEN 
                SELECT ul.characters_limit INTO v_limit
                FROM public.usage_limits ul
                WHERE ul.subscription_id = v_subscription_id;
            WHEN 'api_calls' THEN 
                SELECT ul.api_calls_limit INTO v_limit
                FROM public.usage_limits ul
                WHERE ul.subscription_id = v_subscription_id;
        END CASE;
    END IF;
    
    -- Get current usage
    CASE p_usage_type
        WHEN 'translations' THEN 
            SELECT translations_count INTO v_current_usage
            FROM get_user_usage(p_user_id);
        WHEN 'documents' THEN 
            SELECT documents_count INTO v_current_usage
            FROM get_user_usage(p_user_id);
        WHEN 'characters' THEN 
            SELECT characters_count INTO v_current_usage
            FROM get_user_usage(p_user_id);
        WHEN 'api_calls' THEN 
            SELECT api_calls_count INTO v_current_usage
            FROM get_user_usage(p_user_id);
    END CASE;
    
    -- Check if limit reached (-1 means unlimited)
    IF v_limit = -1 THEN
        RETURN FALSE; -- No limit
    ELSE
        RETURN COALESCE(v_current_usage, 0) >= v_limit;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
    p_user_id UUID,
    p_usage_type TEXT,
    p_amount INTEGER DEFAULT 1
) RETURNS VOID AS $$
DECLARE
    v_subscription_id UUID;
BEGIN
    -- Get user's subscription
    SELECT s.id INTO v_subscription_id
    FROM public.subscriptions s
    WHERE s.user_id = p_user_id
    AND s.status = 'active'
    LIMIT 1;
    
    -- Update or insert usage tracking
    INSERT INTO public.usage_tracking (
        user_id,
        subscription_id,
        period_start,
        period_end,
        translations_count,
        documents_count,
        characters_count,
        api_calls_count
    )
    VALUES (
        p_user_id,
        v_subscription_id,
        date_trunc('month', NOW()),
        date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 second',
        CASE WHEN p_usage_type = 'translations' THEN p_amount ELSE 0 END,
        CASE WHEN p_usage_type = 'documents' THEN p_amount ELSE 0 END,
        CASE WHEN p_usage_type = 'characters' THEN p_amount ELSE 0 END,
        CASE WHEN p_usage_type = 'api_calls' THEN p_amount ELSE 0 END
    )
    ON CONFLICT (user_id, period_start) 
    DO UPDATE SET
        translations_count = usage_tracking.translations_count + 
            CASE WHEN p_usage_type = 'translations' THEN p_amount ELSE 0 END,
        documents_count = usage_tracking.documents_count + 
            CASE WHEN p_usage_type = 'documents' THEN p_amount ELSE 0 END,
        characters_count = usage_tracking.characters_count + 
            CASE WHEN p_usage_type = 'characters' THEN p_amount ELSE 0 END,
        api_calls_count = usage_tracking.api_calls_count + 
            CASE WHEN p_usage_type = 'api_calls' THEN p_amount ELSE 0 END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
    p_user_id UUID,
    p_action TEXT,
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.activity_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        metadata
    ) VALUES (
        p_user_id,
        p_action,
        p_resource_type,
        p_resource_id,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data() RETURNS VOID AS $$
BEGIN
    -- Delete old activity logs (older than 90 days)
    DELETE FROM public.activity_logs
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Delete old webhook logs (older than 30 days)
    DELETE FROM public.webhook_logs
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Archive old translations (older than 1 year)
    UPDATE public.translations
    SET status = 'archived'
    WHERE created_at < NOW() - INTERVAL '1 year'
    AND status = 'completed';
    
    -- Clean up expired API keys
    UPDATE public.api_keys
    SET is_active = false
    WHERE expires_at < NOW()
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Create views for common queries

-- User dashboard view
CREATE OR REPLACE VIEW user_dashboard AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.created_at,
    s.tier as subscription_tier,
    s.status as subscription_status,
    COALESCE(ut.translations_count, 0) as translations_this_month,
    COALESCE(ut.documents_count, 0) as documents_this_month,
    COALESCE(ut.characters_count, 0) as characters_this_month,
    (
        SELECT COUNT(*) 
        FROM public.translations t 
        WHERE t.user_id = u.id
    ) as total_translations,
    (
        SELECT COUNT(*) 
        FROM public.documents d 
        WHERE d.user_id = u.id
    ) as total_documents
FROM public.users u
LEFT JOIN public.subscriptions s ON s.user_id = u.id AND s.status = 'active'
LEFT JOIN public.usage_tracking ut ON ut.user_id = u.id 
    AND ut.period_start <= NOW() 
    AND ut.period_end >= NOW();

-- Translation analytics view
CREATE OR REPLACE VIEW translation_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    source_language,
    target_language,
    provider,
    COUNT(*) as translation_count,
    AVG(translation_time_ms) as avg_translation_time,
    AVG(confidence_score) as avg_confidence,
    SUM(character_count) as total_characters,
    COUNT(DISTINCT user_id) as unique_users
FROM public.translations
WHERE status = 'completed'
GROUP BY DATE_TRUNC('day', created_at), source_language, target_language, provider;

-- Popular language pairs view
CREATE OR REPLACE VIEW popular_language_pairs AS
SELECT 
    source_language,
    target_language,
    COUNT(*) as usage_count,
    AVG(confidence_score) as avg_confidence,
    AVG(translation_time_ms) as avg_time_ms
FROM public.translations
WHERE created_at >= NOW() - INTERVAL '30 days'
AND status = 'completed'
GROUP BY source_language, target_language
ORDER BY usage_count DESC;

-- Team activity view
CREATE OR REPLACE VIEW team_activity AS
SELECT 
    t.id as team_id,
    t.name as team_name,
    COUNT(DISTINCT tm.user_id) as member_count,
    COUNT(DISTINCT tr.id) as translations_count,
    COUNT(DISTINCT d.id) as documents_count,
    MAX(tr.created_at) as last_translation_at,
    SUM(tr.character_count) as total_characters
FROM public.teams t
LEFT JOIN public.team_members tm ON tm.team_id = t.id AND tm.is_active = true
LEFT JOIN public.translations tr ON tr.user_id = tm.user_id 
    AND tr.created_at >= NOW() - INTERVAL '30 days'
LEFT JOIN public.documents d ON d.user_id = tm.user_id 
    AND d.created_at >= NOW() - INTERVAL '30 days'
GROUP BY t.id, t.name;

-- Create materialized view for performance metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_metrics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(DISTINCT user_id) as active_users,
    COUNT(*) as total_translations,
    SUM(character_count) as total_characters,
    AVG(translation_time_ms) as avg_translation_time,
    AVG(confidence_score) as avg_confidence,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_translations,
    COUNT(CASE WHEN is_cached THEN 1 END) as cached_translations
FROM public.translations
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at);

-- Create index on materialized view
CREATE INDEX idx_daily_metrics_date ON daily_metrics(date DESC);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views() RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_metrics;
END;
$$ LANGUAGE plpgsql;

-- Create scheduled jobs (requires pg_cron extension)
-- Note: This should be run separately if pg_cron is available
/*
SELECT cron.schedule('refresh-materialized-views', '0 1 * * *', 'SELECT refresh_materialized_views();');
SELECT cron.schedule('cleanup-old-data', '0 2 * * 0', 'SELECT cleanup_old_data();');
*/

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.translations TO authenticated;
GRANT INSERT ON public.activity_logs TO authenticated;
GRANT INSERT ON public.feedback TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_usage_limits(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION log_activity(UUID, TEXT, TEXT, UUID, JSONB) TO authenticated;