-- =====================================================
-- OCR PAGES TABLE - Phase 3.3-A
-- Migration: 20250702_ocr_pages_table
-- Stores OCR text extraction and layout data per page
-- =====================================================

-- OCR pages table - stores extracted text and layout per document page
CREATE TABLE IF NOT EXISTS ocr_pages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           uuid NOT NULL REFERENCES job_queue(id) ON DELETE CASCADE,
  page_number      int NOT NULL,
  text             text NOT NULL,
  confidence       numeric(5,2) CHECK (confidence >= 0 AND confidence <= 100),
  layout           jsonb NOT NULL DEFAULT '{}',
  processing_time_ms int,
  created_at       timestamptz DEFAULT now(),
  
  -- Ensure unique page numbers per job
  UNIQUE(job_id, page_number),
  
  -- Ensure valid page numbers
  CONSTRAINT valid_page_number CHECK (page_number > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS ocr_pages_job_id_idx ON ocr_pages(job_id);
CREATE INDEX IF NOT EXISTS ocr_pages_page_number_idx ON ocr_pages(job_id, page_number);
CREATE INDEX IF NOT EXISTS ocr_pages_confidence_idx ON ocr_pages(confidence);
CREATE INDEX IF NOT EXISTS ocr_pages_created_at_idx ON ocr_pages(created_at DESC);

-- Full-text search index on extracted text
CREATE INDEX IF NOT EXISTS ocr_pages_text_search_idx ON ocr_pages USING gin(to_tsvector('english', text));

-- GiST index for layout JSON queries
CREATE INDEX IF NOT EXISTS ocr_pages_layout_idx ON ocr_pages USING gin(layout);

-- RLS Policy: Users can only access OCR data for their jobs
ALTER TABLE ocr_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own OCR pages" ON ocr_pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM job_queue jq 
      WHERE jq.id = ocr_pages.job_id 
        AND (jq.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

-- Function to get OCR summary for a job
CREATE OR REPLACE FUNCTION get_ocr_summary(p_job_id uuid)
RETURNS TABLE(
  total_pages bigint,
  avg_confidence numeric,
  total_words bigint,
  processing_time_ms bigint,
  text_preview text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_pages,
    ROUND(AVG(op.confidence), 2) as avg_confidence,
    SUM(array_length(string_to_array(op.text, ' '), 1)) as total_words,
    SUM(op.processing_time_ms) as processing_time_ms,
    SUBSTRING(string_agg(op.text, ' ' ORDER BY op.page_number), 1, 500) as text_preview
  FROM ocr_pages op
  WHERE op.job_id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- Function to search OCR text across all pages of a job
CREATE OR REPLACE FUNCTION search_ocr_text(
  p_job_id uuid,
  p_search_query text,
  p_limit int DEFAULT 10
)
RETURNS TABLE(
  page_number int,
  text_snippet text,
  confidence numeric,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    op.page_number,
    ts_headline('english', op.text, plainto_tsquery('english', p_search_query)) as text_snippet,
    op.confidence,
    ts_rank(to_tsvector('english', op.text), plainto_tsquery('english', p_search_query)) as rank
  FROM ocr_pages op
  WHERE op.job_id = p_job_id
    AND to_tsvector('english', op.text) @@ plainto_tsquery('english', p_search_query)
  ORDER BY rank DESC, op.page_number ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get OCR layout data for a specific page
CREATE OR REPLACE FUNCTION get_page_layout(
  p_job_id uuid,
  p_page_number int
)
RETURNS TABLE(
  page_number int,
  text text,
  confidence numeric,
  words jsonb,
  lines jsonb,
  paragraphs jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    op.page_number,
    op.text,
    op.confidence,
    op.layout->'words' as words,
    op.layout->'lines' as lines,
    op.layout->'paragraphs' as paragraphs
  FROM ocr_pages op
  WHERE op.job_id = p_job_id
    AND op.page_number = p_page_number;
END;
$$ LANGUAGE plpgsql;

-- Update job queue to track OCR completion
ALTER TABLE job_queue 
ADD COLUMN IF NOT EXISTS ocr_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS ocr_page_count int DEFAULT 0,
ADD COLUMN IF NOT EXISTS ocr_avg_confidence numeric(5,2);

-- Trigger to update job OCR stats when pages are inserted
CREATE OR REPLACE FUNCTION update_job_ocr_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update job queue with OCR completion stats
  UPDATE job_queue 
  SET 
    ocr_page_count = (
      SELECT COUNT(*) 
      FROM ocr_pages 
      WHERE job_id = NEW.job_id
    ),
    ocr_avg_confidence = (
      SELECT ROUND(AVG(confidence), 2) 
      FROM ocr_pages 
      WHERE job_id = NEW.job_id
    ),
    ocr_completed_at = CASE 
      WHEN (SELECT COUNT(*) FROM ocr_pages WHERE job_id = NEW.job_id) = 
           (SELECT COALESCE((payload->>'totalPages')::int, 1) FROM job_queue WHERE id = NEW.job_id)
      THEN now()
      ELSE ocr_completed_at
    END,
    updated_at = now()
  WHERE id = NEW.job_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ocr_pages_update_job_stats
  AFTER INSERT ON ocr_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_job_ocr_stats();

COMMENT ON TABLE ocr_pages IS 'OCR extracted text and layout data per document page';
COMMENT ON FUNCTION get_ocr_summary IS 'Get OCR processing summary for a job';
COMMENT ON FUNCTION search_ocr_text IS 'Full-text search across OCR extracted text';
COMMENT ON FUNCTION get_page_layout IS 'Get detailed layout data for a specific page';

-- Example queries for development
/*
-- Get OCR summary for a job
SELECT * FROM get_ocr_summary('job-uuid-here');

-- Search for text across all pages
SELECT * FROM search_ocr_text('job-uuid-here', 'important document text');

-- Get layout data for page 1
SELECT * FROM get_page_layout('job-uuid-here', 1);

-- Get all pages with confidence below 80%
SELECT job_id, page_number, confidence, substring(text, 1, 100) as preview
FROM ocr_pages 
WHERE confidence < 80 
ORDER BY confidence ASC;
*/