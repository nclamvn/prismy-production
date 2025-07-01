# ===============================================
# Database Monitoring and Dashboards
# ===============================================

# CloudWatch Dashboard for Database Performance
resource "aws_cloudwatch_dashboard" "database_performance" {
  dashboard_name = "${var.environment}-prismy-database-performance"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.main_optimized.id],
            [".", "DatabaseConnections", ".", "."],
            [".", "ReadLatency", ".", "."],
            [".", "WriteLatency", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Database Performance Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/RDS", "ReadIOPS", "DBInstanceIdentifier", aws_db_instance.main_optimized.id],
            [".", "WriteIOPS", ".", "."],
            [".", "ReadThroughput", ".", "."],
            [".", "WriteThroughput", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Database I/O Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/RDS", "FreeableMemory", "DBInstanceIdentifier", aws_db_instance.main_optimized.id],
            [".", "FreeStorageSpace", ".", "."],
            [".", "SwapUsage", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Database Memory and Storage"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        
        properties = {
          metrics = concat(
            [
              for replica in aws_db_instance.read_replica : [
                "AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", replica.id
              ]
            ],
            [
              for replica in aws_db_instance.read_replica : [
                "AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", replica.id
              ]
            ]
          )
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Read Replica Performance"
          period  = 300
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 12
        width  = 24
        height = 6
        
        properties = {
          query   = "SOURCE '/aws/rds/instance/${aws_db_instance.main_optimized.id}/postgresql'\n| fields @timestamp, @message\n| filter @message like /ERROR/\n| sort @timestamp desc\n| limit 100"
          region  = var.aws_region
          title   = "Database Error Logs"
        }
      }
    ]
  })
}

# CloudWatch Dashboard for Connection Pooling
resource "aws_cloudwatch_dashboard" "connection_pooling" {
  count = var.enable_connection_pooling ? 1 : 0
  
  dashboard_name = "${var.environment}-prismy-connection-pooling"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", aws_ecs_service.pgbouncer[0].name, "ClusterName", aws_ecs_cluster.main.name],
            [".", "MemoryUtilization", ".", ".", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "PgBouncer Resource Utilization"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", aws_lb.pgbouncer[0].arn_suffix],
            [".", "HealthyHostCount", ".", "."],
            [".", "UnHealthyHostCount", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "PgBouncer Load Balancer Metrics"
          period  = 300
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 6
        width  = 24
        height = 6
        
        properties = {
          query   = "SOURCE '${aws_cloudwatch_log_group.pgbouncer[0].name}'\n| fields @timestamp, @message\n| filter @message like /pool/\n| stats count() by bin(5m)\n| sort @timestamp desc"
          region  = var.aws_region
          title   = "PgBouncer Connection Pool Activity"
        }
      }
    ]
  })
}

# Custom metrics for database maintenance
resource "aws_cloudwatch_metric_alarm" "database_maintenance_failure" {
  count = var.enable_automated_maintenance ? 1 : 0
  
  alarm_name          = "${var.environment}-prismy-db-maintenance-failure"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Database maintenance Lambda function failed"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    FunctionName = aws_lambda_function.db_maintenance[0].function_name
  }
  
  tags = {
    Name = "${var.environment}-prismy-db-maintenance-failure-alarm"
  }
}

# Performance Insights monitoring
resource "aws_cloudwatch_metric_alarm" "performance_insights_cpu_utilization" {
  alarm_name          = "${var.environment}-prismy-pi-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DBLoad"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Database load is high based on Performance Insights"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main_optimized.id
  }
  
  tags = {
    Name = "${var.environment}-prismy-pi-cpu-alarm"
  }
}

# Database storage space monitoring
resource "aws_cloudwatch_metric_alarm" "database_storage_space" {
  alarm_name          = "${var.environment}-prismy-db-storage-space"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10737418240" # 10GB in bytes
  alarm_description   = "Database free storage space is low"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main_optimized.id
  }
  
  tags = {
    Name = "${var.environment}-prismy-db-storage-alarm"
  }
}

# Connection count monitoring
resource "aws_cloudwatch_metric_alarm" "database_connection_count" {
  alarm_name          = "${var.environment}-prismy-db-connection-count"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.max_connections * 0.8
  alarm_description   = "Database connection count is approaching limit"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main_optimized.id
  }
  
  tags = {
    Name = "${var.environment}-prismy-db-connection-alarm"
  }
}

# Read replica lag monitoring
resource "aws_cloudwatch_metric_alarm" "read_replica_lag" {
  count = var.enable_read_replica ? var.read_replica_count : 0
  
  alarm_name          = "${var.environment}-prismy-replica-${count.index + 1}-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "300" # 5 minutes in seconds
  alarm_description   = "Read replica lag is high"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.read_replica[count.index].id
  }
  
  tags = {
    Name = "${var.environment}-prismy-replica-${count.index + 1}-lag-alarm"
  }
}

