# ===============================================
# Global Deployment & Edge Optimization
# Multi-region deployment with edge caching
# ===============================================

# ===============================================
# CloudFront Distribution for Global CDN
# ===============================================

resource "aws_cloudfront_distribution" "global" {
  aliases             = var.domain_aliases
  comment             = "${var.environment} Prismy Global Distribution"
  default_root_object = "index.html"
  enabled             = true
  is_ipv6_enabled     = true
  price_class         = var.cloudfront_price_class
  web_acl_id          = aws_wafv2_web_acl.enhanced.arn

  # Origin for main application
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALB-${var.environment}-prismy"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
    
    # Custom headers for origin identification
    custom_header {
      name  = "X-CloudFront-Origin"
      value = var.environment
    }
  }
  
  # Origin for static assets (S3)
  origin {
    domain_name = aws_s3_bucket.static_assets.bucket_regional_domain_name
    origin_id   = "S3-${var.environment}-prismy-static"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.static_assets.cloudfront_access_identity_path
    }
  }
  
  # Origin for API endpoints
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "API-${var.environment}-prismy"
    origin_path = "/api"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
    
    custom_header {
      name  = "X-API-Origin"
      value = "cloudfront"
    }
  }

  # Default cache behavior for main application
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "ALB-${var.environment}-prismy"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    
    cache_policy_id = aws_cloudfront_cache_policy.app_cache_policy.id
    origin_request_policy_id = aws_cloudfront_origin_request_policy.app_origin_policy.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
    
    # Lambda@Edge functions
    lambda_function_association {
      event_type   = "origin-request"
      lambda_arn   = aws_lambda_function.edge_auth.qualified_arn
      include_body = false
    }
    
    lambda_function_association {
      event_type = "origin-response"
      lambda_arn = aws_lambda_function.edge_security_headers.qualified_arn
    }
  }
  
  # Cache behavior for static assets
  ordered_cache_behavior {
    path_pattern           = "/static/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.environment}-prismy-static"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    
    cache_policy_id = aws_cloudfront_cache_policy.static_cache_policy.id
    
    # Cache static assets for 1 year
    min_ttl     = 31536000
    default_ttl = 31536000
    max_ttl     = 31536000
  }
  
  # Cache behavior for API endpoints
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "API-${var.environment}-prismy"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    
    cache_policy_id = aws_cloudfront_cache_policy.api_cache_policy.id
    origin_request_policy_id = aws_cloudfront_origin_request_policy.api_origin_policy.id
    
    # No caching for API calls by default
    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }
  
  # Cache behavior for translation assets
  ordered_cache_behavior {
    path_pattern           = "/locales/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.environment}-prismy-static"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    
    cache_policy_id = aws_cloudfront_cache_policy.translation_cache_policy.id
    
    # Cache translations for 1 hour
    min_ttl     = 3600
    default_ttl = 3600
    max_ttl     = 86400
  }

  # Geographic restrictions
  restrictions {
    geo_restriction {
      restriction_type = var.enable_geo_restrictions ? "blacklist" : "none"
      locations        = var.blocked_countries
    }
  }

  # SSL Certificate
  viewer_certificate {
    acm_certificate_arn      = var.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # Logging configuration
  logging_config {
    bucket          = aws_s3_bucket.cloudfront_logs.bucket_domain_name
    prefix          = "cloudfront-logs/"
    include_cookies = false
  }

  tags = {
    Name        = "${var.environment}-prismy-global-distribution"
    Environment = var.environment
    Purpose     = "global-cdn"
  }
}

# ===============================================
# CloudFront Cache Policies
# ===============================================

# Cache policy for main application
resource "aws_cloudfront_cache_policy" "app_cache_policy" {
  name        = "${var.environment}-prismy-app-cache-policy"
  comment     = "Cache policy for main application"
  default_ttl = 300   # 5 minutes
  max_ttl     = 3600  # 1 hour
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true

    cookies_config {
      cookie_behavior = "whitelist"
      cookies {
        items = ["session", "csrf_token", "i18next"]
      }
    }

    headers_config {
      header_behavior = "whitelist"
      headers {
        items = [
          "Accept-Language",
          "Authorization",
          "CloudFront-Viewer-Country",
          "CloudFront-Viewer-Country-Region",
          "User-Agent"
        ]
      }
    }

    query_strings_config {
      query_string_behavior = "whitelist"
      query_strings {
        items = ["lang", "theme", "version"]
      }
    }
  }
}

