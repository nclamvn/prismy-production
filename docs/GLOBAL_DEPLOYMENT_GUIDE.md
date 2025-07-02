# 🌍 GLOBAL DEPLOYMENT GUIDE

## Overview

This guide covers the global deployment and edge optimization setup for Prismy's production infrastructure with worldwide performance optimization.

## 🚀 Global Architecture

### Core Components

- **CloudFront CDN** - Global content delivery with 400+ edge locations
- **Lambda@Edge** - Serverless functions running at edge locations
- **Route 53** - Global DNS with health checks and failover
- **Multi-Region Deployment** - Primary and secondary regions for redundancy
- **S3 Global Acceleration** - Optimized uploads via edge locations

### Geographic Distribution

```
Primary Region: us-west-2 (Oregon)
Secondary Regions:
├── us-east-1 (N. Virginia) - Lambda@Edge functions
├── eu-west-1 (Ireland) - European users
└── ap-southeast-1 (Singapore) - Asian users
```

## 🌐 CloudFront Configuration

### Distribution Setup

```hcl
# Main CloudFront distribution with multiple origins
Origins:
├── ALB Origin (Main App) - /
├── S3 Origin (Static Assets) - /static/*
├── API Origin (API Endpoints) - /api/*
└── Translation Origin - /locales/*
```

### Cache Behaviors

| Path Pattern | Cache TTL | Headers Forwarded | Notes             |
| ------------ | --------- | ----------------- | ----------------- |
| `/`          | 5 minutes | All auth headers  | Main application  |
| `/static/*`  | 1 year    | None              | Static assets     |
| `/api/*`     | No cache  | All               | API endpoints     |
| `/locales/*` | 1 hour    | Accept-Language   | Translation files |

### Edge Functions

- **Authentication** (`edge-auth.js`) - JWT validation at edge
- **Security Headers** (`edge-security-headers.js`) - CSP and security headers
- **Bot Detection** - Automated bot filtering
- **Image Optimization** - Dynamic image resizing
- **Geo-routing** - Country-based routing

## 🔧 Deployment Steps

### 1. Prerequisites

```bash
# Ensure AWS CLI is configured for multiple regions
aws configure list-profiles

# Validate Terraform configuration
cd infrastructure/terraform
terraform validate
```

### 2. Certificate Setup (Required for HTTPS)

```bash
# Request certificate in us-east-1 for CloudFront
aws acm request-certificate \
  --domain-name "*.prismy.com" \
  --validation-method DNS \
  --region us-east-1

# Note the certificate ARN for terraform.tfvars
```

### 3. Deploy Global Infrastructure

```bash
# Initialize Terraform with global backend
terraform init

# Plan global deployment
terraform plan -var-file="global.tfvars"

# Deploy global infrastructure
terraform apply -var-file="global.tfvars"
```

### 4. Configure Domain DNS

```bash
# Get CloudFront distribution domain
CLOUDFRONT_DOMAIN=$(terraform output cloudfront_domain_name)

# Update DNS records to point to CloudFront
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch file://dns-changes.json
```

### 5. Deploy Lambda@Edge Functions

```bash
# Functions are automatically deployed with Terraform
# Verify deployment in CloudFront console
aws cloudfront list-distributions \
  --query 'DistributionList.Items[0].DistributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations'
```

## 🌍 Multi-Region Setup

### Primary Region (us-west-2)

- Main application servers
- Primary database
- File storage
- Monitoring stack

### Secondary Regions

- **us-east-1**: Lambda@Edge functions, Route 53 health checks
- **eu-west-1**: Read replicas, European data residency
- **ap-southeast-1**: Read replicas, Asian users

### Cross-Region Replication

