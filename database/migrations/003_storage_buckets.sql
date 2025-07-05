-- Storage Buckets and Policies for Prismy v2
-- Configure Supabase Storage for secure file handling

-- Create documents bucket for uploaded files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  1073741824, -- 1GB limit
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
    'image/jpeg',
    'image/png'
  ]
) on conflict (id) do nothing;

-- Create results bucket for translated documents
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'results',
  'results',
  false,
  1073741824, -- 1GB limit
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
    'application/json'
  ]
) on conflict (id) do nothing;

-- Create temp bucket for chunked uploads
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'temp',
  'temp',
  false,
  1073741824, -- 1GB limit
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
    'image/jpeg',
    'image/png',
    'application/octet-stream'
  ]
) on conflict (id) do nothing;

-- Create avatars bucket for user profile images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
) on conflict (id) do nothing;

-- Documents bucket policies
create policy "Users can upload documents" on storage.objects
  for insert with check (
    bucket_id = 'documents' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view their own documents" on storage.objects
  for select using (
    bucket_id = 'documents' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own documents" on storage.objects
  for update using (
    bucket_id = 'documents' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own documents" on storage.objects
  for delete using (
    bucket_id = 'documents' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Admins can view all documents" on storage.objects
  for select using (
    bucket_id = 'documents' and
    exists(select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "System can manage documents" on storage.objects
  for all using (
    bucket_id = 'documents' and
    auth.role() = 'service_role'
  );

-- Results bucket policies
create policy "Users can view their own results" on storage.objects
  for select using (
    bucket_id = 'results' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can upload results" on storage.objects
  for insert with check (
    bucket_id = 'results' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own results" on storage.objects
  for update using (
    bucket_id = 'results' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own results" on storage.objects
  for delete using (
    bucket_id = 'results' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Admins can view all results" on storage.objects
  for select using (
    bucket_id = 'results' and
    exists(select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "System can manage results" on storage.objects
  for all using (
    bucket_id = 'results' and
    auth.role() = 'service_role'
  );

-- Temp bucket policies (for chunked uploads)
create policy "Users can upload temp files" on storage.objects
  for insert with check (
    bucket_id = 'temp' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view their own temp files" on storage.objects
  for select using (
    bucket_id = 'temp' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own temp files" on storage.objects
  for update using (
    bucket_id = 'temp' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own temp files" on storage.objects
  for delete using (
    bucket_id = 'temp' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "System can manage temp files" on storage.objects
  for all using (
    bucket_id = 'temp' and
    auth.role() = 'service_role'
  );

-- Avatars bucket policies (public bucket)
create policy "Users can upload their own avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view all avatars" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Users can update their own avatar" on storage.objects
  for update using (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own avatar" on storage.objects
  for delete using (
    bucket_id = 'avatars' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Helper functions for storage policies
create or replace function storage.path_prefix(user_id uuid)
returns text as $$
begin
  return user_id::text || '/';
end;
$$ language plpgsql;

create or replace function storage.is_user_file(file_name text, user_id uuid)
returns boolean as $$
begin
  return file_name like (user_id::text || '/%');
end;
$$ language plpgsql;

-- Create storage cleanup function for expired temp files
create or replace function public.cleanup_expired_temp_files()
returns void as $$
declare
  expired_files record;
begin
  -- Find temp files older than 24 hours
  for expired_files in
    select name from storage.objects
    where bucket_id = 'temp'
    and created_at < now() - interval '24 hours'
  loop
    -- Delete expired temp files
    delete from storage.objects
    where bucket_id = 'temp' and name = expired_files.name;
  end loop;
end;
$$ language plpgsql security definer;

-- Create cleanup function for orphaned upload sessions
create or replace function public.cleanup_expired_upload_sessions()
returns void as $$
begin
  -- Delete expired upload sessions
  delete from public.upload_sessions
  where expires_at < now();
end;
$$ language plpgsql security definer;

-- Grant execute permissions on cleanup functions
grant execute on function public.cleanup_expired_temp_files() to service_role;
grant execute on function public.cleanup_expired_upload_sessions() to service_role;