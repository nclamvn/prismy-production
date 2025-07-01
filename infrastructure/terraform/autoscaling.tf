# ===============================================
# Auto Scaling Configuration
# Dynamic scaling based on load and performance
# ===============================================

# ===============================================
# CloudWatch Alarms for Auto Scaling
# ===============================================

# High CPU Alarm for App Service
resource "aws_cloudwatch_metric_alarm" "app_cpu_high" {
  alarm_name          = "${var.environment}-prismy-app-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.autoscaling_target_cpu
  alarm_description   = "Triggers when app CPU exceeds ${var.autoscaling_target_cpu}%"

  dimensions = {
    ServiceName = aws_ecs_service.app.name
    ClusterName = aws_ecs_cluster.main.name
  }

  tags = {
    Name = "${var.environment}-prismy-app-cpu-high"
  }
}

# Low CPU Alarm for App Service
resource "aws_cloudwatch_metric_alarm" "app_cpu_low" {
  alarm_name          = "${var.environment}-prismy-app-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.autoscaling_target_cpu - 20
  alarm_description   = "Triggers when app CPU falls below ${var.autoscaling_target_cpu - 20}%"

  dimensions = {
    ServiceName = aws_ecs_service.app.name
    ClusterName = aws_ecs_cluster.main.name
  }

  tags = {
    Name = "${var.environment}-prismy-app-cpu-low"
  }
}

# High Memory Alarm for App Service
resource "aws_cloudwatch_metric_alarm" "app_memory_high" {
  alarm_name          = "${var.environment}-prismy-app-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.autoscaling_target_memory
  alarm_description   = "Triggers when app memory exceeds ${var.autoscaling_target_memory}%"

  dimensions = {
    ServiceName = aws_ecs_service.app.name
    ClusterName = aws_ecs_cluster.main.name
  }

  tags = {
    Name = "${var.environment}-prismy-app-memory-high"
  }
}

# Request Count Based Scaling Alarm
resource "aws_cloudwatch_metric_alarm" "app_requests_high" {
  alarm_name          = "${var.environment}-prismy-app-requests-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "RequestCountPerTarget"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1000"
  alarm_description   = "Triggers when requests per target exceed 1000"

  dimensions = {
    TargetGroup = aws_lb_target_group.app.arn_suffix
  }

  tags = {
    Name = "${var.environment}-prismy-app-requests-high"
  }
}

# Response Time Based Scaling Alarm
resource "aws_cloudwatch_metric_alarm" "app_response_time_high" {
  alarm_name          = "${var.environment}-prismy-app-response-time-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "Triggers when average response time exceeds 1 second"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.app.arn_suffix
  }

  tags = {
    Name = "${var.environment}-prismy-app-response-time-high"
  }
}

# ===============================================
# Step Scaling Policies
# ===============================================

# Step Scaling Policy for Scale Out
resource "aws_appautoscaling_policy" "app_scale_out" {
  count              = var.enable_auto_scaling ? 1 : 0
  name               = "${var.environment}-prismy-app-scale-out"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.app[0].resource_id
  scalable_dimension = aws_appautoscaling_target.app[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.app[0].service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "PercentChangeInCapacity"
    cooldown               = 300
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_lower_bound = 0
      metric_interval_upper_bound = 10
      scaling_adjustment         = 10
    }

    step_adjustment {
      metric_interval_lower_bound = 10
      metric_interval_upper_bound = 20
      scaling_adjustment         = 20
    }

    step_adjustment {
      metric_interval_lower_bound = 20
      scaling_adjustment         = 30
    }
  }
}

# Step Scaling Policy for Scale In
resource "aws_appautoscaling_policy" "app_scale_in" {
  count              = var.enable_auto_scaling ? 1 : 0
  name               = "${var.environment}-prismy-app-scale-in"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.app[0].resource_id
  scalable_dimension = aws_appautoscaling_target.app[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.app[0].service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "PercentChangeInCapacity"
    cooldown               = 300
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_upper_bound = 0
      scaling_adjustment         = -10
    }
  }
}

# ===============================================
# Scheduled Scaling Actions
# ===============================================

