# ===============================================
# ECS Task Definitions and Services
# ===============================================

# ===============================================
# Secrets Manager for Application Secrets
# ===============================================
resource "aws_secretsmanager_secret" "app_secrets" {
  name        = "${var.environment}-prismy-app-secrets"
  description = "Application secrets for Prismy ${var.environment}"
  
  tags = {
    Name = "${var.environment}-prismy-app-secrets"
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    NEXTAUTH_SECRET           = var.nextauth_secret
    SUPABASE_URL             = var.supabase_url
    SUPABASE_ANON_KEY        = var.supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY = var.supabase_service_role_key
    STRIPE_SECRET_KEY        = var.stripe_secret_key
    STRIPE_WEBHOOK_SECRET    = var.stripe_webhook_secret
    OPENAI_API_KEY           = var.openai_api_key
    RESEND_API_KEY           = var.resend_api_key
  })
}

resource "aws_secretsmanager_secret" "db_password" {
  name        = "${var.environment}-prismy-db-password"
  description = "Database password for Prismy ${var.environment}"
  
  tags = {
    Name = "${var.environment}-prismy-db-password"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = var.db_password
}

resource "aws_secretsmanager_secret" "redis_auth_token" {
  name        = "${var.environment}-prismy-redis-auth-token"
  description = "Redis auth token for Prismy ${var.environment}"
  
  tags = {
    Name = "${var.environment}-prismy-redis-auth-token"
  }
}

resource "aws_secretsmanager_secret_version" "redis_auth_token" {
  secret_id     = aws_secretsmanager_secret.redis_auth_token.id
  secret_string = var.redis_auth_token
}

# ===============================================
# KMS Key for Encryption
# ===============================================
resource "aws_kms_key" "main" {
  description             = "KMS key for Prismy ${var.environment} encryption"
  deletion_window_in_days = var.kms_key_deletion_window
  
  tags = {
    Name = "${var.environment}-prismy-kms-key"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.environment}-prismy"
  target_key_id = aws_kms_key.main.key_id
}

# ===============================================
# ECR Repository
# ===============================================
resource "aws_ecr_repository" "app" {
  name                 = "${var.environment}-prismy-app"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  lifecycle_policy {
    policy = jsonencode({
      rules = [
        {
          rulePriority = 1
          description  = "Keep last 30 images"
          selection = {
            tagStatus     = "tagged"
            tagPrefixList = ["v"]
            countType     = "imageCountMoreThan"
            countNumber   = 30
          }
          action = {
            type = "expire"
          }
        }
      ]
    })
  }

  tags = {
    Name = "${var.environment}-prismy-app-ecr"
  }
}

resource "aws_ecr_repository" "worker" {
  name                 = "${var.environment}-prismy-worker"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  lifecycle_policy {
    policy = jsonencode({
      rules = [
        {
          rulePriority = 1
          description  = "Keep last 30 images"
          selection = {
            tagStatus     = "tagged"
            tagPrefixList = ["v"]
            countType     = "imageCountMoreThan"
            countNumber   = 30
          }
          action = {
            type = "expire"
          }
        }
      ]
    })
  }

  tags = {
    Name = "${var.environment}-prismy-worker-ecr"
  }
}

# ===============================================
# ECS Task Definition - Application
# ===============================================
resource "aws_ecs_task_definition" "app" {
  family                   = "${var.environment}-prismy-app"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_app_cpu
  memory                   = var.ecs_app_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "prismy-app"
      image     = "${aws_ecr_repository.app.repository_url}:${var.app_image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "3000"
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
        {
          name  = "S3_BUCKET_NAME"
          value = aws_s3_bucket.app_storage.bucket
        },
        {
          name  = "S3_REGION"
          value = var.aws_region
        },
        {
          name  = "CLOUDFRONT_DISTRIBUTION_ID"
          value = aws_cloudfront_distribution.main.id
        }
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = aws_secretsmanager_secret.db_password.arn
        },
        {
          name      = "REDIS_URL"
          valueFrom = aws_secretsmanager_secret.redis_auth_token.arn
        },
        {
          name      = "NEXTAUTH_SECRET"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:NEXTAUTH_SECRET::"
        },
        {
          name      = "SUPABASE_URL"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:SUPABASE_URL::"
        },
        {
          name      = "SUPABASE_ANON_KEY"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:SUPABASE_ANON_KEY::"
        },
        {
          name      = "SUPABASE_SERVICE_ROLE_KEY"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:SUPABASE_SERVICE_ROLE_KEY::"
        },
        {
          name      = "STRIPE_SECRET_KEY"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:STRIPE_SECRET_KEY::"
        },
        {
          name      = "STRIPE_WEBHOOK_SECRET"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:STRIPE_WEBHOOK_SECRET::"
        },
        {
          name      = "OPENAI_API_KEY"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:OPENAI_API_KEY::"
        },
        {
          name      = "RESEND_API_KEY"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:RESEND_API_KEY::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command = [
          "CMD-SHELL",
          "curl -f http://localhost:3000/api/health || exit 1"
        ]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "${var.environment}-prismy-app-task"
  }
}

