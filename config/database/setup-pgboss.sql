-- ============================================
-- PG_BOSS SETUP FOR JOB QUEUE
-- Run this to set up pg_boss tables in Supabase
-- ============================================

-- Create pgboss schema if not exists
CREATE SCHEMA IF NOT EXISTS pgboss;

-- Grant usage on schema
GRANT USAGE ON SCHEMA pgboss TO authenticated;
GRANT USAGE ON SCHEMA pgboss TO service_role;

-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Note: pg_boss will automatically create its tables when initialized
-- The following grants ensure proper access after tables are created

-- Grant permissions on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA pgboss 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA pgboss 
  GRANT SELECT ON TABLES TO authenticated;

-- Create indexes for better performance (after pg_boss creates tables)
-- Run these after first initialization:
/*
CREATE INDEX IF NOT EXISTS pgboss_job_name_idx ON pgboss.job(name);
CREATE INDEX IF NOT EXISTS pgboss_job_priority_created_on_idx ON pgboss.job(priority DESC, createdOn);
CREATE INDEX IF NOT EXISTS pgboss_job_state_idx ON pgboss.job(state);
CREATE INDEX IF NOT EXISTS pgboss_job_created_on_idx ON pgboss.job(createdOn);
*/

-- Create job progress tracking table
CREATE TABLE IF NOT EXISTS public.job_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for job progress
CREATE INDEX IF NOT EXISTS idx_job_progress_user_id ON public.job_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_job_progress_status ON public.job_progress(status);
CREATE INDEX IF NOT EXISTS idx_job_progress_created_at ON public.job_progress(created_at DESC);

-- Enable RLS on job progress
ALTER TABLE public.job_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for job progress
CREATE POLICY "Users can view own job progress" ON public.job_progress
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage job progress" ON public.job_progress
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Function to clean up old job progress
CREATE OR REPLACE FUNCTION public.cleanup_old_job_progress()
RETURNS void AS $$
BEGIN
  DELETE FROM public.job_progress
  WHERE created_at < NOW() - INTERVAL '7 days'
  AND status IN ('completed', 'failed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create scheduled job to clean up old progress (if pg_cron is available)
-- SELECT cron.schedule('cleanup-job-progress', '0 2 * * *', 'SELECT public.cleanup_old_job_progress();');

-- Grant execute permission on cleanup function
GRANT EXECUTE ON FUNCTION public.cleanup_old_job_progress() TO service_role;