```hcl
# Database read replicas
resource "aws_db_instance" "eu_replica" {
  provider = aws.eu_west_1
  replicate_source_db = aws_db_instance.main.identifier
}

# S3 cross-region replication
resource "aws_s3_bucket_replication_configuration" "global" {
  rule {
    id     = "global-replication"
    status = "Enabled"
    destination {
      bucket = aws_s3_bucket.eu_backup.arn
    }
  }
}
```

## 📊 Performance Optimization

### Caching Strategy

```
Static Assets (CSS, JS, Images):
├── CloudFront: 1 year cache
├── Browser: 1 year cache
└── S3: Versioned for cache busting

Dynamic Content:
├── CloudFront: 5 minutes cache
├── Vary by: Authorization, Accept-Language
└── Custom cache keys for personalization

API Responses:
├── CloudFront: No cache (default)
├── Selective caching for GET endpoints
└── Cache-Control headers from origin
```

### Image Optimization

```javascript
// Lambda@Edge image optimization
const optimizeImage = request => {
  const { width, quality, format } = request.querystring
  // Resize and optimize images at edge
  return optimizedImageResponse
}
```

### Content Compression

- **Gzip/Brotli** enabled for text content
- **WebP conversion** for images in supported browsers
- **Minification** for CSS and JavaScript

## 🔒 Security Configuration

### Edge Security Headers

```javascript
// Comprehensive security headers at edge
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}
```

### WAF Rules

- **Rate limiting**: 1000 requests/5min per IP
- **Geographic blocking**: Configurable country list
- **SQL injection protection**: Pattern-based detection
- **XSS protection**: Request body scanning

### Authentication at Edge

```javascript
// JWT validation without origin round-trip
const validateJWT = token => {
  // Validate signature and expiration
  // Add user context to request headers
  return { valid: true, user: payload }
}
```

## 📈 Monitoring & Analytics

### CloudWatch Dashboards

```
Global Performance Dashboard:
├── Request volume by region
├── Cache hit rates
├── Error rates (4xx, 5xx)
├── Response times
└── Edge function metrics
```

### Real User Monitoring (RUM)

```javascript
// CloudWatch RUM integration
const rumConfig = {
  sessionSampleRate: 0.1,
  guestRoleArn: 'arn:aws:iam::account:role/RUM-Monitor',
  identityPoolId: 'us-west-2:uuid',
  endpoint: 'https://dataplane.rum.us-west-2.amazonaws.com',
}
```

### Performance Budgets

| Metric                   | Target  | Alert Threshold |
| ------------------------ | ------- | --------------- |
| First Contentful Paint   | < 1.5s  | > 2s            |
| Largest Contentful Paint | < 2.5s  | > 3s            |
| First Input Delay        | < 100ms | > 300ms         |
| Cumulative Layout Shift  | < 0.1   | > 0.25          |
| Total Blocking Time      | < 300ms | > 600ms         |

## 🌐 Geographic Routing

### Route 53 Configuration

```hcl
# Geolocation-based routing
resource "aws_route53_record" "us" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "app.prismy.com"
  type    = "A"

  geolocation_routing_policy {
    continent = "NA"
  }

  alias {
    name    = aws_cloudfront_distribution.us.domain_name
    zone_id = aws_cloudfront_distribution.us.hosted_zone_id
  }
}
```

### Latency-Based Routing

```hcl
# Automatic routing to lowest latency region
resource "aws_route53_record" "latency" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.prismy.com"
  type    = "A"

  latency_routing_policy {
    region = var.aws_region
  }

  health_check_id = aws_route53_health_check.main.id
}
```

## 🔄 Disaster Recovery

### Failover Configuration

```hcl
# Primary-secondary failover
resource "aws_route53_record" "primary" {
  failover_routing_policy {
    type = "PRIMARY"
  }
  health_check_id = aws_route53_health_check.main.id
}

resource "aws_route53_record" "secondary" {
  failover_routing_policy {
    type = "SECONDARY"
  }
}
```

### Health Checks

