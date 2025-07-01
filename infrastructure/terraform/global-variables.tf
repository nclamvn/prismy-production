# ===============================================
# Global Deployment Variables
# ===============================================

# Domain and DNS Configuration
variable "domain_name" {
  description = "Primary domain name for the application"
  type        = string
  default     = ""
}

variable "domain_aliases" {
  description = "Additional domain aliases for CloudFront"
  type        = list(string)
  default     = []
}

variable "create_route53_zone" {
  description = "Create Route 53 hosted zone for the domain"
  type        = bool
  default     = false
}

variable "certificate_arn" {
  description = "ARN of the SSL certificate for CloudFront (must be in us-east-1)"
  type        = string
  default     = ""
}

# CloudFront Configuration
variable "cloudfront_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
  validation {
    condition = contains([
      "PriceClass_All", "PriceClass_200", "PriceClass_100"
    ], var.cloudfront_price_class)
    error_message = "CloudFront price class must be PriceClass_All, PriceClass_200, or PriceClass_100."
  }
}

variable "enable_cloudfront_logging" {
  description = "Enable CloudFront access logging"
  type        = bool
  default     = true
}

variable "cloudfront_log_retention_days" {
  description = "Number of days to retain CloudFront logs"
  type        = number
  default     = 90
}

# Geographic Configuration
variable "enable_geo_restrictions" {
  description = "Enable geographic restrictions"
  type        = bool
  default     = false
}

variable "blocked_countries" {
  description = "List of country codes to block (ISO 3166-1 alpha-2)"
  type        = list(string)
  default     = []
}

variable "primary_region" {
  description = "Primary AWS region for deployment"
  type        = string
  default     = "us-west-2"
}

# Multi-Region Configuration
variable "enable_multi_region" {
  description = "Enable multi-region deployment"
  type        = bool
  default     = false
}

variable "edge_regions" {
  description = "List of AWS regions for edge deployments"
  type        = list(string)
  default     = ["us-east-1", "eu-west-1", "ap-southeast-1"]
}

variable "enable_cross_region_replication" {
  description = "Enable cross-region replication for critical data"
  type        = bool
  default     = false
}

# CORS Configuration
variable "cors_allowed_origins" {
  description = "Allowed origins for CORS"
  type        = list(string)
  default     = ["*"]
}

variable "cors_allowed_methods" {
  description = "Allowed methods for CORS"
  type        = list(string)
  default     = ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"]
}

variable "cors_allowed_headers" {
  description = "Allowed headers for CORS"
  type        = list(string)
  default     = ["Accept", "Accept-Language", "Content-Language", "Content-Type", "Authorization"]
}

# Edge Computing Configuration
variable "enable_lambda_edge" {
  description = "Enable Lambda@Edge functions"
  type        = bool
  default     = true
}

variable "enable_ab_testing" {
  description = "Enable A/B testing at the edge"
  type        = bool
  default     = false
}

variable "enable_bot_detection" {
  description = "Enable bot detection at the edge"
  type        = bool
  default     = true
}

variable "enable_image_optimization" {
  description = "Enable image optimization at the edge"
  type        = bool
  default     = true
}

variable "enable_geo_routing" {
  description = "Enable geographic routing at the edge"
  type        = bool
  default     = false
}

variable "enable_edge_monitoring" {
  description = "Enable edge performance monitoring"
  type        = bool
  default     = true
}

# Geo-routing Configuration
variable "geo_routing_config" {
  description = "Geographic routing configuration"
  type = map(object({
    region   = string
    endpoint = string
    priority = number
  }))
  default = {}
}

# Cache Configuration
variable "default_cache_ttl" {
  description = "Default cache TTL in seconds"
  type        = number
  default     = 300
}

variable "max_cache_ttl" {
  description = "Maximum cache TTL in seconds"
  type        = number
  default     = 3600
}

variable "static_cache_ttl" {
  description = "Cache TTL for static assets in seconds"
  type        = number
  default     = 31536000 # 1 year
}

variable "api_cache_ttl" {
  description = "Cache TTL for API responses in seconds"
  type        = number
  default     = 0 # No caching by default
}

# Performance Configuration
variable "enable_compression" {
  description = "Enable Gzip compression"
  type        = bool
  default     = true
}

variable "enable_http2" {
  description = "Enable HTTP/2"
  type        = bool
  default     = true
}

variable "enable_ipv6" {
  description = "Enable IPv6"
  type        = bool
  default     = true
}

# Health Check Configuration
variable "health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
  default     = 30
}

variable "health_check_failure_threshold" {
  description = "Number of failed health checks before marking unhealthy"
  type        = number
  default     = 3
}

variable "health_check_path" {
  description = "Path for health checks"
  type        = string
  default     = "/api/health"
}

# Static Assets Configuration
variable "static_assets_bucket_prefix" {
  description = "Prefix for static assets S3 bucket name"
  type        = string
  default     = "prismy-static-assets"
}

variable "enable_static_website_hosting" {
  description = "Enable static website hosting on S3"
  type        = bool
  default     = false
}

variable "static_assets_versioning" {
  description = "Enable versioning for static assets bucket"
  type        = bool
  default     = true
}

