# Prismy Performance Monitoring Setup Guide

## Overview

This guide covers the comprehensive performance monitoring system for Prismy production deployment. The system tracks Core Web Vitals, API performance, business metrics, and provides real-time insights.

## Architecture

### Performance Monitoring Flow
1. **Client Metrics** → Production Metrics Service → Metrics API → Dashboard
2. **Server Metrics** → Logging System → Alert Manager → Notifications
3. **Business Events** → Analytics Tracking → Business Intelligence
4. **Real-time Monitoring** → Performance Dashboard → Alerts

## Components

### 1. Production Metrics (`lib/performance/production-metrics.ts`)

**Features:**
- Core Web Vitals monitoring (CLS, FCP, FID, LCP, TTFB, INP)
- Resource timing and navigation performance
- Memory usage and connection quality tracking
- Custom metrics collection and batching
- Real-time alert generation

**Key Methods:**
```typescript
// Record custom metrics
productionMetrics.recordMetric(name, value, unit, metadata)

// Track API performance
productionMetrics.recordAPIMetric({
  endpoint, method, statusCode, responseTime
})

// Track business events
productionMetrics.recordBusinessMetric({
  event, value, properties
})

// Start performance transactions
const transaction = productionMetrics.startTransaction(name)
transaction.mark('checkpoint')
transaction.finish()
```

### 2. Metrics API (`app/api/metrics/route.ts`)

**Endpoints:**
- `POST /api/metrics` - Collect metrics batch from clients
- `GET /api/metrics?type=summary` - Get aggregated metrics summary
- `GET /api/metrics?type=webvitals` - Get Web Vitals data
- `GET /api/metrics?type=api` - Get API performance data
- `HEAD /api/metrics` - Health check for metrics system

**Features:**
- Metrics batching and aggregation
- Percentile calculations (P75, P95)
- Error rate tracking
- Endpoint performance analysis

### 3. Performance Dashboard (`components/performance/PerformanceDashboard.tsx`)

**Features:**
- Real-time metrics visualization
- Core Web Vitals monitoring
- API performance analysis
- Endpoint-specific metrics
- Period-based filtering (1h, 6h, 24h, all)
- Auto-refresh capabilities

### 4. Performance Tracking Hook (`hooks/usePerformanceTracking.ts`)

**Hook Variants:**
- `usePerformanceTracking()` - General performance tracking
- `useAPIPerformanceTracking()` - API call monitoring
- `useFeatureTracking()` - User feature usage
- `useBusinessMetrics()` - Business event tracking

**Features:**
- Component mount/unmount tracking
- User interaction monitoring
- Custom timing measurements
- Automatic API call wrapping

## Setup Instructions

### 1. Environment Variables

```bash
# Performance Monitoring
NEXT_PUBLIC_PERFORMANCE_MONITORING=true
NEXT_PUBLIC_METRICS_ENDPOINT="/api/metrics"
PERFORMANCE_SAMPLING_RATE=0.1
NEXT_PUBLIC_ENABLE_WEB_VITALS=true

# Metrics Collection
METRICS_BATCH_SIZE=50
METRICS_BATCH_INTERVAL=10000
METRICS_RETENTION_HOURS=168

# Thresholds for Alerts
PERFORMANCE_ALERT_LCP_THRESHOLD=4000
PERFORMANCE_ALERT_FID_THRESHOLD=300
PERFORMANCE_ALERT_CLS_THRESHOLD=0.25
PERFORMANCE_ALERT_API_THRESHOLD=5000
PERFORMANCE_ALERT_ERROR_RATE=0.05
```

### 2. Installation

```bash
# Install Web Vitals library
npm install web-vitals

# Optional: Install Chart.js for advanced visualization
npm install chart.js react-chartjs-2
```

### 3. Integration with Components

#### Basic Component Tracking
```tsx
import { usePerformanceTracking } from '@/hooks/usePerformanceTracking'

function MyComponent() {
  const { startTiming, endTiming, trackFeatureUsage } = usePerformanceTracking({
    componentName: 'MyComponent',
    trackComponentMount: true,
    trackUserInteractions: true
  })

  const handleExpensiveOperation = async () => {
    startTiming('expensive_operation')
    try {
      await performExpensiveOperation()
      trackFeatureUsage('expensive_operation_completed')
    } finally {
      endTiming('expensive_operation')
    }
  }

  return <div>...</div>
}
```