# Scale up before business hours
resource "aws_appautoscaling_scheduled_action" "app_scale_up_morning" {
  count              = var.enable_auto_scaling ? 1 : 0
  name               = "${var.environment}-prismy-app-scale-up-morning"
  service_namespace  = aws_appautoscaling_target.app[0].service_namespace
  resource_id        = aws_appautoscaling_target.app[0].resource_id
  scalable_dimension = aws_appautoscaling_target.app[0].scalable_dimension
  schedule           = "cron(0 7 ? * MON-FRI *)"  # 7 AM UTC Mon-Fri
  timezone           = "UTC"

  scalable_target_action {
    min_capacity = var.autoscaling_min_capacity * 2
    max_capacity = var.autoscaling_max_capacity
  }
}

# Scale down after business hours
resource "aws_appautoscaling_scheduled_action" "app_scale_down_evening" {
  count              = var.enable_auto_scaling ? 1 : 0
  name               = "${var.environment}-prismy-app-scale-down-evening"
  service_namespace  = aws_appautoscaling_target.app[0].service_namespace
  resource_id        = aws_appautoscaling_target.app[0].resource_id
  scalable_dimension = aws_appautoscaling_target.app[0].scalable_dimension
  schedule           = "cron(0 20 ? * MON-FRI *)"  # 8 PM UTC Mon-Fri
  timezone           = "UTC"

  scalable_target_action {
    min_capacity = var.autoscaling_min_capacity
    max_capacity = var.autoscaling_max_capacity / 2
  }
}

# Scale down on weekends
resource "aws_appautoscaling_scheduled_action" "app_scale_down_weekend" {
  count              = var.enable_auto_scaling ? 1 : 0
  name               = "${var.environment}-prismy-app-scale-down-weekend"
  service_namespace  = aws_appautoscaling_target.app[0].service_namespace
  resource_id        = aws_appautoscaling_target.app[0].resource_id
  scalable_dimension = aws_appautoscaling_target.app[0].scalable_dimension
  schedule           = "cron(0 0 ? * SAT *)"  # Midnight UTC Saturday
  timezone           = "UTC"

  scalable_target_action {
    min_capacity = 1
    max_capacity = var.autoscaling_max_capacity / 4
  }
}

# ===============================================
# RDS Auto Scaling
# ===============================================

# Enable RDS storage autoscaling (handled in main.tf via max_allocated_storage)

# RDS Read Replica Auto Scaling (if using Aurora)
resource "aws_appautoscaling_target" "rds_read_replicas" {
  count              = var.environment == "production" && var.enable_rds_read_replica_scaling ? 1 : 0
  max_capacity       = 5
  min_capacity       = 1
  resource_id        = "cluster:${aws_rds_cluster.main[0].cluster_identifier}"
  scalable_dimension = "rds:cluster:ReadReplicaCount"
  service_namespace  = "rds"
}

resource "aws_appautoscaling_policy" "rds_cpu_scaling" {
  count              = var.environment == "production" && var.enable_rds_read_replica_scaling ? 1 : 0
  name               = "${var.environment}-prismy-rds-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.rds_read_replicas[0].resource_id
  scalable_dimension = aws_appautoscaling_target.rds_read_replicas[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.rds_read_replicas[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "RDSReaderAverageCPUUtilization"
    }
    target_value = 70
  }
}

# ===============================================
# ElastiCache Auto Scaling
# ===============================================

# ElastiCache doesn't support auto-scaling for Redis clusters
# Consider using ElastiCache for Redis with Cluster Mode for sharding

# ===============================================
# Lambda Functions for Custom Scaling Logic
# ===============================================

# Lambda function for custom scaling decisions
resource "aws_lambda_function" "custom_scaling" {
  count            = var.enable_custom_scaling ? 1 : 0
  filename         = "lambda/custom-scaling.zip"
  function_name    = "${var.environment}-prismy-custom-scaling"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("lambda/custom-scaling.zip")
  runtime         = "nodejs18.x"
  timeout         = 60

  environment {
    variables = {
      CLUSTER_NAME = aws_ecs_cluster.main.name
      SERVICE_NAME = aws_ecs_service.app.name
      MIN_CAPACITY = var.autoscaling_min_capacity
      MAX_CAPACITY = var.autoscaling_max_capacity
    }
  }

  tags = {
    Name = "${var.environment}-prismy-custom-scaling"
  }
}

