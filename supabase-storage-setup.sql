-- Supabase Storage Buckets Setup for Document Processing
-- Run this in Supabase SQL Editor

-- Create bucket for user uploaded documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-documents',
  'user-documents',
  false, -- Private bucket
  26214400, -- 25MB limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create bucket for processed/translated documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'processed-documents',
  'processed-documents', 
  true, -- Public bucket for easy sharing
  52428800, -- 50MB limit (translated docs might be larger)
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for user-documents bucket
-- Users can upload to their own folder
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for processed-documents bucket
-- Anyone can view processed documents (public bucket)
CREATE POLICY "Anyone can view processed documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'processed-documents');

-- Only authenticated users can upload processed documents
CREATE POLICY "Authenticated users can upload processed documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'processed-documents');

-- Function to get storage usage for a user
CREATE OR REPLACE FUNCTION get_user_storage_usage(p_user_id UUID)
RETURNS TABLE (
  total_size_bytes BIGINT,
  document_count INTEGER,
  last_upload TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM((metadata->>'size')::BIGINT), 0) as total_size_bytes,
    COUNT(*)::INTEGER as document_count,
    MAX(created_at) as last_upload
  FROM storage.objects
  WHERE bucket_id = 'user-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND owner = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;