-- ============================================
-- ADVANCED BILLING & SUBSCRIPTION SETUP
-- Enhanced billing tables, usage tracking, and subscription management
-- ============================================

-- Drop existing billing_records table to recreate with enhanced schema
DROP TABLE IF EXISTS public.billing_records;

-- Create enhanced billing records table
CREATE TABLE IF NOT EXISTS public.billing_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  subscription_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'subscription_created', 'subscription_updated', 'subscription_cancelled',
    'payment_succeeded', 'payment_failed', 'usage_overage', 'refund_issued',
    'trial_started', 'trial_ended', 'downgrade', 'upgrade'
  )),
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  billing_period_start DATE,
  billing_period_end DATE,
  metadata JSONB,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enhanced user subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'standard', 'premium', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid', 'trialing')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Create subscription usage tracking table
CREATE TABLE IF NOT EXISTS public.subscription_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  usage_type TEXT NOT NULL CHECK (usage_type IN (
    'documents', 'translations', 'storage_gb', 'api_calls', 'team_members'
  )),
  usage_amount INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  overage_amount INTEGER DEFAULT 0,
  overage_cost DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subscription_id, usage_type, period_start, period_end)
);

-- Create subscription tier limits table
CREATE TABLE IF NOT EXISTS public.subscription_tier_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tier TEXT NOT NULL UNIQUE,
  max_documents INTEGER DEFAULT -1, -- -1 means unlimited
  max_translations INTEGER DEFAULT -1,
  max_team_members INTEGER DEFAULT -1,
  max_storage_gb INTEGER DEFAULT -1,
  max_api_calls_per_month INTEGER DEFAULT -1,
  included_documents INTEGER DEFAULT 0,
  included_translations INTEGER DEFAULT 0,
  included_storage_gb INTEGER DEFAULT 0,
  overage_rate_per_document DECIMAL(8,4) DEFAULT 0,
  overage_rate_per_translation DECIMAL(8,4) DEFAULT 0,
  overage_rate_per_gb DECIMAL(8,2) DEFAULT 0,
  features JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  stripe_payment_method_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create billing notifications table
CREATE TABLE IF NOT EXISTS public.billing_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'payment_succeeded', 'payment_failed', 'subscription_cancelled',
    'trial_ending', 'usage_limit_approaching', 'usage_overage',
    'invoice_upcoming', 'subscription_renewed'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage alerts table
