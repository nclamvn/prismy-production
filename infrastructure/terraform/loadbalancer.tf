# ===============================================
# Advanced Load Balancer Configuration
# Multi-layer load balancing with health checks
# ===============================================

# ===============================================
# Network Load Balancer (for WebSocket support)
# ===============================================
resource "aws_lb" "network" {
  count              = var.enable_websocket_support ? 1 : 0
  name               = "${var.environment}-prismy-nlb"
  internal           = false
  load_balancer_type = "network"
  subnets            = aws_subnet.public[*].id
  
  enable_deletion_protection = var.environment == "production"
  enable_cross_zone_load_balancing = true

  tags = {
    Name = "${var.environment}-prismy-nlb"
  }
}

resource "aws_lb_target_group" "websocket" {
  count       = var.enable_websocket_support ? 1 : 0
  name        = "${var.environment}-prismy-websocket-tg"
  port        = 3002
  protocol    = "TCP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 10
    protocol            = "TCP"
  }

  deregistration_delay = 30

  tags = {
    Name = "${var.environment}-prismy-websocket-tg"
  }
}

resource "aws_lb_listener" "websocket" {
  count             = var.enable_websocket_support ? 1 : 0
  load_balancer_arn = aws_lb.network[0].arn
  port              = "443"
  protocol          = "TLS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.main.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.websocket[0].arn
  }
}

# ===============================================
# ALB Advanced Configuration
# ===============================================

# Additional ALB Listener Rules
resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.app.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }

  condition {
    http_header {
      http_header_name = "X-API-Version"
      values          = ["v1", "v2"]
    }
  }
}

resource "aws_lb_listener_rule" "health_check" {
  listener_arn = aws_lb_listener.app.arn
  priority     = 99

  action {
    type = "fixed-response"
    fixed_response {
      content_type = "application/json"
      message_body = jsonencode({
        status = "healthy",
        timestamp = timestamp()
      })
      status_code = "200"
    }
  }

  condition {
    path_pattern {
      values = ["/health", "/healthz"]
    }
  }
}

resource "aws_lb_listener_rule" "maintenance" {
  count        = var.maintenance_mode ? 1 : 0
  listener_arn = aws_lb_listener.app.arn
  priority     = 1

  action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/html"
      message_body = file("${path.module}/templates/maintenance.html")
      status_code  = "503"
    }
  }

  condition {
    path_pattern {
      values = ["/*"]
    }
  }
}

# ===============================================
# Target Group Stickiness
# ===============================================
resource "aws_lb_target_group_attachment" "app_stickiness" {
  count            = length(aws_ecs_service.app.network_configuration[0].subnets)
  target_group_arn = aws_lb_target_group.app.arn
  target_id        = aws_ecs_service.app.id
  port             = 3000
}

resource "aws_lb_cookie_stickiness_policy" "app" {
  name                     = "${var.environment}-prismy-stickiness"
  load_balancer            = aws_lb.main.id
  lb_port                  = 443
  cookie_expiration_period = 86400
}

# ===============================================
# Multiple Target Groups for Blue/Green
# ===============================================
resource "aws_lb_target_group" "app_blue" {
  name        = "${var.environment}-prismy-app-blue-tg"
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

  deregistration_delay = 30
  
  stickiness {
    type            = "app_cookie"
    cookie_duration = 86400
    cookie_name     = "PRISMY_SESSION"
  }

  tags = {
    Name = "${var.environment}-prismy-app-blue-tg"
  }
}

resource "aws_lb_target_group" "app_green" {
  name        = "${var.environment}-prismy-app-green-tg"
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

  deregistration_delay = 30
  
  stickiness {
    type            = "app_cookie"
    cookie_duration = 86400
    cookie_name     = "PRISMY_SESSION"
  }

  tags = {
    Name = "${var.environment}-prismy-app-green-tg"
  }
}

# ===============================================
# Weighted Target Groups for Canary Deployments
# ===============================================
resource "aws_lb_listener_rule" "canary" {
  count        = var.enable_canary_deployment ? 1 : 0
  listener_arn = aws_lb_listener.app.arn
  priority     = 50

  action {
    type = "forward"
    forward {
      target_group {
        arn    = aws_lb_target_group.app_blue.arn
        weight = var.canary_weight_stable
      }
      target_group {
        arn    = aws_lb_target_group.app_green.arn
        weight = var.canary_weight_new
      }
      stickiness {
        enabled  = true
        duration = 3600
      }
    }
  }

  condition {
    path_pattern {
      values = ["/*"]
    }
  }
}

# ===============================================
# Global Accelerator for Multi-Region
# ===============================================
resource "aws_globalaccelerator_accelerator" "main" {
  count           = var.enable_global_accelerator ? 1 : 0
  name            = "${var.environment}-prismy-global"
  ip_address_type = "IPV4"
  enabled         = true

  attributes {
    flow_logs_enabled   = true
    flow_logs_s3_bucket = aws_s3_bucket.alb_logs.bucket
    flow_logs_s3_prefix = "global-accelerator"
  }

  tags = {
    Name = "${var.environment}-prismy-global-accelerator"
  }
}

resource "aws_globalaccelerator_listener" "main" {
  count           = var.enable_global_accelerator ? 1 : 0
  accelerator_arn = aws_globalaccelerator_accelerator.main[0].id
  protocol        = "TCP"

  port_range {
    from_port = 443
    to_port   = 443
  }

  port_range {
    from_port = 80
    to_port   = 80
  }
}

