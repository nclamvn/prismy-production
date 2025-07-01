# ===============================================
# Database Optimization & Clustering
# High-performance database configuration for production
# ===============================================

# ===============================================
# Enhanced RDS Configuration
# ===============================================

# Primary database instance with optimized configuration
resource "aws_db_instance" "main_optimized" {
  identifier = "${var.environment}-prismy-db-optimized"
  
  # Engine configuration
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class
  
  # Storage configuration
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.rds.arn
  
  # Performance Insights
  performance_insights_enabled = true
  performance_insights_kms_key_id = aws_kms_key.rds.arn
  performance_insights_retention_period = 7
  
  # Enhanced monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn
  
  # Backup configuration
  backup_retention_period   = var.backup_retention_days
  backup_window            = var.db_backup_window
  maintenance_window       = var.db_maintenance_window
  delete_automated_backups = false
  deletion_protection      = var.enable_db_deletion_protection
  
  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds_optimized.id]
  publicly_accessible    = false
  
  # Database configuration
  db_name  = var.database_name
  username = var.database_username
  manage_master_user_password = true
  master_user_secret_kms_key_id = aws_kms_key.rds.arn
  
  # Parameter group for optimization
  parameter_group_name = aws_db_parameter_group.postgres_optimized.name
  option_group_name    = aws_db_option_group.postgres_optimized.name
  
  # Multi-AZ for high availability
  multi_az = var.enable_multi_az
  
  # Auto minor version upgrade
  auto_minor_version_upgrade = true
  
  # Copy tags to snapshots
  copy_tags_to_snapshot = true
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-prismy-db-optimized"
    Type = "primary"
  })
}

# Read replica for load distribution
resource "aws_db_instance" "read_replica" {
  count = var.enable_read_replica ? var.read_replica_count : 0
  
  identifier = "${var.environment}-prismy-db-replica-${count.index + 1}"
  
  # Replica configuration
  replicate_source_db = aws_db_instance.main_optimized.identifier
  instance_class      = var.read_replica_instance_class
  
  # Performance configuration
  performance_insights_enabled = true
  performance_insights_kms_key_id = aws_kms_key.rds.arn
  
  # Enhanced monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn
  
  # Network configuration
  publicly_accessible = false
  
  # Auto scaling for read replicas
  auto_minor_version_upgrade = true
  
  # Availability zone distribution
  availability_zone = data.aws_availability_zones.available.names[count.index % length(data.aws_availability_zones.available.names)]
  
  tags = merge(var.common_tags, {
    Name = "${var.environment}-prismy-db-replica-${count.index + 1}"
    Type = "read-replica"
  })
}

# ===============================================
# Database Parameter Groups for Optimization
# ===============================================

resource "aws_db_parameter_group" "postgres_optimized" {
  family = "postgres15"
  name   = "${var.environment}-prismy-postgres-optimized"
  
  # Connection and memory settings
  parameter {
    name  = "max_connections"
    value = var.max_connections
  }
  
  parameter {
    name  = "shared_buffers"
    value = "{DBInstanceClassMemory/4}"
  }
  
  parameter {
    name  = "effective_cache_size"
    value = "{DBInstanceClassMemory*3/4}"
  }
  
  parameter {
    name  = "work_mem"
    value = "16384" # 16MB
  }
  
  parameter {
    name  = "maintenance_work_mem"
    value = "2097152" # 2GB
  }
  
  # Query optimization
  parameter {
    name  = "random_page_cost"
    value = "1.1" # SSD optimization
  }
  
  parameter {
    name  = "seq_page_cost"
    value = "1"
  }
  
  parameter {
    name  = "cpu_tuple_cost"
    value = "0.01"
  }
  
  parameter {
    name  = "cpu_index_tuple_cost"
    value = "0.005"
  }
  
  parameter {
    name  = "cpu_operator_cost"
    value = "0.0025"
  }
  
  # Checkpointing and WAL
  parameter {
    name  = "checkpoint_completion_target"
    value = "0.9"
  }
  
  parameter {
    name  = "wal_buffers"
    value = "16384" # 16MB
  }
  
  parameter {
    name  = "checkpoint_timeout"
    value = "900" # 15 minutes
  }
  
  parameter {
    name  = "max_wal_size"
    value = "4096" # 4GB
  }
  
  parameter {
    name  = "min_wal_size"
    value = "1024" # 1GB
  }
  
  # Background writer
  parameter {
    name  = "bgwriter_delay"
    value = "200"
  }
  
  parameter {
    name  = "bgwriter_lru_maxpages"
    value = "100"
  }
  
  parameter {
    name  = "bgwriter_lru_multiplier"
    value = "2.0"
  }
  
  # Vacuum and statistics
  parameter {
    name  = "autovacuum_vacuum_scale_factor"
    value = "0.1"
  }
  
  parameter {
    name  = "autovacuum_analyze_scale_factor"
    value = "0.05"
  }
  
  parameter {
    name  = "autovacuum_vacuum_cost_limit"
    value = "2000"
  }
  
  parameter {
    name  = "default_statistics_target"
    value = "100"
  }
  
  # Logging for optimization analysis
  parameter {
    name  = "log_statement"
    value = "ddl"
  }
  
  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log queries > 1 second
  }
  
  parameter {
    name  = "log_checkpoints"
    value = "1"
  }
  
  parameter {
    name  = "log_temp_files"
    value = "0" # Log all temp files
  }
  
  parameter {
    name  = "log_lock_waits"
    value = "1"
  }
  
  # Connection pooling optimization
  parameter {
    name  = "tcp_keepalives_idle"
    value = "600"
  }
  
  parameter {
    name  = "tcp_keepalives_interval"
    value = "30"
  }
  
  parameter {
    name  = "tcp_keepalives_count"
    value = "3"
  }
  
  tags = {
    Name = "${var.environment}-prismy-postgres-optimized"
  }
}

