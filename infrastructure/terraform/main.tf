# ===============================================
# Prismy Production Infrastructure
# AWS-based scalable and secure deployment
# ===============================================

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }

  backend "s3" {
    bucket         = "prismy-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "prismy-terraform-locks"
  }
}

# ===============================================
# Provider Configuration
# ===============================================
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = "prismy"
      ManagedBy   = "terraform"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# ===============================================
# Data Sources
# ===============================================
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# ===============================================
# VPC and Networking
# ===============================================
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.environment}-prismy-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.environment}-prismy-igw"
  }
}

resource "aws_subnet" "public" {
  count = 3

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.environment}-prismy-public-${count.index + 1}"
    Type = "public"
  }
}

resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.environment}-prismy-private-${count.index + 1}"
    Type = "private"
  }
}

resource "aws_subnet" "database" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 20}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.environment}-prismy-database-${count.index + 1}"
    Type = "database"
  }
}

# ===============================================
# NAT Gateways
# ===============================================
resource "aws_eip" "nat" {
  count = 3

  domain = "vpc"
  
  tags = {
    Name = "${var.environment}-prismy-nat-eip-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count = 3

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.environment}-prismy-nat-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

# ===============================================
# Route Tables
# ===============================================
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.environment}-prismy-public-rt"
  }
}

resource "aws_route_table" "private" {
  count = 3

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "${var.environment}-prismy-private-rt-${count.index + 1}"
  }
}

resource "aws_route_table_association" "public" {
  count = 3

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = 3

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ===============================================
# Security Groups
# ===============================================
resource "aws_security_group" "alb" {
  name        = "${var.environment}-prismy-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-prismy-alb-sg"
  }
}

resource "aws_security_group" "ecs" {
  name        = "${var.environment}-prismy-ecs-sg"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-prismy-ecs-sg"
  }
}

resource "aws_security_group" "rds" {
  name        = "${var.environment}-prismy-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-prismy-rds-sg"
  }
}

resource "aws_security_group" "redis" {
  name        = "${var.environment}-prismy-redis-sg"
  description = "Security group for Redis cluster"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  tags = {
    Name = "${var.environment}-prismy-redis-sg"
  }
}

# ===============================================
# Application Load Balancer
# ===============================================
resource "aws_lb" "main" {
  name               = "${var.environment}-prismy-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = var.environment == "production"

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    prefix  = "alb-logs"
    enabled = true
  }

  tags = {
    Name = "${var.environment}-prismy-alb"
  }
}

resource "aws_lb_target_group" "app" {
  name        = "${var.environment}-prismy-app-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/api/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 10
    unhealthy_threshold = 3
  }

  tags = {
    Name = "${var.environment}-prismy-app-tg"
  }
}

resource "aws_lb_listener" "app" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate_validation.main.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

resource "aws_lb_listener" "redirect" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# ===============================================
# ECS Cluster
# ===============================================
resource "aws_ecs_cluster" "main" {
  name = "${var.environment}-prismy"

  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"
      
      log_configuration {
        cloud_watch_log_group_name = aws_cloudwatch_log_group.ecs.name
      }
    }
  }

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.environment}-prismy-cluster"
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

# ===============================================
# CloudWatch Log Groups
# ===============================================
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.environment}-prismy"
  retention_in_days = 30

  tags = {
    Name = "${var.environment}-prismy-ecs-logs"
  }
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/ecs/${var.environment}-prismy-app"
  retention_in_days = 30

  tags = {
    Name = "${var.environment}-prismy-app-logs"
  }
}

# ===============================================
# RDS Database
# ===============================================
resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-prismy-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = {
    Name = "${var.environment}-prismy-db-subnet-group"
  }
}

resource "aws_db_instance" "main" {
  identifier = "${var.environment}-prismy-db"

  engine         = "postgres"
  engine_version = "16.1"
  instance_class = var.rds_instance_class

  allocated_storage     = var.rds_allocated_storage
  max_allocated_storage = var.rds_max_allocated_storage
  storage_encrypted     = true
  storage_type          = "gp3"

  db_name  = "prismy"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = var.environment != "production"
  deletion_protection = var.environment == "production"

  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn         = aws_iam_role.rds_monitoring.arn

  tags = {
    Name = "${var.environment}-prismy-db"
  }
}

# ===============================================
# ElastiCache Redis
# ===============================================
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.environment}-prismy-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.environment}-prismy-redis-subnet-group"
  }
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id         = "${var.environment}-prismy-redis"
  description                  = "Redis cluster for Prismy ${var.environment}"
  
  port                         = 6379
  parameter_group_name         = "default.redis7"
  node_type                    = var.redis_node_type
  num_cache_clusters           = var.redis_num_nodes
  
  subnet_group_name            = aws_elasticache_subnet_group.main.name
  security_group_ids           = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled   = true
  transit_encryption_enabled   = true
  auth_token                   = var.redis_auth_token
  
  automatic_failover_enabled   = var.redis_num_nodes > 1
  multi_az_enabled            = var.redis_num_nodes > 1
  
  snapshot_retention_limit     = 5
  snapshot_window             = "03:00-05:00"
  
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format       = "text"
    log_type         = "slow-log"
  }

  tags = {
    Name = "${var.environment}-prismy-redis"
  }
}

resource "aws_cloudwatch_log_group" "redis" {
  name              = "/aws/elasticache/${var.environment}-prismy-redis"
  retention_in_days = 7

  tags = {
    Name = "${var.environment}-prismy-redis-logs"
  }
}

# ===============================================
# S3 Buckets
# ===============================================
resource "aws_s3_bucket" "app_storage" {
  bucket = "${var.environment}-prismy-storage-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "${var.environment}-prismy-storage"
  }
}

resource "aws_s3_bucket" "alb_logs" {
  bucket = "${var.environment}-prismy-alb-logs-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "${var.environment}-prismy-alb-logs"
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_versioning" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ===============================================
# CloudFront CDN
# ===============================================
resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALB-${aws_lb.main.name}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Static assets origin
  origin {
    domain_name = aws_s3_bucket.app_storage.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.app_storage.bucket}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Prismy ${var.environment} CDN"
  default_root_object = "index.html"

  aliases = [var.domain_name, "www.${var.domain_name}"]

  # Default behavior for dynamic content
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "ALB-${aws_lb.main.name}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      headers      = ["Host", "Authorization", "CloudFront-Forwarded-Proto"]
      
      cookies {
        forward = "all"
      }
    }

    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  # Cache behavior for static assets
  ordered_cache_behavior {
    path_pattern           = "/_next/static/*"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "ALB-${aws_lb.main.name}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 31536000
    default_ttl = 31536000
    max_ttl     = 31536000
  }

  # Cache behavior for API routes (no caching)
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "ALB-${aws_lb.main.name}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      headers      = ["*"]
      
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  price_class = var.cloudfront_price_class

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.main.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  web_acl_id = aws_wafv2_web_acl.main.arn

  tags = {
    Name = "${var.environment}-prismy-cdn"
  }
}

resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "Prismy ${var.environment} OAI"
}

# ===============================================
# ACM Certificate
# ===============================================
resource "aws_acm_certificate" "main" {
  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.environment}-prismy-cert"
  }
}

resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in cloudflare_record.cert_validation : record.hostname]
}

# ===============================================
# WAF
# ===============================================
resource "aws_wafv2_web_acl" "main" {
  name  = "${var.environment}-prismy-waf"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "PrismyWAF"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = "${var.environment}-prismy-waf"
  }
}