# ===============================================
# Database Security Groups and Network Configuration
# ===============================================

# Security group for PgBouncer connection pooling
resource "aws_security_group" "pgbouncer" {
  count = var.enable_connection_pooling ? 1 : 0
  
  name        = "${var.environment}-prismy-pgbouncer-sg"
  description = "Security group for PgBouncer connection pooler"
  vpc_id      = aws_vpc.main.id
  
  # Allow connections from application servers
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
    description     = "PostgreSQL from ECS tasks"
  }
  
  # Allow health checks from load balancer
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Health checks from ALB"
  }
  
  # Allow connections within the same security group for clustering
  ingress {
    from_port = 5432
    to_port   = 5432
    protocol  = "tcp"
    self      = true
    description = "PgBouncer clustering"
  }
  
  # Allow outbound connections to RDS
  egress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.rds_optimized.id]
    description     = "PostgreSQL to RDS"
  }
  
  # Allow DNS resolution
  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "DNS resolution"
  }
  
  # Allow HTTPS for service discovery
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS for service discovery"
  }
  
  tags = {
    Name = "${var.environment}-prismy-pgbouncer-sg"
  }
}

# Security group for database maintenance Lambda
resource "aws_security_group" "lambda_db_maintenance" {
  count = var.enable_automated_maintenance ? 1 : 0
  
  name        = "${var.environment}-prismy-lambda-db-maintenance-sg"
  description = "Security group for database maintenance Lambda"
  vpc_id      = aws_vpc.main.id
  
  # Allow outbound connections to RDS
  egress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.rds_optimized.id]
    description     = "PostgreSQL to RDS"
  }
  
  # Allow HTTPS for AWS services
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS for AWS services"
  }
  
  # Allow DNS resolution
  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "DNS resolution"
  }
  
  tags = {
    Name = "${var.environment}-prismy-lambda-db-maintenance-sg"
  }
}

# Load balancer for PgBouncer
resource "aws_lb" "pgbouncer" {
  count = var.enable_connection_pooling ? 1 : 0
  
  name               = "${var.environment}-prismy-pgbouncer-nlb"
  internal           = true
  load_balancer_type = "network"
  subnets            = aws_subnet.private[*].id
  
  enable_deletion_protection = false
  
  tags = {
    Name = "${var.environment}-prismy-pgbouncer-nlb"
  }
}

# Target group for PgBouncer
resource "aws_lb_target_group" "pgbouncer" {
  count = var.enable_connection_pooling ? 1 : 0
  
  name        = "${var.environment}-prismy-pgbouncer-tg"
  port        = 5432
  protocol    = "TCP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = ""
    path                = ""
    port                = "traffic-port"
    protocol            = "TCP"
    timeout             = 10
    unhealthy_threshold = 2
  }
  
  tags = {
    Name = "${var.environment}-prismy-pgbouncer-tg"
  }
}

# Listener for PgBouncer load balancer
resource "aws_lb_listener" "pgbouncer" {
  count = var.enable_connection_pooling ? 1 : 0
  
  load_balancer_arn = aws_lb.pgbouncer[0].arn
  port              = "5432"
  protocol          = "TCP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.pgbouncer[0].arn
  }
  
  tags = {
    Name = "${var.environment}-prismy-pgbouncer-listener"
  }
}

# Service discovery for PgBouncer
resource "aws_service_discovery_private_dns_namespace" "main" {
  count = var.enable_connection_pooling ? 1 : 0
  
  name        = "${var.environment}.prismy.local"
  description = "Private DNS namespace for service discovery"
  vpc         = aws_vpc.main.id
  
  tags = {
    Name = "${var.environment}-prismy-service-discovery"
  }
}

resource "aws_service_discovery_service" "pgbouncer" {
  count = var.enable_connection_pooling ? 1 : 0
  
  name = "pgbouncer"
  
  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main[0].id
    
    dns_records {
      ttl  = 10
      type = "A"
    }
    
    routing_policy = "MULTIVALUE"
  }
  
  health_check_grace_period_seconds = 30
  
  tags = {
    Name = "${var.environment}-prismy-pgbouncer-discovery"
  }
}

# CloudWatch log group for PgBouncer
resource "aws_cloudwatch_log_group" "pgbouncer" {
  count = var.enable_connection_pooling ? 1 : 0
  
  name              = "/ecs/${var.environment}-prismy-pgbouncer"
  retention_in_days = 30
  
  tags = {
    Name = "${var.environment}-prismy-pgbouncer-logs"
  }
}

# IAM role for database maintenance Lambda
resource "aws_iam_role" "db_maintenance" {
  count = var.enable_automated_maintenance ? 1 : 0
  
  name = "${var.environment}-prismy-db-maintenance-role"
  
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
    Name = "${var.environment}-prismy-db-maintenance-role"
  }
}

resource "aws_iam_role_policy_attachment" "db_maintenance_vpc" {
  count = var.enable_automated_maintenance ? 1 : 0
  
  role       = aws_iam_role.db_maintenance[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "db_maintenance" {
  count = var.enable_automated_maintenance ? 1 : 0
  
  name = "${var.environment}-prismy-db-maintenance-policy"
  role = aws_iam_role.db_maintenance[0].id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:DescribeDBClusters",
          "rds:ListTagsForResource"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.db_password.arn,
          "${aws_secretsmanager_secret.db_password.arn}*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.environment}-prismy-db-maintenance:*"
      }
    ]
  })
}

# Lambda permission for EventBridge
resource "aws_lambda_permission" "allow_eventbridge_db_maintenance" {
  count = var.enable_automated_maintenance ? 1 : 0
  
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.db_maintenance[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.db_maintenance_schedule[0].arn
}