# Content Delivery Configuration
variable "origin_shield_enabled" {
  description = "Enable CloudFront Origin Shield"
  type        = bool
  default     = false
}

variable "origin_shield_region" {
  description = "AWS region for Origin Shield"
  type        = string
  default     = ""
}

variable "real_time_logs_enabled" {
  description = "Enable CloudFront real-time logs"
  type        = bool
  default     = false
}

# Security Configuration
variable "waf_enabled" {
  description = "Enable WAF for CloudFront"
  type        = bool
  default     = true
}

variable "ssl_minimum_protocol_version" {
  description = "Minimum SSL protocol version"
  type        = string
  default     = "TLSv1.2_2021"
  validation {
    condition = contains([
      "SSLv3", "TLSv1", "TLSv1_2016", "TLSv1.1_2016", "TLSv1.2_2018", "TLSv1.2_2019", "TLSv1.2_2021"
    ], var.ssl_minimum_protocol_version)
    error_message = "SSL minimum protocol version must be a valid CloudFront SSL protocol."
  }
}

# Load Balancing Configuration
variable "enable_sticky_sessions" {
  description = "Enable sticky sessions for load balancer"
  type        = bool
  default     = false
}

variable "session_affinity_duration" {
  description = "Duration for session affinity in seconds"
  type        = number
  default     = 86400 # 1 day
}

# Monitoring and Analytics
variable "enable_real_user_monitoring" {
  description = "Enable Real User Monitoring (RUM)"
  type        = bool
  default     = false
}

variable "rum_app_monitor_name" {
  description = "Name for CloudWatch RUM app monitor"
  type        = string
  default     = ""
}

variable "enable_web_vitals_monitoring" {
  description = "Enable Web Vitals monitoring"
  type        = bool
  default     = true
}

# Edge Security
variable "enable_ddos_protection" {
  description = "Enable DDoS protection"
  type        = bool
  default     = true
}

variable "enable_origin_access_identity" {
  description = "Use CloudFront Origin Access Identity for S3"
  type        = bool
  default     = true
}

variable "enable_signed_urls" {
  description = "Enable CloudFront signed URLs for protected content"
  type        = bool
  default     = false
}

variable "signed_url_trusted_signers" {
  description = "List of trusted signers for signed URLs"
  type        = list(string)
  default     = []
}

# Content Optimization
variable "enable_automatic_compression" {
  description = "Enable automatic content compression"
  type        = bool
  default     = true
}

variable "compression_file_types" {
  description = "File types to compress"
  type        = list(string)
  default = [
    "text/html",
    "text/css",
    "text/javascript",
    "application/javascript",
    "application/json",
    "application/xml",
    "text/xml",
    "image/svg+xml"
  ]
}

# Internationalization
variable "enable_i18n_routing" {
  description = "Enable internationalization routing"
  type        = bool
  default     = true
}

variable "default_language" {
  description = "Default language code"
  type        = string
  default     = "en"
}

variable "supported_languages" {
  description = "List of supported language codes"
  type        = list(string)
  default     = ["en", "es", "fr", "de", "it", "pt", "ja", "ko", "zh", "ar", "hi"]
}

# Cost Optimization
variable "reserved_capacity_enabled" {
  description = "Enable reserved capacity for CloudFront"
  type        = bool
  default     = false
}

variable "cloudfront_savings_plan" {
  description = "CloudFront savings plan configuration"
  type = object({
    enabled     = bool
    commitment  = string
    term_length = string
  })
  default = {
    enabled     = false
    commitment  = "0"
    term_length = "1Year"
  }
}

# Disaster Recovery
variable "enable_disaster_recovery" {
  description = "Enable disaster recovery configuration"
  type        = bool
  default     = false
}

variable "dr_region" {
  description = "Disaster recovery AWS region"
  type        = string
  default     = ""
}

variable "rto_target_minutes" {
  description = "Recovery Time Objective target in minutes"
  type        = number
  default     = 60
}

variable "rpo_target_minutes" {
  description = "Recovery Point Objective target in minutes"
  type        = number
  default     = 15
}

# Feature Flags
variable "feature_flags" {
  description = "Feature flags for edge functions"
  type = map(object({
    enabled     = bool
    percentage  = number
    description = string
  }))
  default = {}
}

# Custom Error Pages
variable "custom_error_pages" {
  description = "Custom error page configuration"
  type = map(object({
    error_code         = number
    response_code      = number
    response_page_path = string
    ttl                = number
  }))
  default = {
    "404" = {
      error_code         = 404
      response_code      = 404
      response_page_path = "/404.html"
      ttl                = 300
    }
    "500" = {
      error_code         = 500
      response_code      = 500
      response_page_path = "/500.html"
      ttl                = 0
    }
  }
}

# Performance Budgets
variable "performance_budgets" {
  description = "Performance budget thresholds"
  type = object({
    first_contentful_paint_ms = number
    largest_contentful_paint_ms = number
    first_input_delay_ms = number
    cumulative_layout_shift = number
    total_blocking_time_ms = number
  })
  default = {
    first_contentful_paint_ms = 1500
    largest_contentful_paint_ms = 2500
    first_input_delay_ms = 100
    cumulative_layout_shift = 0.1
    total_blocking_time_ms = 300
  }
}