#### API Call Tracking
```tsx
import { useAPIPerformanceTracking } from '@/hooks/usePerformanceTracking'

function DataComponent() {
  const { wrapAPICall } = useAPIPerformanceTracking()

  const fetchData = async () => {
    return wrapAPICall('/api/data', 'GET', async () => {
      const response = await fetch('/api/data')
      return response.json()
    })
  }

  return <div>...</div>
}
```

#### Business Metrics Tracking
```tsx
import { useBusinessMetrics } from '@/hooks/usePerformanceTracking'

function TranslationComponent() {
  const { trackTranslation } = useBusinessMetrics()

  const handleTranslationComplete = (result) => {
    trackTranslation(
      result.sourceLanguage,
      result.targetLanguage,
      result.characterCount,
      result.duration
    )
  }

  return <div>...</div>
}
```

### 4. HOC for Automatic Tracking

```tsx
import { withPerformanceTracking } from '@/hooks/usePerformanceTracking'

const MyComponent = () => <div>...</div>

export default withPerformanceTracking(MyComponent, {
  trackComponentMount: true,
  trackUserInteractions: true,
  customMetrics: ['custom_metric_1', 'custom_metric_2']
})
```

## Performance Thresholds

### Core Web Vitals Thresholds
```typescript
const thresholds = {
  CLS: { good: 0.1, poor: 0.25 },      // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 },     // First Contentful Paint (ms)
  FID: { good: 100, poor: 300 },       // First Input Delay (ms)
  LCP: { good: 2500, poor: 4000 },     // Largest Contentful Paint (ms)
  TTFB: { good: 800, poor: 1800 },     // Time to First Byte (ms)
  INP: { good: 200, poor: 500 }        // Interaction to Next Paint (ms)
}
```

### API Performance Thresholds
```typescript
const apiThresholds = {
  responseTime: { good: 1000, poor: 5000 },  // API response time (ms)
  errorRate: { good: 0.01, poor: 0.05 },     // Error rate (%)
  memoryUsage: { good: 0.7, poor: 0.9 }      // Memory usage (ratio)
}
```

## Monitoring Dashboard

### Accessing the Dashboard
```tsx
import PerformanceDashboard from '@/components/performance/PerformanceDashboard'

function AdminPanel() {
  return (
    <div>
      <PerformanceDashboard 
        autoRefresh={true}
        refreshInterval={30000}
      />
    </div>
  )
}
```

### Dashboard Features
- **Real-time metrics** with auto-refresh
- **Period filtering** (1h, 6h, 24h, all time)
- **Core Web Vitals** visualization with color-coded ratings
- **API performance** analysis with endpoint breakdown
- **Error rate monitoring** with trend analysis
- **Resource timing** and performance bottleneck identification

## Custom Metrics

### Creating Custom Metrics
```typescript
import { productionMetrics } from '@/lib/performance/production-metrics'

// Record custom performance metric
productionMetrics.recordMetric('CUSTOM_OPERATION_TIME', duration, 'ms', {
  operation: 'data_processing',
  recordCount: 1000
})

// Track feature usage
productionMetrics.markFeatureUsage('advanced_search', {
  query: 'user query',
  filters: ['date', 'category'],
  resultCount: 42
})

// Record business metric
productionMetrics.recordBusinessMetric({
  event: 'subscription_upgrade',
  value: 29.99,
  currency: 'USD',
  timestamp: new Date().toISOString(),
  properties: {
    fromPlan: 'free',
    toPlan: 'premium',
    userId: 'user123'
  }
})
```

### Performance Transactions
```typescript
// Start a performance transaction
const transaction = productionMetrics.startTransaction('complex_workflow')

// Mark checkpoints
transaction.mark('data_fetched')
// ... perform operations
transaction.mark('data_processed')
// ... more operations
transaction.mark('ui_updated')

// Finish and record
transaction.finish()
```

## Alert Integration

