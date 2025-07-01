# ===============================================
# Cloudflare DNS Configuration
# Domain management and routing setup
# ===============================================

# ===============================================
# DNS Records for Primary Domain
# ===============================================
resource "cloudflare_record" "root" {
  zone_id = var.cloudflare_zone_id
  name    = var.domain_name
  value   = aws_cloudfront_distribution.main.domain_name
  type    = "CNAME"
  ttl     = 1  # Auto TTL
  proxied = true

  comment = "Primary domain pointing to CloudFront"
}

resource "cloudflare_record" "www" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  value   = aws_cloudfront_distribution.main.domain_name
  type    = "CNAME"
  ttl     = 1  # Auto TTL
  proxied = true

  comment = "WWW subdomain pointing to CloudFront"
}

# ===============================================
# API Subdomain
# ===============================================
resource "cloudflare_record" "api" {
  zone_id = var.cloudflare_zone_id
  name    = "api"
  value   = aws_cloudfront_distribution.main.domain_name
  type    = "CNAME"
  ttl     = 1  # Auto TTL
  proxied = true

  comment = "API subdomain for dedicated API routing"
}

# ===============================================
# ACM Certificate Validation Records
# ===============================================
resource "cloudflare_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = var.cloudflare_zone_id
  name    = each.value.name
  value   = trimsuffix(each.value.record, ".")
  type    = each.value.type
  ttl     = 60

  comment = "ACM SSL certificate validation"
}

# ===============================================
# Email and Other Service Records
# ===============================================
resource "cloudflare_record" "mx" {
  zone_id  = var.cloudflare_zone_id
  name     = var.domain_name
  value    = "10 mx.resend.com"
  type     = "MX"
  priority = 10
  ttl      = 1

  comment = "Resend email service MX record"
}

resource "cloudflare_record" "txt_spf" {
  zone_id = var.cloudflare_zone_id
  name    = var.domain_name
  value   = "v=spf1 include:_spf.resend.com ~all"
  type    = "TXT"
  ttl     = 1

  comment = "SPF record for Resend email authentication"
}

resource "cloudflare_record" "txt_dmarc" {
  zone_id = var.cloudflare_zone_id
  name    = "_dmarc"
  value   = "v=DMARC1; p=quarantine; rua=mailto:dmarc@${var.domain_name}"
  type    = "TXT"
  ttl     = 1

  comment = "DMARC policy for email security"
}

resource "cloudflare_record" "cname_dkim" {
  zone_id = var.cloudflare_zone_id
  name    = "resend._domainkey"
  value   = "resend._domainkey.resend.com"
  type    = "CNAME"
  ttl     = 1

  comment = "DKIM record for Resend email authentication"
}

# ===============================================
# Cloudflare Page Rules for Performance
# ===============================================
resource "cloudflare_page_rule" "cache_static_assets" {
  zone_id  = var.cloudflare_zone_id
  target   = "${var.domain_name}/_next/static/*"
  priority = 1

  actions {
    cache_level = "cache_everything"
    edge_cache_ttl = 31536000  # 1 year
    browser_cache_ttl = 31536000  # 1 year
  }
}

resource "cloudflare_page_rule" "api_no_cache" {
  zone_id  = var.cloudflare_zone_id
  target   = "${var.domain_name}/api/*"
  priority = 2

  actions {
    cache_level = "bypass"
    disable_performance = false
  }
}

resource "cloudflare_page_rule" "security_headers" {
  zone_id  = var.cloudflare_zone_id
  target   = "${var.domain_name}/*"
  priority = 3

  actions {
    security_level = "medium"
    ssl = "strict"
    always_use_https = true
  }
}

# ===============================================
# Cloudflare Security Settings
# ===============================================
resource "cloudflare_zone_settings_override" "security" {
  zone_id = var.cloudflare_zone_id

  settings {
    # Security
    security_level = "medium"
    challenge_ttl = 1800
    browser_check = "on"
    
    # SSL/TLS
    ssl = "strict"
    always_use_https = "on"
    min_tls_version = "1.2"
    opportunistic_encryption = "on"
    tls_1_3 = "zrt"
    automatic_https_rewrites = "on"
    
    # Performance
    brotli = "on"
    minify {
      css  = "on"
      js   = "on"
      html = "on"
    }
    
    # Speed optimizations
    rocket_loader = "on"
    mirage = "on"
    polish = "lossless"
    webp = "on"
    
    # Other settings
    hotlink_protection = "on"
    ip_geolocation = "on"
    email_obfuscation = "on"
    server_side_exclude = "on"
    response_buffering = "on"
    sort_query_string_for_cache = "on"
    true_client_ip_header = "on"
    visitor_ip = "on"
    zero_rtt = "on"
  }
}

# ===============================================
# Rate Limiting Rules
# ===============================================
resource "cloudflare_rate_limit" "api_general" {
  zone_id   = var.cloudflare_zone_id
  threshold = 1000
  period    = 60
  
  match {
    request {
      url_pattern = "${var.domain_name}/api/*"
      schemes     = ["HTTPS"]
      methods     = ["GET", "POST", "PUT", "DELETE", "PATCH"]
    }
  }

  action {
    mode    = "challenge"
    timeout = 600
  }
  
  description = "Rate limit for API endpoints"
}

