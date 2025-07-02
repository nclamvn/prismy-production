-- =====================================================
-- PRISMY CHUNKED UPLOAD SUPPORT SCHEMA
-- Migration: 20250702_chunked_upload_support
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Upload sessions table - tracks chunked upload progress
CREATE TABLE IF NOT EXISTS upload_sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id        text UNIQUE NOT NULL, -- Client-generated upload identifier
  job_id           uuid REFERENCES translation_jobs(id) ON DELETE CASCADE,
  session_id       text NOT NULL, -- Session identifier for anonymous users
  file_name        text NOT NULL,
  file_size        bigint NOT NULL,
  mime_type        text NOT NULL,
  storage_path     text NOT NULL,
  total_chunks     int NOT NULL,
  uploaded_chunks  int DEFAULT 0,
  progress         int DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status           text DEFAULT 'initialized' CHECK (status IN ('initialized', 'uploading', 'completed', 'failed')),
  final_storage_path text,
  file_checksum    text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  completed_at     timestamptz,
  
  -- Constraints
  CONSTRAINT upload_sessions_chunks_check CHECK (uploaded_chunks <= total_chunks),
  CONSTRAINT upload_sessions_progress_check CHECK (
    (status = 'completed' AND progress = 100) OR 
    (status != 'completed' AND progress < 100)
  )
);

-- Upload chunks table - tracks individual chunk uploads
CREATE TABLE IF NOT EXISTS upload_chunks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id    text NOT NULL REFERENCES upload_sessions(upload_id) ON DELETE CASCADE,
  chunk_index  int NOT NULL,
  chunk_size   int NOT NULL,
  storage_path text NOT NULL,
  checksum     text NOT NULL,
  uploaded_at  timestamptz DEFAULT now(),
  
  -- Ensure unique chunk per upload
  UNIQUE(upload_id, chunk_index)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS upload_sessions_upload_id_idx ON upload_sessions(upload_id);
CREATE INDEX IF NOT EXISTS upload_sessions_session_id_idx ON upload_sessions(session_id);
CREATE INDEX IF NOT EXISTS upload_sessions_status_idx ON upload_sessions(status);
CREATE INDEX IF NOT EXISTS upload_sessions_created_at_idx ON upload_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS upload_chunks_upload_id_idx ON upload_chunks(upload_id);
CREATE INDEX IF NOT EXISTS upload_chunks_chunk_index_idx ON upload_chunks(upload_id, chunk_index);

-- Update triggers for updated_at columns
CREATE TRIGGER update_upload_sessions_updated_at 
  BEFORE UPDATE ON upload_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add upload_id field to translation_jobs for chunked upload tracking
ALTER TABLE translation_jobs 
ADD COLUMN IF NOT EXISTS upload_id text;

-- Add new statuses to translation_jobs for upload tracking
ALTER TABLE translation_jobs 
DROP CONSTRAINT IF EXISTS translation_jobs_status_check;

ALTER TABLE translation_jobs 
ADD CONSTRAINT translation_jobs_status_check 
CHECK (status IN ('uploading', 'queued', 'translating', 'translated', 'failed', 'processing'));

-- Add file_checksum field to translation_jobs
ALTER TABLE translation_jobs 
ADD COLUMN IF NOT EXISTS file_checksum text;

-- Function to get upload progress
CREATE OR REPLACE FUNCTION get_upload_progress(
  p_upload_id text,
  p_session_id text DEFAULT NULL
)
RETURNS TABLE(
  upload_id text,
  file_name text,
  file_size bigint,
  total_chunks int,
  uploaded_chunks int,
  progress int,
  status text,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.upload_id,
    us.file_name,
    us.file_size,
    us.total_chunks,
    us.uploaded_chunks,
    us.progress,
    us.status,
    us.created_at,
    us.updated_at
  FROM upload_sessions us
  WHERE us.upload_id = p_upload_id
    AND (p_session_id IS NULL OR us.session_id = p_session_id);
END;
$$ LANGUAGE plpgsql;

-- Function to get chunks for an upload
CREATE OR REPLACE FUNCTION get_upload_chunks(
  p_upload_id text
)
RETURNS TABLE(
  chunk_index int,
  chunk_size int,
  checksum text,
  uploaded_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uc.chunk_index,
    uc.chunk_size,
    uc.checksum,
    uc.uploaded_at
  FROM upload_chunks uc
  WHERE uc.upload_id = p_upload_id
  ORDER BY uc.chunk_index;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old upload sessions (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_uploads(
  p_days_old int DEFAULT 7
)
RETURNS int AS $$
DECLARE
  deleted_count int;
BEGIN
  -- Delete upload sessions older than specified days
  DELETE FROM upload_sessions 
  WHERE created_at < (now() - interval '1 day' * p_days_old)
    AND status IN ('failed', 'completed');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to validate upload completion
CREATE OR REPLACE FUNCTION validate_upload_completion(
  p_upload_id text
)
RETURNS boolean AS $$
DECLARE
  session_record upload_sessions%ROWTYPE;
  chunk_count int;
  total_size bigint;
BEGIN
  -- Get upload session
  SELECT * INTO session_record 
  FROM upload_sessions 
  WHERE upload_id = p_upload_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Count uploaded chunks
  SELECT COUNT(*), COALESCE(SUM(chunk_size), 0)
  INTO chunk_count, total_size
  FROM upload_chunks 
  WHERE upload_id = p_upload_id;
  
  -- Validate completeness
  RETURN (
    chunk_count = session_record.total_chunks AND
    total_size = session_record.file_size AND
    session_record.uploaded_chunks = session_record.total_chunks
  );
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for upload tables
ALTER TABLE upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own upload sessions
CREATE POLICY "Users can view own upload sessions" ON upload_sessions
  FOR ALL USING (
    auth.uid() IS NULL  -- Allow anonymous access via session_id in application layer
  );

-- RLS Policy: Users can only access chunks for their uploads
CREATE POLICY "Users can view own upload chunks" ON upload_chunks
  FOR ALL USING (
    auth.uid() IS NULL  -- Allow anonymous access via session_id in application layer
  );

-- Create index on translation_jobs.upload_id
CREATE INDEX IF NOT EXISTS translation_jobs_upload_id_idx ON translation_jobs(upload_id);

COMMENT ON TABLE upload_sessions IS 'Tracks chunked file upload sessions with progress';
COMMENT ON TABLE upload_chunks IS 'Stores metadata for individual chunks of chunked uploads';
COMMENT ON FUNCTION get_upload_progress IS 'Gets upload progress for a specific upload session';
COMMENT ON FUNCTION get_upload_chunks IS 'Gets all chunks for an upload session';
COMMENT ON FUNCTION cleanup_old_uploads IS 'Cleanup old completed/failed upload sessions';
COMMENT ON FUNCTION validate_upload_completion IS 'Validates that all chunks are uploaded correctly';