resource "aws_db_option_group" "postgres_optimized" {
  name                 = "${var.environment}-prismy-postgres-options"
  option_group_description = "Optimized option group for PostgreSQL"
  engine_name          = "postgres"
  major_engine_version = "15"
  
  tags = {
    Name = "${var.environment}-prismy-postgres-options"
  }
}

# ===============================================
# Enhanced Security Group for Optimized Database
# ===============================================

resource "aws_security_group" "rds_optimized" {
  name        = "${var.environment}-prismy-rds-optimized-sg"
  description = "Optimized security group for RDS database"
  vpc_id      = aws_vpc.main.id
  
  # Allow connections from application servers
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
    description     = "PostgreSQL from ECS tasks"
  }
  
  # Allow connections from read replica security group
  ingress {
    from_port = 5432
    to_port   = 5432
    protocol  = "tcp"
    self      = true
    description = "PostgreSQL replication traffic"
  }
  
  # Allow monitoring from CloudWatch
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
    description = "PostgreSQL monitoring"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }
  
  tags = {
    Name = "${var.environment}-prismy-rds-optimized-sg"
  }
}

# ===============================================
# Database Connection Pooling with PgBouncer
# ===============================================

resource "aws_ecs_service" "pgbouncer" {
  count = var.enable_connection_pooling ? 1 : 0
  
  name            = "${var.environment}-prismy-pgbouncer"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.pgbouncer[0].arn
  desired_count   = var.pgbouncer_desired_count
  
  # Load balancer configuration
  load_balancer {
    target_group_arn = aws_lb_target_group.pgbouncer[0].arn
    container_name   = "pgbouncer"
    container_port   = 5432
  }
  
  # Network configuration
  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.pgbouncer[0].id]
  }
  
  # Service discovery
  service_registries {
    registry_arn = aws_service_discovery_service.pgbouncer[0].arn
  }
  
  # Deployment configuration
  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }
  
  # Auto scaling
  enable_execute_command = true
  
  tags = {
    Name = "${var.environment}-prismy-pgbouncer"
  }
  
  depends_on = [
    aws_lb_listener.pgbouncer
  ]
}

