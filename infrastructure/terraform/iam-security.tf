# ===============================================
# Security-related IAM Roles and Policies
# ===============================================

# AWS Config IAM Role
resource "aws_iam_role" "config" {
  count = var.enable_aws_config ? 1 : 0
  name  = "${var.environment}-prismy-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.environment}-prismy-config-role"
  }
}

resource "aws_iam_role_policy_attachment" "config" {
  count      = var.enable_aws_config ? 1 : 0
  role       = aws_iam_role.config[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

resource "aws_iam_role_policy" "config_s3" {
  count = var.enable_aws_config ? 1 : 0
  name  = "${var.environment}-prismy-config-s3-policy"
  role  = aws_iam_role.config[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:GetBucketLocation",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.config_logs[0].arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.config_logs[0].arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# VPC Flow Logs IAM Role
resource "aws_iam_role" "flow_log" {
  count = var.enable_vpc_flow_logs ? 1 : 0
  name  = "${var.environment}-prismy-flow-log-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.environment}-prismy-flow-log-role"
  }
}

resource "aws_iam_role_policy" "flow_log" {
  count = var.enable_vpc_flow_logs ? 1 : 0
  name  = "${var.environment}-prismy-flow-log-policy"
  role  = aws_iam_role.flow_log[0].id

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
        Resource = "*"
      }
    ]
  })
}

# Lambda Rotation Function IAM Role
resource "aws_iam_role" "lambda_rotation" {
  count = var.enable_secret_rotation ? 1 : 0
  name  = "${var.environment}-prismy-lambda-rotation-role"

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
    Name = "${var.environment}-prismy-lambda-rotation-role"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_rotation_basic" {
  count      = var.enable_secret_rotation ? 1 : 0
  role       = aws_iam_role.lambda_rotation[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "lambda_rotation_secrets" {
  count = var.enable_secret_rotation ? 1 : 0
  name  = "${var.environment}-prismy-lambda-rotation-secrets-policy"
  role  = aws_iam_role.lambda_rotation[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage"
        ]
        Resource = aws_secretsmanager_secret.db_password.arn
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:DescribeDBClusters"
        ]
        Resource = "*"
      }
    ]
  })
}

# AWS Backup IAM Role
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

resource "aws_iam_role_policy_attachment" "backup_restore" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
}

# Lambda Permission for Secrets Manager
resource "aws_lambda_permission" "allow_secret_manager_call_Lambda" {
  count         = var.enable_secret_rotation ? 1 : 0
  statement_id  = "AllowSecretsManagerToCallLambda"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.rotate_secret[0].function_name
  principal     = "secretsmanager.amazonaws.com"
}

# Enhanced ECS Task Role for Security
resource "aws_iam_role_policy" "ecs_security_enhanced" {
  name = "${var.environment}-prismy-ecs-security-policy"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.db_password.arn,
          aws_secretsmanager_secret.jwt_secret.arn,
          "${aws_secretsmanager_secret.db_password.arn}*",
          "${aws_secretsmanager_secret.jwt_secret.arn}*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.secrets.arn,
          aws_kms_key.s3.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ecs/${var.environment}-prismy:*"
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

# Security Monitoring Role
resource "aws_iam_role" "security_monitoring" {
  name = "${var.environment}-prismy-security-monitoring-role"

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
    Name = "${var.environment}-prismy-security-monitoring-role"
  }
}

resource "aws_iam_role_policy" "security_monitoring" {
  name = "${var.environment}-prismy-security-monitoring-policy"
  role = aws_iam_role.security_monitoring.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "guardduty:GetFindings",
          "guardduty:ListFindings",
          "guardduty:GetDetector",
          "guardduty:ListDetectors"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "securityhub:GetFindings",
          "securityhub:BatchImportFindings"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = "arn:aws:sns:${var.aws_region}:${data.aws_caller_identity.current.account_id}:${var.environment}-prismy-security-alerts"
      },
      {
        Effect = "Allow"
        Action = [
          "config:GetComplianceDetailsByConfigRule",
          "config:GetConfigRuleEvaluationStatus"
        ]
        Resource = "*"
      }
    ]
  })
}

# Cross-account access role for security scanning
resource "aws_iam_role" "security_scanner" {
  count = var.enable_cross_account_security ? 1 : 0
  name  = "${var.environment}-prismy-security-scanner-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = var.security_scanner_account_ids
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "sts:ExternalId" = var.security_scanner_external_id
          }
        }
      }
    ]
  })

  tags = {
    Name = "${var.environment}-prismy-security-scanner-role"
  }
}

resource "aws_iam_role_policy" "security_scanner" {
  count = var.enable_cross_account_security ? 1 : 0
  name  = "${var.environment}-prismy-security-scanner-policy"
  role  = aws_iam_role.security_scanner[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "config:GetComplianceDetailsByConfigRule",
          "config:GetConfigRuleEvaluationStatus",
          "config:DescribeConfigRules",
          "guardduty:GetFindings",
          "guardduty:ListFindings",
          "securityhub:GetFindings",
          "inspector2:ListFindings",
          "inspector2:GetMember"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeVpcs",
          "ec2:DescribeNetworkAcls",
          "ecs:DescribeClusters",
          "ecs:DescribeServices",
          "ecs:DescribeTasks",
          "rds:DescribeDBInstances",
          "rds:DescribeDBClusters",
          "s3:GetBucketPolicy",
          "s3:GetBucketAcl",
          "s3:GetBucketEncryption"
        ]
        Resource = "*"
      }
    ]
  })
}

# Data source for current AWS account ID
data "aws_caller_identity" "current" {}

# Random ID for bucket naming
resource "random_id" "bucket_suffix" {
  byte_length = 4
}