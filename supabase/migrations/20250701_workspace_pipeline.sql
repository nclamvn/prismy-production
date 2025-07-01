-- =====================================================
-- PRISMY vNEXT WORKSPACE PIPELINE SCHEMA
-- Migration: 20250701_workspace_pipeline
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Credits tracking table
-- Supports both anonymous (session_id) and authenticated (user_id) users
CREATE TABLE IF NOT EXISTS user_credits (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id     text,
  credits_left   int DEFAULT 20,
  credits_used   int DEFAULT 0,
  tier           text DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'pro', 'enterprise')),
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now(),
  
  -- Ensure either user_id OR session_id is present, not both
  CONSTRAINT user_credits_identity_check 
    CHECK ((user_id IS NOT NULL AND session_id IS NULL) OR 
           (user_id IS NULL AND session_id IS NOT NULL))
);

-- Create unique index on user_id and session_id
CREATE UNIQUE INDEX IF NOT EXISTS user_credits_user_id_idx ON user_credits(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_credits_session_id_idx ON user_credits(session_id) WHERE session_id IS NOT NULL;

-- Translation jobs table
CREATE TABLE IF NOT EXISTS translation_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    text,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  filename      text NOT NULL,
  original_name text NOT NULL,
  file_size     bigint NOT NULL,
  mime_type     text NOT NULL,
  storage_path  text NOT NULL,
  pages         int DEFAULT 0,
  status        text DEFAULT 'queued' CHECK (status IN ('queued', 'translating', 'translated', 'failed')),
  progress      int DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  output_path   text,
  error_message text,
  credits_cost  int DEFAULT 0,
  translation_service text DEFAULT 'google' CHECK (translation_service IN ('google', 'openai', 'anthropic')),
  source_lang   text DEFAULT 'auto',
  target_lang   text DEFAULT 'en',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  completed_at  timestamptz,
  
  -- Ensure either user_id OR session_id is present
  CONSTRAINT translation_jobs_identity_check 
    CHECK ((user_id IS NOT NULL AND session_id IS NULL) OR 
           (user_id IS NULL AND session_id IS NOT NULL))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS translation_jobs_session_id_idx ON translation_jobs(session_id);
CREATE INDEX IF NOT EXISTS translation_jobs_user_id_idx ON translation_jobs(user_id);
CREATE INDEX IF NOT EXISTS translation_jobs_status_idx ON translation_jobs(status);
CREATE INDEX IF NOT EXISTS translation_jobs_created_at_idx ON translation_jobs(created_at DESC);

-- Chat messages table for LLM conversations
CREATE TABLE IF NOT EXISTS chat_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      uuid REFERENCES translation_jobs(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('user', 'assistant')),
  content     text NOT NULL,
  tokens      int DEFAULT 0,
  credits_cost int DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_job_id_idx ON chat_messages(job_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at DESC);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_credits_updated_at 
  BEFORE UPDATE ON user_credits 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translation_jobs_updated_at 
  BEFORE UPDATE ON translation_jobs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get or create user credits
CREATE OR REPLACE FUNCTION get_or_create_credits(
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL
)
RETURNS TABLE(credits_left int, credits_used int, tier text) AS $$
BEGIN
  -- Validate input
  IF (p_user_id IS NULL AND p_session_id IS NULL) OR 
     (p_user_id IS NOT NULL AND p_session_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Must provide either user_id OR session_id, not both or neither';
  END IF;
  
  -- Try to get existing credits
  IF p_user_id IS NOT NULL THEN
    SELECT uc.credits_left, uc.credits_used, uc.tier 
    INTO credits_left, credits_used, tier
    FROM user_credits uc 
    WHERE uc.user_id = p_user_id;
  ELSE
    SELECT uc.credits_left, uc.credits_used, uc.tier 
    INTO credits_left, credits_used, tier
    FROM user_credits uc 
    WHERE uc.session_id = p_session_id;
  END IF;
  
  -- Create if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, session_id, credits_left, credits_used, tier)
    VALUES (p_user_id, p_session_id, 20, 0, 'free')
    RETURNING user_credits.credits_left, user_credits.credits_used, user_credits.tier
    INTO credits_left, credits_used, tier;
  END IF;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to reserve credits (atomic operation)
CREATE OR REPLACE FUNCTION reserve_credits(
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_cost int DEFAULT 1
)
RETURNS boolean AS $$
DECLARE
  current_credits int;
BEGIN
  -- Validate input
  IF (p_user_id IS NULL AND p_session_id IS NULL) OR 
     (p_user_id IS NOT NULL AND p_session_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Must provide either user_id OR session_id, not both or neither';
  END IF;
  
  -- Atomic credit reservation
  IF p_user_id IS NOT NULL THEN
    UPDATE user_credits 
    SET credits_left = credits_left - p_cost,
        credits_used = credits_used + p_cost
    WHERE user_id = p_user_id 
      AND credits_left >= p_cost
    RETURNING credits_left INTO current_credits;
  ELSE
    UPDATE user_credits 
    SET credits_left = credits_left - p_cost,
        credits_used = credits_used + p_cost
    WHERE session_id = p_session_id 
      AND credits_left >= p_cost
    RETURNING credits_left INTO current_credits;
  END IF;
  
  -- Return success/failure
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get job status with credits info
CREATE OR REPLACE FUNCTION get_job_with_credits(
  p_job_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  filename text,
  original_name text,
  file_size bigint,
  pages int,
  status text,
  progress int,
  output_path text,
  error_message text,
  created_at timestamptz,
  credits_left int,
  credits_used int,
  tier text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id,
    j.filename,
    j.original_name,
    j.file_size,
    j.pages,
    j.status,
    j.progress,
    j.output_path,
    j.error_message,
    j.created_at,
    c.credits_left,
    c.credits_used,
    c.tier
  FROM translation_jobs j
  LEFT JOIN (
    SELECT * FROM get_or_create_credits(p_user_id, p_session_id)
  ) c ON true
  WHERE j.id = p_job_id
    AND (
      (p_user_id IS NOT NULL AND j.user_id = p_user_id) OR
      (p_session_id IS NOT NULL AND j.session_id = p_session_id)
    );
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own credits
CREATE POLICY "Users can view own credits" ON user_credits
  FOR ALL USING (
    auth.uid() = user_id OR
    auth.uid() IS NULL  -- Allow anonymous access via session_id in application layer
  );

-- RLS Policy: Users can only see their own jobs
CREATE POLICY "Users can view own jobs" ON translation_jobs
  FOR ALL USING (
    auth.uid() = user_id OR
    auth.uid() IS NULL  -- Allow anonymous access via session_id in application layer
  );

-- RLS Policy: Users can only see chat messages for their jobs
CREATE POLICY "Users can view own chat messages" ON chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM translation_jobs j 
      WHERE j.id = chat_messages.job_id 
        AND (j.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

-- Insert some test data for development
INSERT INTO user_credits (session_id, credits_left, credits_used, tier) 
VALUES ('test-session-1', 20, 0, 'free') 
ON CONFLICT DO NOTHING;

COMMENT ON TABLE user_credits IS 'Tracks credit usage for both anonymous and authenticated users';
COMMENT ON TABLE translation_jobs IS 'Document translation jobs with progress tracking';
COMMENT ON TABLE chat_messages IS 'LLM chat conversations linked to translation jobs';
COMMENT ON FUNCTION get_or_create_credits IS 'Gets existing credits or creates new entry with 20 free credits';
COMMENT ON FUNCTION reserve_credits IS 'Atomically reserves credits for LLM usage';
COMMENT ON FUNCTION get_job_with_credits IS 'Gets job status along with current credit balance';