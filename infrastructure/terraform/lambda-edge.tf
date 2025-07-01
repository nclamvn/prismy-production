# ===============================================
# Lambda@Edge Functions for Global Optimization
# ===============================================

# ===============================================
# Edge Authentication Function
# ===============================================

resource "aws_lambda_function" "edge_auth" {
  provider = aws.us_east_1  # Lambda@Edge must be in us-east-1
  
  filename         = "lambda/edge-auth.zip"
  function_name    = "${var.environment}-prismy-edge-auth"
  role            = aws_iam_role.lambda_edge_auth.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 5
  memory_size     = 128
  publish         = true
  
  tags = {
    Name        = "${var.environment}-prismy-edge-auth"
    Environment = var.environment
    Purpose     = "edge-authentication"
  }
}

# IAM role for edge authentication Lambda
resource "aws_iam_role" "lambda_edge_auth" {
  provider = aws.us_east_1
  
  name = "${var.environment}-prismy-lambda-edge-auth-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "edgelambda.amazonaws.com"
          ]
        }
      }
    ]
  })
  
  tags = {
    Name = "${var.environment}-prismy-lambda-edge-auth-role"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_edge_auth_basic" {
  provider = aws.us_east_1
  
  role       = aws_iam_role.lambda_edge_auth.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ===============================================
# Edge Security Headers Function
# ===============================================

resource "aws_lambda_function" "edge_security_headers" {
  provider = aws.us_east_1
  
  filename         = "lambda/edge-security-headers.zip"
  function_name    = "${var.environment}-prismy-edge-security-headers"
  role            = aws_iam_role.lambda_edge_security.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 5
  memory_size     = 128
  publish         = true
  
  tags = {
    Name        = "${var.environment}-prismy-edge-security-headers"
    Environment = var.environment
    Purpose     = "edge-security"
  }
}

# IAM role for edge security Lambda
resource "aws_iam_role" "lambda_edge_security" {
  provider = aws.us_east_1
  
  name = "${var.environment}-prismy-lambda-edge-security-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "edgelambda.amazonaws.com"
          ]
        }
      }
    ]
  })
  
  tags = {
    Name = "${var.environment}-prismy-lambda-edge-security-role"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_edge_security_basic" {
  provider = aws.us_east_1
  
  role       = aws_iam_role.lambda_edge_security.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ===============================================
# Edge A/B Testing Function
# ===============================================

resource "aws_lambda_function" "edge_ab_testing" {
  count    = var.enable_ab_testing ? 1 : 0
  provider = aws.us_east_1
  
  filename         = "lambda/edge-ab-testing.zip"
  function_name    = "${var.environment}-prismy-edge-ab-testing"
  role            = aws_iam_role.lambda_edge_ab_testing[0].arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 5
  memory_size     = 128
  publish         = true
  
  tags = {
    Name        = "${var.environment}-prismy-edge-ab-testing"
    Environment = var.environment
    Purpose     = "edge-ab-testing"
  }
}

# IAM role for A/B testing Lambda
resource "aws_iam_role" "lambda_edge_ab_testing" {
  count    = var.enable_ab_testing ? 1 : 0
  provider = aws.us_east_1
  
  name = "${var.environment}-prismy-lambda-edge-ab-testing-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "edgelambda.amazonaws.com"
          ]
        }
      }
    ]
  })
  
  tags = {
    Name = "${var.environment}-prismy-lambda-edge-ab-testing-role"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_edge_ab_testing_basic" {
  count    = var.enable_ab_testing ? 1 : 0
  provider = aws.us_east_1
  
  role       = aws_iam_role.lambda_edge_ab_testing[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ===============================================
# Edge Bot Detection Function
# ===============================================

resource "aws_lambda_function" "edge_bot_detection" {
  count    = var.enable_bot_detection ? 1 : 0
  provider = aws.us_east_1
  
  filename         = "lambda/edge-bot-detection.zip"
  function_name    = "${var.environment}-prismy-edge-bot-detection"
  role            = aws_iam_role.lambda_edge_bot_detection[0].arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 5
  memory_size     = 128
  publish         = true
  
  environment {
    variables = {
      LOG_LEVEL = "INFO"
    }
  }
  
  tags = {
    Name        = "${var.environment}-prismy-edge-bot-detection"
    Environment = var.environment
    Purpose     = "edge-bot-detection"
  }
}

# IAM role for bot detection Lambda
resource "aws_iam_role" "lambda_edge_bot_detection" {
  count    = var.enable_bot_detection ? 1 : 0
  provider = aws.us_east_1
  
  name = "${var.environment}-prismy-lambda-edge-bot-detection-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "edgelambda.amazonaws.com"
          ]
        }
      }
    ]
  })
  
  tags = {
    Name = "${var.environment}-prismy-lambda-edge-bot-detection-role"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_edge_bot_detection_basic" {
  count    = var.enable_bot_detection ? 1 : 0
  provider = aws.us_east_1
  
  role       = aws_iam_role.lambda_edge_bot_detection[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ===============================================
# Edge Image Optimization Function
# ===============================================

resource "aws_lambda_function" "edge_image_optimization" {
  count    = var.enable_image_optimization ? 1 : 0
  provider = aws.us_east_1
  
  filename         = "lambda/edge-image-optimization.zip"
  function_name    = "${var.environment}-prismy-edge-image-optimization"
  role            = aws_iam_role.lambda_edge_image_optimization[0].arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 10
  memory_size     = 256
  publish         = true
  
  environment {
    variables = {
      QUALITY = "85"
      MAX_WIDTH = "1920"
      MAX_HEIGHT = "1080"
    }
  }
  
  tags = {
    Name        = "${var.environment}-prismy-edge-image-optimization"
    Environment = var.environment
    Purpose     = "edge-image-optimization"
  }
}

# IAM role for image optimization Lambda
resource "aws_iam_role" "lambda_edge_image_optimization" {
  count    = var.enable_image_optimization ? 1 : 0
  provider = aws.us_east_1
  
  name = "${var.environment}-prismy-lambda-edge-image-optimization-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "edgelambda.amazonaws.com"
          ]
        }
      }
    ]
  })
  
  tags = {
    Name = "${var.environment}-prismy-lambda-edge-image-optimization-role"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_edge_image_optimization_basic" {
  count    = var.enable_image_optimization ? 1 : 0
  provider = aws.us_east_1
  
  role       = aws_iam_role.lambda_edge_image_optimization[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ===============================================
# Edge Geo-routing Function
# ===============================================

resource "aws_lambda_function" "edge_geo_routing" {
  count    = var.enable_geo_routing ? 1 : 0
  provider = aws.us_east_1
  
  filename         = "lambda/edge-geo-routing.zip"
  function_name    = "${var.environment}-prismy-edge-geo-routing"
  role            = aws_iam_role.lambda_edge_geo_routing[0].arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 5
  memory_size     = 128
  publish         = true
  
  environment {
    variables = {
      DEFAULT_REGION = var.aws_region
      ROUTING_CONFIG = jsonencode(var.geo_routing_config)
    }
  }
  
  tags = {
    Name        = "${var.environment}-prismy-edge-geo-routing"
    Environment = var.environment
    Purpose     = "edge-geo-routing"
  }
}

# IAM role for geo-routing Lambda
resource "aws_iam_role" "lambda_edge_geo_routing" {
  count    = var.enable_geo_routing ? 1 : 0
  provider = aws.us_east_1
  
  name = "${var.environment}-prismy-lambda-edge-geo-routing-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "edgelambda.amazonaws.com"
          ]
        }
      }
    ]
  })
  
  tags = {
    Name = "${var.environment}-prismy-lambda-edge-geo-routing-role"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_edge_geo_routing_basic" {
  count    = var.enable_geo_routing ? 1 : 0
  provider = aws.us_east_1
  
  role       = aws_iam_role.lambda_edge_geo_routing[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ===============================================
# Edge Performance Monitoring Function
# ===============================================

resource "aws_lambda_function" "edge_performance_monitoring" {
  count    = var.enable_edge_monitoring ? 1 : 0
  provider = aws.us_east_1
  
  filename         = "lambda/edge-performance-monitoring.zip"
  function_name    = "${var.environment}-prismy-edge-performance-monitoring"
  role            = aws_iam_role.lambda_edge_performance_monitoring[0].arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 5
  memory_size     = 128
  publish         = true
  
  tags = {
    Name        = "${var.environment}-prismy-edge-performance-monitoring"
    Environment = var.environment
    Purpose     = "edge-performance-monitoring"
  }
}

# IAM role for performance monitoring Lambda
resource "aws_iam_role" "lambda_edge_performance_monitoring" {
  count    = var.enable_edge_monitoring ? 1 : 0
  provider = aws.us_east_1
  
  name = "${var.environment}-prismy-lambda-edge-performance-monitoring-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "edgelambda.amazonaws.com"
          ]
        }
      }
    ]
  })
  
  tags = {
    Name = "${var.environment}-prismy-lambda-edge-performance-monitoring-role"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_edge_performance_monitoring_basic" {
  count    = var.enable_edge_monitoring ? 1 : 0
  provider = aws.us_east_1
  
  role       = aws_iam_role.lambda_edge_performance_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_edge_performance_monitoring_cloudwatch" {
  count    = var.enable_edge_monitoring ? 1 : 0
  provider = aws.us_east_1
  
  name = "${var.environment}-prismy-lambda-edge-performance-monitoring-cloudwatch-policy"
  role = aws_iam_role.lambda_edge_performance_monitoring[0].id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}