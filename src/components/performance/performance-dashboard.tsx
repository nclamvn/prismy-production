'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { PerformanceMonitor } from '@/lib/performance/monitor'
import { cache } from '@/lib/cache/cache-manager'
import { 
  Activity, 
  Zap, 
  HardDrive, 
  Clock, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
  Gauge
} from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  unit?: string
  status?: 'good' | 'warning' | 'critical'
  description?: string
  icon?: React.ReactNode
}

function MetricCard({ title, value, unit, status = 'good', description, icon }: MetricCardProps) {
  const statusColors = {
    good: 'text-green-500 bg-green-50',
    warning: 'text-yellow-500 bg-yellow-50',
    critical: 'text-red-500 bg-red-50'
  }

  const statusIcons = {
    good: <CheckCircle className="h-4 w-4" />,
    warning: <AlertCircle className="h-4 w-4" />,
    critical: <AlertCircle className="h-4 w-4" />
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        <div className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs ${statusColors[status]}`}>
          {statusIcons[status]}
          <span className="capitalize">{status}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<{
    webVitals: {
      fcp?: number
      lcp?: number
      fid?: number
      cls?: number
    }
    performance: {
      pageLoad?: number
      domInteractive?: number
      jsHeapUsed?: number
      jsHeapLimit?: number
    }
    cache: ReturnType<typeof cache.getStats>
  }>({
    webVitals: {},
    performance: {},
    cache: cache.getStats()
  })
  const [loading, setLoading] = useState(true)
  const monitor = PerformanceMonitor.getInstance()

  useEffect(() => {
    loadMetrics()
    const interval = setInterval(loadMetrics, 5000) // Update every 5 seconds
    
    // Start monitoring
    monitor.monitorMemory()
    monitor.trackBundleSize()

    return () => {
      clearInterval(interval)
    }
  }, [])

  const loadMetrics = () => {
    setLoading(false)
    
    // Get Web Vitals
    const webVitals = {
      fcp: monitor.getAverageMetric('fcp') || undefined,
      lcp: monitor.getAverageMetric('lcp') || undefined,
      fid: monitor.getAverageMetric('fid') || undefined,
      cls: monitor.getAverageMetric('cls') || undefined
    }

    // Get performance metrics
    const performance = {
      pageLoad: monitor.getAverageMetric('page-load') || undefined,
      domInteractive: monitor.getAverageMetric('dom-interactive') || undefined,
      jsHeapUsed: monitor.getAverageMetric('js-heap-used') || undefined,
      jsHeapLimit: monitor.getAverageMetric('js-heap-limit') || undefined
    }

    setMetrics({
      webVitals,
      performance,
      cache: cache.getStats()
    })
  }

  const getWebVitalStatus = (metric: string, value: number | null | undefined): 'good' | 'warning' | 'critical' => {
    if (!value) return 'good'
    
    const thresholds: Record<string, { good: number; warning: number }> = {
      fcp: { good: 1800, warning: 3000 },
      lcp: { good: 2500, warning: 4000 },
      fid: { good: 100, warning: 300 },
      cls: { good: 0.1, warning: 0.25 }
    }

    const threshold = thresholds[metric]
    if (!threshold) return 'good'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.warning) return 'warning'
    return 'critical'
  }

  const formatBytes = (bytes: number | null | undefined): string => {
    if (!bytes) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    let value = bytes
    let unitIndex = 0
    
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024
      unitIndex++
    }
    
    return `${value.toFixed(2)} ${units[unitIndex]}`
  }

  const exportMetrics = async () => {
    const allMetrics = monitor.getMetrics()
    const report = {
      timestamp: new Date().toISOString(),
      webVitals: metrics.webVitals,
      performance: metrics.performance,
      cache: metrics.cache,
      detailedMetrics: allMetrics
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearCache = () => {
    cache.clear()
    loadMetrics()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const heapUsagePercent = metrics.performance.jsHeapUsed && metrics.performance.jsHeapLimit
    ? (metrics.performance.jsHeapUsed / metrics.performance.jsHeapLimit) * 100
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time performance metrics and optimization insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportMetrics}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals</CardTitle>
          <CardDescription>
            Key metrics for user experience as defined by Google
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="First Contentful Paint"
              value={metrics.webVitals.fcp?.toFixed(0) || 'N/A'}
              unit="ms"
              status={getWebVitalStatus('fcp', metrics.webVitals.fcp)}
              description="Time to first content render"
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Largest Contentful Paint"
              value={metrics.webVitals.lcp?.toFixed(0) || 'N/A'}
              unit="ms"
              status={getWebVitalStatus('lcp', metrics.webVitals.lcp)}
              description="Time to largest content render"
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="First Input Delay"
              value={metrics.webVitals.fid?.toFixed(0) || 'N/A'}
              unit="ms"
              status={getWebVitalStatus('fid', metrics.webVitals.fid)}
              description="Time to first interaction"
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Cumulative Layout Shift"
              value={metrics.webVitals.cls?.toFixed(3) || 'N/A'}
              unit=""
              status={getWebVitalStatus('cls', metrics.webVitals.cls)}
              description="Visual stability score"
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Page Load Time"
          value={metrics.performance.pageLoad?.toFixed(0) || 'N/A'}
          unit="ms"
          status={metrics.performance.pageLoad && metrics.performance.pageLoad < 3000 ? 'good' : 'warning'}
          description="Total page load time"
          icon={<Gauge className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="DOM Interactive"
          value={metrics.performance.domInteractive?.toFixed(0) || 'N/A'}
          unit="ms"
          status={metrics.performance.domInteractive && metrics.performance.domInteractive < 2000 ? 'good' : 'warning'}
          description="Time to interactive DOM"
          icon={<Zap className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Memory Usage"
          value={formatBytes(metrics.performance.jsHeapUsed)}
          unit=""
          status={heapUsagePercent < 70 ? 'good' : heapUsagePercent < 90 ? 'warning' : 'critical'}
          description={`${heapUsagePercent.toFixed(1)}% of heap limit`}
          icon={<HardDrive className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Cache Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cache Performance</CardTitle>
              <CardDescription>
                Application cache statistics and efficiency
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={clearCache}>
              Clear Cache
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Hit Rate</p>
              <p className="text-2xl font-bold">{metrics.cache.hitRate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Hits</p>
              <p className="text-2xl font-bold">{metrics.cache.hits}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cache Size</p>
              <p className="text-2xl font-bold">{metrics.cache.size}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Memory Usage</p>
              <p className="text-2xl font-bold">{metrics.cache.memoryUsage}</p>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Cache Efficiency</span>
              <span className="text-sm text-muted-foreground">
                {parseFloat(metrics.cache.hitRate)}%
              </span>
            </div>
            <Progress value={parseFloat(metrics.cache.hitRate)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
          <CardDescription>
            Actionable insights based on current performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.webVitals.lcp && metrics.webVitals.lcp > 2500 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">Optimize Largest Contentful Paint</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    LCP is {metrics.webVitals.lcp.toFixed(0)}ms. Consider optimizing images, fonts, and critical CSS.
                  </p>
                </div>
              </div>
            )}
            
            {heapUsagePercent > 70 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">High Memory Usage</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Memory usage is at {heapUsagePercent.toFixed(1)}%. Consider profiling for memory leaks.
                  </p>
                </div>
              </div>
            )}
            
            {parseFloat(metrics.cache.hitRate) < 60 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Low Cache Hit Rate</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Cache hit rate is {metrics.cache.hitRate}. Consider caching more frequently accessed data.
                  </p>
                </div>
              </div>
            )}

            {(!metrics.webVitals.lcp || metrics.webVitals.lcp <= 2500) && 
             heapUsagePercent <= 70 && 
             parseFloat(metrics.cache.hitRate) >= 60 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Great Performance!</p>
                  <p className="text-sm text-green-700 mt-1">
                    All key metrics are within optimal ranges. Keep up the good work!
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Day 10 - Performance Monitoring Active</span>
        </div>
      </div>
    </div>
  )
}