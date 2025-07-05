-- Row Level Security (RLS) Policies for Prismy v2
-- Secure data access based on user roles and ownership

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.documents enable row level security;
alter table public.translations enable row level security;
alter table public.ocr_jobs enable row level security;
alter table public.admin_settings enable row level security;
alter table public.admin_settings_history enable row level security;
alter table public.upload_sessions enable row level security;
alter table public.system_metrics enable row level security;
alter table public.audit_logs enable row level security;

-- Users table policies
create policy "Users can view their own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.users
  for update using (auth.uid() = id);

create policy "Admins can view all users" on public.users
  for select using (
    exists(select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update all users" on public.users
  for update using (
    exists(select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- Documents table policies
create policy "Users can view their own documents" on public.documents
  for select using (auth.uid() = user_id);

create policy "Users can insert their own documents" on public.documents
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own documents" on public.documents
  for update using (auth.uid() = user_id);

create policy "Users can delete their own documents" on public.documents
  for delete using (auth.uid() = user_id);

create policy "Admins can view all documents" on public.documents
  for select using (
    exists(select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update all documents" on public.documents
  for update using (
    exists(select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- Translations table policies
create policy "Users can view translations for their documents" on public.translations
  for select using (
    exists(select 1 from public.documents where id = document_id and user_id = auth.uid())
  );

create policy "Users can insert translations for their documents" on public.translations
  for insert with check (
    exists(select 1 from public.documents where id = document_id and user_id = auth.uid())
  );

create policy "Users can update translations for their documents" on public.translations
  for update using (
    exists(select 1 from public.documents where id = document_id and user_id = auth.uid())
  );

create policy "Users can delete translations for their documents" on public.translations
  for delete using (
    exists(select 1 from public.documents where id = document_id and user_id = auth.uid())
  );

create policy "Admins can view all translations" on public.translations
  for select using (
    exists(select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update all translations" on public.translations
  for update using (
    exists(select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- OCR jobs table policies
create policy "Users can view OCR jobs for their documents" on public.ocr_jobs
  for select using (
    exists(select 1 from public.documents where id = document_id and user_id = auth.uid())
  );

create policy "Users can insert OCR jobs for their documents" on public.ocr_jobs
  for insert with check (
    exists(select 1 from public.documents where id = document_id and user_id = auth.uid())
  );

create policy "Users can update OCR jobs for their documents" on public.ocr_jobs
  for update using (
    exists(select 1 from public.documents where id = document_id and user_id = auth.uid())
  );

create policy "System can manage OCR jobs" on public.ocr_jobs
  for all using (
    -- Allow system operations (service role)
    auth.role() = 'service_role' or 
    -- Allow admin operations
    exists(select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- Admin settings table policies
create policy "Public settings are viewable by all authenticated users" on public.admin_settings
  for select using (auth.role() = 'authenticated' and is_public = true);

create policy "Admins can view all settings" on public.admin_settings
  for select using (
    exists(select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Admins can manage all settings" on public.admin_settings
  for all using (
    exists(select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- Admin settings history table policies
create policy "Admins can view settings history" on public.admin_settings_history
  for select using (
    exists(select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Admins can insert settings history" on public.admin_settings_history
  for insert with check (
    exists(select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- Upload sessions table policies
create policy "Users can view their own upload sessions" on public.upload_sessions
  for select using (auth.uid() = user_id);

create policy "Users can insert their own upload sessions" on public.upload_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own upload sessions" on public.upload_sessions
  for update using (auth.uid() = user_id);

create policy "Users can delete their own upload sessions" on public.upload_sessions
  for delete using (auth.uid() = user_id);

create policy "Admins can view all upload sessions" on public.upload_sessions
  for select using (
    exists(select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "System can manage upload sessions" on public.upload_sessions
  for all using (auth.role() = 'service_role');

-- System metrics table policies
create policy "Admins can view system metrics" on public.system_metrics
  for select using (
    exists(select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "System can insert metrics" on public.system_metrics
  for insert with check (auth.role() = 'service_role');

create policy "Admins can insert metrics" on public.system_metrics
  for insert with check (
    exists(select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- Audit logs table policies
create policy "Users can view their own audit logs" on public.audit_logs
  for select using (auth.uid() = user_id);

create policy "Admins can view all audit logs" on public.audit_logs
  for select using (
    exists(select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "System can insert audit logs" on public.audit_logs
  for insert with check (auth.role() = 'service_role');

create policy "Admins can insert audit logs" on public.audit_logs
  for insert with check (
    exists(select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- Create helper functions for RLS
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists(select 1 from public.users where id = auth.uid() and role = 'admin');
end;
$$ language plpgsql security definer;

create or replace function public.current_user_role()
returns text as $$
begin
  return (select role from public.users where id = auth.uid());
end;
$$ language plpgsql security definer;

-- Grant necessary permissions
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- Additional security: revoke default permissions and grant specific ones
revoke all on schema public from public;
grant usage on schema public to anon, authenticated, service_role;

-- Grant specific table permissions
grant select, insert, update, delete on public.users to authenticated, service_role;
grant select, insert, update, delete on public.documents to authenticated, service_role;
grant select, insert, update, delete on public.translations to authenticated, service_role;
grant select, insert, update, delete on public.ocr_jobs to authenticated, service_role;
grant select on public.admin_settings to authenticated;
grant select, insert, update, delete on public.admin_settings to service_role;
grant select, insert on public.admin_settings_history to authenticated, service_role;
grant select, insert, update, delete on public.upload_sessions to authenticated, service_role;
grant select, insert on public.system_metrics to authenticated, service_role;
grant select, insert on public.audit_logs to authenticated, service_role;