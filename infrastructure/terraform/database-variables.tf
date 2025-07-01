# ===============================================
# Database Optimization Variables
# ===============================================

# Database Instance Configuration
variable "db_instance_class" {
  description = "RDS instance class for primary database"
  type        = string
  default     = "db.r6g.xlarge"
}

variable "db_allocated_storage" {
  description = "Initial allocated storage for RDS instance (GB)"
  type        = number
  default     = 100
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for auto-scaling (GB)"
  type        = number
  default     = 1000
}

variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "prismy"
}

variable "database_username" {
  description = "Master username for the database"
  type        = string
  default     = "prismy_admin"
}

# High Availability Configuration
variable "enable_multi_az" {
  description = "Enable Multi-AZ deployment for high availability"
  type        = bool
  default     = true
}

variable "enable_read_replica" {
  description = "Enable read replicas for load distribution"
  type        = bool
  default     = true
}

variable "read_replica_count" {
  description = "Number of read replicas to create"
  type        = number
  default     = 2
  validation {
    condition     = var.read_replica_count >= 1 && var.read_replica_count <= 5
    error_message = "Read replica count must be between 1 and 5."
  }
}

variable "read_replica_instance_class" {
  description = "RDS instance class for read replicas"
  type        = string
  default     = "db.r6g.large"
}

# Performance Configuration
variable "max_connections" {
  description = "Maximum number of database connections"
  type        = number
  default     = 200
}

variable "shared_buffers_ratio" {
  description = "Ratio of shared_buffers to total memory (0.25 = 25%)"
  type        = number
  default     = 0.25
  validation {
    condition     = var.shared_buffers_ratio > 0 && var.shared_buffers_ratio <= 0.4
    error_message = "Shared buffers ratio must be between 0 and 0.4."
  }
}

variable "effective_cache_size_ratio" {
  description = "Ratio of effective_cache_size to total memory (0.75 = 75%)"
  type        = number
  default     = 0.75
  validation {
    condition     = var.effective_cache_size_ratio > 0 && var.effective_cache_size_ratio <= 1
    error_message = "Effective cache size ratio must be between 0 and 1."
  }
}

# Connection Pooling Configuration
variable "enable_connection_pooling" {
  description = "Enable PgBouncer connection pooling"
  type        = bool
  default     = true
}

variable "pgbouncer_desired_count" {
  description = "Desired number of PgBouncer instances"
  type        = number
  default     = 2
}

variable "pgbouncer_pool_size" {
  description = "Default pool size for PgBouncer"
  type        = number
  default     = 20
}

variable "pgbouncer_max_client_conn" {
  description = "Maximum client connections for PgBouncer"
  type        = number
  default     = 1000
}

# Backup and Maintenance Configuration
variable "backup_retention_days" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 30
  validation {
    condition     = var.backup_retention_days >= 7 && var.backup_retention_days <= 35
    error_message = "Backup retention must be between 7 and 35 days."
  }
}

variable "db_backup_window" {
  description = "Preferred backup window (UTC)"
  type        = string
  default     = "03:00-04:00"
}

