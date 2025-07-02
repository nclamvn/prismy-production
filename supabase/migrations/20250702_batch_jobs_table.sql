-- Migration: Batch Jobs Support - Phase 3.5
-- Creates tables and functions for batch job management

-- Create batch_jobs table
CREATE TABLE IF NOT EXISTS batch_jobs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    session_id TEXT,
    user_id UUID REFERENCES auth.users(id),
    org_id UUID,
    
    -- Batch configuration
    file_count INTEGER NOT NULL DEFAULT 0,
    target_language TEXT DEFAULT 'en',
    options JSONB DEFAULT '{}',
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    
    -- Progress tracking
    completed_jobs INTEGER DEFAULT 0,
    failed_jobs INTEGER DEFAULT 0,
    total_progress DECIMAL(5,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Add batch_id to job_queue table for batch association
ALTER TABLE job_queue 
ADD COLUMN IF NOT EXISTS batch_id TEXT REFERENCES batch_jobs(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_batch_jobs_session_id ON batch_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_user_id ON batch_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_org_id ON batch_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON batch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_created_at ON batch_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_job_queue_batch_id ON job_queue(batch_id);

-- RLS Policies for batch_jobs
ALTER TABLE batch_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own batches
CREATE POLICY "Users can view own batches" ON batch_jobs
    FOR SELECT USING (
        auth.uid() = user_id 
        OR session_id = current_setting('request.cookie.session_id', true)
    );

-- Policy: Users can create batches
CREATE POLICY "Users can create batches" ON batch_jobs
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        OR session_id = current_setting('request.cookie.session_id', true)
    );

-- Policy: Users can update their own batches
CREATE POLICY "Users can update own batches" ON batch_jobs
    FOR UPDATE USING (
        auth.uid() = user_id 
        OR session_id = current_setting('request.cookie.session_id', true)
    );

-- Policy: Users can delete their own batches
CREATE POLICY "Users can delete own batches" ON batch_jobs
    FOR DELETE USING (
        auth.uid() = user_id 
        OR session_id = current_setting('request.cookie.session_id', true)
    );

-- Function: Update batch progress when jobs complete
CREATE OR REPLACE FUNCTION update_batch_progress()
RETURNS TRIGGER AS $$
DECLARE
    batch_stats RECORD;
BEGIN
    -- Only process if the job has a batch_id and status changed
    IF NEW.batch_id IS NOT NULL AND (OLD.status IS DISTINCT FROM NEW.status) THEN
        -- Calculate batch statistics
        SELECT 
            COUNT(*) as total_jobs,
            COUNT(*) FILTER (WHERE status = 'completed') as completed,
            COUNT(*) FILTER (WHERE status = 'failed') as failed,
            COUNT(*) FILTER (WHERE status = 'processing') as processing,
            AVG(COALESCE(progress, 0)) as avg_progress
        INTO batch_stats
        FROM job_queue 
        WHERE batch_id = NEW.batch_id;
        
        -- Determine batch status
        DECLARE
            new_batch_status TEXT;
        BEGIN
            IF batch_stats.failed > 0 AND batch_stats.processing = 0 THEN
                new_batch_status := 'failed';
            ELSIF batch_stats.completed = batch_stats.total_jobs THEN
                new_batch_status := 'completed';
            ELSIF batch_stats.processing > 0 OR batch_stats.completed > 0 THEN
                new_batch_status := 'processing';
            ELSE
                new_batch_status := 'pending';
            END IF;
            
            -- Update batch record
            UPDATE batch_jobs 
            SET 
                completed_jobs = batch_stats.completed,
                failed_jobs = batch_stats.failed,
                total_progress = batch_stats.avg_progress,
                status = new_batch_status,
                updated_at = NOW(),
                completed_at = CASE 
                    WHEN new_batch_status IN ('completed', 'failed') 
                    THEN NOW() 
                    ELSE completed_at 
                END
            WHERE id = NEW.batch_id;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update batch progress when job status changes
DROP TRIGGER IF EXISTS trigger_update_batch_progress ON job_queue;
CREATE TRIGGER trigger_update_batch_progress
    AFTER UPDATE OF status, progress ON job_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_batch_progress();

-- Function: Get batch statistics
CREATE OR REPLACE FUNCTION get_batch_statistics(
    p_session_id TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_batch_id TEXT DEFAULT NULL,
    p_time_period TEXT DEFAULT '24 hours'
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_batches', COUNT(*),
        'pending_batches', COUNT(*) FILTER (WHERE status = 'pending'),
        'processing_batches', COUNT(*) FILTER (WHERE status = 'processing'),
        'completed_batches', COUNT(*) FILTER (WHERE status = 'completed'),
        'failed_batches', COUNT(*) FILTER (WHERE status = 'failed'),
        'avg_files_per_batch', AVG(file_count),
        'avg_completion_time', AVG(
            EXTRACT(EPOCH FROM (completed_at - created_at))
        ) FILTER (WHERE completed_at IS NOT NULL),
        'success_rate', CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(*) FILTER (WHERE status = 'completed')::FLOAT / COUNT(*) * 100)
            ELSE 0 
        END
    ) INTO result
    FROM batch_jobs
    WHERE 
        created_at >= NOW() - p_time_period::INTERVAL
        AND (p_session_id IS NULL OR session_id = p_session_id)
        AND (p_user_id IS NULL OR user_id = p_user_id)
        AND (p_batch_id IS NULL OR id = p_batch_id);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function: Get batch details with job breakdown
CREATE OR REPLACE FUNCTION get_batch_details(p_batch_id TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'batch', row_to_json(b.*),
        'jobs', COALESCE(
            json_agg(
                json_build_object(
                    'id', j.id,
                    'type', j.type,
                    'status', j.status,
                    'progress', j.progress,
                    'message', j.progress_message,
                    'created_at', j.created_at,
                    'completed_at', j.completed_at
                ) ORDER BY j.created_at
            ) FILTER (WHERE j.id IS NOT NULL), 
            '[]'::json
        ),
        'statistics', json_build_object(
            'total_jobs', COUNT(j.id),
            'avg_progress', AVG(COALESCE(j.progress, 0)),
            'processing_time', EXTRACT(EPOCH FROM (MAX(j.completed_at) - MIN(j.created_at)))
        )
    ) INTO result
    FROM batch_jobs b
    LEFT JOIN job_queue j ON j.batch_id = b.id
    WHERE b.id = p_batch_id
    GROUP BY b.id, b.name, b.status, b.created_at, b.completed_at, b.file_count, b.target_language, b.options;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Insert some example batch job types
INSERT INTO job_types (name, description, priority) VALUES 
    ('batch-processing', 'Batch file processing job', 5),
    ('batch-finalization', 'Batch completion and cleanup', 8)
ON CONFLICT (name) DO NOTHING;