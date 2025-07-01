-- ===========================================
-- PRISMY COMPLETE DATABASE SETUP SCRIPT
-- ===========================================
-- Run this script in Supabase SQL Editor to setup everything at once
-- 
-- Order of execution:
-- 1. Basic tables and auth
-- 2. Credit and invitation system  
-- 3. Storage buckets and policies
-- ===========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- PART 1: BASIC TABLES & AUTH (from supabase-setup.sql)
-- ===========================================

-- Users table to extend Supabase auth
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'trial' CHECK (role IN ('admin', 'trial', 'paid')),
  trial_credits INTEGER DEFAULT 15000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, role, trial_credits)
  VALUES (NEW.id, NEW.email, 'trial', 15000);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile automatically
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- ===========================================
-- PART 2: CREDIT & INVITATION SYSTEM
-- ===========================================

-- Invitation codes table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  is_active BOOLEAN DEFAULT TRUE
);

-- Credit transactions table
CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  change INTEGER NOT NULL, -- Positive for add, negative for deduct
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  task_id UUID -- Optional reference to tasks table
);

-- Tasks table for tracking work
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('translate', 'summarize', 'qa')),
  cost INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'error')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS on all tables
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitations
CREATE POLICY "Admin can manage invitations" ON invitations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Anyone can view active invitations" ON invitations
  FOR SELECT TO authenticated
  USING (is_active = true AND expires_at > NOW());

-- RLS Policies for credits
CREATE POLICY "Users can view own credits" ON credits
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin can view all credits" ON credits
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- RLS Policies for tasks
CREATE POLICY "Users can view own tasks" ON tasks
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin can view all tasks" ON tasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- ===========================================
-- PART 3: UTILITY FUNCTIONS
-- ===========================================

-- Function to get user's current credit balance
CREATE OR REPLACE FUNCTION get_user_credit_balance(p_user_id UUID)
RETURNS TABLE (balance INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(SUM(change), 0)::INTEGER as balance
  FROM credits
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to redeem invitation code
CREATE OR REPLACE FUNCTION redeem_invitation_code(
  p_code TEXT,
  p_user_id UUID,
  p_credit_amount INTEGER DEFAULT 15000
)
RETURNS BOOLEAN AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Check if invitation exists and is valid
  SELECT * INTO invitation_record
  FROM invitations
  WHERE code = p_code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND current_uses < max_uses;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user already redeemed this code
  IF EXISTS (
    SELECT 1 FROM credits
    WHERE user_id = p_user_id
    AND reason LIKE '%' || p_code || '%'
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Add credits to user
  INSERT INTO credits (user_id, change, reason)
  VALUES (p_user_id, p_credit_amount, 'Invitation code redemption: ' || p_code);
  
  -- Update invitation usage
  UPDATE invitations
  SET current_uses = current_uses + 1
  WHERE id = invitation_record.id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct credits for a task
CREATE OR REPLACE FUNCTION deduct_credits_for_task(
  p_user_id UUID,
  p_task_id UUID,
  p_amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance
  FROM get_user_credit_balance(p_user_id);
  
  -- Check if user has enough credits
  IF current_balance < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credits
  INSERT INTO credits (user_id, change, reason, task_id)
  VALUES (p_user_id, -p_amount, 'Task execution', p_task_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- PART 4: STORAGE BUCKETS
-- ===========================================

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

-- ===========================================
-- PART 5: STORAGE POLICIES
-- ===========================================

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

-- ===========================================
-- PART 6: STORAGE FUNCTIONS
-- ===========================================

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

-- ===========================================
-- COMPLETE! 
-- ===========================================
-- All tables, functions, and policies have been created.
-- You can now:
-- 1. Create your first admin user
-- 2. Generate invitation codes
-- 3. Test the full MVP pipeline
-- ===========================================