resource "aws_globalaccelerator_endpoint_group" "main" {
  count                        = var.enable_global_accelerator ? 1 : 0
  listener_arn                 = aws_globalaccelerator_listener.main[0].id
  endpoint_group_region        = var.aws_region
  health_check_interval_seconds = 30
  health_check_path            = "/api/health"
  health_check_port            = 443
  health_check_protocol        = "HTTPS"
  threshold_count              = 3
  traffic_dial_percentage      = 100

  endpoint_configuration {
    endpoint_id = aws_lb.main.arn
    weight      = 100
  }
}

# ===============================================
# Request Routing Rules
# ===============================================

# Route based on geographic location
resource "aws_lb_listener_rule" "geo_routing" {
  count        = var.enable_geo_routing ? 1 : 0
  listener_arn = aws_lb_listener.app.arn
  priority     = 200

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  condition {
    http_header {
      http_header_name = "CloudFront-Viewer-Country"
      values          = ["US", "CA", "MX"]
    }
  }
}

# Route based on device type
resource "aws_lb_listener_rule" "mobile_routing" {
  count        = var.enable_device_routing ? 1 : 0
  listener_arn = aws_lb_listener.app.arn
  priority     = 201

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  condition {
    http_header {
      http_header_name = "CloudFront-Is-Mobile-Viewer"
      values          = ["true"]
    }
  }
}

# ===============================================
# ALB Access Logs Analysis
# ===============================================
resource "aws_athena_database" "alb_logs" {
  count  = var.enable_alb_logs_analysis ? 1 : 0
  name   = "${var.environment}_prismy_alb_logs"
  bucket = aws_s3_bucket.alb_logs.bucket

  encryption_configuration {
    encryption_option = "SSE_S3"
  }
}

resource "aws_athena_table" "alb_logs" {
  count     = var.enable_alb_logs_analysis ? 1 : 0
  name      = "alb_logs"
  database  = aws_athena_database.alb_logs[0].name

  table_type = "EXTERNAL_TABLE"

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.alb_logs.bucket}/alb-logs/"
    input_format  = "org.apache.hadoop.mapred.TextInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat"

    ser_de_info {
      serialization_library = "org.apache.hadoop.hive.serde2.RegexSerDe"
      
      parameters = {
        "serialization.format" = "1"
        "input.regex" = "([^ ]*) ([^ ]*) ([^ ]*) ([^ ]*):([0-9]*) ([^ ]*)[:-]([0-9]*) ([-.0-9]*) ([-.0-9]*) ([-.0-9]*) (|[-0-9]*) (-|[-0-9]*) ([-0-9]*) ([-0-9]*) \"([^ ]*) ([^ ]*) (- |[^ ]*)\" \"([^\"]*)\" ([A-Z0-9-]+) ([A-Za-z0-9.-]*) ([^ ]*) \"([^\"]*)\" \"([^\"]*)\" \"([^\"]*)\" ([-.0-9]*) ([^ ]*) \"([^\"]*)\" \"([^\"]*)\" \"([^ ]*)\" \"([^\\s]+?)\" \"([^\\s]+)\" \"([^ ]*)\" \"([^ ]*)\""
      }
    }

    columns {
      name = "type"
      type = "string"
    }
    columns {
      name = "time"
      type = "string"
    }
    columns {
      name = "elb"
      type = "string"
    }
    columns {
      name = "client_ip"
      type = "string"
    }
    columns {
      name = "client_port"
      type = "int"
    }
    columns {
      name = "target_ip"
      type = "string"
    }
    columns {
      name = "target_port"
      type = "int"
    }
    columns {
      name = "request_processing_time"
      type = "double"
    }
    columns {
      name = "target_processing_time"
      type = "double"
    }
    columns {
      name = "response_processing_time"
      type = "double"
    }
    columns {
      name = "elb_status_code"
      type = "string"
    }
    columns {
      name = "target_status_code"
      type = "string"
    }
    columns {
      name = "received_bytes"
      type = "bigint"
    }
    columns {
      name = "sent_bytes"
      type = "bigint"
    }
    columns {
      name = "request_verb"
      type = "string"
    }
    columns {
      name = "request_url"
      type = "string"
    }
    columns {
      name = "request_proto"
      type = "string"
    }
    columns {
      name = "user_agent"
      type = "string"
    }
    columns {
      name = "ssl_cipher"
      type = "string"
    }
    columns {
      name = "ssl_protocol"
      type = "string"
    }
    columns {
      name = "target_group_arn"
      type = "string"
    }
    columns {
      name = "trace_id"
      type = "string"
    }
  }
}

# ===============================================
# Load Balancer Controller for Kubernetes
# ===============================================
resource "aws_iam_policy" "alb_controller" {
  count       = var.enable_eks_alb_controller ? 1 : 0
  name        = "${var.environment}-prismy-alb-controller-policy"
  path        = "/"
  description = "IAM policy for AWS Load Balancer Controller"

  policy = file("${path.module}/policies/alb-controller-policy.json")
}

# ===============================================
# Connection Draining Configuration
# ===============================================
resource "aws_lb_target_group" "app_with_draining" {
  name        = "${var.environment}-prismy-app-drain-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  deregistration_delay          = 300
  slow_start                    = 30
  load_balancing_algorithm_type = "least_outstanding_requests"

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
    Name = "${var.environment}-prismy-app-drain-tg"
  }
}