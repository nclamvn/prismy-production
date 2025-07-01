# ===============================================
# Enhanced Security Groups Configuration
# Granular network security controls
# ===============================================

# ===============================================
# Web Application Firewall (WAF) Rules
# ===============================================

# Custom rate limiting rule
resource "aws_wafv2_rule_group" "rate_limiting" {
  capacity = 100
  name     = "${var.environment}-prismy-rate-limiting"
  scope    = "CLOUDFRONT"

  rule {
    name     = "APIRateLimit"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"

        scope_down_statement {
          byte_match_statement {
            search_string = "/api/"
            field_to_match {
              uri_path {}
            }
            text_transformation {
              priority = 1
              type     = "LOWERCASE"
            }
            positional_constraint = "CONTAINS"
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "APIRateLimit"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "LoginRateLimit"
    priority = 2

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 50
        aggregate_key_type = "IP"

        scope_down_statement {
          byte_match_statement {
            search_string = "/api/auth/"
            field_to_match {
              uri_path {}
            }
            text_transformation {
              priority = 1
              type     = "LOWERCASE"
            }
            positional_constraint = "STARTS_WITH"
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "LoginRateLimit"
      sampled_requests_enabled   = true
    }
  }

  tags = {
    Name = "${var.environment}-prismy-rate-limiting"
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "PrismyRateLimiting"
    sampled_requests_enabled   = true
  }
}

# Geographic blocking rule
resource "aws_wafv2_rule_group" "geo_blocking" {
  capacity = 50
  name     = "${var.environment}-prismy-geo-blocking"
  scope    = "CLOUDFRONT"

  rule {
    name     = "BlockHighRiskCountries"
    priority = 1

    action {
      block {}
    }

    statement {
      geo_match_statement {
        country_codes = var.blocked_countries
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "GeoBlocking"
      sampled_requests_enabled   = true
    }
  }

  tags = {
    Name = "${var.environment}-prismy-geo-blocking"
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "PrismyGeoBlocking"
    sampled_requests_enabled   = true
  }
}

# SQL Injection protection
resource "aws_wafv2_rule_group" "sql_injection_protection" {
  capacity = 200
  name     = "${var.environment}-prismy-sqli-protection"
  scope    = "CLOUDFRONT"

  rule {
    name     = "SQLiProtection"
    priority = 1

    action {
      block {}
    }

    statement {
      sqli_match_statement {
        field_to_match {
          all_query_arguments {}
        }
        text_transformation {
          priority = 1
          type     = "URL_DECODE"
        }
        text_transformation {
          priority = 2
          type     = "HTML_ENTITY_DECODE"
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLiProtection"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "SQLiProtectionBody"
    priority = 2

    action {
      block {}
    }

    statement {
      sqli_match_statement {
        field_to_match {
          body {
            oversize_handling = "CONTINUE"
          }
        }
        text_transformation {
          priority = 1
          type     = "URL_DECODE"
        }
        text_transformation {
          priority = 2
          type     = "HTML_ENTITY_DECODE"
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLiProtectionBody"
      sampled_requests_enabled   = true
    }
  }

  tags = {
    Name = "${var.environment}-prismy-sqli-protection"
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "PrismySQLiProtection"
    sampled_requests_enabled   = true
  }
}

# Enhanced WAF Web ACL
resource "aws_wafv2_web_acl" "enhanced" {
  name  = "${var.environment}-prismy-enhanced-waf"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # Rate limiting rules
  rule {
    name     = "RateLimitingRules"
    priority = 1

    override_action {
      none {}
    }

    statement {
      rule_group_reference_statement {
        arn = aws_wafv2_rule_group.rate_limiting.arn
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitingRules"
      sampled_requests_enabled   = true
    }
  }

  # Geographic blocking
  rule {
    name     = "GeographicBlocking"
    priority = 2

    override_action {
      none {}
    }

    statement {
      rule_group_reference_statement {
        arn = aws_wafv2_rule_group.geo_blocking.arn
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "GeographicBlocking"
      sampled_requests_enabled   = true
    }
  }

  # SQL Injection protection
  rule {
    name     = "SQLInjectionProtection"
    priority = 3

    override_action {
      none {}
    }

    statement {
      rule_group_reference_statement {
        arn = aws_wafv2_rule_group.sql_injection_protection.arn
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLInjectionProtection"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - Core Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 10

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"

        rule_action_override {
          action_to_use {
            count {}
          }
          name = "SizeRestrictions_BODY"
        }

        rule_action_override {
          action_to_use {
            count {}
          }
          name = "GenericRFI_BODY"
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - Known Bad Inputs
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 20

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "KnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - Anonymous IP List
  rule {
    name     = "AWSManagedRulesAnonymousIpList"
    priority = 30

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAnonymousIpList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AnonymousIpListMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - Amazon IP Reputation List
  rule {
    name     = "AWSManagedRulesAmazonIpReputationList"
    priority = 40

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AmazonIpReputationListMetric"
      sampled_requests_enabled   = true
    }
  }

  # Custom IP allowlist
  rule {
    name     = "IPAllowlistRule"
    priority = 50

    action {
      allow {}
    }

    statement {
      ip_set_reference_statement {
        arn = aws_wafv2_ip_set.allowed_ips.arn
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "IPAllowlistRule"
      sampled_requests_enabled   = true
    }
  }

  tags = {
    Name = "${var.environment}-prismy-enhanced-waf"
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "PrismyEnhancedWAF"
    sampled_requests_enabled   = true
  }
}

# IP allowlist for admin access
resource "aws_wafv2_ip_set" "allowed_ips" {
  name               = "${var.environment}-prismy-allowed-ips"
  description        = "Allowed IP addresses for admin access"
  scope              = "CLOUDFRONT"
  ip_address_version = "IPV4"

  addresses = var.admin_allowed_ips

  tags = {
    Name = "${var.environment}-prismy-allowed-ips"
  }
}

# ===============================================
# Enhanced Security Groups
# ===============================================

# Database security group with restricted access
resource "aws_security_group" "rds_enhanced" {
  name        = "${var.environment}-prismy-rds-enhanced-sg"
  description = "Enhanced security group for RDS database"
  vpc_id      = aws_vpc.main.id

  # Only allow connections from application servers
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
    description     = "PostgreSQL from ECS tasks"
  }

  # Allow connections from bastion host (if enabled)
  dynamic "ingress" {
    for_each = var.enable_bastion_host ? [1] : []
    content {
      from_port       = 5432
      to_port         = 5432
      protocol        = "tcp"
      security_groups = [aws_security_group.bastion[0].id]
      description     = "PostgreSQL from bastion host"
    }
  }

  # No outbound rules needed for RDS
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name = "${var.environment}-prismy-rds-enhanced-sg"
  }
}

# Redis security group with enhanced rules
resource "aws_security_group" "redis_enhanced" {
  name        = "${var.environment}-prismy-redis-enhanced-sg"
  description = "Enhanced security group for Redis cluster"
  vpc_id      = aws_vpc.main.id

  # Only allow connections from application servers
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
    description     = "Redis from ECS tasks"
  }

  # Allow connections from bastion host (if enabled)
  dynamic "ingress" {
    for_each = var.enable_bastion_host ? [1] : []
    content {
      from_port       = 6379
      to_port         = 6379
      protocol        = "tcp"
      security_groups = [aws_security_group.bastion[0].id]
      description     = "Redis from bastion host"
    }
  }

  tags = {
    Name = "${var.environment}-prismy-redis-enhanced-sg"
  }
}

# VPC Endpoint security group
resource "aws_security_group" "vpc_endpoints" {
  name        = "${var.environment}-prismy-vpc-endpoints-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
    description = "HTTPS from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name = "${var.environment}-prismy-vpc-endpoints-sg"
  }
}

# ===============================================
# VPC Endpoints for Security
# ===============================================

# S3 VPC Endpoint
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = "*"
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
      }
    ]
  })

  tags = {
    Name = "${var.environment}-prismy-s3-endpoint"
  }
}

# Secrets Manager VPC Endpoint
resource "aws_vpc_endpoint" "secrets_manager" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = "*"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "${var.environment}-prismy-secrets-manager-endpoint"
  }
}

# CloudWatch Logs VPC Endpoint
resource "aws_vpc_endpoint" "logs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "${var.environment}-prismy-logs-endpoint"
  }
}

# ECR VPC Endpoints
resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "${var.environment}-prismy-ecr-dkr-endpoint"
  }
}

resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "${var.environment}-prismy-ecr-api-endpoint"
  }
}

# ===============================================
# Security Group Rules Validation
# ===============================================

# Data source to validate security group rules
data "aws_security_group" "validate_alb" {
  id = aws_security_group.alb.id
}

data "aws_security_group" "validate_ecs" {
  id = aws_security_group.ecs.id
}

# Local values for validation
locals {
  # Check if ALB security group allows HTTP/HTTPS
  alb_allows_http = contains([
    for rule in data.aws_security_group.validate_alb.ingress :
    rule.from_port if rule.from_port == 80 && rule.to_port == 80
  ], 80)

  alb_allows_https = contains([
    for rule in data.aws_security_group.validate_alb.ingress :
    rule.from_port if rule.from_port == 443 && rule.to_port == 443
  ], 443)

  # Validate security group configuration
  security_validation = {
    alb_http_enabled  = local.alb_allows_http
    alb_https_enabled = local.alb_allows_https
  }
}

# Output security validation results
output "security_validation" {
  value       = local.security_validation
  description = "Security group validation results"
}