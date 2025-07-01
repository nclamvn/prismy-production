# ===============================================
# Production Security Hardening
# Comprehensive security controls and compliance
# ===============================================

# ===============================================
# AWS Config for Compliance Monitoring
# ===============================================
resource "aws_config_configuration_recorder" "main" {
  count    = var.enable_aws_config ? 1 : 0
  name     = "${var.environment}-prismy-config-recorder"
  role_arn = aws_iam_role.config[0].arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  depends_on = [aws_config_delivery_channel.main]
}

resource "aws_config_delivery_channel" "main" {
  count           = var.enable_aws_config ? 1 : 0
  name            = "${var.environment}-prismy-config-delivery"
  s3_bucket_name  = aws_s3_bucket.config_logs[0].bucket
  s3_key_prefix   = "config"

  snapshot_delivery_properties {
    delivery_frequency = "TwentyFour_Hours"
  }
}

resource "aws_s3_bucket" "config_logs" {
  count  = var.enable_aws_config ? 1 : 0
  bucket = "${var.environment}-prismy-config-logs-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "${var.environment}-prismy-config-logs"
  }
}

resource "aws_s3_bucket_policy" "config_logs" {
  count  = var.enable_aws_config ? 1 : 0
  bucket = aws_s3_bucket.config_logs[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config_logs[0].arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config_logs[0].arn
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_logs[0].arn}/config/AWSLogs/${data.aws_caller_identity.current.account_id}/Config/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# ===============================================
# AWS CloudTrail for Audit Logging
# ===============================================
resource "aws_cloudtrail" "main" {
  count                         = var.enable_cloudtrail ? 1 : 0
  name                          = "${var.environment}-prismy-cloudtrail"
  s3_bucket_name               = aws_s3_bucket.cloudtrail_logs[0].bucket
  s3_key_prefix               = "cloudtrail"
  include_global_service_events = true
  is_multi_region_trail        = true
  enable_logging               = true

  kms_key_id = aws_kms_key.cloudtrail[0].arn

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.app_storage.arn}/*"]
    }

    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:aws:lambda:*"]
    }
  }

  insight_selector {
    insight_type = "ApiCallRateInsight"
  }

  tags = {
    Name = "${var.environment}-prismy-cloudtrail"
  }
}

resource "aws_s3_bucket" "cloudtrail_logs" {
  count  = var.enable_cloudtrail ? 1 : 0
  bucket = "${var.environment}-prismy-cloudtrail-logs-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "${var.environment}-prismy-cloudtrail-logs"
  }
}

resource "aws_s3_bucket_policy" "cloudtrail_logs" {
  count  = var.enable_cloudtrail ? 1 : 0
  bucket = aws_s3_bucket.cloudtrail_logs[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail_logs[0].arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_logs[0].arn}/cloudtrail/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

resource "aws_kms_key" "cloudtrail" {
  count       = var.enable_cloudtrail ? 1 : 0
  description = "KMS key for CloudTrail encryption"

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
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:CreateGrant",
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "${var.environment}-prismy-cloudtrail-key"
  }
}

# ===============================================
# VPC Flow Logs
# ===============================================
resource "aws_vpc_flow_log" "main" {
  count           = var.enable_vpc_flow_logs ? 1 : 0
  iam_role_arn    = aws_iam_role.flow_log[0].arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs[0].arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = {
    Name = "${var.environment}-prismy-vpc-flow-logs"
  }
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  count             = var.enable_vpc_flow_logs ? 1 : 0
  name              = "/aws/vpc/flowlogs/${var.environment}-prismy"
  retention_in_days = 30

  tags = {
    Name = "${var.environment}-prismy-vpc-flow-logs"
  }
}

# ===============================================
# GuardDuty for Threat Detection
# ===============================================
resource "aws_guardduty_detector" "main" {
  count  = var.enable_guardduty ? 1 : 0
  enable = true

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = true
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = true
        }
      }
    }
  }

  finding_publishing_frequency = "FIFTEEN_MINUTES"

  tags = {
    Name = "${var.environment}-prismy-guardduty"
  }
}

# ===============================================
# Security Hub for Centralized Security
# ===============================================
resource "aws_securityhub_account" "main" {
  count                    = var.enable_security_hub ? 1 : 0
  enable_default_standards = true
  auto_enable_controls     = true

  control_finding_generator = "SECURITY_CONTROL"
}

resource "aws_securityhub_standards_subscription" "aws_foundational" {
  count         = var.enable_security_hub ? 1 : 0
  standards_arn = "arn:aws:securityhub:${var.aws_region}::ruleset/finding-format/aws-foundational-security-standards/v/1.0.0"
  depends_on    = [aws_securityhub_account.main]
}

resource "aws_securityhub_standards_subscription" "cis" {
  count         = var.enable_security_hub ? 1 : 0
  standards_arn = "arn:aws:securityhub:${var.aws_region}::ruleset/finding-format/cis-aws-foundations-benchmark/v/1.2.0"
  depends_on    = [aws_securityhub_account.main]
}

# ===============================================
# AWS Inspector for Vulnerability Assessment
# ===============================================
resource "aws_inspector2_enabler" "example" {
  count           = var.enable_inspector ? 1 : 0
  account_ids     = [data.aws_caller_identity.current.account_id]
  resource_types  = ["ECR", "EC2"]
}

# ===============================================
# Enhanced Security Groups
# ===============================================
resource "aws_security_group" "bastion" {
  count       = var.enable_bastion_host ? 1 : 0
  name        = "${var.environment}-prismy-bastion-sg"
  description = "Security group for bastion host"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidrs
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-prismy-bastion-sg"
  }
}

# ===============================================
# Systems Manager Session Manager
# ===============================================
resource "aws_ssm_document" "session_manager_prefs" {
  name          = "${var.environment}-prismy-session-manager-prefs"
  document_type = "Session"
  document_format = "JSON"

  content = jsonencode({
    schemaVersion = "1.0"
    description   = "Document to hold regional settings for Session Manager"
    sessionType   = "Standard_Stream"
    inputs = {
      s3BucketName        = aws_s3_bucket.session_logs.bucket
      s3KeyPrefix         = "session-logs"
      s3EncryptionEnabled = true
      cloudWatchLogGroupName        = aws_cloudwatch_log_group.session_logs.name
      cloudWatchEncryptionEnabled   = true
      cloudWatchStreamingEnabled    = true
      idleSessionTimeout            = "60"
      maxSessionDuration            = "60"
      runAsEnabled                  = false
      runAsDefaultUser              = ""
      shellProfile = {
        windows = "date"
        linux   = "pwd;whoami"
      }
    }
  })

  tags = {
    Name = "${var.environment}-prismy-session-manager-prefs"
  }
}

resource "aws_s3_bucket" "session_logs" {
  bucket = "${var.environment}-prismy-session-logs-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "${var.environment}-prismy-session-logs"
  }
}

resource "aws_cloudwatch_log_group" "session_logs" {
  name              = "/aws/ssm/sessions/${var.environment}-prismy"
  retention_in_days = 90

  tags = {
    Name = "${var.environment}-prismy-session-logs"
  }
}

# ===============================================
# Secrets Manager Secret Rotation
# ===============================================
resource "aws_secretsmanager_secret_rotation" "db_password" {
  secret_id           = aws_secretsmanager_secret.db_password.id
  rotation_lambda_arn = aws_lambda_function.rotate_secret[0].arn

  rotation_rules {
    automatically_after_days = 30
  }

  depends_on = [aws_lambda_permission.allow_secret_manager_call_Lambda]
}

resource "aws_lambda_function" "rotate_secret" {
  count            = var.enable_secret_rotation ? 1 : 0
  filename         = "lambda/rotate-secret.zip"
  function_name    = "${var.environment}-prismy-rotate-secret"
  role            = aws_iam_role.lambda_rotation[0].arn
  handler         = "lambda_function.lambda_handler"
  source_code_hash = filebase64sha256("lambda/rotate-secret.zip")
  runtime         = "python3.9"
  timeout         = 30

  environment {
    variables = {
      SECRETS_MANAGER_ENDPOINT = "https://secretsmanager.${var.aws_region}.amazonaws.com"
    }
  }

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda_rotation[0].id]
  }

  tags = {
    Name = "${var.environment}-prismy-rotate-secret"
  }
}

resource "aws_security_group" "lambda_rotation" {
  count       = var.enable_secret_rotation ? 1 : 0
  name        = "${var.environment}-prismy-lambda-rotation-sg"
  description = "Security group for secret rotation lambda"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.rds.id]
  }

  tags = {
    Name = "${var.environment}-prismy-lambda-rotation-sg"
  }
}

# ===============================================
# Network ACLs for Additional Security
# ===============================================
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  # Inbound rules
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = aws_vpc.main.cidr_block
    from_port  = 0
    to_port    = 65535
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 32768
    to_port    = 61000
  }

  # Outbound rules
  egress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 65535
  }

  egress {
    protocol   = "udp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 53
    to_port    = 53
  }

  tags = {
    Name = "${var.environment}-prismy-private-nacl"
  }
}

# ===============================================
# AWS Backup for Data Protection
# ===============================================
resource "aws_backup_vault" "main" {
  name        = "${var.environment}-prismy-backup-vault"
  kms_key_arn = aws_kms_key.backup.arn

  tags = {
    Name = "${var.environment}-prismy-backup-vault"
  }
}

resource "aws_kms_key" "backup" {
  description = "KMS key for backup encryption"

  tags = {
    Name = "${var.environment}-prismy-backup-key"
  }
}

resource "aws_backup_plan" "main" {
  name = "${var.environment}-prismy-backup-plan"

  rule {
    rule_name         = "daily_backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 3 ? * * *)"

    recovery_point_tags = {
      Environment = var.environment
      Project     = "prismy"
    }

    lifecycle {
      cold_storage_after = 30
      delete_after       = 120
    }

    copy_action {
      destination_vault_arn = aws_backup_vault.main.arn

      lifecycle {
        cold_storage_after = 30
        delete_after       = 120
      }
    }
  }

  tags = {
    Name = "${var.environment}-prismy-backup-plan"
  }
}

resource "aws_backup_selection" "main" {
  iam_role_arn = aws_iam_role.backup.arn
  name         = "${var.environment}-prismy-backup-selection"
  plan_id      = aws_backup_plan.main.id

  resources = [
    aws_db_instance.main.arn,
    aws_s3_bucket.app_storage.arn
  ]

  condition {
    string_equals {
      key   = "aws:ResourceTag/Environment"
      value = var.environment
    }
  }
}

# ===============================================
# DDoS Protection with AWS Shield Advanced
# ===============================================
resource "aws_shield_protection" "alb" {
  count        = var.enable_shield_advanced ? 1 : 0
  name         = "${var.environment}-prismy-alb-protection"
  resource_arn = aws_lb.main.arn

  tags = {
    Name = "${var.environment}-prismy-alb-shield"
  }
}

resource "aws_shield_protection" "cloudfront" {
  count        = var.enable_shield_advanced ? 1 : 0
  name         = "${var.environment}-prismy-cloudfront-protection"
  resource_arn = aws_cloudfront_distribution.main.arn

  tags = {
    Name = "${var.environment}-prismy-cloudfront-shield"
  }
}

# ===============================================
# AWS Certificate Manager Private CA
# ===============================================
resource "aws_acmpca_certificate_authority" "main" {
  count = var.enable_private_ca ? 1 : 0

  certificate_authority_configuration {
    key_algorithm     = "RSA_2048"
    signing_algorithm = "SHA256WITHRSA"

    subject {
      country                  = "US"
      organization             = "Prismy"
      organizational_unit      = "IT"
      locality                 = "San Francisco"
      province                 = "CA"
      common_name              = "Prismy Private CA"
    }
  }

  revocation_configuration {
    crl_configuration {
      custom_cname       = "crl.prismy.internal"
      enabled            = true
      expiration_in_days = 7
      s3_bucket_name     = aws_s3_bucket.private_ca_crl[0].bucket
      s3_object_acl      = "BUCKET_OWNER_FULL_CONTROL"
    }
  }

  permanent_deletion_time_in_days = 7
  type                           = "ROOT"

  tags = {
    Name = "${var.environment}-prismy-private-ca"
  }
}

resource "aws_s3_bucket" "private_ca_crl" {
  count  = var.enable_private_ca ? 1 : 0
  bucket = "${var.environment}-prismy-private-ca-crl-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "${var.environment}-prismy-private-ca-crl"
  }
}

# ===============================================
# Compliance and Governance
# ===============================================

# AWS Config Rules for Compliance
resource "aws_config_config_rule" "s3_bucket_ssl_requests_only" {
  count = var.enable_aws_config ? 1 : 0
  name  = "s3-bucket-ssl-requests-only"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SSL_REQUESTS_ONLY"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "encrypted_volumes" {
  count = var.enable_aws_config ? 1 : 0
  name  = "encrypted-volumes"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "rds_storage_encrypted" {
  count = var.enable_aws_config ? 1 : 0
  name  = "rds-storage-encrypted"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}