```bash
# Multi-region health monitoring
Health Check Endpoints:
├── Primary: https://app.prismy.com/api/health
├── EU: https://eu.prismy.com/api/health
└── Asia: https://asia.prismy.com/api/health

Thresholds:
├── Failure threshold: 3 consecutive failures
├── Check interval: 30 seconds
└── Timeout: 10 seconds
```

## 📱 Mobile Optimization

### Device-Specific Optimization

```javascript
// Lambda@Edge mobile detection
const optimizeForMobile = request => {
  const userAgent = request.headers['user-agent'][0].value
  const isMobile = /Mobile|Android|iPhone/i.test(userAgent)

  if (isMobile) {
    // Route to mobile-optimized origin
    request.origin.custom.domainName = 'mobile-api.prismy.com'
  }

  return request
}
```

### Progressive Web App (PWA)

- **Service Worker** caching strategy
- **App Shell** architecture
- **Push notifications** via web standards

## 🔧 Troubleshooting

### Common Issues

#### 1. CloudFront Cache Issues

```bash
# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

# Check cache behavior
curl -I https://app.prismy.com \
  -H "Cache-Control: no-cache"
```

#### 2. Lambda@Edge Function Errors

```bash
# View Lambda@Edge logs (in each region)
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/lambda/us-east-1.prismy-edge" \
  --region us-east-1
```

#### 3. Route 53 Health Check Failures

```bash
# Check health check status
aws route53 get-health-check \
  --health-check-id $HEALTH_CHECK_ID

# View health check metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Route53 \
  --metric-name HealthCheckStatus \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 300 \
  --statistics Average
```

#### 4. Certificate Issues

```bash
# Verify certificate status
aws acm describe-certificate \
  --certificate-arn $CERT_ARN \
  --region us-east-1

# Check CloudFront SSL configuration
aws cloudfront get-distribution-config \
  --id $DISTRIBUTION_ID \
  --query 'DistributionConfig.ViewerCertificate'
```

## 📊 Performance Testing

### Load Testing

```bash
# Global load testing with Artillery
artillery run --config global-load-test.yml

# Test from multiple regions
regions=("us-east-1" "eu-west-1" "ap-southeast-1")
for region in "${regions[@]}"; do
  echo "Testing from $region"
  curl -w "@curl-format.txt" \
    -H "CloudFront-Viewer-Country: $region" \
    https://app.prismy.com/api/health
done
```

### Synthetic Monitoring

```javascript
// CloudWatch Synthetics canary
const synthetics = require('Synthetics')

const apiCanary = async function () {
  const response = await synthetics.executeStep('checkHomepage', async () => {
    return await synthetics.getPage().goto('https://app.prismy.com')
  })

  await synthetics.executeStep('checkApiHealth', async () => {
    const apiResponse = await synthetics
      .getPage()
      .goto('https://app.prismy.com/api/health')
    return apiResponse
  })
}

exports.handler = async () => {
  return await synthetics.executeStep('apiCanary', apiCanary)
}
```

## 🎯 Optimization Checklist

### Pre-Deployment

- [ ] SSL certificate deployed in us-east-1
- [ ] DNS records configured
- [ ] Lambda@Edge functions tested
- [ ] WAF rules configured
- [ ] Health checks configured

### Post-Deployment

- [ ] Cache hit rates > 80%
- [ ] Global response times < 200ms
- [ ] Error rates < 0.1%
- [ ] Security headers present
- [ ] Mobile performance optimized

### Ongoing Monitoring

- [ ] Weekly performance reports
- [ ] Monthly cost optimization review
- [ ] Quarterly security assessment
- [ ] Annual disaster recovery testing

---

## 🚨 EMERGENCY CONTACTS

**Global Infrastructure Issues**: +1-XXX-XXX-XXXX
**AWS Support**: Premium Support Case
**CloudFlare Support**: Enterprise Portal

Remember: All global changes affect users worldwide. Test thoroughly in staging before production deployment.
