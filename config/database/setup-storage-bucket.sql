-- Setup Supabase Storage Bucket for Document Processing
-- Run this in your Supabase SQL Editor

-- Create the processed-documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'processed-documents',
  'processed-documents', 
  true, -- Set to true for public access to translated documents
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/html']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the bucket
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload documents" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'processed-documents');

-- Allow authenticated users to read their own files
CREATE POLICY "Users can read their own documents" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'processed-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to translated documents
CREATE POLICY "Public can read translated documents" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'processed-documents' AND storage.foldername(name)[1] = 'translated');

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own documents" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'processed-documents' AND auth.uid()::text = (storage.foldername(name))[1]);