variable "db_maintenance_window" {
  description = "Preferred maintenance window (UTC)"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "enable_db_deletion_protection" {
  description = "Enable deletion protection for the database"
  type        = bool
  default     = true
}

variable "enable_automated_maintenance" {
  description = "Enable automated database maintenance tasks"
  type        = bool
  default     = true
}

# Monitoring Configuration
variable "performance_insights_retention_period" {
  description = "Performance Insights retention period (days)"
  type        = number
  default     = 7
  validation {
    condition = contains([7, 731], var.performance_insights_retention_period)
    error_message = "Performance Insights retention must be either 7 or 731 days."
  }
}

variable "enhanced_monitoring_interval" {
  description = "Enhanced monitoring interval in seconds"
  type        = number
  default     = 60
  validation {
    condition = contains([0, 1, 5, 10, 15, 30, 60], var.enhanced_monitoring_interval)
    error_message = "Enhanced monitoring interval must be 0, 1, 5, 10, 15, 30, or 60 seconds."
  }
}

# Query Optimization Parameters
variable "work_mem_mb" {
  description = "Work memory per connection in MB"
  type        = number
  default     = 16
}

variable "maintenance_work_mem_mb" {
  description = "Maintenance work memory in MB"
  type        = number
  default     = 2048
}

variable "random_page_cost" {
  description = "Random page cost for query optimizer (SSD optimized)"
  type        = number
  default     = 1.1
}

variable "seq_page_cost" {
  description = "Sequential page cost for query optimizer"
  type        = number
  default     = 1.0
}

# Checkpoint and WAL Configuration
variable "checkpoint_completion_target" {
  description = "Checkpoint completion target (0.0-1.0)"
  type        = number
  default     = 0.9
  validation {
    condition     = var.checkpoint_completion_target >= 0.0 && var.checkpoint_completion_target <= 1.0
    error_message = "Checkpoint completion target must be between 0.0 and 1.0."
  }
}

variable "wal_buffers_mb" {
  description = "WAL buffers size in MB"
  type        = number
  default     = 16
}

variable "max_wal_size_gb" {
  description = "Maximum WAL size in GB"
  type        = number
  default     = 4
}

variable "min_wal_size_gb" {
  description = "Minimum WAL size in GB"
  type        = number
  default     = 1
}

# Autovacuum Configuration
variable "autovacuum_vacuum_scale_factor" {
  description = "Autovacuum vacuum scale factor"
  type        = number
  default     = 0.1
  validation {
    condition     = var.autovacuum_vacuum_scale_factor >= 0.0 && var.autovacuum_vacuum_scale_factor <= 1.0
    error_message = "Autovacuum vacuum scale factor must be between 0.0 and 1.0."
  }
}

variable "autovacuum_analyze_scale_factor" {
  description = "Autovacuum analyze scale factor"
  type        = number
  default     = 0.05
  validation {
    condition     = var.autovacuum_analyze_scale_factor >= 0.0 && var.autovacuum_analyze_scale_factor <= 1.0
    error_message = "Autovacuum analyze scale factor must be between 0.0 and 1.0."
  }
}

variable "autovacuum_vacuum_cost_limit" {
  description = "Autovacuum vacuum cost limit"
  type        = number
  default     = 2000
}

# Statistics Configuration
variable "default_statistics_target" {
  description = "Default statistics target for query planning"
  type        = number
  default     = 100
  validation {
    condition     = var.default_statistics_target >= 1 && var.default_statistics_target <= 10000
    error_message = "Default statistics target must be between 1 and 10000."
  }
}

# Logging Configuration
variable "log_min_duration_statement_ms" {
  description = "Minimum duration to log statements (milliseconds)"
  type        = number
  default     = 1000
}

variable "log_checkpoints" {
  description = "Enable checkpoint logging"
  type        = bool
  default     = true
}

variable "log_temp_files" {
  description = "Log temporary files larger than this size (0 = all)"
  type        = number
  default     = 0
}

variable "log_lock_waits" {
  description = "Enable lock wait logging"
  type        = bool
  default     = true
}

# Connection Keep-Alive Configuration
variable "tcp_keepalives_idle_seconds" {
  description = "TCP keepalive idle time in seconds"
  type        = number
  default     = 600
}

variable "tcp_keepalives_interval_seconds" {
  description = "TCP keepalive interval in seconds"
  type        = number
  default     = 30
}

variable "tcp_keepalives_count" {
  description = "TCP keepalive count"
  type        = number
  default     = 3
}

# Security Configuration
variable "enable_ssl_enforcement" {
  description = "Enforce SSL connections"
  type        = bool
  default     = true
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access the database"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

# Cost Optimization
variable "enable_storage_autoscaling" {
  description = "Enable storage autoscaling"
  type        = bool
  default     = true
}

variable "storage_autoscaling_threshold" {
  description = "Threshold for storage autoscaling (percentage)"
  type        = number
  default     = 90
  validation {
    condition     = var.storage_autoscaling_threshold >= 10 && var.storage_autoscaling_threshold <= 99
    error_message = "Storage autoscaling threshold must be between 10 and 99."
  }
}

# Database Extensions
variable "enabled_extensions" {
  description = "List of PostgreSQL extensions to enable"
  type        = list(string)
  default     = [
    "pg_stat_statements",
    "pg_buffercache",
    "pg_prewarm",
    "uuid-ossp",
    "btree_gin",
    "btree_gist",
    "pgcrypto"
  ]
}

# Replication Configuration
variable "enable_cross_region_replica" {
  description = "Enable cross-region read replica for disaster recovery"
  type        = bool
  default     = false
}

variable "cross_region_replica_region" {
  description = "AWS region for cross-region replica"
  type        = string
  default     = "us-east-1"
}

# Data Lifecycle Management
variable "enable_data_archival" {
  description = "Enable automated data archival"
  type        = bool
  default     = true
}

variable "archival_retention_days" {
  description = "Number of days before archiving old data"
  type        = number
  default     = 365
}

# Performance Testing
variable "enable_performance_testing" {
  description = "Enable automated performance testing"
  type        = bool
  default     = false
}

variable "performance_test_schedule" {
  description = "Cron expression for performance testing schedule"
  type        = string
  default     = "cron(0 3 ? * SAT *)" # Weekly on Saturday at 3 AM
}

# Disaster Recovery
variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery"
  type        = bool
  default     = true
}

variable "backup_cross_region_copy" {
  description = "Enable cross-region backup copying"
  type        = bool
  default     = true
}

variable "backup_cross_region_destination" {
  description = "Destination region for cross-region backup copy"
  type        = string
  default     = "us-east-1"
}