CREATE TABLE IF NOT EXISTS public.usage_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'documents_limit', 'translations_limit', 'storage_limit', 'api_calls_limit'
  )),
  threshold_percentage INTEGER NOT NULL DEFAULT 80,
  is_enabled BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id, alert_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_billing_records_user ON public.billing_records(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_org ON public.billing_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_subscription ON public.billing_records(subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_event_type ON public.billing_records(event_type);
CREATE INDEX IF NOT EXISTS idx_billing_records_created_at ON public.billing_records(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_org ON public.user_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON public.user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON public.user_subscriptions(subscription_tier);

CREATE INDEX IF NOT EXISTS idx_subscription_usage_subscription ON public.subscription_usage(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user ON public.subscription_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_type ON public.subscription_usage(usage_type);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_period ON public.subscription_usage(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_org ON public.payment_methods(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON public.payment_methods(is_default);

CREATE INDEX IF NOT EXISTS idx_billing_notifications_user ON public.billing_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_notifications_org ON public.billing_notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_notifications_read ON public.billing_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_billing_notifications_created_at ON public.billing_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_alerts_user ON public.usage_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_alerts_org ON public.usage_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_alerts_enabled ON public.usage_alerts(is_enabled);

-- Enable RLS on all billing tables
ALTER TABLE public.billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_tier_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for billing records
CREATE POLICY "Users can view own billing records" ON public.billing_records
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Organization billing access" ON public.billing_records
  FOR SELECT 
  USING (
    organization_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = billing_records.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

CREATE POLICY "System can manage billing records" ON public.billing_records
  FOR ALL 
  USING (auth.role() = 'service_role');

-- RLS policies for user subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Organization subscription access" ON public.user_subscriptions
  FOR SELECT 
  USING (
    organization_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = user_subscriptions.organization_id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );

CREATE POLICY "System can manage subscriptions" ON public.user_subscriptions
  FOR ALL 
  USING (auth.role() = 'service_role');

-- RLS policies for subscription usage
CREATE POLICY "Users can view own usage" ON public.subscription_usage
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Organization usage access" ON public.subscription_usage
  FOR SELECT 
  USING (
    organization_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = subscription_usage.organization_id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );

CREATE POLICY "System can manage usage" ON public.subscription_usage
  FOR ALL 
  USING (auth.role() = 'service_role');

-- RLS policies for tier limits (public read access)
CREATE POLICY "Anyone can view tier limits" ON public.subscription_tier_limits
  FOR SELECT 
  TO public
  USING (true);

CREATE POLICY "System can manage tier limits" ON public.subscription_tier_limits
  FOR ALL 
  USING (auth.role() = 'service_role');

-- RLS policies for payment methods
CREATE POLICY "Users can manage own payment methods" ON public.payment_methods
  FOR ALL 
  USING (user_id = auth.uid());

CREATE POLICY "Organization payment methods access" ON public.payment_methods
  FOR ALL 
  USING (
    organization_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = payment_methods.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- RLS policies for billing notifications
CREATE POLICY "Users can view own notifications" ON public.billing_notifications
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.billing_notifications
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "System can manage notifications" ON public.billing_notifications
  FOR ALL 
  USING (auth.role() = 'service_role');

-- RLS policies for usage alerts
CREATE POLICY "Users can manage own alerts" ON public.usage_alerts
  FOR ALL 
  USING (user_id = auth.uid());

CREATE POLICY "Organization alerts access" ON public.usage_alerts
  FOR ALL 
  USING (
    organization_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = usage_alerts.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND status = 'active'
    )
  );

-- Function to track subscription usage
CREATE OR REPLACE FUNCTION public.track_subscription_usage(
  p_user_id UUID,
  p_organization_id UUID DEFAULT NULL,
  p_usage_type TEXT,
  p_amount INTEGER DEFAULT 1
)
RETURNS void AS $$
DECLARE
  v_subscription_id UUID;
  v_period_start TIMESTAMP WITH TIME ZONE;
  v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get active subscription
  SELECT id, current_period_start, current_period_end
  INTO v_subscription_id, v_period_start, v_period_end
  FROM public.user_subscriptions
  WHERE user_id = p_user_id
    AND (p_organization_id IS NULL OR organization_id = p_organization_id)
    AND status = 'active'
  LIMIT 1;

  IF v_subscription_id IS NULL THEN
    RETURN; -- No active subscription
  END IF;

  -- Update or insert usage record
  INSERT INTO public.subscription_usage (
    subscription_id, user_id, organization_id, usage_type,
    usage_amount, period_start, period_end
  )
  VALUES (
    v_subscription_id, p_user_id, p_organization_id, p_usage_type,
    p_amount, v_period_start, v_period_end
  )
  ON CONFLICT (subscription_id, usage_type, period_start, period_end)
  DO UPDATE SET
    usage_amount = subscription_usage.usage_amount + p_amount,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check usage limits and send alerts
CREATE OR REPLACE FUNCTION public.check_usage_limits(p_user_id UUID, p_organization_id UUID DEFAULT NULL)
RETURNS void AS $$
DECLARE
  v_subscription RECORD;
  v_limits RECORD;
  v_usage RECORD;
  v_threshold INTEGER;
BEGIN
  -- Get subscription and limits
  SELECT s.*, l.*
  INTO v_subscription
  FROM public.user_subscriptions s
  JOIN public.subscription_tier_limits l ON l.tier = s.subscription_tier
  WHERE s.user_id = p_user_id
    AND (p_organization_id IS NULL OR s.organization_id = p_organization_id)
    AND s.status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN; -- No active subscription
  END IF;

  -- Check each usage type
  FOR v_usage IN
    SELECT usage_type, usage_amount
    FROM public.subscription_usage
    WHERE subscription_id = v_subscription.id
      AND period_start = v_subscription.current_period_start
      AND period_end = v_subscription.current_period_end
  LOOP
    -- Get alert threshold
    SELECT threshold_percentage INTO v_threshold
    FROM public.usage_alerts
    WHERE user_id = p_user_id
      AND (p_organization_id IS NULL OR organization_id = p_organization_id)
      AND alert_type = v_usage.usage_type || '_limit'
      AND is_enabled = true;

    IF FOUND THEN
      -- Check if threshold exceeded
      CASE v_usage.usage_type
        WHEN 'documents' THEN
          IF v_subscription.max_documents > 0 AND 
             v_usage.usage_amount >= (v_subscription.max_documents * v_threshold / 100.0) THEN
            PERFORM public.create_usage_alert_notification(
              p_user_id, p_organization_id, 'documents_limit',
              v_usage.usage_amount, v_subscription.max_documents
            );
          END IF;
        -- Add similar checks for other usage types
      END CASE;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create usage alert notifications
CREATE OR REPLACE FUNCTION public.create_usage_alert_notification(
  p_user_id UUID,
  p_organization_id UUID,
  p_alert_type TEXT,
  p_current_usage INTEGER,
  p_limit INTEGER
)
RETURNS void AS $$
DECLARE
  v_percentage INTEGER;
  v_title TEXT;
  v_message TEXT;
BEGIN
  v_percentage := (p_current_usage * 100 / p_limit);
  
  CASE p_alert_type
    WHEN 'documents_limit' THEN
      v_title := 'Document Limit Alert';
      v_message := format('You have used %s of %s documents (%s%%)', 
                         p_current_usage, p_limit, v_percentage);
    WHEN 'translations_limit' THEN
      v_title := 'Translation Limit Alert';
      v_message := format('You have used %s of %s translations (%s%%)', 
                         p_current_usage, p_limit, v_percentage);
    -- Add other alert types
  END CASE;

  INSERT INTO public.billing_notifications (
    user_id, organization_id, notification_type, title, message, metadata
  )
  VALUES (
    p_user_id, p_organization_id, 'usage_limit_approaching', v_title, v_message,
    jsonb_build_object('alert_type', p_alert_type, 'usage', p_current_usage, 'limit', p_limit)
  );

  -- Update last triggered time
  UPDATE public.usage_alerts
  SET last_triggered_at = NOW()
  WHERE user_id = p_user_id
    AND (p_organization_id IS NULL OR organization_id = p_organization_id)
    AND alert_type = p_alert_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old billing data
CREATE OR REPLACE FUNCTION public.cleanup_billing_data()
RETURNS void AS $$
BEGIN
  -- Delete old billing records (keep 2 years)
  DELETE FROM public.billing_records
  WHERE created_at < NOW() - INTERVAL '2 years';
  
  -- Delete old usage data (keep 1 year)
  DELETE FROM public.subscription_usage
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Delete old notifications (keep 90 days)
  DELETE FROM public.billing_notifications
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.track_subscription_usage(UUID, UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_usage_limits(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_usage_alert_notification(UUID, UUID, TEXT, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_billing_data() TO service_role;

-- Insert subscription tier limits
INSERT INTO public.subscription_tier_limits (
  tier, max_documents, max_translations, max_team_members, max_storage_gb,
  included_documents, included_translations, included_storage_gb,
  overage_rate_per_document, overage_rate_per_translation, overage_rate_per_gb,
  features
) VALUES 
  ('free', 10, 50, 1, 1, 10, 50, 1, 0.10, 0.02, 5.00, 
   '{"prioritySupport": false, "customBranding": false, "apiAccess": false}'::jsonb),
  ('standard', 100, 1000, 5, 10, 100, 1000, 10, 0.08, 0.015, 3.00,
   '{"prioritySupport": true, "customBranding": false, "apiAccess": true}'::jsonb),
  ('premium', 500, 5000, 20, 50, 500, 5000, 50, 0.05, 0.01, 2.00,
   '{"prioritySupport": true, "customBranding": true, "apiAccess": true, "ssoIntegration": true}'::jsonb),
  ('enterprise', -1, -1, -1, 500, -1, -1, 500, 0.02, 0.005, 1.00,
   '{"prioritySupport": true, "customBranding": true, "apiAccess": true, "ssoIntegration": true, "dedicatedManager": true}'::jsonb)
ON CONFLICT (tier) DO UPDATE SET
  max_documents = EXCLUDED.max_documents,
  max_translations = EXCLUDED.max_translations,
  max_team_members = EXCLUDED.max_team_members,
  max_storage_gb = EXCLUDED.max_storage_gb,
  updated_at = NOW();

-- Create scheduled cleanup job (if pg_cron is available)
-- SELECT cron.schedule('cleanup-billing-data', '0 4 * * 0', 'SELECT public.cleanup_billing_data();');