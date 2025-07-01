-- ============================================
-- PRISMY ROW LEVEL SECURITY (RLS) SETUP
-- Enable multi-tenant data isolation
-- ============================================

-- Enable RLS on critical tables
ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS translation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS usage_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DOCUMENTS TABLE POLICIES
-- ============================================

-- Users can only see their own documents
CREATE POLICY "Users can view own documents" ON documents
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only insert documents for themselves
CREATE POLICY "Users can insert own documents" ON documents
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own documents
CREATE POLICY "Users can update own documents" ON documents
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own documents
CREATE POLICY "Users can delete own documents" ON documents
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Admin users can see all documents (for support)
CREATE POLICY "Admins can view all documents" ON documents
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================
-- TRANSLATION_JOBS TABLE POLICIES
-- ============================================

-- Users can only see their own translation jobs
CREATE POLICY "Users can view own translation jobs" ON translation_jobs
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only create jobs for themselves
CREATE POLICY "Users can insert own translation jobs" ON translation_jobs
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own jobs
CREATE POLICY "Users can update own translation jobs" ON translation_jobs
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- System can update job status (for processing)
CREATE POLICY "System can update job status" ON translation_jobs
  FOR UPDATE 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- USER_CREDITS TABLE POLICIES
-- ============================================

-- Users can only see their own credits
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Only system can modify credits (for billing)
CREATE POLICY "System can manage credits" ON user_credits
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- SUBSCRIPTIONS TABLE POLICIES
-- ============================================

-- Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Only system can manage subscriptions (for Stripe webhooks)
CREATE POLICY "System can manage subscriptions" ON subscriptions
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- USAGE_LOGS TABLE POLICIES
-- ============================================

-- Users can only see their own usage logs
CREATE POLICY "Users can view own usage logs" ON usage_logs
  FOR SELECT 
  USING (auth.uid() = user_id);

-- System can insert usage logs
CREATE POLICY "System can insert usage logs" ON usage_logs
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

-- Admins can view all usage logs (for analytics)
CREATE POLICY "Admins can view all usage logs" ON usage_logs
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================
-- SECURITY FUNCTIONS
-- ============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's tenant ID (if using multi-tenant setup)
CREATE OR REPLACE FUNCTION auth.current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT raw_user_meta_data->>'tenant_id'::UUID 
    FROM auth.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AUDIT LOGGING
-- ============================================

-- Create audit log table for security events
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON security_audit_log
  FOR SELECT 
  USING (auth.is_admin());

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON security_audit_log
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Test RLS policies (run these after enabling)
/*
-- Test as regular user (should only see own data)
SET request.jwt.claims TO '{"sub": "user1-uuid"}';
SELECT * FROM documents; -- Should only show user1's documents

-- Test as admin (should see all data)
SET request.jwt.claims TO '{"sub": "admin-uuid", "raw_user_meta_data": {"role": "admin"}}';
SELECT * FROM documents; -- Should show all documents

-- Test cross-tenant access (should fail)
SET request.jwt.claims TO '{"sub": "user2-uuid"}';
INSERT INTO documents (user_id, title) VALUES ('user1-uuid', 'hack attempt'); -- Should fail
*/

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.current_tenant_id() TO authenticated;