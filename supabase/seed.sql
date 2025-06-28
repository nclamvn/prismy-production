-- PRISMY DATABASE SEED DATA
-- Initial data for development and testing
-- DO NOT RUN IN PRODUCTION

-- Insert test users (passwords should be changed in production)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
    ('d0d8c630-8e5a-4c6a-8b7a-5c4b3a2e1f0a', 'admin@prismy.ai', crypt('Admin123!', gen_salt('bf')), NOW(), NOW(), NOW()),
    ('e1e9d741-9f6b-5d7b-9c8b-6d5c4b3f2a1b', 'demo@prismy.ai', crypt('Demo123!', gen_salt('bf')), NOW(), NOW(), NOW()),
    ('f2fae852-ag7c-6e8c-ad9c-7e6d5c4a3b2c', 'test@prismy.ai', crypt('Test123!', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert user profiles
INSERT INTO public.users (id, email, full_name, language_preference, timezone)
VALUES 
    ('d0d8c630-8e5a-4c6a-8b7a-5c4b3a2e1f0a', 'admin@prismy.ai', 'Admin User', 'en', 'America/New_York'),
    ('e1e9d741-9f6b-5d7b-9c8b-6d5c4b3f2a1b', 'demo@prismy.ai', 'Demo User', 'vi', 'Asia/Ho_Chi_Minh'),
    ('f2fae852-ag7c-6e8c-ad9c-7e6d5c4a3b2c', 'test@prismy.ai', 'Test User', 'en', 'UTC')
ON CONFLICT (id) DO NOTHING;

-- Insert subscriptions
INSERT INTO public.subscriptions (id, user_id, tier, status, current_period_start, current_period_end)
VALUES 
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'd0d8c630-8e5a-4c6a-8b7a-5c4b3a2e1f0a', 'enterprise', 'active', NOW(), NOW() + INTERVAL '30 days'),
    ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'e1e9d741-9f6b-5d7b-9c8b-6d5c4b3f2a1b', 'premium', 'active', NOW(), NOW() + INTERVAL '30 days'),
    ('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'f2fae852-ag7c-6e8c-ad9c-7e6d5c4a3b2c', 'free', 'active', NOW(), NOW() + INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- Insert usage limits
INSERT INTO public.usage_limits (subscription_id, translations_limit, documents_limit, characters_limit, api_calls_limit, storage_limit_mb, team_members_limit, reset_at)
VALUES 
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', -1, -1, -1, -1, 10000, 50, NOW() + INTERVAL '30 days'),
    ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 200, 100, 500000, 5000, 1000, 10, NOW() + INTERVAL '30 days'),
    ('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 10, 0, 10000, 100, 100, 1, NOW() + INTERVAL '30 days')
ON CONFLICT DO NOTHING;

-- Insert sample documents
INSERT INTO public.documents (id, user_id, filename, file_type, status, source_language, target_language, word_count, character_count)
VALUES 
    ('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'd0d8c630-8e5a-4c6a-8b7a-5c4b3a2e1f0a', 'business-proposal.pdf', 'pdf', 'completed', 'en', 'vi', 500, 2500),
    ('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'e1e9d741-9f6b-5d7b-9c8b-6d5c4b3f2a1b', 'product-manual.docx', 'docx', 'completed', 'vi', 'en', 1000, 5000),
    ('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 'f2fae852-ag7c-6e8c-ad9c-7e6d5c4a3b2c', 'welcome-message.txt', 'txt', 'completed', 'en', 'vi', 50, 250)
ON CONFLICT (id) DO NOTHING;

-- Insert sample translations
INSERT INTO public.translations (user_id, document_id, source_text, translated_text, source_language, target_language, status, provider, model_used, confidence_score, character_count, translation_time_ms)
VALUES 
    ('d0d8c630-8e5a-4c6a-8b7a-5c4b3a2e1f0a', 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 
     'Welcome to Prismy', 'Chào mừng đến với Prismy', 
     'en', 'vi', 'completed', 'anthropic', 'claude-3-5-sonnet-20241022', 0.95, 17, 150),
    
    ('e1e9d741-9f6b-5d7b-9c8b-6d5c4b3f2a1b', 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 
     'Xin chào thế giới', 'Hello world', 
     'vi', 'en', 'completed', 'openai', 'gpt-4o', 0.98, 16, 120),
    
    ('f2fae852-ag7c-6e8c-ad9c-7e6d5c4a3b2c', 'd3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 
     'Artificial Intelligence is the future', 'Trí tuệ nhân tạo là tương lai', 
     'en', 'vi', 'completed', 'google', 'google-translate', 0.92, 35, 80),
     
    ('d0d8c630-8e5a-4c6a-8b7a-5c4b3a2e1f0a', NULL, 
     'Machine learning transforms businesses', 'Học máy biến đổi doanh nghiệp', 
     'en', 'vi', 'completed', 'anthropic', 'claude-3-5-sonnet-20241022', 0.94, 37, 180),
     
    ('e1e9d741-9f6b-5d7b-9c8b-6d5c4b3f2a1b', NULL, 
     'Việt Nam là một đất nước xinh đẹp', 'Vietnam is a beautiful country', 
     'vi', 'en', 'completed', 'openai', 'gpt-4o', 0.96, 34, 140)
ON CONFLICT DO NOTHING;

-- Insert sample teams
INSERT INTO public.teams (id, name, slug, owner_id, description)
VALUES 
    ('t1t1t1t1-t1t1-t1t1-t1t1-t1t1t1t1t1t1', 'Prismy Dev Team', 'prismy-dev', 'd0d8c630-8e5a-4c6a-8b7a-5c4b3a2e1f0a', 'Development team for Prismy platform'),
    ('t2t2t2t2-t2t2-t2t2-t2t2-t2t2t2t2t2t2', 'Demo Company', 'demo-co', 'e1e9d741-9f6b-5d7b-9c8b-6d5c4b3f2a1b', 'Demo company for testing')
ON CONFLICT (id) DO NOTHING;

-- Insert team members
INSERT INTO public.team_members (team_id, user_id, role, permissions, joined_at)
VALUES 
    ('t1t1t1t1-t1t1-t1t1-t1t1-t1t1t1t1t1t1', 'd0d8c630-8e5a-4c6a-8b7a-5c4b3a2e1f0a', 'owner', '["read", "write", "delete", "admin"]'::jsonb, NOW()),
    ('t1t1t1t1-t1t1-t1t1-t1t1-t1t1t1t1t1t1', 'e1e9d741-9f6b-5d7b-9c8b-6d5c4b3f2a1b', 'member', '["read", "write"]'::jsonb, NOW()),
    ('t2t2t2t2-t2t2-t2t2-t2t2-t2t2t2t2t2t2', 'e1e9d741-9f6b-5d7b-9c8b-6d5c4b3f2a1b', 'owner', '["read", "write", "delete", "admin"]'::jsonb, NOW())
ON CONFLICT (team_id, user_id) DO NOTHING;

-- Insert sample API keys (these are fake keys for demonstration)
INSERT INTO public.api_keys (user_id, name, key_hash, key_prefix, permissions, rate_limit)
VALUES 
    ('d0d8c630-8e5a-4c6a-8b7a-5c4b3a2e1f0a', 'Production API Key', '$2a$10$fakehashvalue1234567890abcdef', 'pk_live_', '["read", "write"]'::jsonb, 1000),
    ('e1e9d741-9f6b-5d7b-9c8b-6d5c4b3f2a1b', 'Test API Key', '$2a$10$fakehashvalue0987654321fedcba', 'pk_test_', '["read"]'::jsonb, 100)
ON CONFLICT DO NOTHING;

-- Insert sample activity logs
INSERT INTO public.activity_logs (user_id, action, resource_type, resource_id, metadata)
VALUES 
    ('d0d8c630-8e5a-4c6a-8b7a-5c4b3a2e1f0a', 'translation.created', 'translation', NULL, '{"source": "en", "target": "vi", "length": 100}'::jsonb),
    ('e1e9d741-9f6b-5d7b-9c8b-6d5c4b3f2a1b', 'document.uploaded', 'document', 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', '{"filename": "product-manual.docx", "size": 524288}'::jsonb),
    ('f2fae852-ag7c-6e8c-ad9c-7e6d5c4a3b2c', 'user.login', 'user', 'f2fae852-ag7c-6e8c-ad9c-7e6d5c4a3b2c', '{"ip": "127.0.0.1", "user_agent": "Mozilla/5.0"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Insert sample feedback
INSERT INTO public.feedback (user_id, translation_id, rating, comment, is_helpful)
VALUES 
    ('d0d8c630-8e5a-4c6a-8b7a-5c4b3a2e1f0a', 
     (SELECT id FROM public.translations WHERE user_id = 'd0d8c630-8e5a-4c6a-8b7a-5c4b3a2e1f0a' LIMIT 1), 
     5, 'Excellent translation quality!', true),
    ('e1e9d741-9f6b-5d7b-9c8b-6d5c4b3f2a1b', 
     (SELECT id FROM public.translations WHERE user_id = 'e1e9d741-9f6b-5d7b-9c8b-6d5c4b3f2a1b' LIMIT 1), 
     4, 'Good, but could improve context understanding', true)
ON CONFLICT DO NOTHING;

-- Insert current month usage tracking
INSERT INTO public.usage_tracking (user_id, subscription_id, period_start, period_end, translations_count, documents_count, characters_count, api_calls_count)
VALUES 
    ('d0d8c630-8e5a-4c6a-8b7a-5c4b3a2e1f0a', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 
     date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 second',
     150, 25, 75000, 500),
    ('e1e9d741-9f6b-5d7b-9c8b-6d5c4b3f2a1b', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 
     date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 second',
     50, 10, 25000, 200),
    ('f2fae852-ag7c-6e8c-ad9c-7e6d5c4a3b2c', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 
     date_trunc('month', NOW()), date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 second',
     5, 0, 2500, 20)
ON CONFLICT (user_id, period_start) DO NOTHING;

-- Create some webhook configurations
INSERT INTO public.webhooks (user_id, url, events, secret, is_active)
VALUES 
    ('d0d8c630-8e5a-4c6a-8b7a-5c4b3a2e1f0a', 
     'https://example.com/webhooks/prismy', 
     ARRAY['translation.completed', 'document.processed'], 
     'whsec_fakesecret123', 
     true),
    ('e1e9d741-9f6b-5d7b-9c8b-6d5c4b3f2a1b', 
     'https://demo.com/api/webhooks', 
     ARRAY['translation.failed', 'subscription.updated'], 
     'whsec_demosecret456', 
     true)
ON CONFLICT DO NOTHING;

-- Create sample payments
INSERT INTO public.payments (user_id, subscription_id, amount, currency, status, provider, description)
VALUES 
    ('d0d8c630-8e5a-4c6a-8b7a-5c4b3a2e1f0a', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 299.00, 'USD', 'succeeded', 'stripe', 'Enterprise Plan - Monthly'),
    ('e1e9d741-9f6b-5d7b-9c8b-6d5c4b3f2a1b', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 49.00, 'USD', 'succeeded', 'stripe', 'Premium Plan - Monthly')
ON CONFLICT DO NOTHING;

-- Refresh materialized views
REFRESH MATERIALIZED VIEW daily_metrics;

-- Output confirmation
DO $$
BEGIN
    RAISE NOTICE 'Seed data inserted successfully!';
    RAISE NOTICE 'Test accounts created:';
    RAISE NOTICE '  - admin@prismy.ai (password: Admin123!)';
    RAISE NOTICE '  - demo@prismy.ai (password: Demo123!)';
    RAISE NOTICE '  - test@prismy.ai (password: Test123!)';
END $$;