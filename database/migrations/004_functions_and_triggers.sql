-- Database Functions and Triggers for Prismy v2
-- Business logic functions and automated triggers

-- Function to handle user creation from auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', ''),
    case 
      when new.email like '%@prismy.com' then 'admin'
      else 'user'
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Function to update OCR job queue position
create or replace function public.update_ocr_queue_positions()
returns void as $$
begin
  -- Update queue positions for pending jobs
  with ordered_jobs as (
    select id, row_number() over (order by priority desc, created_at asc) as position
    from public.ocr_jobs
    where status = 'pending'
  )
  update public.ocr_jobs
  set queue_position = ordered_jobs.position
  from ordered_jobs
  where public.ocr_jobs.id = ordered_jobs.id;
end;
$$ language plpgsql;

-- Trigger to update queue positions when OCR jobs change
create or replace function public.trigger_update_ocr_queue()
returns trigger as $$
begin
  perform public.update_ocr_queue_positions();
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger update_ocr_queue_on_change
  after insert or update or delete on public.ocr_jobs
  for each row execute function public.trigger_update_ocr_queue();

-- Function to log admin settings changes
create or replace function public.log_admin_settings_change()
returns trigger as $$
begin
  if TG_OP = 'UPDATE' then
    insert into public.admin_settings_history (
      setting_key,
      old_value,
      new_value,
      admin_user_id,
      reason
    ) values (
      new.setting_key,
      old.setting_value,
      new.setting_value,
      auth.uid(),
      'Setting updated'
    );
  elsif TG_OP = 'INSERT' then
    insert into public.admin_settings_history (
      setting_key,
      old_value,
      new_value,
      admin_user_id,
      reason
    ) values (
      new.setting_key,
      null,
      new.setting_value,
      auth.uid(),
      'Setting created'
    );
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for admin settings changes
create trigger log_admin_settings_changes
  after insert or update on public.admin_settings
  for each row execute function public.log_admin_settings_change();

-- Function to create audit log entry
create or replace function public.create_audit_log(
  p_action text,
  p_resource_type text,
  p_resource_id uuid default null,
  p_details jsonb default null
)
returns void as $$
begin
  insert into public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent
  ) values (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_details,
    null, -- Will be populated by application
    null  -- Will be populated by application
  );
end;
$$ language plpgsql security definer;

-- Function to get user's file upload quota
create or replace function public.get_user_upload_quota(user_id uuid)
returns jsonb as $$
declare
  user_role text;
  quota_info jsonb;
  current_month_usage bigint;
  max_file_size bigint;
  max_monthly_usage bigint;
begin
  -- Get user role
  select role into user_role from public.users where id = user_id;
  
  -- Get current month's usage
  select coalesce(sum(file_size), 0) into current_month_usage
  from public.documents
  where user_id = user_id
  and created_at >= date_trunc('month', now());
  
  -- Get limits based on role
  if user_role = 'admin' then
    max_file_size := 1073741824; -- 1GB
    max_monthly_usage := 10737418240; -- 10GB
  else
    max_file_size := 52428800; -- 50MB
    max_monthly_usage := 1073741824; -- 1GB
  end if;
  
  -- Build quota info
  quota_info := jsonb_build_object(
    'max_file_size', max_file_size,
    'max_monthly_usage', max_monthly_usage,
    'current_month_usage', current_month_usage,
    'remaining_quota', greatest(0, max_monthly_usage - current_month_usage),
    'quota_percentage', round((current_month_usage::numeric / max_monthly_usage::numeric) * 100, 2)
  );
  
  return quota_info;
end;
$$ language plpgsql security definer;

-- Function to check if user can upload file
create or replace function public.can_user_upload_file(
  user_id uuid,
  file_size bigint
)
returns boolean as $$
declare
  quota_info jsonb;
  max_file_size bigint;
  remaining_quota bigint;
begin
  quota_info := public.get_user_upload_quota(user_id);
  
  max_file_size := (quota_info ->> 'max_file_size')::bigint;
  remaining_quota := (quota_info ->> 'remaining_quota')::bigint;
  
  -- Check file size limit
  if file_size > max_file_size then
    return false;
  end if;
  
  -- Check monthly quota
  if file_size > remaining_quota then
    return false;
  end if;
  
  return true;
end;
$$ language plpgsql security definer;

-- Function to get system metrics
create or replace function public.get_system_metrics()
returns jsonb as $$
declare
  metrics jsonb;
