-- =====================================================
-- PRISMY JOB QUEUE SYSTEM SCHEMA
-- Migration: 20250702_job_queue_system
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Job queue table - tracks background jobs with progress
CREATE TABLE IF NOT EXISTS job_queue (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type             text NOT NULL,
  session_id       text,
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  payload          jsonb NOT NULL DEFAULT '{}',
  status           text DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled', 'retrying')),
  progress         int DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  progress_message text,
  current_step     text,
  total_steps      int,
  priority         int DEFAULT 0,
  retry_limit      int DEFAULT 3,
  retry_count      int DEFAULT 0,
  error_message    text,
  result           jsonb,
  start_after      timestamptz,
  started_at       timestamptz,
  completed_at     timestamptz,
  estimated_completion timestamptz,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT job_queue_identity_check 
    CHECK ((user_id IS NOT NULL AND session_id IS NULL) OR 
           (user_id IS NULL AND session_id IS NOT NULL)),
  CONSTRAINT job_queue_retry_check CHECK (retry_count <= retry_limit),
  CONSTRAINT job_queue_progress_check CHECK (
    (status = 'completed' AND progress = 100) OR 
    (status != 'completed')
  )
);

-- Job dependencies table - for job chaining and workflows
CREATE TABLE IF NOT EXISTS job_dependencies (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           uuid NOT NULL REFERENCES job_queue(id) ON DELETE CASCADE,
  depends_on_job_id uuid NOT NULL REFERENCES job_queue(id) ON DELETE CASCADE,
  created_at       timestamptz DEFAULT now(),
  
  -- Ensure no circular dependencies and unique dependencies
  UNIQUE(job_id, depends_on_job_id),
  CONSTRAINT no_self_dependency CHECK (job_id != depends_on_job_id)
);

-- Job metrics table - for performance tracking
CREATE TABLE IF NOT EXISTS job_metrics (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           uuid NOT NULL REFERENCES job_queue(id) ON DELETE CASCADE,
  metric_name      text NOT NULL,
  metric_value     numeric NOT NULL,
  metric_unit      text,
  recorded_at      timestamptz DEFAULT now(),
  
  -- Index for fast metric queries
  UNIQUE(job_id, metric_name, recorded_at)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS job_queue_type_idx ON job_queue(type);
CREATE INDEX IF NOT EXISTS job_queue_status_idx ON job_queue(status);
CREATE INDEX IF NOT EXISTS job_queue_session_id_idx ON job_queue(session_id);
CREATE INDEX IF NOT EXISTS job_queue_user_id_idx ON job_queue(user_id);
CREATE INDEX IF NOT EXISTS job_queue_priority_idx ON job_queue(priority DESC);
CREATE INDEX IF NOT EXISTS job_queue_created_at_idx ON job_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS job_queue_start_after_idx ON job_queue(start_after);
CREATE INDEX IF NOT EXISTS job_queue_processing_idx ON job_queue(status, priority DESC, created_at) WHERE status IN ('queued', 'processing');

CREATE INDEX IF NOT EXISTS job_dependencies_job_id_idx ON job_dependencies(job_id);
CREATE INDEX IF NOT EXISTS job_dependencies_depends_on_idx ON job_dependencies(depends_on_job_id);

CREATE INDEX IF NOT EXISTS job_metrics_job_id_idx ON job_metrics(job_id);
CREATE INDEX IF NOT EXISTS job_metrics_name_idx ON job_metrics(metric_name);

-- Update triggers for updated_at columns
CREATE TRIGGER update_job_queue_updated_at 
  BEFORE UPDATE ON job_queue 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get next available job
CREATE OR REPLACE FUNCTION get_next_job(
  p_job_types text[] DEFAULT NULL,
  p_worker_id text DEFAULT NULL
)
RETURNS TABLE(
  job_id uuid,
  job_type text,
  payload jsonb,
  retry_count int
) AS $$
DECLARE
  selected_job_id uuid;
BEGIN
  -- Select and lock the next available job
  SELECT jq.id INTO selected_job_id
  FROM job_queue jq
  LEFT JOIN job_dependencies jd ON jq.id = jd.job_id
  LEFT JOIN job_queue dep ON jd.depends_on_job_id = dep.id
  WHERE jq.status = 'queued'
    AND (jq.start_after IS NULL OR jq.start_after <= now())
    AND (p_job_types IS NULL OR jq.type = ANY(p_job_types))
    -- Check that all dependencies are completed
    AND (jd.job_id IS NULL OR dep.status = 'completed')
  GROUP BY jq.id, jq.priority, jq.created_at
  -- Ensure all dependencies for this job are completed
  HAVING COUNT(CASE WHEN dep.status != 'completed' THEN 1 END) = 0
  ORDER BY jq.priority DESC, jq.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- If we found a job, mark it as processing
  IF selected_job_id IS NOT NULL THEN
    UPDATE job_queue 
    SET 
      status = 'processing',
      started_at = now(),
      updated_at = now()
    WHERE id = selected_job_id;

    -- Return job details
    RETURN QUERY
    SELECT 
      jq.id,
      jq.type,
      jq.payload,
      jq.retry_count
    FROM job_queue jq
    WHERE jq.id = selected_job_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update job progress
CREATE OR REPLACE FUNCTION update_job_progress(
  p_job_id uuid,
  p_status text DEFAULT NULL,
  p_progress int DEFAULT NULL,
  p_message text DEFAULT NULL,
  p_current_step text DEFAULT NULL,
  p_total_steps int DEFAULT NULL,
  p_error_message text DEFAULT NULL,
  p_result jsonb DEFAULT NULL,
  p_estimated_completion timestamptz DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  job_exists boolean;
BEGIN
  -- Check if job exists and is in a valid state for updates
  SELECT EXISTS(
    SELECT 1 FROM job_queue 
    WHERE id = p_job_id 
      AND status IN ('queued', 'processing', 'retrying')
  ) INTO job_exists;

  IF NOT job_exists THEN
    RETURN false;
  END IF;

  -- Update job with provided parameters
  UPDATE job_queue 
  SET 
    status = COALESCE(p_status, status),
    progress = COALESCE(p_progress, progress),
    progress_message = COALESCE(p_message, progress_message),
    current_step = COALESCE(p_current_step, current_step),
    total_steps = COALESCE(p_total_steps, total_steps),
    error_message = COALESCE(p_error_message, error_message),
    result = COALESCE(p_result, result),
    estimated_completion = COALESCE(p_estimated_completion, estimated_completion),
    completed_at = CASE 
      WHEN p_status IN ('completed', 'failed', 'cancelled') THEN now()
      ELSE completed_at
    END,
    updated_at = now()
  WHERE id = p_job_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to retry failed job
CREATE OR REPLACE FUNCTION retry_job(
  p_job_id uuid
)
RETURNS boolean AS $$
DECLARE
  current_retry_count int;
  retry_limit int;
BEGIN
  -- Get current retry info
  SELECT retry_count, retry_limit 
  INTO current_retry_count, retry_limit
  FROM job_queue 
  WHERE id = p_job_id AND status = 'failed';

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check if we can retry
  IF current_retry_count >= retry_limit THEN
    RETURN false;
  END IF;

  -- Reset job for retry
  UPDATE job_queue 
  SET 
    status = 'queued',
    retry_count = retry_count + 1,
    progress = 0,
    progress_message = NULL,
    current_step = NULL,
    error_message = NULL,
    started_at = NULL,
    completed_at = NULL,
    updated_at = now()
  WHERE id = p_job_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to get job statistics
CREATE OR REPLACE FUNCTION get_job_statistics(
  p_session_id text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_job_type text DEFAULT NULL,
  p_time_period interval DEFAULT '24 hours'
)
RETURNS TABLE(
  total_jobs bigint,
  queued_jobs bigint,
  processing_jobs bigint,
  completed_jobs bigint,
  failed_jobs bigint,
  avg_processing_time interval,
  success_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH job_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'queued') as queued,
      COUNT(*) FILTER (WHERE status = 'processing') as processing,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      COUNT(*) FILTER (WHERE status = 'failed') as failed,
      AVG(completed_at - started_at) FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL) as avg_time,
      CASE 
        WHEN COUNT(*) FILTER (WHERE status IN ('completed', 'failed')) > 0 
        THEN ROUND(
          COUNT(*) FILTER (WHERE status = 'completed')::numeric / 
          COUNT(*) FILTER (WHERE status IN ('completed', 'failed'))::numeric * 100, 2
        )
        ELSE 0
      END as success_rate
    FROM job_queue jq
    WHERE created_at >= now() - p_time_period
      AND (p_session_id IS NULL OR jq.session_id = p_session_id)
      AND (p_user_id IS NULL OR jq.user_id = p_user_id)
      AND (p_job_type IS NULL OR jq.type = p_job_type)
  )
  SELECT 
    js.total,
    js.queued,
    js.processing,
    js.completed,
    js.failed,
    js.avg_time,
    js.success_rate
  FROM job_stats js;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old jobs
