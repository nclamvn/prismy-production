-- PRISMY DATABASE MIGRATION 001
-- Initial schema setup for production deployment
-- Includes all core tables and relationships

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'standard', 'premium', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete');
CREATE TYPE document_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'archived');
CREATE TYPE translation_status AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded');
CREATE TYPE ai_provider AS ENUM ('openai', 'anthropic', 'cohere', 'google', 'azure');

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    language_preference TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tier subscription_tier NOT NULL DEFAULT 'free',
    status subscription_status NOT NULL DEFAULT 'active',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id)
);

-- Create usage_limits table
CREATE TABLE IF NOT EXISTS public.usage_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    translations_limit INTEGER NOT NULL DEFAULT 10,
    documents_limit INTEGER NOT NULL DEFAULT 0,
    characters_limit INTEGER NOT NULL DEFAULT 10000,
    api_calls_limit INTEGER NOT NULL DEFAULT 100,
    storage_limit_mb INTEGER NOT NULL DEFAULT 100,
    team_members_limit INTEGER NOT NULL DEFAULT 1,
    reset_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create usage_tracking table
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    translations_count INTEGER DEFAULT 0,
    documents_count INTEGER DEFAULT 0,
    characters_count INTEGER DEFAULT 0,
    api_calls_count INTEGER DEFAULT 0,
    storage_used_mb DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, period_start)
);

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_path TEXT,
    file_size INTEGER,
    file_type TEXT,
    mime_type TEXT,
    status document_status NOT NULL DEFAULT 'pending',
    source_language TEXT,
    target_language TEXT,
    page_count INTEGER,
    word_count INTEGER,
    character_count INTEGER,
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    processing_time_ms INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create translations table
CREATE TABLE IF NOT EXISTS public.translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    source_text TEXT NOT NULL,
    translated_text TEXT,
    source_language TEXT NOT NULL,
    target_language TEXT NOT NULL,
    status translation_status NOT NULL DEFAULT 'pending',
    provider ai_provider,
    model_used TEXT,
    confidence_score DECIMAL(3,2),
    character_count INTEGER,
    translation_time_ms INTEGER,
    cost_credits DECIMAL(10,4),
    is_cached BOOLEAN DEFAULT false,
    cache_key TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create translation_history table (for versioning)
CREATE TABLE IF NOT EXISTS public.translation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    translation_id UUID NOT NULL REFERENCES public.translations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    source_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    edited_text TEXT,
    confidence_score DECIMAL(3,2),
    edit_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create api_keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix TEXT NOT NULL,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '["read", "write"]'::jsonb,
    rate_limit INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status payment_status NOT NULL DEFAULT 'pending',
    provider TEXT NOT NULL,
    provider_payment_id TEXT,
    provider_customer_id TEXT,
    description TEXT,
    invoice_url TEXT,
    receipt_url TEXT,
    failure_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    logo_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    permissions JSONB DEFAULT '["read"]'::jsonb,
    invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webhooks table
CREATE TABLE IF NOT EXISTS public.webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL,
    secret TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    failure_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
    event TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    payload JSONB,
    response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    translation_id UUID REFERENCES public.translations(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_helpful BOOLEAN,
    improvement_suggestion TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_tier ON public.subscriptions(tier);
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX idx_translations_user_id ON public.translations(user_id);
CREATE INDEX idx_translations_document_id ON public.translations(document_id);
CREATE INDEX idx_translations_status ON public.translations(status);
CREATE INDEX idx_translations_languages ON public.translations(source_language, target_language);
CREATE INDEX idx_translations_created_at ON public.translations(created_at DESC);
CREATE INDEX idx_translations_cache_key ON public.translations(cache_key) WHERE cache_key IS NOT NULL;
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_teams_owner_id ON public.teams(owner_id);
CREATE INDEX idx_teams_slug ON public.teams(slug);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_webhooks_user_id ON public.webhooks(user_id);
CREATE INDEX idx_webhook_logs_webhook_id ON public.webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);

-- Create full-text search indexes
CREATE INDEX idx_translations_source_text_search ON public.translations USING gin(to_tsvector('english', source_text));
CREATE INDEX idx_translations_translated_text_search ON public.translations USING gin(to_tsvector('english', translated_text));
CREATE INDEX idx_documents_filename_search ON public.documents USING gin(to_tsvector('english', filename));

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translations_updated_at BEFORE UPDATE ON public.translations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON public.webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS (Row Level Security) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Users can manage their own subscriptions
CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own documents
CREATE POLICY "Users can view own documents" ON public.documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create documents" ON public.documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON public.documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON public.documents
    FOR DELETE USING (auth.uid() = user_id);

-- Users can manage their own translations
CREATE POLICY "Users can view own translations" ON public.translations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create translations" ON public.translations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own translations" ON public.translations
    FOR UPDATE USING (auth.uid() = user_id);

-- Team members can view team data
CREATE POLICY "Team members can view team" ON public.teams
    FOR SELECT USING (
        auth.uid() = owner_id OR
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_id = teams.id
            AND user_id = auth.uid()
            AND is_active = true
        )
    );

-- Add comments for documentation
COMMENT ON TABLE public.users IS 'User profiles extending Supabase auth';
COMMENT ON TABLE public.subscriptions IS 'User subscription information';
COMMENT ON TABLE public.documents IS 'Uploaded documents for translation';
COMMENT ON TABLE public.translations IS 'Translation records and history';
COMMENT ON TABLE public.teams IS 'Team/organization accounts';
COMMENT ON TABLE public.activity_logs IS 'User activity tracking for analytics';
COMMENT ON TABLE public.webhooks IS 'Webhook configurations for integrations';

-- Create health check table for monitoring
CREATE TABLE IF NOT EXISTS public.health_check (
    id SERIAL PRIMARY KEY,
    checked_at TIMESTAMPTZ DEFAULT NOW()
);