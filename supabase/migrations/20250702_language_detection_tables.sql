-- =====================================================
-- LANGUAGE DETECTION & TEXT CHUNKING TABLES - Phase 3.3-B
-- Migration: 20250702_language_detection_tables
-- Stores language detection results and LLM-optimized text chunks
-- =====================================================

-- Page language mapping table - stores detected languages per page
CREATE TABLE IF NOT EXISTS page_language_maps (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           uuid NOT NULL REFERENCES job_queue(id) ON DELETE CASCADE,
  page_number      int NOT NULL,
  detected_language jsonb NOT NULL,
  alternative_languages jsonb DEFAULT '[]',
  chunk_count      int DEFAULT 0,
  total_tokens     int DEFAULT 0,
  text_length      int DEFAULT 0,
  confidence_score numeric(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at       timestamptz DEFAULT now(),
  
  -- Ensure unique page numbers per job
  UNIQUE(job_id, page_number),
  
  -- Ensure valid page numbers
  CONSTRAINT valid_page_number CHECK (page_number > 0),
  CONSTRAINT valid_chunk_count CHECK (chunk_count >= 0),
  CONSTRAINT valid_token_count CHECK (total_tokens >= 0)
);

-- Text chunks table - stores LLM-optimized text chunks for translation
CREATE TABLE IF NOT EXISTS text_chunks (
  id               text PRIMARY KEY, -- Custom ID like 'chunk-123'
  job_id           uuid NOT NULL REFERENCES job_queue(id) ON DELETE CASCADE,
  page_number      int NOT NULL,
  chunk_index      int NOT NULL,
  text             text NOT NULL,
  token_count      int NOT NULL CHECK (token_count > 0),
  language         jsonb NOT NULL,
  start_position   int NOT NULL CHECK (start_position >= 0),
  end_position     int NOT NULL CHECK (end_position > start_position),
  overlap_start    int,
  overlap_end      int,
  translation_status text DEFAULT 'pending' CHECK (translation_status IN ('pending', 'processing', 'completed', 'failed')),
  translated_text  text,
  translation_tokens int,
  translation_model text,
  translation_confidence numeric(5,4),
  created_at       timestamptz DEFAULT now(),
  translated_at    timestamptz,
  
  -- Ensure unique chunks per job and page
  UNIQUE(job_id, page_number, chunk_index),
  
  -- Ensure valid positions
  CONSTRAINT valid_positions CHECK (end_position > start_position),
  CONSTRAINT valid_overlap CHECK (
    (overlap_start IS NULL AND overlap_end IS NULL) OR
    (overlap_start IS NOT NULL AND overlap_end IS NOT NULL AND overlap_end > overlap_start)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS page_language_maps_job_id_idx ON page_language_maps(job_id);
CREATE INDEX IF NOT EXISTS page_language_maps_page_number_idx ON page_language_maps(job_id, page_number);
CREATE INDEX IF NOT EXISTS page_language_maps_language_idx ON page_language_maps USING gin(detected_language);
CREATE INDEX IF NOT EXISTS page_language_maps_confidence_idx ON page_language_maps(confidence_score DESC);

CREATE INDEX IF NOT EXISTS text_chunks_job_id_idx ON text_chunks(job_id);
CREATE INDEX IF NOT EXISTS text_chunks_page_idx ON text_chunks(job_id, page_number);
CREATE INDEX IF NOT EXISTS text_chunks_status_idx ON text_chunks(translation_status);
CREATE INDEX IF NOT EXISTS text_chunks_language_idx ON text_chunks USING gin(language);
CREATE INDEX IF NOT EXISTS text_chunks_token_count_idx ON text_chunks(token_count);
CREATE INDEX IF NOT EXISTS text_chunks_translation_idx ON text_chunks(translation_status, created_at);

-- Full-text search on chunk text
CREATE INDEX IF NOT EXISTS text_chunks_text_search_idx ON text_chunks USING gin(to_tsvector('english', text));

-- RLS Policies
ALTER TABLE page_language_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own language maps" ON page_language_maps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM job_queue jq 
      WHERE jq.id = page_language_maps.job_id 
        AND (jq.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

CREATE POLICY "Users can view own text chunks" ON text_chunks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM job_queue jq 
      WHERE jq.id = text_chunks.job_id 
        AND (jq.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

-- Function to get language detection summary for a job
CREATE OR REPLACE FUNCTION get_language_summary(p_job_id uuid)
RETURNS TABLE(
  total_pages bigint,
  primary_language text,
  language_distribution jsonb,
  avg_confidence numeric,
  total_chunks bigint,
  total_tokens bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH language_stats AS (
    SELECT 
      COUNT(*) as page_count,
      plm.detected_language->>'code' as lang_code,
      plm.detected_language->>'name' as lang_name,
      AVG(plm.confidence_score) as avg_conf,
      SUM(plm.chunk_count) as chunks,
      SUM(plm.total_tokens) as tokens
    FROM page_language_maps plm
    WHERE plm.job_id = p_job_id
    GROUP BY plm.detected_language->>'code', plm.detected_language->>'name'
  ),
  primary_lang AS (
    SELECT lang_code, lang_name
    FROM language_stats
    ORDER BY page_count DESC, avg_conf DESC
    LIMIT 1
  )
  SELECT 
    (SELECT COUNT(*) FROM page_language_maps WHERE job_id = p_job_id) as total_pages,
    (SELECT COALESCE(lang_name, 'Unknown') FROM primary_lang) as primary_language,
    (SELECT jsonb_object_agg(lang_code, page_count) FROM language_stats) as language_distribution,
    (SELECT ROUND(AVG(confidence_score), 4) FROM page_language_maps WHERE job_id = p_job_id) as avg_confidence,
    (SELECT SUM(chunk_count) FROM page_language_maps WHERE job_id = p_job_id) as total_chunks,
    (SELECT SUM(total_tokens) FROM page_language_maps WHERE job_id = p_job_id) as total_tokens;
END;
$$ LANGUAGE plpgsql;

-- Function to get chunks ready for translation
CREATE OR REPLACE FUNCTION get_chunks_for_translation(
  p_job_id uuid,
  p_language_code text DEFAULT NULL,
  p_limit int DEFAULT 10
)
RETURNS TABLE(
  chunk_id text,
  page_number int,
  chunk_index int,
  text text,
  token_count int,
  language_code text,
  language_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.id,
    tc.page_number,
    tc.chunk_index,
    tc.text,
    tc.token_count,
    tc.language->>'code' as language_code,
    tc.language->>'name' as language_name
  FROM text_chunks tc
  WHERE tc.job_id = p_job_id
    AND tc.translation_status = 'pending'
    AND (p_language_code IS NULL OR tc.language->>'code' = p_language_code)
  ORDER BY tc.page_number ASC, tc.chunk_index ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to update chunk translation status
CREATE OR REPLACE FUNCTION update_chunk_translation(
  p_chunk_id text,
  p_status text,
  p_translated_text text DEFAULT NULL,
  p_translation_tokens int DEFAULT NULL,
  p_model text DEFAULT NULL,
  p_confidence numeric DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  UPDATE text_chunks 
  SET 
    translation_status = p_status,
    translated_text = COALESCE(p_translated_text, translated_text),
    translation_tokens = COALESCE(p_translation_tokens, translation_tokens),
    translation_model = COALESCE(p_model, translation_model),
    translation_confidence = COALESCE(p_confidence, translation_confidence),
    translated_at = CASE 
      WHEN p_status = 'completed' THEN now()
      ELSE translated_at
    END
  WHERE id = p_chunk_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get translation progress for a job
CREATE OR REPLACE FUNCTION get_translation_progress(p_job_id uuid)
RETURNS TABLE(
  total_chunks bigint,
  pending_chunks bigint,
  processing_chunks bigint,
  completed_chunks bigint,
  failed_chunks bigint,
  progress_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH chunk_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE translation_status = 'pending') as pending,
      COUNT(*) FILTER (WHERE translation_status = 'processing') as processing,
      COUNT(*) FILTER (WHERE translation_status = 'completed') as completed,
      COUNT(*) FILTER (WHERE translation_status = 'failed') as failed
    FROM text_chunks
    WHERE job_id = p_job_id
  )
  SELECT 
    cs.total,
    cs.pending,
    cs.processing,
    cs.completed,
    cs.failed,
    CASE 
      WHEN cs.total > 0 
      THEN ROUND((cs.completed::numeric / cs.total::numeric) * 100, 2)
      ELSE 0
    END as progress_percentage
  FROM chunk_stats cs;
END;
$$ LANGUAGE plpgsql;

-- Update job queue to track language detection completion
ALTER TABLE job_queue 
ADD COLUMN IF NOT EXISTS lang_detection_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS primary_language text,
ADD COLUMN IF NOT EXISTS total_chunks int DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_tokens int DEFAULT 0;

-- Trigger to update job language stats when language maps are inserted
CREATE OR REPLACE FUNCTION update_job_language_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update job queue with language detection stats
  WITH language_summary AS (
    SELECT 
      plm.detected_language->>'name' as primary_lang,
      SUM(plm.chunk_count) as total_chunks,
      SUM(plm.total_tokens) as total_tokens,
      COUNT(*) as total_pages
    FROM page_language_maps plm
    WHERE plm.job_id = NEW.job_id
    GROUP BY plm.detected_language->>'code', plm.detected_language->>'name'
    ORDER BY COUNT(*) DESC, AVG(plm.confidence_score) DESC
    LIMIT 1
  )
  UPDATE job_queue jq
  SET 
    primary_language = ls.primary_lang,
    total_chunks = ls.total_chunks,
    total_tokens = ls.total_tokens,
    lang_detection_completed_at = CASE 
      WHEN (SELECT COUNT(*) FROM page_language_maps WHERE job_id = NEW.job_id) = 
           (SELECT COALESCE((payload->>'totalPages')::int, 1) FROM job_queue WHERE id = NEW.job_id)
      THEN now()
      ELSE lang_detection_completed_at
    END,
    updated_at = now()
  FROM language_summary ls
  WHERE jq.id = NEW.job_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER page_language_maps_update_job_stats
  AFTER INSERT ON page_language_maps
  FOR EACH ROW
  EXECUTE FUNCTION update_job_language_stats();

-- Add language detection dependencies
INSERT INTO job_dependencies (job_id, depends_on_job_id) VALUES 
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE page_language_maps IS 'Language detection results per document page';
COMMENT ON TABLE text_chunks IS 'LLM-optimized text chunks for translation processing';
COMMENT ON FUNCTION get_language_summary IS 'Get language detection summary for a job';
COMMENT ON FUNCTION get_chunks_for_translation IS 'Get text chunks ready for translation';
COMMENT ON FUNCTION update_chunk_translation IS 'Update chunk translation status and results';
COMMENT ON FUNCTION get_translation_progress IS 'Get translation progress statistics for a job';

-- Example queries for development
/*
-- Get language summary for a job
SELECT * FROM get_language_summary('job-uuid-here');

-- Get chunks ready for translation
SELECT * FROM get_chunks_for_translation('job-uuid-here', 'en', 5);

-- Update chunk translation
SELECT update_chunk_translation('chunk-123', 'completed', 'Translated text here', 150, 'gpt-4o', 0.95);

-- Get translation progress
SELECT * FROM get_translation_progress('job-uuid-here');

-- Find jobs by primary language
SELECT id, primary_language, total_chunks, total_tokens
FROM job_queue 
WHERE primary_language = 'English' 
AND lang_detection_completed_at IS NOT NULL;
*/