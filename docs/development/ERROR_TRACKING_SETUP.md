# Prismy Error Tracking & Alerting Setup Guide

## Overview

This guide covers the comprehensive error tracking and alerting system for Prismy production deployment using Sentry and custom alert management.

## Architecture

### Error Tracking Flow
1. **Client/Server Errors** → Sentry SDK → Sentry Dashboard
2. **Critical Errors** → Alert Manager → Multiple Channels (Slack, Email, PagerDuty)
3. **User Reports** → Error Report Dialog → Sentry + Local Logging
4. **System Alerts** → Alert Rules Engine → Escalation Framework

## Components

### 1. Sentry Configuration (`lib/error-tracking/sentry-config.ts`)

**Features:**
- Automatic error capture and reporting
- Performance monitoring and profiling
- User context tracking
- Breadcrumb collection
- Custom error filtering
- Source map uploading

**Key Methods:**
```typescript
// Track different types of errors
errorTracker.captureError(error, context)
errorTracker.trackTranslationError(error, translationContext)
errorTracker.trackAPIError(error, apiContext)
errorTracker.trackPaymentError(error, paymentContext)
```

### 2. Error Boundary (`lib/error-tracking/error-boundary.tsx`)

**Features:**
- React error boundary with Sentry integration
- Graceful error handling and recovery
- User-friendly error displays
- Automatic error reporting
- Component-level error isolation

**Usage:**
```tsx
<ErrorBoundary level="page" name="HomePage">
  <HomePage />
</ErrorBoundary>

// Or with HOC
export default withErrorBoundary(MyComponent, { 
  level: 'component',
  name: 'MyComponent' 
})
```

### 3. Alert Manager (`lib/error-tracking/alert-manager.ts`)

**Features:**
- Multi-channel alerting (Slack, Email, PagerDuty, Webhooks)
- Alert rule engine with conditions
- Escalation framework
- Alert suppression and cooldowns
- Real-time alert resolution

**Alert Types:**
- **Low:** Minor issues, info notifications
- **Medium:** Performance degradation, warnings
- **High:** Major functionality broken
- **Critical:** System down, security incidents

### 4. Error Report Dialog (`components/error-tracking/ErrorReportDialog.tsx`)

**Features:**
- User-friendly error reporting interface
- System information collection
- Severity and category classification
- Integration with Sentry user feedback

## Setup Instructions

### 1. Environment Variables

```bash
# Sentry Configuration
SENTRY_DSN="https://your-dsn@sentry.io/project-id"
NEXT_PUBLIC_SENTRY_DSN="https://your-dsn@sentry.io/project-id"
SENTRY_ORG="your-org"
SENTRY_PROJECT="prismy-production"
SENTRY_AUTH_TOKEN="your-auth-token"
SENTRY_ENVIRONMENT="production"
SENTRY_SAMPLE_RATE="1.0"
SENTRY_TRACES_SAMPLE_RATE="0.1"
SENTRY_PROFILES_SAMPLE_RATE="0.1"

# Alert Channels
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/your/webhook/url"
SLACK_ALERT_CHANNEL="#alerts"
ALERT_EMAIL_TO="admin@prismy.ai,dev@prismy.ai"
ALERT_EMAIL_FROM="alerts@prismy.ai"
ALERT_EMAIL_API_KEY="your-email-service-api-key"
ALERT_WEBHOOK_URL="https://your-webhook-endpoint.com/alerts"
ALERT_WEBHOOK_TOKEN="your-webhook-token"
PAGERDUTY_ROUTING_KEY="your-pagerduty-routing-key"
```

### 2. Install Dependencies

```bash
npm install @sentry/nextjs @sentry/profiling-node
```

### 3. Sentry Project Setup

1. **Create Sentry Project**
   - Go to Sentry.io
   - Create new project (Next.js)
   - Copy DSN and configuration

2. **Configure Source Maps**
   - Set `SENTRY_AUTH_TOKEN` for uploading source maps
   - Configure `sentry.properties` file

3. **Set Up Releases**
   - Configure automatic release creation
   - Link commits to releases
   - Track deployment health

### 4. Alert Channel Setup

#### Slack Integration
1. Create Slack app with incoming webhooks
2. Add webhook URL to environment variables
3. Configure channel permissions

#### Email Alerts
1. Set up email service (SendGrid, Mailgun, etc.)
2. Configure SMTP or API credentials
3. Set recipient addresses

#### PagerDuty Integration
1. Create PagerDuty service
2. Generate routing key
3. Configure escalation policies

## Alert Rules Configuration

### Default Alert Rules