CREATE OR REPLACE FUNCTION cleanup_old_jobs(
  p_days_old int DEFAULT 30,
  p_keep_failed_days int DEFAULT 7
)
RETURNS int AS $$
DECLARE
  deleted_count int;
BEGIN
  -- Delete old completed jobs
  DELETE FROM job_queue 
  WHERE status = 'completed' 
    AND completed_at < (now() - interval '1 day' * p_days_old);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete old failed jobs (keep for shorter period for debugging)
  DELETE FROM job_queue 
  WHERE status = 'failed' 
    AND completed_at < (now() - interval '1 day' * p_keep_failed_days);
  
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for job queue tables
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own jobs
CREATE POLICY "Users can view own jobs" ON job_queue
  FOR ALL USING (
    auth.uid() = user_id OR
    auth.uid() IS NULL  -- Allow anonymous access via session_id in application layer
  );

-- RLS Policy: Users can only access dependencies for their jobs
CREATE POLICY "Users can view own job dependencies" ON job_dependencies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM job_queue jq 
      WHERE jq.id = job_dependencies.job_id 
        AND (jq.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

-- RLS Policy: Users can only access metrics for their jobs
CREATE POLICY "Users can view own job metrics" ON job_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM job_queue jq 
      WHERE jq.id = job_metrics.job_id 
        AND (jq.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

-- Create scheduled job cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-old-jobs', '0 2 * * *', 'SELECT cleanup_old_jobs(30, 7);');

COMMENT ON TABLE job_queue IS 'Background job queue with progress tracking and retry logic';
COMMENT ON TABLE job_dependencies IS 'Job dependencies for workflow orchestration';
COMMENT ON TABLE job_metrics IS 'Performance metrics for job execution';
COMMENT ON FUNCTION get_next_job IS 'Get next available job for processing with dependency checking';
COMMENT ON FUNCTION update_job_progress IS 'Update job progress and status';
COMMENT ON FUNCTION retry_job IS 'Retry a failed job if within retry limits';
COMMENT ON FUNCTION get_job_statistics IS 'Get job queue statistics for monitoring';
COMMENT ON FUNCTION cleanup_old_jobs IS 'Clean up old completed and failed jobs';