resource "cloudflare_rate_limit" "login_protection" {
  zone_id   = var.cloudflare_zone_id
  threshold = 5
  period    = 300  # 5 minutes
  
  match {
    request {
      url_pattern = "${var.domain_name}/api/auth/*"
      schemes     = ["HTTPS"]
      methods     = ["POST"]
    }
  }

  action {
    mode    = "block"
    timeout = 1800  # 30 minutes
  }
  
  description = "Protect authentication endpoints from brute force"
}

# ===============================================
# Firewall Rules
# ===============================================
resource "cloudflare_filter" "block_bad_bots" {
  zone_id     = var.cloudflare_zone_id
  expression  = "(cf.client.bot and not cf.verified_bot_category in {\"Search Engine Crawler\" \"SEO\" \"Academic Research\"})"
  description = "Block unverified bots"
}

resource "cloudflare_firewall_rule" "block_bad_bots" {
  zone_id     = var.cloudflare_zone_id
  description = "Block unverified bots"
  filter_id   = cloudflare_filter.block_bad_bots.id
  action      = "block"
  priority    = 1000
}

resource "cloudflare_filter" "allow_api_keys" {
  zone_id     = var.cloudflare_zone_id
  expression  = "(http.request.uri.path matches \"^/api/\" and http.request.headers[\"authorization\"][0] contains \"Bearer\")"
  description = "Allow authenticated API requests"
}

resource "cloudflare_firewall_rule" "allow_api_keys" {
  zone_id     = var.cloudflare_zone_id
  description = "Allow authenticated API requests"
  filter_id   = cloudflare_filter.allow_api_keys.id
  action      = "allow"
  priority    = 500
}

# ===============================================
# Custom SSL Certificate (if using custom certs)
# ===============================================
resource "cloudflare_custom_ssl" "main" {
  count   = var.environment == "production" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  
  # These would be set if using custom SSL certificates
  # For now, we'll use Cloudflare's Universal SSL
  lifecycle {
    ignore_changes = all
  }
}

# ===============================================
# Origin CA Certificate for Backend Communication
# ===============================================
resource "cloudflare_origin_ca_certificate" "backend" {
  csr                = tls_cert_request.backend.cert_request_pem
  hostnames          = [var.domain_name, "*.${var.domain_name}"]
  request_type       = "origin-rsa"
  requested_validity = 365
}

resource "tls_private_key" "backend" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_cert_request" "backend" {
  private_key_pem = tls_private_key.backend.private_key_pem

  subject {
    common_name  = var.domain_name
    organization = "Prismy"
  }

  dns_names = [
    var.domain_name,
    "*.${var.domain_name}"
  ]
}

# ===============================================
# Store SSL certificates in AWS Secrets Manager
# ===============================================
resource "aws_secretsmanager_secret" "cloudflare_origin_cert" {
  name        = "${var.environment}-prismy-cloudflare-origin-cert"
  description = "Cloudflare Origin Certificate for backend communication"
  
  tags = {
    Name = "${var.environment}-prismy-cloudflare-origin-cert"
  }
}

resource "aws_secretsmanager_secret_version" "cloudflare_origin_cert" {
  secret_id = aws_secretsmanager_secret.cloudflare_origin_cert.id
  secret_string = jsonencode({
    certificate = cloudflare_origin_ca_certificate.backend.certificate
    private_key = tls_private_key.backend.private_key_pem
  })
}

# ===============================================
# Health Check for Domain
# ===============================================
resource "cloudflare_healthcheck" "main" {
  zone_id     = var.cloudflare_zone_id
  name        = "${var.environment}-prismy-health-check"
  address     = "https://${var.domain_name}/api/health"
  type        = "HTTPS"
  description = "Health check for Prismy application"
  
  check_regions = [
    "WEU",  # Western Europe
    "EEU",  # Eastern Europe
    "NAM",  # North America
    "SAS",  # South Asia
    "OC"    # Oceania
  ]
  
  notification_email_addresses = [var.notification_email]
}

# ===============================================
# Analytics and Monitoring
# ===============================================
resource "cloudflare_logpush_job" "http_requests" {
  count            = var.environment == "production" ? 1 : 0
  zone_id          = var.cloudflare_zone_id
  name             = "${var.environment}-prismy-http-logs"
  destination_conf = "s3://${aws_s3_bucket.cloudflare_logs[0].bucket}/http_requests?region=${var.aws_region}"
  dataset          = "http_requests"
  frequency        = "high"
  
  logpull_options = "fields=ClientIP,ClientRequestHost,ClientRequestMethod,ClientRequestURI,EdgeEndTimestamp,EdgeResponseBytes,EdgeResponseStatus,EdgeStartTimestamp,RayID&timestamps=rfc3339"
}

resource "aws_s3_bucket" "cloudflare_logs" {
  count  = var.environment == "production" ? 1 : 0
  bucket = "${var.environment}-prismy-cloudflare-logs-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "${var.environment}-prismy-cloudflare-logs"
  }
}