```typescript
// High Error Rate
{
  condition: 'error_rate > 0.05',
  severity: 'high',
  channels: ['slack', 'email'],
  cooldown: 300, // 5 minutes
  escalation: {
    levels: [['slack'], ['email'], ['pagerduty']],
    intervals: [300, 600, 1200] // 5min, 10min, 20min
  }
}

// Critical Errors
{
  condition: 'severity = critical',
  severity: 'critical',
  channels: ['slack', 'email', 'pagerduty'],
  cooldown: 0, // No cooldown
  escalation: {
    levels: [['slack', 'email'], ['pagerduty']],
    intervals: [60, 300] // 1min, 5min
  }
}

// Performance Issues
{
  condition: 'avg_response_time > 5000',
  severity: 'medium',
  channels: ['slack'],
  cooldown: 600 // 10 minutes
}
```

### Custom Alert Rules

Use the Alert Rules API to create custom rules:

```bash
# Create custom alert rule
curl -X POST /api/alerts/rules \
  -H "Content-Type: application/json" \
  -d '{
    "id": "custom-rule",
    "name": "Custom Alert Rule",
    "condition": "custom_metric > threshold",
    "severity": "medium",
    "category": "performance",
    "channels": ["slack"],
    "enabled": true,
    "cooldown": 300
  }'
```

## API Endpoints

### Alerts Management

```bash
# Get alerts
GET /api/alerts?resolved=false&severity=high&limit=50

# Create alert
POST /api/alerts
{
  "title": "Alert Title",
  "message": "Alert message",
  "severity": "high",
  "category": "error",
  "metadata": {}
}

# Resolve alert
PATCH /api/alerts?id=alert-id
{
  "action": "resolve",
  "resolvedBy": "user-id"
}
```

### Alert Rules Management

```bash
# Get alert rules
GET /api/alerts/rules

# Update alert rule
PATCH /api/alerts/rules?id=rule-id
{
  "enabled": false,
  "channels": ["email"]
}
```

## Integration with Components

### 1. Error Boundary Integration

```tsx
import { ErrorBoundary } from '@/lib/error-tracking/error-boundary'

function App() {
  return (
    <ErrorBoundary level="critical" name="App">
      <Routes />
    </ErrorBoundary>
  )
}
```

### 2. Manual Error Tracking

```tsx
import { errorTracker } from '@/lib/error-tracking/sentry-config'

function handleAPIError(error: Error) {
  errorTracker.trackAPIError(error, {
    endpoint: '/api/translate',
    method: 'POST',
    statusCode: 500,
    userId: currentUser.id
  })
}
```

### 3. User Error Reporting

```tsx
import { useErrorReportDialog } from '@/components/error-tracking/ErrorReportDialog'

function MyComponent() {
  const { showReportDialog, ErrorReportDialog } = useErrorReportDialog()
  
  const handleError = (error: Error) => {
    showReportDialog(error, 'error-id', { context: 'user-action' })
  }
  
  return (
    <>
      <button onClick={handleError}>Report Issue</button>
      <ErrorReportDialog />
    </>
  )
}
```

## Monitoring & Dashboards

### Sentry Dashboard Features
- Real-time error tracking
- Performance monitoring
- Release health tracking
- User impact analysis
- Custom dashboards

### Alert Management Dashboard
- Active alerts overview
- Alert rule configuration
- Channel status monitoring
- Escalation tracking
- Resolution analytics

## Best Practices

### 1. Error Classification
- Use appropriate severity levels
- Categorize errors by domain
- Include relevant context
- Filter out noise

### 2. Alert Management
- Set appropriate cooldowns
- Configure escalation policies
- Use suppression for known issues
- Regular rule maintenance

### 3. Performance Monitoring
- Monitor core web vitals
- Track API response times
- Alert on performance degradation
- Use sampling for high-traffic sites

### 4. Security Considerations
- Don't log sensitive data
- Sanitize error messages
- Use secure webhook endpoints
- Implement proper authentication

## Troubleshooting

### Common Issues

1. **Sentry Not Capturing Errors**
   - Check DSN configuration
   - Verify environment setup
   - Check sample rates
   - Review beforeSend filters

2. **Alerts Not Sending**
   - Verify webhook URLs
   - Check channel configurations
   - Review alert rule conditions
   - Test channel connectivity

3. **High Error Volume**
   - Implement rate limiting
   - Use error grouping
   - Configure sampling
   - Add error filtering

### Debug Commands

```bash
# Test Sentry configuration
curl -X POST "https://sentry.io/api/0/projects/{org}/{project}/events/" \
  -H "Authorization: Bearer {token}" \
  -d '{"message": "Test error"}'

# Test Slack webhook
curl -X POST "YOUR_SLACK_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test alert"}'

# Check alert rules
curl /api/alerts/rules | jq .
```

## Maintenance

### Regular Tasks
- Review and update alert rules
- Clean up resolved alerts
- Monitor channel health
- Update escalation policies
- Review error trends

### Performance Optimization
- Adjust sample rates based on volume
- Configure appropriate retention periods
- Optimize error filtering
- Monitor Sentry quota usage

This comprehensive error tracking and alerting system ensures reliable monitoring and quick response to issues in production.