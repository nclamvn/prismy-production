# ===============================================
# IAM Roles and Policies for Prismy Infrastructure
# ===============================================

# ===============================================
# ECS Task Execution Role
# ===============================================
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.environment}-prismy-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.environment}-prismy-ecs-task-execution-role"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Additional permissions for ECS task execution
resource "aws_iam_role_policy" "ecs_task_execution_additional" {
  name = "${var.environment}-prismy-ecs-task-execution-additional"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.db_password.arn,
          aws_secretsmanager_secret.redis_auth_token.arn,
          aws_secretsmanager_secret.app_secrets.arn
        ]
      }
    ]
  })
}

# ===============================================
# ECS Task Role
# ===============================================
resource "aws_iam_role" "ecs_task" {
  name = "${var.environment}-prismy-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.environment}-prismy-ecs-task-role"
  }
}

# ECS task role permissions
resource "aws_iam_role_policy" "ecs_task" {
  name = "${var.environment}-prismy-ecs-task-policy"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.app_storage.arn,
          "${aws_s3_bucket.app_storage.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail",
          "ses:GetSendQuota",
          "ses:GetSendStatistics"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.app_secrets.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/prismy/${var.environment}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

# ===============================================
# RDS Monitoring Role
# ===============================================
resource "aws_iam_role" "rds_monitoring" {
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

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ===============================================
# Auto Scaling Role
# ===============================================
resource "aws_iam_role" "autoscaling" {
  name = "${var.environment}-prismy-autoscaling-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "application-autoscaling.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.environment}-prismy-autoscaling-role"
  }
}

resource "aws_iam_role_policy_attachment" "autoscaling" {
  role       = aws_iam_role.autoscaling.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSServiceRolePolicy"
}

# ===============================================
# CloudFront Origin Access Identity
# ===============================================
resource "aws_s3_bucket_policy" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.main.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.app_storage.arn}/*"
      },
      {
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.ecs_task.arn
        }
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.app_storage.arn}/*"
      },
      {
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.ecs_task.arn
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.app_storage.arn
      }
    ]
  })
}

# ===============================================
# ALB Logs Bucket Policy
# ===============================================
data "aws_elb_service_account" "main" {}

resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/alb-logs/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/alb-logs/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.alb_logs.arn
      }
    ]
  })
}

# ===============================================
# Lambda Execution Role (for custom functions)
# ===============================================
resource "aws_iam_role" "lambda_execution" {
  name = "${var.environment}-prismy-lambda-execution-role"

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
    Name = "${var.environment}-prismy-lambda-execution-role"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_execution_additional" {
  name = "${var.environment}-prismy-lambda-execution-additional"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AttachNetworkInterface",
          "ec2:DetachNetworkInterface"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.app_storage.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

# ===============================================
# Backup Role
# ===============================================
resource "aws_iam_role" "backup" {
  name = "${var.environment}-prismy-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.environment}-prismy-backup-role"
  }
}

resource "aws_iam_role_policy_attachment" "backup" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

# ===============================================
# EventBridge Role
# ===============================================
resource "aws_iam_role" "eventbridge" {
  name = "${var.environment}-prismy-eventbridge-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.environment}-prismy-eventbridge-role"
  }
}

resource "aws_iam_role_policy" "eventbridge" {
  name = "${var.environment}-prismy-eventbridge-policy"
  role = aws_iam_role.eventbridge.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:RunTask"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = [
          aws_iam_role.ecs_task_execution.arn,
          aws_iam_role.ecs_task.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = "*"
      }
    ]
  })
}

# ===============================================
# CloudWatch Events Rule Role
# ===============================================
resource "aws_iam_role" "cloudwatch_events" {
  name = "${var.environment}-prismy-cloudwatch-events-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.environment}-prismy-cloudwatch-events-role"
  }
}

# ===============================================
# Cross-Account Access Role (if needed)
# ===============================================
resource "aws_iam_role" "cross_account_access" {
  count = var.environment == "production" ? 1 : 0
  name  = "${var.environment}-prismy-cross-account-access-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "prismy-external-id"
          }
        }
      }
    ]
  })

  tags = {
    Name = "${var.environment}-prismy-cross-account-access-role"
  }
}

# ===============================================
# Service-Linked Roles (if not existing)
# ===============================================
resource "aws_iam_service_linked_role" "ecs" {
  aws_service_name = "ecs.amazonaws.com"
  description      = "Service-linked role for ECS"

  # Only create if it doesn't exist
  lifecycle {
    ignore_changes = all
  }
}

resource "aws_iam_service_linked_role" "elasticache" {
  aws_service_name = "elasticache.amazonaws.com"
  description      = "Service-linked role for ElastiCache"

  lifecycle {
    ignore_changes = all
  }
}

# ===============================================
# Instance Profile for EC2 (if using EC2 launch type)
# ===============================================
resource "aws_iam_instance_profile" "ecs_instance" {
  count = var.environment == "production" ? 1 : 0
  name  = "${var.environment}-prismy-ecs-instance-profile"
  role  = aws_iam_role.ecs_instance[0].name

  tags = {
    Name = "${var.environment}-prismy-ecs-instance-profile"
  }
}

resource "aws_iam_role" "ecs_instance" {
  count = var.environment == "production" ? 1 : 0
  name  = "${var.environment}-prismy-ecs-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.environment}-prismy-ecs-instance-role"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_instance" {
  count      = var.environment == "production" ? 1 : 0
  role       = aws_iam_role.ecs_instance[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}