# EventBridge rule to trigger custom scaling
resource "aws_cloudwatch_event_rule" "custom_scaling_trigger" {
  count               = var.enable_custom_scaling ? 1 : 0
  name                = "${var.environment}-prismy-custom-scaling-trigger"
  description         = "Trigger custom scaling logic"
  schedule_expression = "rate(5 minutes)"

  tags = {
    Name = "${var.environment}-prismy-custom-scaling-trigger"
  }
}

resource "aws_cloudwatch_event_target" "lambda" {
  count     = var.enable_custom_scaling ? 1 : 0
  rule      = aws_cloudwatch_event_rule.custom_scaling_trigger[0].name
  target_id = "CustomScalingLambda"
  arn       = aws_lambda_function.custom_scaling[0].arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  count         = var.enable_custom_scaling ? 1 : 0
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.custom_scaling[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.custom_scaling_trigger[0].arn
}

# ===============================================
# Predictive Scaling (if available)
# ===============================================

resource "aws_autoscaling_policy" "predictive_scaling" {
  count                  = var.enable_predictive_scaling ? 1 : 0
  name                   = "${var.environment}-prismy-predictive-scaling"
  autoscaling_group_name = aws_autoscaling_group.ecs_asg[0].name
  policy_type            = "PredictiveScaling"

  predictive_scaling_configuration {
    metric_specification {
      target_value = 70
      
      predefined_metric_pair_specification {
        predefined_metric_type = "ASGCPUUtilization"
      }
    }
    
    mode                         = "ForecastAndScale"
    scheduling_buffer_time       = 600
    max_capacity_breach_behavior = "IncreaseMaxCapacity"
    max_capacity_buffer          = 10
  }
}

# ===============================================
# Auto Scaling Notifications
# ===============================================

resource "aws_autoscaling_notification" "scaling_notifications" {
  count = var.enable_auto_scaling ? 1 : 0

  group_names = [
    aws_autoscaling_group.ecs_asg[0].name
  ]

  notifications = [
    "autoscaling:EC2_INSTANCE_LAUNCH",
    "autoscaling:EC2_INSTANCE_TERMINATE",
    "autoscaling:EC2_INSTANCE_LAUNCH_ERROR",
    "autoscaling:EC2_INSTANCE_TERMINATE_ERROR",
  ]

  topic_arn = aws_sns_topic.scaling_events.arn
}

resource "aws_sns_topic" "scaling_events" {
  name = "${var.environment}-prismy-scaling-events"

  tags = {
    Name = "${var.environment}-prismy-scaling-events"
  }
}

resource "aws_sns_topic_subscription" "scaling_email" {
  topic_arn = aws_sns_topic.scaling_events.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# ===============================================
# Custom Metrics for Scaling
# ===============================================

# CloudWatch Log Metric Filter for Active Users
resource "aws_cloudwatch_log_metric_filter" "active_users" {
  name           = "${var.environment}-prismy-active-users"
  log_group_name = aws_cloudwatch_log_group.app.name
  pattern        = "[timestamp, request_id, user_id != \"-\", ...]"

  metric_transformation {
    name      = "ActiveUsers"
    namespace = "Prismy/Application"
    value     = "1"
    dimensions = {
      Environment = var.environment
    }
  }
}

# CloudWatch Metric for Queue Depth
resource "aws_cloudwatch_log_metric_filter" "queue_depth" {
  name           = "${var.environment}-prismy-queue-depth"
  log_group_name = aws_cloudwatch_log_group.app.name
  pattern        = "[timestamp, request_id, event_type = \"QUEUE_DEPTH\", queue_name, depth]"

  metric_transformation {
    name      = "QueueDepth"
    namespace = "Prismy/Application"
    value     = "$depth"
    dimensions = {
      QueueName = "$queue_name"
    }
  }
}

# Custom scaling policy based on queue depth
resource "aws_appautoscaling_policy" "worker_queue_scaling" {
  count              = var.enable_auto_scaling ? 1 : 0
  name               = "${var.environment}-prismy-worker-queue-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.worker[0].resource_id
  scalable_dimension = aws_appautoscaling_target.worker[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.worker[0].service_namespace

  target_tracking_scaling_policy_configuration {
    customized_metric_specification {
      metric_name = "QueueDepth"
      namespace   = "Prismy/Application"
      statistic   = "Average"
      dimensions {
        name  = "QueueName"
        value = "translation-jobs"
      }
    }
    target_value       = 100
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}