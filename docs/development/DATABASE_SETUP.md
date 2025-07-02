# Prismy Database Setup Guide

## Overview

This guide covers the complete database setup for Prismy production deployment using Supabase PostgreSQL.

## Database Schema

### Core Tables

1. **users** - User profiles extending Supabase auth
2. **subscriptions** - Subscription and billing information
3. **documents** - Uploaded documents for translation
4. **translations** - Translation records with history
5. **teams** - Organization/team accounts
6. **api_keys** - API access management
7. **payments** - Payment transactions
8. **webhooks** - Integration webhooks

### Supporting Tables

- **usage_limits** - Subscription tier limits
- **usage_tracking** - Monthly usage tracking
- **translation_history** - Version control for translations
- **team_members** - Team membership
- **activity_logs** - User activity tracking
- **webhook_logs** - Webhook delivery logs
- **feedback** - User feedback on translations
- **audit_logs** - Security audit trail
- **rate_limits** - API rate limiting
- **blocked_ips** - Security IP blocking
- **user_sessions** - Session management
- **system_stats** - Daily statistics

## Migration Files

### 001_initial_schema.sql

- Creates all core tables
- Sets up custom types (enums)
- Adds indexes for performance
- Implements Row Level Security (RLS)
- Creates triggers for timestamps

### 002_functions_and_views.sql

- Utility functions for usage tracking
- Views for common queries
- Materialized views for analytics
- Database functions for business logic

### 003_security_and_performance.sql

- Audit logging system
- Rate limiting implementation
- IP blocking for security
- Performance optimizations
- Data retention policies

## Setup Instructions

### 1. Prerequisites

```bash
# Install dependencies
npm install @supabase/supabase-js

# Set environment variables
export SUPABASE_URL="your-project-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 2. Run Migrations

```bash
# Check migration status
node scripts/db-migrate.js status

# Run all pending migrations
node scripts/db-migrate.js migrate

# Run with stop on error
STOP_ON_ERROR=true node scripts/db-migrate.js migrate
```

### 3. Seed Development Data (Optional)

```bash
# Load test data (DO NOT run in production)
node scripts/db-migrate.js seed
```

Test accounts created by seed:

- admin@prismy.ai (password: Admin123!)
- demo@prismy.ai (password: Demo123!)
- test@prismy.ai (password: Test123!)

### 4. Verify Setup

```sql
-- Check tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check user count
SELECT COUNT(*) FROM public.users;

-- Check migration history
SELECT * FROM public.schema_migrations
ORDER BY version DESC;
```

## Database Features

### Row Level Security (RLS)

- Users can only access their own data
- Team members can access shared team resources
- API keys provide programmatic access

### Performance Optimizations

- Strategic indexes on foreign keys and frequently queried columns
- Partial indexes for status-based queries
- Materialized views for analytics
- Full-text search on translations

### Security Features

- Audit logging for sensitive operations
- Rate limiting at database level
- IP blocking capability
- Session management
- Data encryption at rest (Supabase feature)

### Automated Maintenance

- Updated_at triggers on all tables
- Data retention policies
- Expired data cleanup
- Statistics calculation

## Common Operations

### Check User Usage

```sql
SELECT * FROM get_user_usage('user-uuid-here');
```

### Check Rate Limits

```sql
SELECT check_rate_limit('user-id', '/api/translate', 100, 60);
```

### View Daily Statistics

```sql
SELECT * FROM system_stats
ORDER BY stat_date DESC
LIMIT 30;
```

### Monitor Active Translations

```sql
SELECT COUNT(*) as active_count
FROM translations
WHERE status IN ('pending', 'in_progress');
```

## Backup and Recovery

### Automated Backups

Supabase provides automated daily backups with point-in-time recovery.

### Manual Backup

```bash
# Using pg_dump (requires database URL)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore from Backup

```bash
# Restore using psql
psql $DATABASE_URL < backup_file.sql
```

## Monitoring

### Health Checks

The database includes a health_check table used by monitoring endpoints:

- `/api/health/database` - Database connectivity
- Database query performance
- Table accessibility

### Performance Monitoring

- Query performance via pg_stat_statements
- Index usage statistics
- Connection pool monitoring
- Slow query logging

## Troubleshooting

### Common Issues

1. **Migration Fails**

   - Check Supabase credentials
   - Verify network connectivity
   - Review migration SQL for syntax errors

2. **RLS Blocking Access**

   - Verify user authentication
   - Check RLS policies
   - Use service role key for admin operations

3. **Performance Issues**
   - Run ANALYZE on tables
   - Check index usage
   - Monitor slow queries
   - Review connection pool settings

### Debug Queries

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'translations';

-- View active connections
SELECT * FROM pg_stat_activity;

-- Check index usage
SELECT * FROM pg_stat_user_indexes;

-- Find slow queries
SELECT * FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

## Best Practices

1. **Always test migrations in development first**
2. **Take backups before major changes**
3. **Monitor query performance regularly**
4. **Keep RLS policies simple and efficient**
5. **Use connection pooling for scalability**
6. **Implement proper error handling in application code**
7. **Regular maintenance with VACUUM and ANALYZE**

## Support

For database-related issues:

1. Check Supabase dashboard for real-time metrics
2. Review PostgreSQL logs
3. Monitor application error logs
4. Contact Supabase support for infrastructure issues
