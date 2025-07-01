# ===============================================
# CloudWatch Monitoring and Alerting
# Comprehensive observability for production
# ===============================================

# ===============================================
# CloudWatch Dashboards
# ===============================================
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.environment}-prismy-overview"

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
            ["AWS/ECS", "CPUUtilization", "ServiceName", aws_ecs_service.app.name, "ClusterName", aws_ecs_cluster.main.name],
            ["AWS/ECS", "MemoryUtilization", "ServiceName", aws_ecs_service.app.name, "ClusterName", aws_ecs_cluster.main.name],
            ["AWS/ECS", "CPUUtilization", "ServiceName", aws_ecs_service.worker.name, "ClusterName", aws_ecs_cluster.main.name],
            ["AWS/ECS", "MemoryUtilization", "ServiceName", aws_ecs_service.worker.name, "ClusterName", aws_ecs_cluster.main.name]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "ECS Service Metrics"
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
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", aws_lb.main.arn_suffix],
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.main.arn_suffix],
            ["AWS/ApplicationELB", "HTTPCode_Target_2XX_Count", "LoadBalancer", aws_lb.main.arn_suffix],
            ["AWS/ApplicationELB", "HTTPCode_Target_4XX_Count", "LoadBalancer", aws_lb.main.arn_suffix],
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", aws_lb.main.arn_suffix]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "ALB Metrics"
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
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.main.identifier],
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", aws_db_instance.main.identifier],
            ["AWS/RDS", "FreeableMemory", "DBInstanceIdentifier", aws_db_instance.main.identifier],
            ["AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", aws_db_instance.main.identifier]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "RDS Metrics"
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
          metrics = [
            ["AWS/ElastiCache", "CPUUtilization", "CacheClusterId", "${aws_elasticache_replication_group.main.replication_group_id}-001"],
            ["AWS/ElastiCache", "NetworkBytesIn", "CacheClusterId", "${aws_elasticache_replication_group.main.replication_group_id}-001"],
            ["AWS/ElastiCache", "NetworkBytesOut", "CacheClusterId", "${aws_elasticache_replication_group.main.replication_group_id}-001"],
            ["AWS/ElastiCache", "CurrConnections", "CacheClusterId", "${aws_elasticache_replication_group.main.replication_group_id}-001"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "ElastiCache Metrics"
          period  = 300
        }
      }
    ]
  })
}

# ===============================================
# CloudWatch Alarms - Application Performance
# ===============================================
resource "aws_cloudwatch_metric_alarm" "high_cpu_app" {
  alarm_name          = "${var.environment}-prismy-app-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS app CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    ServiceName = aws_ecs_service.app.name
    ClusterName = aws_ecs_cluster.main.name
  }

  tags = {
    Name = "${var.environment}-prismy-app-high-cpu"
  }
}

resource "aws_cloudwatch_metric_alarm" "high_memory_app" {
  alarm_name          = "${var.environment}-prismy-app-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS app memory utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    ServiceName = aws_ecs_service.app.name
    ClusterName = aws_ecs_cluster.main.name
  }

  tags = {
    Name = "${var.environment}-prismy-app-high-memory"
  }
}

# ===============================================
# CloudWatch Alarms - Load Balancer
# ===============================================
resource "aws_cloudwatch_metric_alarm" "high_response_time" {
  alarm_name          = "${var.environment}-prismy-high-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "2"
  alarm_description   = "This metric monitors ALB response time"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name = "${var.environment}-prismy-high-response-time"
  }
}

resource "aws_cloudwatch_metric_alarm" "high_5xx_errors" {
  alarm_name          = "${var.environment}-prismy-high-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors 5XX errors from ALB"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Name = "${var.environment}-prismy-high-5xx-errors"
  }
}

# ===============================================
# CloudWatch Alarms - Database
# ===============================================
resource "aws_cloudwatch_metric_alarm" "rds_high_cpu" {
  alarm_name          = "${var.environment}-prismy-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = {
    Name = "${var.environment}-prismy-rds-high-cpu"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_low_free_memory" {
  alarm_name          = "${var.environment}-prismy-rds-low-free-memory"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeableMemory"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "1073741824"  # 1GB in bytes
  alarm_description   = "This metric monitors RDS free memory"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = {
    Name = "${var.environment}-prismy-rds-low-free-memory"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_high_connections" {
  alarm_name          = "${var.environment}-prismy-rds-high-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS connection count"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = {
    Name = "${var.environment}-prismy-rds-high-connections"
  }
}

# ===============================================
# CloudWatch Alarms - Redis
# ===============================================
resource "aws_cloudwatch_metric_alarm" "redis_high_cpu" {
  alarm_name          = "${var.environment}-prismy-redis-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors Redis CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    CacheClusterId = "${aws_elasticache_replication_group.main.replication_group_id}-001"
  }

  tags = {
    Name = "${var.environment}-prismy-redis-high-cpu"
  }
}

