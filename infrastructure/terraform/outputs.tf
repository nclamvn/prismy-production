# ===============================================
# Terraform Outputs for Prismy Infrastructure
# ===============================================

# ===============================================
# Network Outputs
# ===============================================
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = aws_subnet.database[*].id
}

# ===============================================
# Load Balancer Outputs
# ===============================================
output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "load_balancer_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.app.arn
}

# ===============================================
# ECS Outputs
# ===============================================
output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

# ===============================================
# Database Outputs
# ===============================================
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

output "rds_username" {
  description = "RDS master username"
  value       = aws_db_instance.main.username
}

output "rds_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.main.arn
}

# ===============================================
# Redis Outputs
# ===============================================
output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
  sensitive   = true
}

output "redis_port" {
  description = "Redis cluster port"
  value       = aws_elasticache_replication_group.main.port
}

output "redis_reader_endpoint" {
  description = "Redis cluster reader endpoint"
  value       = aws_elasticache_replication_group.main.reader_endpoint_address
  sensitive   = true
}

# ===============================================
# S3 Outputs
# ===============================================
output "s3_storage_bucket_name" {
  description = "Name of the S3 storage bucket"
  value       = aws_s3_bucket.app_storage.bucket
}

output "s3_storage_bucket_arn" {
  description = "ARN of the S3 storage bucket"
  value       = aws_s3_bucket.app_storage.arn
}

output "s3_storage_bucket_domain_name" {
  description = "Domain name of the S3 storage bucket"
  value       = aws_s3_bucket.app_storage.bucket_domain_name
}

output "s3_alb_logs_bucket_name" {
  description = "Name of the S3 ALB logs bucket"
  value       = aws_s3_bucket.alb_logs.bucket
}

# ===============================================
# CloudFront Outputs
# ===============================================
output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.arn
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "Hosted zone ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.hosted_zone_id
}

# ===============================================
# Security Group Outputs
# ===============================================
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ecs_security_group_id" {
  description = "ID of the ECS security group"
  value       = aws_security_group.ecs.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "redis_security_group_id" {
  description = "ID of the Redis security group"
  value       = aws_security_group.redis.id
}

# ===============================================
# SSL Certificate Outputs
# ===============================================
output "ssl_certificate_arn" {
  description = "ARN of the SSL certificate"
  value       = aws_acm_certificate.main.arn
}

output "ssl_certificate_status" {
  description = "Status of the SSL certificate"
  value       = aws_acm_certificate.main.status
}

# ===============================================
# WAF Outputs
# ===============================================
output "waf_web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

# ===============================================
# CloudWatch Outputs
# ===============================================
output "cloudwatch_log_group_ecs" {
  description = "Name of the ECS CloudWatch log group"
  value       = aws_cloudwatch_log_group.ecs.name
}

output "cloudwatch_log_group_app" {
  description = "Name of the application CloudWatch log group"
  value       = aws_cloudwatch_log_group.app.name
}

# ===============================================
# IAM Outputs
# ===============================================
output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task.arn
}

# ===============================================
# Application Outputs
# ===============================================
output "application_url" {
  description = "URL of the application"
  value       = "https://${var.domain_name}"
}

output "api_url" {
  description = "URL of the API"
  value       = "https://${var.domain_name}/api"
}

# ===============================================
# Environment Configuration
# ===============================================
output "environment_variables" {
  description = "Environment variables for the application"
  value = {
    NODE_ENV                    = "production"
    DATABASE_URL               = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.endpoint}:${aws_db_instance.main.port}/${aws_db_instance.main.db_name}"
    REDIS_URL                  = "redis://:${var.redis_auth_token}@${aws_elasticache_replication_group.main.primary_endpoint_address}:${aws_elasticache_replication_group.main.port}"
    S3_BUCKET_NAME             = aws_s3_bucket.app_storage.bucket
    S3_REGION                  = var.aws_region
    CLOUDFRONT_DISTRIBUTION_ID = aws_cloudfront_distribution.main.id
    AWS_REGION                 = var.aws_region
  }
  sensitive = true
}

# ===============================================
# Monitoring Endpoints
# ===============================================
output "monitoring_endpoints" {
  description = "Monitoring and health check endpoints"
  value = {
    health_check = "https://${var.domain_name}/api/health"
    metrics      = "https://${var.domain_name}/api/metrics"
    status       = "https://${var.domain_name}/api/status"
  }
}

# ===============================================
# DNS Configuration
# ===============================================
output "dns_configuration" {
  description = "DNS configuration details"
  value = {
    domain_name                = var.domain_name
    cloudfront_domain_name     = aws_cloudfront_distribution.main.domain_name
    load_balancer_dns_name     = aws_lb.main.dns_name
    cloudfront_hosted_zone_id  = aws_cloudfront_distribution.main.hosted_zone_id
    load_balancer_hosted_zone_id = aws_lb.main.zone_id
  }
}

# ===============================================
# Resource Summary
# ===============================================
output "resource_summary" {
  description = "Summary of created resources"
  value = {
    vpc_id                     = aws_vpc.main.id
    ecs_cluster_name          = aws_ecs_cluster.main.name
    rds_instance_id           = aws_db_instance.main.identifier
    redis_cluster_id          = aws_elasticache_replication_group.main.replication_group_id
    cloudfront_distribution_id = aws_cloudfront_distribution.main.id
    s3_storage_bucket         = aws_s3_bucket.app_storage.bucket
    load_balancer_name        = aws_lb.main.name
    waf_web_acl_name          = aws_wafv2_web_acl.main.name
  }
}

# ===============================================
# Cost Optimization Outputs
# ===============================================
output "cost_optimization_info" {
  description = "Information for cost optimization"
  value = {
    rds_instance_class        = aws_db_instance.main.instance_class
    redis_node_type          = aws_elasticache_replication_group.main.node_type
    cloudfront_price_class   = aws_cloudfront_distribution.main.price_class
    s3_storage_bucket_region = aws_s3_bucket.app_storage.region
  }
}

# ===============================================
# Security Information
# ===============================================
output "security_information" {
  description = "Security-related information"
  value = {
    waf_enabled               = true
    ssl_certificate_validated = aws_acm_certificate_validation.main.certificate_arn != ""
    vpc_flow_logs_enabled    = false # Would be implemented separately
    cloudtrail_enabled       = false # Would be implemented separately
    rds_encryption_enabled   = aws_db_instance.main.storage_encrypted
    redis_encryption_enabled = aws_elasticache_replication_group.main.at_rest_encryption_enabled
    s3_encryption_enabled    = true
  }
}