-- 🚨 NUCLEAR DATABASE RESET - OAUTH CLEAN SLATE
-- This script completely resets all auth-related data and schemas
-- ⚠️  WARNING: This will delete ALL existing users and sessions!

-- =============================================================================
-- STEP 1: CLEAN ALL EXISTING AUTH DATA
-- =============================================================================

-- Clear all active sessions and refresh tokens
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.sessions;

-- Clear existing user data (CAREFUL!)
-- DELETE FROM auth.users; -- Uncomment if you want to delete all users

-- =============================================================================
-- STEP 2: RESET USER CREDITS TABLE
-- =============================================================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS user_credits CASCADE;

-- Create fresh user_credits table with correct schema
CREATE TABLE user_credits (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_left INTEGER DEFAULT 20 NOT NULL,
    total_earned INTEGER DEFAULT 20 NOT NULL,
    total_spent INTEGER DEFAULT 0 NOT NULL,
    trial_credits INTEGER DEFAULT 20 NOT NULL,
    purchased_credits INTEGER DEFAULT 0 NOT NULL,
    daily_usage_count INTEGER DEFAULT 0 NOT NULL,
    daily_usage_reset DATE DEFAULT CURRENT_DATE NOT NULL,
    invite_code_used TEXT,
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'pro', 'enterprise')),
    trial_ends_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id)
);

-- =============================================================================
-- STEP 3: SETUP ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on user_credits table
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can update own credits" ON user_credits;
DROP POLICY IF EXISTS "Service role can manage all credits" ON user_credits;

-- Create comprehensive RLS policies
CREATE POLICY "Users can read own credits" ON user_credits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits" ON user_credits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all credits" ON user_credits
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to insert their own credits
CREATE POLICY "Users can insert own credits" ON user_credits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- STEP 4: CREATE AUTH TRIGGER FUNCTION
-- =============================================================================

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create trigger function for new user setup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert initial credits for new user
    INSERT INTO user_credits (
        user_id,
        credits_left,
        total_earned,
        total_spent,
        trial_credits,
        purchased_credits,
        daily_usage_count,
        daily_usage_reset,
        tier
    ) VALUES (
        NEW.id,
        20,          -- credits_left
        20,          -- total_earned
        0,           -- total_spent
        20,          -- trial_credits
        0,           -- purchased_credits
        0,           -- daily_usage_count
        CURRENT_DATE, -- daily_usage_reset
        'free'       -- tier
    );
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE LOG 'Error creating user credits for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- STEP 5: CREATE UTILITY FUNCTIONS
-- =============================================================================

-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS get_user_credits(UUID);

-- Function to check user credits
CREATE OR REPLACE FUNCTION get_user_credits(user_uuid UUID)
RETURNS TABLE (
    credits_left INTEGER,
    total_earned INTEGER,
    total_spent INTEGER,
    tier TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uc.credits_left,
        uc.total_earned,
        uc.total_spent,
        uc.tier
    FROM user_credits uc
    WHERE uc.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing function first to avoid conflicts
DROP FUNCTION IF EXISTS update_user_credits(UUID, INTEGER);

-- Function to update user credits
CREATE OR REPLACE FUNCTION update_user_credits(
    user_uuid UUID,
    credits_used INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    current_credits INTEGER;
BEGIN
    -- Get current credits
    SELECT credits_left INTO current_credits
    FROM user_credits
    WHERE user_id = user_uuid;
    
    -- Check if user has enough credits
    IF current_credits < credits_used THEN
        RETURN FALSE;
    END IF;
    
    -- Update credits
    UPDATE user_credits
    SET 
        credits_left = credits_left - credits_used,
        total_spent = total_spent + credits_used,
        last_used_at = NOW(),
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STEP 6: CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- Index on daily_usage_reset for cleanup jobs
CREATE INDEX IF NOT EXISTS idx_user_credits_daily_reset ON user_credits(daily_usage_reset);

-- Index on created_at for analytics
CREATE INDEX IF NOT EXISTS idx_user_credits_created_at ON user_credits(created_at);

-- =============================================================================
-- STEP 7: VERIFY SETUP
-- =============================================================================

-- Test data insertion (will be removed)
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (
--     gen_random_uuid(),
--     'test@example.com',
--     'encrypted_password_here',
--     NOW(),
--     NOW(),
--     NOW()
-- );

-- Check if trigger works by querying user_credits
-- SELECT * FROM user_credits;

-- =============================================================================
-- STEP 8: GRANT NECESSARY PERMISSIONS
-- =============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, UPDATE ON user_credits TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_credits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_credits(UUID, INTEGER) TO authenticated;

-- Grant full permissions to service role
GRANT ALL ON user_credits TO service_role;
GRANT ALL ON FUNCTION handle_new_user() TO service_role;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$ 
BEGIN 
    RAISE NOTICE '🎉 DATABASE RESET COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '✅ user_credits table created with correct schema';
    RAISE NOTICE '✅ RLS policies configured';
    RAISE NOTICE '✅ Auth trigger function created';
    RAISE NOTICE '✅ Utility functions created';
    RAISE NOTICE '✅ Indexes created for performance';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Next steps:';
    RAISE NOTICE '1. Reset Google OAuth configuration in Supabase Dashboard';
    RAISE NOTICE '2. Test OAuth flow with clean database';
    RAISE NOTICE '3. Verify user creation and credits assignment';
END $$;