begin
  select jsonb_build_object(
    'total_users', (select count(*) from public.users),
    'total_documents', (select count(*) from public.documents),
    'total_translations', (select count(*) from public.translations),
    'pending_ocr_jobs', (select count(*) from public.ocr_jobs where status = 'pending'),
    'processing_ocr_jobs', (select count(*) from public.ocr_jobs where status = 'processing'),
    'active_upload_sessions', (select count(*) from public.upload_sessions where status = 'active'),
    'storage_usage_bytes', (
      select coalesce(sum(file_size), 0)
      from public.documents
      where created_at >= now() - interval '30 days'
    ),
    'last_24h_uploads', (
      select count(*)
      from public.documents
      where created_at >= now() - interval '24 hours'
    ),
    'last_24h_translations', (
      select count(*)
      from public.translations
      where created_at >= now() - interval '24 hours'
    ),
    'average_processing_time_ms', (
      select avg(processing_time_ms)
      from public.translations
      where completed_at >= now() - interval '7 days'
      and processing_time_ms is not null
    )
  ) into metrics;
  
  return metrics;
end;
$$ language plpgsql security definer;

-- Function to get user statistics
create or replace function public.get_user_stats(user_id uuid)
returns jsonb as $$
declare
  stats jsonb;
begin
  select jsonb_build_object(
    'total_documents', (select count(*) from public.documents where user_id = user_id),
    'total_translations', (
      select count(*)
      from public.translations t
      join public.documents d on t.document_id = d.id
      where d.user_id = user_id
    ),
    'total_storage_bytes', (
      select coalesce(sum(file_size), 0)
      from public.documents
      where user_id = user_id
    ),
    'this_month_uploads', (
      select count(*)
      from public.documents
      where user_id = user_id
      and created_at >= date_trunc('month', now())
    ),
    'this_month_translations', (
      select count(*)
      from public.translations t
      join public.documents d on t.document_id = d.id
      where d.user_id = user_id
      and t.created_at >= date_trunc('month', now())
    ),
    'average_processing_time_ms', (
      select avg(t.processing_time_ms)
      from public.translations t
      join public.documents d on t.document_id = d.id
      where d.user_id = user_id
      and t.processing_time_ms is not null
    ),
    'quota_info', public.get_user_upload_quota(user_id)
  ) into stats;
  
  return stats;
end;
$$ language plpgsql security definer;

-- Function to clean up old system metrics
create or replace function public.cleanup_old_metrics()
returns void as $$
begin
  -- Keep only last 30 days of metrics
  delete from public.system_metrics
  where recorded_at < now() - interval '30 days';
end;
$$ language plpgsql security definer;

-- Function to record system metric
create or replace function public.record_system_metric(
  metric_name text,
  metric_value numeric,
  tags jsonb default null
)
returns void as $$
begin
  insert into public.system_metrics (metric_name, metric_value, tags)
  values (metric_name, metric_value, tags);
end;
$$ language plpgsql security definer;

-- Function to get admin setting value
create or replace function public.get_admin_setting(
  setting_key text,
  default_value text default null
)
returns text as $$
declare
  setting_value text;
begin
  select (setting_value #>> '{}') into setting_value
  from public.admin_settings
  where setting_key = get_admin_setting.setting_key;
  
  return coalesce(setting_value, default_value);
end;
$$ language plpgsql security definer;

-- Function to update admin setting
create or replace function public.update_admin_setting(
  setting_key text,
  setting_value jsonb,
  admin_user_id uuid default null
)
returns boolean as $$
declare
  is_admin boolean;
begin
  -- Check if user is admin
  select exists(
    select 1 from public.users 
    where id = coalesce(admin_user_id, auth.uid()) 
    and role = 'admin'
  ) into is_admin;
  
  if not is_admin then
    return false;
  end if;
  
  -- Update or insert setting
  insert into public.admin_settings (setting_key, setting_value)
  values (setting_key, setting_value)
  on conflict (setting_key)
  do update set
    setting_value = excluded.setting_value,
    updated_at = now();
  
  return true;
end;
$$ language plpgsql security definer;

-- Grant execute permissions on functions
grant execute on function public.get_user_upload_quota(uuid) to authenticated, service_role;
grant execute on function public.can_user_upload_file(uuid, bigint) to authenticated, service_role;
grant execute on function public.get_system_metrics() to authenticated, service_role;
grant execute on function public.get_user_stats(uuid) to authenticated, service_role;
grant execute on function public.create_audit_log(text, text, uuid, jsonb) to authenticated, service_role;
grant execute on function public.record_system_metric(text, numeric, jsonb) to authenticated, service_role;
grant execute on function public.get_admin_setting(text, text) to authenticated, service_role;
grant execute on function public.update_admin_setting(text, jsonb, uuid) to authenticated, service_role;
grant execute on function public.cleanup_old_metrics() to service_role;
grant execute on function public.update_ocr_queue_positions() to service_role;