resource "aws_ecs_task_definition" "pgbouncer" {
  count = var.enable_connection_pooling ? 1 : 0
  
  family                   = "${var.environment}-prismy-pgbouncer"
  requires_compatibilities = ["FARGATE"]
  network_mode            = "awsvpc"
  cpu                     = 256
  memory                  = 512
  execution_role_arn      = aws_iam_role.ecs_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn
  
  container_definitions = jsonencode([
    {
      name  = "pgbouncer"
      image = "pgbouncer/pgbouncer:latest"
      
      portMappings = [
        {
          containerPort = 5432
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "POOL_MODE"
          value = "transaction"
        },
        {
          name  = "MAX_CLIENT_CONN"
          value = "1000"
        },
        {
          name  = "DEFAULT_POOL_SIZE"
          value = "20"
        },
        {
          name  = "RESERVE_POOL_SIZE"
          value = "5"
        },
        {
          name  = "SERVER_LIFETIME"
          value = "3600"
        },
        {
          name  = "SERVER_IDLE_TIMEOUT"
          value = "600"
        }
      ]
      
      secrets = [
        {
          name      = "DATABASES_HOST"
          valueFrom = aws_secretsmanager_secret.db_connection.arn
        },
        {
          name      = "DATABASES_USER"
          valueFrom = "${aws_secretsmanager_secret.db_connection.arn}:username::"
        },
        {
          name      = "DATABASES_PASSWORD"
          valueFrom = "${aws_secretsmanager_secret.db_connection.arn}:password::"
        },
        {
          name      = "DATABASES_DBNAME"
          valueFrom = "${aws_secretsmanager_secret.db_connection.arn}:dbname::"
        }
      ]
      
      healthCheck = {
        command = [
          "CMD-SHELL",
          "pg_isready -h localhost -p 5432 -U pgbouncer"
        ]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.pgbouncer[0].name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
  
  tags = {
    Name = "${var.environment}-prismy-pgbouncer"
  }
}

# ===============================================
# Database Monitoring and Alerting
# ===============================================

# Enhanced monitoring IAM role
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${var.environment}-prismy-rds-monitoring-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name = "${var.environment}-prismy-rds-monitoring-role"
  }
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# CloudWatch alarms for database performance
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${var.environment}-prismy-db-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main_optimized.id
  }
  
  tags = {
    Name = "${var.environment}-prismy-db-cpu-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "${var.environment}-prismy-db-high-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.max_connections * 0.8
  alarm_description   = "This metric monitors RDS connection count"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main_optimized.id
  }
  
  tags = {
    Name = "${var.environment}-prismy-db-connections-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "database_read_latency" {
  alarm_name          = "${var.environment}-prismy-db-read-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReadLatency"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "0.2"
  alarm_description   = "This metric monitors RDS read latency"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main_optimized.id
  }
  
  tags = {
    Name = "${var.environment}-prismy-db-read-latency-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "database_write_latency" {
  alarm_name          = "${var.environment}-prismy-db-write-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "WriteLatency"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "0.2"
  alarm_description   = "This metric monitors RDS write latency"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main_optimized.id
  }
  
  tags = {
    Name = "${var.environment}-prismy-db-write-latency-alarm"
  }
}

# ===============================================
# Database Maintenance and Optimization
# ===============================================

# Lambda function for automated database maintenance
resource "aws_lambda_function" "db_maintenance" {
  count = var.enable_automated_maintenance ? 1 : 0
  
  filename         = "lambda/db-maintenance.zip"
  function_name    = "${var.environment}-prismy-db-maintenance"
  role            = aws_iam_role.db_maintenance[0].arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 300
  
  environment {
    variables = {
      DB_INSTANCE_ID = aws_db_instance.main_optimized.id
      SNS_TOPIC_ARN  = aws_sns_topic.alerts.arn
    }
  }
  
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda_db_maintenance[0].id]
  }
  
  tags = {
    Name = "${var.environment}-prismy-db-maintenance"
  }
}

# Schedule for automated maintenance
resource "aws_cloudwatch_event_rule" "db_maintenance_schedule" {
  count = var.enable_automated_maintenance ? 1 : 0
  
  name                = "${var.environment}-prismy-db-maintenance-schedule"
  description         = "Schedule for database maintenance tasks"
  schedule_expression = "cron(0 2 ? * SUN *)" # Weekly on Sunday at 2 AM
  
  tags = {
    Name = "${var.environment}-prismy-db-maintenance-schedule"
  }
}

resource "aws_cloudwatch_event_target" "db_maintenance_target" {
  count = var.enable_automated_maintenance ? 1 : 0
  
  rule      = aws_cloudwatch_event_rule.db_maintenance_schedule[0].name
  target_id = "DbMaintenanceTarget"
  arn       = aws_lambda_function.db_maintenance[0].arn
}

# ===============================================
# Outputs
# ===============================================

output "database_endpoint" {
  description = "Primary database endpoint"
  value       = aws_db_instance.main_optimized.endpoint
  sensitive   = true
}

output "database_replica_endpoints" {
  description = "Read replica endpoints"
  value       = aws_db_instance.read_replica[*].endpoint
  sensitive   = true
}

output "pgbouncer_endpoint" {
  description = "PgBouncer connection pooling endpoint"
  value       = var.enable_connection_pooling ? aws_lb.pgbouncer[0].dns_name : null
  sensitive   = true
}