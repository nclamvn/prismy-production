-- Initial Database Schema for Prismy v2 Production
-- Create all tables with proper RLS policies and indexes

-- Enable Row Level Security
alter default privileges revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from public;

-- Create users table (extends auth.users)
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create documents table
create table if not exists public.documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  filename text not null,
  original_name text not null,
  file_size bigint not null,
  mime_type text not null,
  storage_path text not null,
  detected_language text,
  page_count integer,
  processing_status text default 'pending' check (processing_status in ('pending', 'processing', 'completed', 'failed')),
  upload_type text default 'standard' check (upload_type in ('standard', 'chunked')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create translations table
create table if not exists public.translations (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references public.documents(id) on delete cascade not null,
  source_language text not null,
  target_language text not null,
  original_text text,
  translated_text text,
  provider text not null check (provider in ('openai', 'anthropic', 'azure')),
  chunk_count integer default 1,
  processing_time_ms integer,
  token_count integer,
  cost_usd decimal(10,4),
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  result_path text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create OCR jobs table for queue processing
create table if not exists public.ocr_jobs (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references public.documents(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  priority integer default 5 check (priority between 1 and 10),
  engine text not null check (engine in ('tesseract', 'google_vision', 'azure_cognitive')),
  payload jsonb not null,
  result jsonb,
  error_message text,
  processing_time_ms integer,
  queue_position integer,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create admin settings table
create table if not exists public.admin_settings (
  id uuid default gen_random_uuid() primary key,
  setting_key text unique not null,
  setting_value jsonb not null,
  description text,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create admin settings history table
create table if not exists public.admin_settings_history (
  id uuid default gen_random_uuid() primary key,
  setting_key text not null,
  old_value jsonb,
  new_value jsonb,
  admin_user_id uuid references public.users(id) on delete set null,
  reason text,
  created_at timestamptz default now()
);

-- Create upload sessions table for chunked uploads
create table if not exists public.upload_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  filename text not null,
  total_size bigint not null,
  chunk_size integer not null,
  total_chunks integer not null,
  uploaded_chunks integer default 0,
  status text default 'active' check (status in ('active', 'completed', 'failed', 'cancelled')),
  storage_path text,
  expires_at timestamptz default (now() + interval '24 hours'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create system metrics table
create table if not exists public.system_metrics (
  id uuid default gen_random_uuid() primary key,
  metric_name text not null,
  metric_value numeric not null,
  tags jsonb,
  recorded_at timestamptz default now()
);

-- Create audit logs table
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now()
);

-- Create indexes for performance
create index if not exists idx_documents_user_id on public.documents(user_id);
create index if not exists idx_documents_status on public.documents(processing_status);
create index if not exists idx_documents_created_at on public.documents(created_at desc);
create index if not exists idx_translations_document_id on public.translations(document_id);
create index if not exists idx_translations_status on public.translations(status);
create index if not exists idx_ocr_jobs_status on public.ocr_jobs(status);
create index if not exists idx_ocr_jobs_priority on public.ocr_jobs(priority desc, created_at asc);
create index if not exists idx_upload_sessions_user_id on public.upload_sessions(user_id);
create index if not exists idx_upload_sessions_expires_at on public.upload_sessions(expires_at);
create index if not exists idx_system_metrics_name_time on public.system_metrics(metric_name, recorded_at desc);
create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- Insert default admin settings
insert into public.admin_settings (setting_key, setting_value, description, is_public) values
  ('upload.max_file_size', '52428800', 'Maximum file size in bytes (50MB)', true),
  ('upload.chunked_threshold', '52428800', 'File size threshold for chunked uploads (50MB)', false),
  ('upload.allowed_types', '["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword", "text/plain", "text/markdown", "image/jpeg", "image/png"]', 'Allowed file MIME types', true),
  ('ocr.queue_threshold', '104857600', 'File size threshold for OCR queue processing (100MB)', false),
  ('ocr.max_queue_size', '100', 'Maximum number of jobs in OCR queue', false),
  ('ocr.default_engine', '"tesseract"', 'Default OCR engine', false),
  ('translation.max_text_length', '100000', 'Maximum text length for translation (MVP)', true),
  ('translation.default_provider', '"openai"', 'Default translation provider', false),
  ('translation.rate_limit_per_hour', '100', 'Translation requests per hour per user', true),
  ('system.maintenance_mode', 'false', 'System maintenance mode', true),
  ('system.registration_enabled', 'true', 'User registration enabled', true),
  ('features.large_uploads', 'false', 'Enable large file uploads (>50MB)', true),
  ('features.chunked_upload', 'false', 'Enable chunked uploads', true),
  ('features.ocr_queue', 'false', 'Enable OCR queue processing', true),
  ('features.real_translation', 'true', 'Enable real translation (vs stub)', true),
  ('features.admin_panel', 'true', 'Enable admin panel', false),
  ('features.analytics', 'true', 'Enable analytics tracking', false),
  ('features.dark_mode', 'false', 'Enable dark mode UI', true),
  ('features.preview_iframe', 'true', 'Enable document preview', true),
  ('features.rate_limiting', 'true', 'Enable rate limiting', false),
  ('monitoring.error_tracking', 'true', 'Enable error tracking', false),
  ('monitoring.performance', 'true', 'Enable performance monitoring', false)
on conflict (setting_key) do nothing;

-- Add updated_at triggers
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at before update on public.users
  for each row execute function public.update_updated_at_column();

create trigger update_documents_updated_at before update on public.documents
  for each row execute function public.update_updated_at_column();

create trigger update_translations_updated_at before update on public.translations
  for each row execute function public.update_updated_at_column();

create trigger update_ocr_jobs_updated_at before update on public.ocr_jobs
  for each row execute function public.update_updated_at_column();

create trigger update_admin_settings_updated_at before update on public.admin_settings
  for each row execute function public.update_updated_at_column();

create trigger update_upload_sessions_updated_at before update on public.upload_sessions
  for each row execute function public.update_updated_at_column();