# ===============================================
# ECS Task Definition - Worker
# ===============================================
resource "aws_ecs_task_definition" "worker" {
  family                   = "${var.environment}-prismy-worker"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.ecs_worker_cpu
  memory                   = var.ecs_worker_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "prismy-worker"
      image     = "${aws_ecr_repository.worker.repository_url}:${var.worker_image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = 3001
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "3001"
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
        {
          name  = "S3_BUCKET_NAME"
          value = aws_s3_bucket.app_storage.bucket
        },
        {
          name  = "WORKER_CONCURRENCY"
          value = "5"
        }
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = aws_secretsmanager_secret.db_password.arn
        },
        {
          name      = "REDIS_URL"
          valueFrom = aws_secretsmanager_secret.redis_auth_token.arn
        },
        {
          name      = "OPENAI_API_KEY"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:OPENAI_API_KEY::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.worker.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command = [
          "CMD-SHELL",
          "curl -f http://localhost:3001/health || exit 1"
        ]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "${var.environment}-prismy-worker-task"
  }
}

# ===============================================
# CloudWatch Log Groups for ECS Services
# ===============================================
resource "aws_cloudwatch_log_group" "worker" {
  name              = "/aws/ecs/${var.environment}-prismy-worker"
  retention_in_days = var.cloudwatch_log_retention

  tags = {
    Name = "${var.environment}-prismy-worker-logs"
  }
}

# ===============================================
# ECS Service - Application
# ===============================================
resource "aws_ecs_service" "app" {
  name            = "${var.environment}-prismy-app"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.ecs_app_count
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs.id]
    subnets          = aws_subnet.private[*].id
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "prismy-app"
    container_port   = 3000
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
    
    deployment_circuit_breaker {
      enable   = true
      rollback = true
    }
  }

  deployment_controller {
    type = "ECS"
  }

  enable_execute_command = true

  depends_on = [aws_lb_listener.app]

  tags = {
    Name = "${var.environment}-prismy-app-service"
  }
}

# ===============================================
# ECS Service - Worker
# ===============================================
resource "aws_ecs_service" "worker" {
  name            = "${var.environment}-prismy-worker"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker.arn
  desired_count   = var.ecs_worker_count
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs.id]
    subnets          = aws_subnet.private[*].id
    assign_public_ip = false
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 50
    
    deployment_circuit_breaker {
      enable   = true
      rollback = true
    }
  }

  deployment_controller {
    type = "ECS"
  }

  enable_execute_command = true

  tags = {
    Name = "${var.environment}-prismy-worker-service"
  }
}

# ===============================================
# Auto Scaling for Application Service
# ===============================================
resource "aws_appautoscaling_target" "app" {
  count              = var.enable_auto_scaling ? 1 : 0
  max_capacity       = var.autoscaling_max_capacity
  min_capacity       = var.autoscaling_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  tags = {
    Name = "${var.environment}-prismy-app-autoscaling-target"
  }
}

resource "aws_appautoscaling_policy" "app_cpu" {
  count              = var.enable_auto_scaling ? 1 : 0
  name               = "${var.environment}-prismy-app-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.app[0].resource_id
  scalable_dimension = aws_appautoscaling_target.app[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.app[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = var.autoscaling_target_cpu
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}

resource "aws_appautoscaling_policy" "app_memory" {
  count              = var.enable_auto_scaling ? 1 : 0
  name               = "${var.environment}-prismy-app-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.app[0].resource_id
  scalable_dimension = aws_appautoscaling_target.app[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.app[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value = var.autoscaling_target_memory
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}

# ===============================================
# Auto Scaling for Worker Service
# ===============================================
resource "aws_appautoscaling_target" "worker" {
  count              = var.enable_auto_scaling ? 1 : 0
  max_capacity       = var.autoscaling_max_capacity / 2
  min_capacity       = var.autoscaling_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.worker.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  tags = {
    Name = "${var.environment}-prismy-worker-autoscaling-target"
  }
}

resource "aws_appautoscaling_policy" "worker_cpu" {
  count              = var.enable_auto_scaling ? 1 : 0
  name               = "${var.environment}-prismy-worker-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.worker[0].resource_id
  scalable_dimension = aws_appautoscaling_target.worker[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.worker[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = var.autoscaling_target_cpu
    scale_in_cooldown  = 300
    scale_out_cooldown = 300
  }
}