# Cache policy for static assets
resource "aws_cloudfront_cache_policy" "static_cache_policy" {
  name        = "${var.environment}-prismy-static-cache-policy"
  comment     = "Cache policy for static assets"
  default_ttl = 31536000  # 1 year
  max_ttl     = 31536000  # 1 year
  min_ttl     = 31536000  # 1 year

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true

    cookies_config {
      cookie_behavior = "none"
    }

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "whitelist"
      query_strings {
        items = ["v", "version"]
      }
    }
  }
}

# Cache policy for API endpoints
resource "aws_cloudfront_cache_policy" "api_cache_policy" {
  name        = "${var.environment}-prismy-api-cache-policy"
  comment     = "Cache policy for API endpoints"
  default_ttl = 0
  max_ttl     = 300  # 5 minutes max for certain GET APIs
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true

    cookies_config {
      cookie_behavior = "all"
    }

    headers_config {
      header_behavior = "whitelist"
      headers {
        items = [
          "Accept",
          "Accept-Language",
          "Authorization",
          "Content-Type",
          "Origin",
          "Referer",
          "User-Agent",
          "X-Requested-With"
        ]
      }
    }

    query_strings_config {
      query_string_behavior = "all"
    }
  }
}

# Cache policy for translation files
resource "aws_cloudfront_cache_policy" "translation_cache_policy" {
  name        = "${var.environment}-prismy-translation-cache-policy"
  comment     = "Cache policy for translation files"
  default_ttl = 3600   # 1 hour
  max_ttl     = 86400  # 1 day
  min_ttl     = 3600   # 1 hour

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true

    cookies_config {
      cookie_behavior = "none"
    }

    headers_config {
      header_behavior = "whitelist"
      headers {
        items = ["Accept-Language"]
      }
    }

    query_strings_config {
      query_string_behavior = "whitelist"
      query_strings {
        items = ["v", "version", "lang"]
      }
    }
  }
}

# ===============================================
# CloudFront Origin Request Policies
# ===============================================

resource "aws_cloudfront_origin_request_policy" "app_origin_policy" {
  name    = "${var.environment}-prismy-app-origin-policy"
  comment = "Origin request policy for main application"

  cookies_config {
    cookie_behavior = "all"
  }

  headers_config {
    header_behavior = "whitelist"
    headers {
      items = [
        "Accept",
        "Accept-Language",
        "Authorization",
        "CloudFront-Forwarded-Proto",
        "CloudFront-Is-Desktop-Viewer",
        "CloudFront-Is-Mobile-Viewer",
        "CloudFront-Is-Tablet-Viewer",
        "CloudFront-Viewer-Country",
        "CloudFront-Viewer-Country-Region",
        "Host",
        "Origin",
        "Referer",
        "User-Agent",
        "X-Forwarded-For",
        "X-Forwarded-Host",
        "X-Forwarded-Proto"
      ]
    }
  }

  query_strings_config {
    query_string_behavior = "all"
  }
}

resource "aws_cloudfront_origin_request_policy" "api_origin_policy" {
  name    = "${var.environment}-prismy-api-origin-policy"
  comment = "Origin request policy for API endpoints"

  cookies_config {
    cookie_behavior = "all"
  }

  headers_config {
    header_behavior = "allExcept"
    headers {
      items = ["Host"]
    }
  }

  query_strings_config {
    query_string_behavior = "all"
  }
}

# ===============================================
# CloudFront Response Headers Policy
# ===============================================

resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name    = "${var.environment}-prismy-security-headers"
  comment = "Security headers policy"

  cors_config {
    access_control_allow_credentials = false
    access_control_allow_headers {
      items = ["Accept", "Accept-Language", "Content-Language", "Content-Type", "Authorization"]
    }
    access_control_allow_methods {
      items = ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"]
    }
    access_control_allow_origins {
      items = var.cors_allowed_origins
    }
    access_control_expose_headers {
      items = ["Date", "ETag"]
    }
    access_control_max_age_sec = 86400
    origin_override            = true
  }

  custom_headers_config {
    items {
      header   = "X-Frame-Options"
      value    = "DENY"
      override = true
    }
    items {
      header   = "X-Content-Type-Options"
      value    = "nosniff"
      override = true
    }
    items {
      header   = "X-XSS-Protection"
      value    = "1; mode=block"
      override = true
    }
    items {
      header   = "Referrer-Policy"
      value    = "strict-origin-when-cross-origin"
      override = true
    }
    items {
      header   = "Permissions-Policy"
      value    = "camera=(), microphone=(), geolocation=()"
      override = true
    }
  }

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }
    content_type_options {
      override = true
    }
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
  }
}