### Automatic Performance Alerts
The system automatically creates alerts for:
- **Poor Core Web Vitals** (LCP > 4s, FID > 300ms, CLS > 0.25)
- **Slow API responses** (> 5 seconds)
- **High error rates** (> 5%)
- **Memory usage issues** (> 90%)
- **Large resources** (> 1MB)

### Custom Alert Rules
```typescript
import { alertManager } from '@/lib/error-tracking/alert-manager'

// Create custom performance alert
alertManager.createPerformanceAlert(
  'CUSTOM_METRIC_SLOW',
  actualValue,
  thresholdValue
)
```

## Data Export and Analysis

### Export Metrics Data
```bash
# Get metrics summary
curl "/api/metrics?type=summary&since=2024-01-01T00:00:00Z" | jq .

# Get Web Vitals data
curl "/api/metrics?type=webvitals&limit=1000" | jq .

# Get API performance data
curl "/api/metrics?type=api&since=2024-01-01T00:00:00Z" | jq .
```

### Integration with External Tools

#### Google Analytics 4
```typescript
// Automatic GA4 integration
if (typeof gtag !== 'undefined') {
  gtag('event', 'web_vital', {
    metric_name: metric.name,
    metric_value: Math.round(metric.value),
    metric_rating: metric.rating
  })
}
```

#### Custom Analytics Endpoint
```typescript
// Send to custom analytics service
if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
  fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metricsData)
  })
}
```

## Best Practices

### 1. Sampling Strategy
- Use sampling for high-traffic applications
- Sample 100% for critical user journeys
- Implement intelligent sampling based on user segments

### 2. Performance Budget
- Set performance budgets for each page/component
- Monitor bundle size changes
- Alert on performance regression

### 3. Continuous Monitoring
- Monitor Core Web Vitals daily
- Track performance trends over time
- Set up alerts for performance degradation

### 4. User-Centric Metrics
- Focus on user-perceived performance
- Track business-critical user journeys
- Correlate performance with business metrics

### 5. Mobile Performance
- Monitor mobile-specific metrics
- Track connection quality impact
- Test on various devices and networks

## Troubleshooting

### Common Issues

1. **High LCP (Largest Contentful Paint)**
   - Optimize images and fonts
   - Implement lazy loading
   - Use CDN for static assets
   - Check server response times

2. **Poor CLS (Cumulative Layout Shift)**
   - Set size attributes for images
   - Avoid injecting content above existing content
   - Use CSS aspect-ratio for responsive images

3. **Slow API Responses**
   - Implement caching strategies
   - Optimize database queries
   - Use connection pooling
   - Consider API rate limiting

### Debug Performance Issues

```typescript
// Enable debug mode
productionMetrics.recordMetric('DEBUG_MODE', 1, 'flag', {
  userAgent: navigator.userAgent,
  connection: (navigator as any).connection?.effectiveType,
  memory: (performance as any).memory?.usedJSHeapSize
})

// Log detailed timing
const transaction = productionMetrics.startTransaction('debug_operation')
transaction.mark('step_1')
// ... operation
transaction.mark('step_2')
// ... operation
transaction.finish()
```

### Performance Monitoring Health

```bash
# Check metrics API health
curl -I /api/metrics

# Verify metrics collection
curl "/api/metrics?type=summary" | jq '.summary.counts'
```

## Integration Examples

### React App Integration
```tsx
// app/layout.tsx
import { productionMetrics } from '@/lib/performance/production-metrics'

export default function RootLayout({ children }) {
  useEffect(() => {
    // Initialize performance monitoring
    productionMetrics.initialize()
  }, [])

  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
```

### API Route Monitoring
```typescript
// app/api/example/route.ts
import { productionMetrics } from '@/lib/performance/production-metrics'

export async function POST(request: NextRequest) {
  const startTime = performance.now()
  let status = 200

  try {
    const result = await processRequest()
    return NextResponse.json(result)
  } catch (error) {
    status = 500
    throw error
  } finally {
    productionMetrics.recordAPIMetric({
      endpoint: '/api/example',
      method: 'POST',
      statusCode: status,
      responseTime: performance.now() - startTime,
      timestamp: new Date().toISOString()
    })
  }
}
```

This comprehensive performance monitoring system provides deep insights into application performance, user experience, and business metrics, enabling data-driven optimization decisions.