# ===============================================
# SNS Topic for Alerts
# ===============================================
resource "aws_sns_topic" "alerts" {
  name = "${var.environment}-prismy-alerts"

  tags = {
    Name = "${var.environment}-prismy-alerts"
  }
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

resource "aws_sns_topic_subscription" "slack" {
  count     = var.slack_webhook_url != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "https"
  endpoint  = var.slack_webhook_url
}

# ===============================================
# Custom Application Metrics
# ===============================================
resource "aws_cloudwatch_log_metric_filter" "api_errors" {
  name           = "${var.environment}-prismy-api-errors"
  log_group_name = aws_cloudwatch_log_group.app.name
  pattern        = "[timestamp, requestId, level=\"ERROR\", ...]"

  metric_transformation {
    name      = "APIErrors"
    namespace = "Prismy/Application"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "api_errors" {
  alarm_name          = "${var.environment}-prismy-api-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "APIErrors"
  namespace           = "Prismy/Application"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors API errors from application logs"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = {
    Name = "${var.environment}-prismy-api-errors"
  }
}

# ===============================================
# CloudWatch Log Insights Queries
# ===============================================
resource "aws_cloudwatch_query_definition" "slow_queries" {
  name = "${var.environment}-prismy-slow-queries"

  log_group_names = [
    aws_cloudwatch_log_group.app.name
  ]

  query_string = <<EOF
fields @timestamp, @message
| filter @message like /slow query/
| sort @timestamp desc
| limit 100
EOF
}

resource "aws_cloudwatch_query_definition" "error_analysis" {
  name = "${var.environment}-prismy-error-analysis"

  log_group_names = [
    aws_cloudwatch_log_group.app.name
  ]

  query_string = <<EOF
fields @timestamp, @message, level
| filter level = "ERROR"
| stats count() by bin(5m)
| sort @timestamp desc
EOF
}

# ===============================================
# X-Ray Tracing (Optional)
# ===============================================
resource "aws_xray_sampling_rule" "prismy" {
  count       = var.environment == "production" ? 1 : 0
  rule_name   = "${var.environment}-prismy-sampling"
  priority    = 9000
  version     = 1
  reservoir   = 1
  fixed_rate  = 0.1
  url_path    = "*"
  host        = "*"
  http_method = "*"
  service_name = "prismy-app"
  service_type = "AWS::ECS::Service"
  resource_arn = "*"

  tags = {
    Name = "${var.environment}-prismy-xray-sampling"
  }
}

# ===============================================
# EventBridge Rules for Automated Responses
# ===============================================
resource "aws_cloudwatch_event_rule" "ecs_state_change" {
  name        = "${var.environment}-prismy-ecs-state-change"
  description = "Capture ECS task state changes"

  event_pattern = jsonencode({
    source      = ["aws.ecs"]
    detail-type = ["ECS Task State Change"]
    detail = {
      clusterArn = [aws_ecs_cluster.main.arn]
    }
  })

  tags = {
    Name = "${var.environment}-prismy-ecs-state-change"
  }
}

resource "aws_cloudwatch_event_target" "sns" {
  rule      = aws_cloudwatch_event_rule.ecs_state_change.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.alerts.arn
}

# ===============================================
# CloudWatch Composite Alarms
# ===============================================
resource "aws_cloudwatch_composite_alarm" "application_health" {
  alarm_name        = "${var.environment}-prismy-application-health"
  alarm_description = "Composite alarm for overall application health"

  alarm_rule = join(" OR ", [
    "ALARM(${aws_cloudwatch_metric_alarm.high_cpu_app.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.high_memory_app.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.high_response_time.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.high_5xx_errors.alarm_name})"
  ])

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = {
    Name = "${var.environment}-prismy-application-health"
  }
}