# ===============================================
# S3 Bucket for Static Assets
# ===============================================

resource "aws_s3_bucket" "static_assets" {
  bucket = "${var.environment}-prismy-static-assets-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "${var.environment}-prismy-static-assets"
    Purpose     = "static-assets"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "static_assets" {
  comment = "OAI for ${var.environment} Prismy static assets"
}

# S3 bucket policy for CloudFront access
resource "aws_s3_bucket_policy" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.static_assets.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.static_assets.arn}/*"
      }
    ]
  })
}

# ===============================================
# CloudFront Logging
# ===============================================

resource "aws_s3_bucket" "cloudfront_logs" {
  bucket = "${var.environment}-prismy-cloudfront-logs-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "${var.environment}-prismy-cloudfront-logs"
    Purpose     = "cloudfront-logs"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  rule {
    id     = "delete_old_logs"
    status = "Enabled"

    expiration {
      days = 90
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }
}

# ===============================================
# Route 53 for Global DNS
# ===============================================

resource "aws_route53_zone" "main" {
  count = var.create_route53_zone ? 1 : 0
  name  = var.domain_name

  tags = {
    Name        = "${var.environment}-prismy-zone"
    Environment = var.environment
  }
}

# Primary domain record
resource "aws_route53_record" "main" {
  count   = var.create_route53_zone ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.global.domain_name
    zone_id                = aws_cloudfront_distribution.global.hosted_zone_id
    evaluate_target_health = false
  }
}

# WWW redirect
resource "aws_route53_record" "www" {
  count   = var.create_route53_zone ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.global.domain_name
    zone_id                = aws_cloudfront_distribution.global.hosted_zone_id
    evaluate_target_health = false
  }
}

# API subdomain
resource "aws_route53_record" "api" {
  count   = var.create_route53_zone ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.global.domain_name
    zone_id                = aws_cloudfront_distribution.global.hosted_zone_id
    evaluate_target_health = false
  }
}

# Health check for primary domain
resource "aws_route53_health_check" "main" {
  count                           = var.create_route53_zone ? 1 : 0
  fqdn                           = var.domain_name
  port                           = 443
  type                           = "HTTPS"
  resource_path                  = "/api/health"
  failure_threshold              = 3
  request_interval               = 30
  cloudwatch_alarm_region        = var.aws_region
  cloudwatch_alarm_name          = "${var.environment}-prismy-health-check"
  insufficient_data_health_status = "Failure"

  tags = {
    Name = "${var.environment}-prismy-health-check"
  }
}

# ===============================================
# Edge Locations and Regional Deployments
# ===============================================

# Regional deployment configuration
locals {
  edge_regions = var.enable_multi_region ? var.edge_regions : []
}

# Cross-region provider for edge deployments
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"
}

provider "aws" {
  alias  = "ap_southeast_1"
  region = "ap-southeast-1"
}

# ===============================================
# Global Performance Monitoring
# ===============================================

# CloudWatch Insights for global performance analysis
resource "aws_cloudwatch_log_group" "global_performance" {
  name              = "/aws/cloudfront/${var.environment}-prismy-global"
  retention_in_days = 30

  tags = {
    Name        = "${var.environment}-prismy-global-performance"
    Environment = var.environment
  }
}

# Global performance dashboard
resource "aws_cloudwatch_dashboard" "global_performance" {
  dashboard_name = "${var.environment}-prismy-global-performance"

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
            ["AWS/CloudFront", "Requests", "DistributionId", aws_cloudfront_distribution.global.id],
            [".", "BytesDownloaded", ".", "."],
            [".", "BytesUploaded", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "Global Traffic Metrics"
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
            ["AWS/CloudFront", "CacheHitRate", "DistributionId", aws_cloudfront_distribution.global.id],
            [".", "ErrorRate", ".", "."],
            [".", "4xxErrorRate", ".", "."],
            [".", "5xxErrorRate", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "Cache Performance and Errors"
          period  = 300
        }
      }
    ]
  })
}

# ===============================================
# Outputs
# ===============================================

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.global.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.global.domain_name
}

output "static_assets_bucket" {
  description = "S3 bucket for static assets"
  value       = aws_s3_bucket.static_assets.bucket
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = var.create_route53_zone ? aws_route53_zone.main[0].zone_id : null
}

output "name_servers" {
  description = "Route 53 name servers"
  value       = var.create_route53_zone ? aws_route53_zone.main[0].name_servers : null
}