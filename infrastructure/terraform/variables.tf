# ===============================================
# Terraform Variables for Prismy Infrastructure
# ===============================================

# ===============================================
# General Configuration
# ===============================================
variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"
  
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be one of: dev, staging, production."
  }
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "prismy"
}

# ===============================================
# Networking
# ===============================================
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# ===============================================
# Domain and SSL
# ===============================================
variable "domain_name" {
  description = "Primary domain name"
  type        = string
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token for DNS management"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for the domain"
  type        = string
}

# ===============================================
# Database Configuration
# ===============================================
variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.large"
}

variable "rds_allocated_storage" {
  description = "Initial storage size for RDS instance (GB)"
  type        = number
  default     = 100
}

variable "rds_max_allocated_storage" {
  description = "Maximum storage size for RDS autoscaling (GB)"
  type        = number
  default     = 1000
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "prismy"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "db_backup_retention" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 30
}

# ===============================================
# Redis Configuration
# ===============================================
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.r6g.large"
}

variable "redis_num_nodes" {
  description = "Number of Redis nodes"
  type        = number
  default     = 2
}

variable "redis_auth_token" {
  description = "Redis authentication token"
  type        = string
  sensitive   = true
}

# ===============================================
# ECS Configuration
# ===============================================
variable "ecs_app_cpu" {
  description = "CPU units for the app task"
  type        = number
  default     = 1024
}

variable "ecs_app_memory" {
  description = "Memory (MB) for the app task"
  type        = number
  default     = 2048
}

variable "ecs_app_count" {
  description = "Number of app tasks to run"
  type        = number
  default     = 3
}

variable "ecs_worker_cpu" {
  description = "CPU units for the worker task"
  type        = number
  default     = 512
}

variable "ecs_worker_memory" {
  description = "Memory (MB) for the worker task"
  type        = number
  default     = 1024
}

variable "ecs_worker_count" {
  description = "Number of worker tasks to run"
  type        = number
  default     = 2
}

# ===============================================
# Auto Scaling Configuration
# ===============================================
variable "autoscaling_min_capacity" {
  description = "Minimum number of tasks for auto scaling"
  type        = number
  default     = 2
}

variable "autoscaling_max_capacity" {
  description = "Maximum number of tasks for auto scaling"
  type        = number
  default     = 20
}

variable "autoscaling_target_cpu" {
  description = "Target CPU utilization for auto scaling"
  type        = number
  default     = 70
}

variable "autoscaling_target_memory" {
  description = "Target memory utilization for auto scaling"
  type        = number
  default     = 80
}

# ===============================================
# CloudFront Configuration
# ===============================================
variable "cloudfront_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_All"
  
  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.cloudfront_price_class)
    error_message = "CloudFront price class must be one of: PriceClass_100, PriceClass_200, PriceClass_All."
  }
}

variable "cloudfront_cache_policy_id" {
  description = "CloudFront cache policy ID"
  type        = string
  default     = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingDisabled
}

# ===============================================
# S3 Configuration
# ===============================================
variable "s3_storage_class" {
  description = "Default S3 storage class"
  type        = string
  default     = "STANDARD"
}

variable "s3_lifecycle_transition_days" {
  description = "Days before transitioning to IA storage"
  type        = number
  default     = 30
}

variable "s3_lifecycle_expiration_days" {
  description = "Days before expiring objects"
  type        = number
  default     = 2555 # 7 years
}

# ===============================================
# Monitoring Configuration
# ===============================================
variable "cloudwatch_log_retention" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "enable_container_insights" {
  description = "Enable ECS Container Insights"
  type        = bool
  default     = true
}

variable "enable_enhanced_monitoring" {
  description = "Enable enhanced monitoring for RDS"
  type        = bool
  default     = true
}

# ===============================================
# Security Configuration
# ===============================================
variable "enable_deletion_protection" {
  description = "Enable deletion protection for critical resources"
  type        = bool
  default     = true
}

variable "enable_backup_encryption" {
  description = "Enable encryption for backups"
  type        = bool
  default     = true
}

variable "kms_key_deletion_window" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 30
}

# ===============================================
# Application Configuration
# ===============================================
variable "app_image_tag" {
  description = "Docker image tag for the application"
  type        = string
  default     = "latest"
}

variable "worker_image_tag" {
  description = "Docker image tag for the worker"
  type        = string
  default     = "latest"
}

variable "ecr_repository_url" {
  description = "ECR repository URL for Docker images"
  type        = string
}

# ===============================================
# Environment Variables
# ===============================================
variable "nextauth_secret" {
  description = "NextAuth secret key"
  type        = string
  sensitive   = true
}

variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
}

variable "supabase_anon_key" {
  description = "Supabase anonymous key"
  type        = string
  sensitive   = true
}

variable "supabase_service_role_key" {
  description = "Supabase service role key"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook secret"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
}

variable "resend_api_key" {
  description = "Resend API key for email"
  type        = string
  sensitive   = true
}

# ===============================================
# Feature Flags
# ===============================================
variable "enable_waf" {
  description = "Enable AWS WAF"
  type        = bool
  default     = true
}

variable "enable_cloudfront" {
  description = "Enable CloudFront CDN"
  type        = bool
  default     = true
}

variable "enable_auto_scaling" {
  description = "Enable auto scaling for ECS services"
  type        = bool
  default     = true
}

variable "enable_performance_insights" {
  description = "Enable RDS Performance Insights"
  type        = bool
  default     = true
}

variable "enable_multi_az" {
  description = "Enable Multi-AZ deployment for RDS"
  type        = bool
  default     = true
}

# ===============================================
# Cost Optimization
# ===============================================
variable "use_spot_instances" {
  description = "Use Spot instances for non-critical workloads"
  type        = bool
  default     = false
}

variable "enable_s3_intelligent_tiering" {
  description = "Enable S3 Intelligent Tiering"
  type        = bool
  default     = true
}

variable "enable_rds_auto_scaling" {
  description = "Enable RDS storage auto scaling"
  type        = bool
  default     = true
}

# ===============================================
# Backup Configuration
# ===============================================
variable "backup_schedule" {
  description = "Backup schedule expression"
  type        = string
  default     = "cron(0 3 * * ? *)" # Daily at 3 AM UTC
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 30
}

# ===============================================
# Notification Configuration
# ===============================================
variable "notification_email" {
  description = "Email address for notifications"
  type        = string
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for notifications"
  type        = string
  default     = ""
}

# ===============================================
# Tags
# ===============================================
variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "prismy"
    ManagedBy   = "terraform"
    Environment = "production"
  }
}