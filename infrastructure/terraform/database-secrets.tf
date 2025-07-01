# ===============================================
# Database Secrets Management
# ===============================================

# Database connection secret for PgBouncer
resource "aws_secretsmanager_secret" "db_connection" {
  name        = "${var.environment}-prismy-db-connection"
  description = "Database connection details for PgBouncer"
  
  replica {
    region = var.backup_cross_region_destination
  }
  
  tags = {
    Name        = "${var.environment}-prismy-db-connection"
    Purpose     = "database-connection"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "db_connection" {
  secret_id = aws_secretsmanager_secret.db_connection.id
  
  secret_string = jsonencode({
    engine   = "postgres"
    host     = aws_db_instance.main_optimized.endpoint
    port     = aws_db_instance.main_optimized.port
    dbname   = aws_db_instance.main_optimized.db_name
    username = aws_db_instance.main_optimized.username
  })
  
  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Read replica connection strings
resource "aws_secretsmanager_secret" "db_read_replicas" {
  count = var.enable_read_replica ? 1 : 0
  
  name        = "${var.environment}-prismy-db-read-replicas"
  description = "Read replica connection details"
  
  tags = {
    Name        = "${var.environment}-prismy-db-read-replicas"
    Purpose     = "read-replica-connections"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "db_read_replicas" {
  count = var.enable_read_replica ? 1 : 0
  
  secret_id = aws_secretsmanager_secret.db_read_replicas[0].id
  
  secret_string = jsonencode({
    replicas = [
      for replica in aws_db_instance.read_replica : {
        host = replica.endpoint
        port = replica.port
      }
    ]
  })
  
  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Database performance monitoring credentials
resource "aws_secretsmanager_secret" "db_monitoring" {
  name        = "${var.environment}-prismy-db-monitoring"
  description = "Database monitoring user credentials"
  
  tags = {
    Name        = "${var.environment}-prismy-db-monitoring"
    Purpose     = "database-monitoring"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "db_monitoring" {
  secret_id = aws_secretsmanager_secret.db_monitoring.id
  
  secret_string = jsonencode({
    username = "prismy_monitor"
    password = random_password.db_monitor_password.result
    host     = aws_db_instance.main_optimized.endpoint
    port     = aws_db_instance.main_optimized.port
    dbname   = aws_db_instance.main_optimized.db_name
  })
  
  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Generate monitoring user password
resource "random_password" "db_monitor_password" {
  length  = 32
  special = true
}

# PgBouncer configuration secret
resource "aws_secretsmanager_secret" "pgbouncer_config" {
  count = var.enable_connection_pooling ? 1 : 0
  
  name        = "${var.environment}-prismy-pgbouncer-config"
  description = "PgBouncer configuration and credentials"
  
  tags = {
    Name        = "${var.environment}-prismy-pgbouncer-config"
    Purpose     = "connection-pooling"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "pgbouncer_config" {
  count = var.enable_connection_pooling ? 1 : 0
  
  secret_id = aws_secretsmanager_secret.pgbouncer_config[0].id
  
  secret_string = jsonencode({
    admin_users      = "prismy_admin"
    stats_users      = "prismy_monitor"
    pool_mode        = "transaction"
    max_client_conn  = var.pgbouncer_max_client_conn
    default_pool_size = var.pgbouncer_pool_size
    reserve_pool_size = 5
    server_lifetime  = 3600
    server_idle_timeout = 600
    log_connections  = 1
    log_disconnections = 1
    log_pooler_errors = 1
    databases = {
      prismy = {
        host = aws_db_instance.main_optimized.endpoint
        port = aws_db_instance.main_optimized.port
        dbname = aws_db_instance.main_optimized.db_name
        pool_size = var.pgbouncer_pool_size
      }
    }
  })
  
  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Database backup encryption key
resource "aws_kms_key" "db_backup" {
  description             = "KMS key for database backup encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = var.kms_key_rotation_enabled
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow RDS Service"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow AWS Backup Service"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
  
  tags = {
    Name        = "${var.environment}-prismy-db-backup-key"
    Purpose     = "database-backup-encryption"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "db_backup" {
  name          = "alias/${var.environment}-prismy-db-backup"
  target_key_id = aws_kms_key.db_backup.key_id
}

# Cross-region replica encryption key (if enabled)
resource "aws_kms_key" "db_cross_region" {
  count = var.enable_cross_region_replica ? 1 : 0
  
  provider                = aws.cross_region
  description             = "KMS key for cross-region database replica encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = var.kms_key_rotation_enabled
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow RDS Service"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
  
  tags = {
    Name        = "${var.environment}-prismy-db-cross-region-key"
    Purpose     = "cross-region-replica-encryption"
    Environment = var.environment
  }
}

# Database performance insights encryption key
resource "aws_kms_key" "db_performance_insights" {
  description             = "KMS key for database Performance Insights encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = var.kms_key_rotation_enabled
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow RDS Service"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
  
  tags = {
    Name        = "${var.environment}-prismy-db-performance-insights-key"
    Purpose     = "performance-insights-encryption"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "db_performance_insights" {
  name          = "alias/${var.environment}-prismy-db-performance-insights"
  target_key_id = aws_kms_key.db_performance_insights.key_id
}

# Database parameter store for runtime configuration
resource "aws_ssm_parameter" "db_max_connections" {
  name        = "/${var.environment}/prismy/database/max_connections"
  description = "Maximum database connections allowed"
  type        = "String"
  value       = var.max_connections
  
  tags = {
    Name        = "${var.environment}-prismy-db-max-connections"
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "db_pool_size" {
  name        = "/${var.environment}/prismy/database/pool_size"
  description = "Database connection pool size"
  type        = "String"
  value       = var.pgbouncer_pool_size
  
  tags = {
    Name        = "${var.environment}-prismy-db-pool-size"
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "db_performance_schema" {
  name        = "/${var.environment}/prismy/database/performance_schema"
  description = "Performance schema configuration"
  type        = "StringList"
  value       = join(",", var.enabled_extensions)
  
  tags = {
    Name        = "${var.environment}-prismy-db-performance-schema"
    Environment = var.environment
  }
}

# Database backup schedule configuration
resource "aws_ssm_parameter" "db_backup_schedule" {
  name        = "/${var.environment}/prismy/database/backup_schedule"
  description = "Database backup schedule configuration"
  type        = "String"
  value = jsonencode({
    backup_window      = var.db_backup_window
    retention_days     = var.backup_retention_days
    cross_region_copy  = var.backup_cross_region_copy
    maintenance_window = var.db_maintenance_window
  })
  
  tags = {
    Name        = "${var.environment}-prismy-db-backup-schedule"
    Environment = var.environment
  }
}

# Database monitoring configuration
resource "aws_ssm_parameter" "db_monitoring_config" {
  name        = "/${var.environment}/prismy/database/monitoring"
  description = "Database monitoring configuration"
  type        = "String"
  value = jsonencode({
    performance_insights_enabled = true
    enhanced_monitoring_interval = var.enhanced_monitoring_interval
    log_min_duration_statement   = var.log_min_duration_statement_ms
    log_checkpoints              = var.log_checkpoints
    log_temp_files               = var.log_temp_files
    log_lock_waits               = var.log_lock_waits
  })
  
  tags = {
    Name        = "${var.environment}-prismy-db-monitoring-config"
    Environment = var.environment
  }
}