# Custom CloudWatch metric for slow query analysis
resource "aws_cloudwatch_log_metric_filter" "slow_query_count" {
  name           = "${var.environment}-prismy-slow-query-count"
  log_group_name = "/aws/rds/instance/${aws_db_instance.main_optimized.id}/postgresql"
  pattern        = "[timestamp, timezone, pid, sessionid, lineno, commandtag, sessionstart, vxid, txid, severity=\"LOG:\", message=\"duration:*ms*\"]"
  
  metric_transformation {
    name      = "SlowQueryCount"
    namespace = "Prismy/Database"
    value     = "1"
    
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "slow_query_alarm" {
  alarm_name          = "${var.environment}-prismy-slow-query-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "SlowQueryCount"
  namespace           = "Prismy/Database"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "High number of slow queries detected"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  tags = {
    Name = "${var.environment}-prismy-slow-query-alarm"
  }
}

# Database deadlock monitoring
resource "aws_cloudwatch_log_metric_filter" "deadlock_count" {
  name           = "${var.environment}-prismy-deadlock-count"
  log_group_name = "/aws/rds/instance/${aws_db_instance.main_optimized.id}/postgresql"
  pattern        = "[timestamp, timezone, pid, sessionid, lineno, commandtag, sessionstart, vxid, txid, severity=\"ERROR:\", message=\"*deadlock*\"]"
  
  metric_transformation {
    name      = "DeadlockCount"
    namespace = "Prismy/Database"
    value     = "1"
    
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "deadlock_alarm" {
  alarm_name          = "${var.environment}-prismy-deadlock-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "DeadlockCount"
  namespace           = "Prismy/Database"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Database deadlock detected"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  tags = {
    Name = "${var.environment}-prismy-deadlock-alarm"
  }
}

# Lambda function for database performance analysis
resource "aws_lambda_function" "db_performance_analyzer" {
  count = var.enable_performance_testing ? 1 : 0
  
  filename         = "lambda/db-performance-analyzer.zip"
  function_name    = "${var.environment}-prismy-db-performance-analyzer"
  role            = aws_iam_role.db_performance_analyzer[0].arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 900 # 15 minutes
  memory_size     = 512
  
  environment {
    variables = {
      DB_INSTANCE_ID = aws_db_instance.main_optimized.id
      SNS_TOPIC_ARN  = aws_sns_topic.alerts.arn
      CLOUDWATCH_NAMESPACE = "Prismy/Database/Performance"
    }
  }
  
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda_db_maintenance[0].id]
  }
  
  tags = {
    Name = "${var.environment}-prismy-db-performance-analyzer"
  }
}

# IAM role for performance analyzer Lambda
resource "aws_iam_role" "db_performance_analyzer" {
  count = var.enable_performance_testing ? 1 : 0
  
  name = "${var.environment}-prismy-db-performance-analyzer-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name = "${var.environment}-prismy-db-performance-analyzer-role"
  }
}

resource "aws_iam_role_policy_attachment" "db_performance_analyzer_vpc" {
  count = var.enable_performance_testing ? 1 : 0
  
  role       = aws_iam_role.db_performance_analyzer[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "db_performance_analyzer" {
  count = var.enable_performance_testing ? 1 : 0
  
  name = "${var.environment}-prismy-db-performance-analyzer-policy"
  role = aws_iam_role.db_performance_analyzer[0].id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:DescribeDBClusters",
          "pi:GetResourceMetrics",
          "pi:DescribeDimensionKeys",
          "pi:GetDimensionKeyDetails"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricStatistics"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.db_monitoring.arn,
          "${aws_secretsmanager_secret.db_monitoring.arn}*"
        ]
      }
    ]
  })
}

# Schedule for performance analysis
resource "aws_cloudwatch_event_rule" "db_performance_analysis_schedule" {
  count = var.enable_performance_testing ? 1 : 0
  
  name                = "${var.environment}-prismy-db-performance-analysis-schedule"
  description         = "Schedule for database performance analysis"
  schedule_expression = var.performance_test_schedule
  
  tags = {
    Name = "${var.environment}-prismy-db-performance-analysis-schedule"
  }
}

resource "aws_cloudwatch_event_target" "db_performance_analysis_target" {
  count = var.enable_performance_testing ? 1 : 0
  
  rule      = aws_cloudwatch_event_rule.db_performance_analysis_schedule[0].name
  target_id = "DbPerformanceAnalysisTarget"
  arn       = aws_lambda_function.db_performance_analyzer[0].arn
}

resource "aws_lambda_permission" "allow_eventbridge_db_performance_analysis" {
  count = var.enable_performance_testing ? 1 : 0
  
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.db_performance_analyzer[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.db_performance_analysis_schedule[0].arn
}