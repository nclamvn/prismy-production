// Advanced Performance Monitoring System
// Comprehensive performance tracking, analysis, and optimization

import { validateObject, validateString, validateNumber } from '../validation'

// Performance metric types
export interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  timestamp: Date
  category: PerformanceCategory
  severity: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Record<string, any>
}

export interface ComponentMetrics {
  componentName: string
  renderTime: number
  mountTime: number
  updateCount: number
  errorCount: number
  memoryUsage: number
  propsSize: number
  childrenCount: number
  lastUpdate: Date
}

export interface NetworkMetrics {
  requestId: string
  url: string
  method: string
  duration: number
  responseSize: number
  cacheHit: boolean
  retryCount: number
  errorType?: string
  timestamp: Date
}

export interface BundleMetrics {
  chunkName: string
  size: number
  loadTime: number
  cacheStatus: 'hit' | 'miss' | 'stale'
  dependencies: string[]
  compressionRatio: number
  timestamp: Date
}

export interface UserInteractionMetrics {
  interactionId: string
  type: 'click' | 'scroll' | 'input' | 'navigation' | 'gesture'
  target: string
  duration: number
  responseTime: number
  successful: boolean
  errorDetails?: string
  timestamp: Date
}

export type PerformanceCategory =
  | 'rendering'
  | 'network'
  | 'memory'
  | 'bundle'
  | 'interaction'
  | 'animation'
  | 'ai_processing'

// Performance thresholds and budgets
export interface PerformanceBudget {
  category: PerformanceCategory
  metric: string
  threshold: number
  unit: string
  action: 'warn' | 'error' | 'block'
}

const DEFAULT_BUDGETS: PerformanceBudget[] = [
  {
    category: 'rendering',
    metric: 'renderTime',
    threshold: 16,
    unit: 'ms',
    action: 'warn',
  },
  {
    category: 'rendering',
    metric: 'mountTime',
    threshold: 100,
    unit: 'ms',
    action: 'error',
  },
  {
    category: 'network',
    metric: 'requestDuration',
    threshold: 3000,
    unit: 'ms',
    action: 'warn',
  },
  {
    category: 'network',
    metric: 'responseSize',
    threshold: 1048576,
    unit: 'bytes',
    action: 'warn',
  },
  {
    category: 'memory',
    metric: 'heapUsed',
    threshold: 52428800,
    unit: 'bytes',
    action: 'error',
  },
  {
    category: 'bundle',
    metric: 'chunkSize',
    threshold: 524288,
    unit: 'bytes',
    action: 'warn',
  },
  {
    category: 'interaction',
    metric: 'responseTime',
    threshold: 100,
    unit: 'ms',
    action: 'warn',
  },
  {
    category: 'ai_processing',
    metric: 'processingTime',
    threshold: 5000,
    unit: 'ms',
    action: 'warn',
  },
]

// Performance monitoring system
export class AdvancedPerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private componentMetrics: Map<string, ComponentMetrics> = new Map()
  private networkMetrics: NetworkMetrics[] = []
  private bundleMetrics: Map<string, BundleMetrics> = new Map()
  private interactionMetrics: UserInteractionMetrics[] = []
  private budgets: PerformanceBudget[] = DEFAULT_BUDGETS
  private observers: Map<string, PerformanceObserver> = new Map()
  private isMonitoring = false
  private samplingRate = 1.0 // Sample 100% by default
  private maxMetricsAge = 24 * 60 * 60 * 1000 // 24 hours
  private onViolation?: (violation: PerformanceBudgetViolation) => void

  constructor() {
    this.setupPerformanceObservers()
    this.startCleanupInterval()
  }

  // Start performance monitoring
  public startMonitoring(
    options: {
      samplingRate?: number
      onViolation?: (violation: PerformanceBudgetViolation) => void
    } = {}
  ): void {
    this.isMonitoring = true
    this.samplingRate = options.samplingRate ?? 1.0
    this.onViolation = options.onViolation

    // Start observing performance entries
    this.observers.forEach(observer => observer.observe())

    // Monitor memory usage
    this.startMemoryMonitoring()

    // Monitor network performance
    this.startNetworkMonitoring()

    // Monitor user interactions
    this.startInteractionMonitoring()
  }

  // Stop performance monitoring
  public stopMonitoring(): void {
    this.isMonitoring = false
    this.observers.forEach(observer => observer.disconnect())
    this.cleanup()
  }

  // Record a performance metric
  public recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    if (!this.shouldSample()) return

    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date(),
    }

    const categoryMetrics = this.metrics.get(metric.category) || []
    categoryMetrics.push(fullMetric)
    this.metrics.set(metric.category, categoryMetrics)

    // Check against performance budgets
    this.checkBudgetViolation(fullMetric)

    // Emit metric event
    this.emitMetricEvent(fullMetric)
  }

  // Record component performance metrics
  public recordComponentMetrics(metrics: ComponentMetrics): void {
    if (!this.shouldSample()) return

    this.componentMetrics.set(metrics.componentName, {
      ...metrics,
      lastUpdate: new Date(),
    })

    // Check component-specific budgets
    this.checkComponentBudgets(metrics)
  }

  // Record network performance
  public recordNetworkMetrics(metrics: NetworkMetrics): void {
    if (!this.shouldSample()) return

    this.networkMetrics.push(metrics)
    this.checkNetworkBudgets(metrics)

    // Keep only recent network metrics
    const cutoff = Date.now() - this.maxMetricsAge
    this.networkMetrics = this.networkMetrics.filter(
      m => m.timestamp.getTime() > cutoff
    )
  }

  // Record bundle performance
  public recordBundleMetrics(metrics: BundleMetrics): void {
    if (!this.shouldSample()) return

    this.bundleMetrics.set(metrics.chunkName, metrics)
    this.checkBundleBudgets(metrics)
  }

  // Record user interaction metrics
  public recordInteractionMetrics(metrics: UserInteractionMetrics): void {
    if (!this.shouldSample()) return

    this.interactionMetrics.push(metrics)
    this.checkInteractionBudgets(metrics)

    // Keep only recent interaction metrics
    const cutoff = Date.now() - this.maxMetricsAge
    this.interactionMetrics = this.interactionMetrics.filter(
      m => m.timestamp.getTime() > cutoff
    )
  }

  // Get performance summary
  public getPerformanceSummary(): PerformanceSummary {
    return {
      overall: this.calculateOverallScore(),
      categories: this.getCategoryMetrics(),
      components: this.getComponentSummary(),
      network: this.getNetworkSummary(),
      bundles: this.getBundleSummary(),
      interactions: this.getInteractionSummary(),
      violations: this.getRecentViolations(),
      recommendations: this.generateRecommendations(),
      timestamp: new Date(),
    }
  }

  // Get real-time metrics
  public getRealTimeMetrics(): RealTimeMetrics {
    return {
      fps: this.getCurrentFPS(),
      memoryUsage: this.getCurrentMemoryUsage(),
      networkActivity: this.getCurrentNetworkActivity(),
      cpuUsage: this.getCurrentCPUUsage(),
      renderTime: this.getAverageRenderTime(),
      timestamp: new Date(),
    }
  }

  // Performance analysis and insights
  public analyzePerformance(): PerformanceAnalysis {
    const trends = this.analyzeTrends()
    const bottlenecks = this.identifyBottlenecks()
    const optimizations = this.suggestOptimizations()

    return {
      trends,
      bottlenecks,
      optimizations,
      score: this.calculateOverallScore(),
      confidence: this.calculateAnalysisConfidence(),
      timestamp: new Date(),
    }
  }

  // Performance optimization suggestions
  public getOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []

    // Analyze render performance
    const slowComponents = this.findSlowComponents()
    slowComponents.forEach(component => {
      suggestions.push({
        type: 'component_optimization',
        priority: 'high',
        title: `Optimize ${component.componentName}`,
        description: `Component takes ${component.renderTime}ms to render`,
        impact: 'high',
        effort: 'medium',
        actions: [
          'Consider memoization with React.memo',
          'Optimize re-renders with useMemo/useCallback',
          'Split into smaller components',
        ],
      })
    })

    // Analyze bundle size
    const largeBundles = this.findLargeBundles()
    largeBundles.forEach(bundle => {
      suggestions.push({
        type: 'bundle_optimization',
        priority: 'medium',
        title: `Reduce ${bundle.chunkName} bundle size`,
        description: `Bundle is ${(bundle.size / 1024).toFixed(1)}KB`,
        impact: 'medium',
        effort: 'high',
        actions: [
          'Implement code splitting',
          'Remove unused dependencies',
          'Enable tree shaking',
        ],
      })
    })

    // Analyze network performance
    const slowRequests = this.findSlowRequests()
    slowRequests.forEach(request => {
      suggestions.push({
        type: 'network_optimization',
        priority: 'medium',
        title: `Optimize ${request.url}`,
        description: `Request takes ${request.duration}ms`,
        impact: 'medium',
        effort: 'low',
        actions: [
          'Enable response caching',
          'Implement request debouncing',
          'Optimize response size',
        ],
      })
    })

    return suggestions.sort(
      (a, b) =>
        this.priorityWeight(b.priority) - this.priorityWeight(a.priority)
    )
  }

  // Export performance data
  public exportPerformanceData(): PerformanceExport {
    return {
      metadata: {
        exportDate: new Date(),
        monitoringDuration: this.getMonitoringDuration(),
        samplingRate: this.samplingRate,
        totalMetrics: this.getTotalMetricsCount(),
      },
      metrics: Object.fromEntries(this.metrics),
      components: Object.fromEntries(this.componentMetrics),
      network: this.networkMetrics,
      bundles: Object.fromEntries(this.bundleMetrics),
      interactions: this.interactionMetrics,
      budgets: this.budgets,
      summary: this.getPerformanceSummary(),
    }
  }

  // Private methods
  private setupPerformanceObservers(): void {
    if (typeof window === 'undefined') return

    // Navigation timing observer
    if ('PerformanceObserver' in window) {
      const navObserver = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'navigation') {
            this.processNavigationEntry(entry as PerformanceNavigationTiming)
          }
        })
      })
      this.observers.set('navigation', navObserver)

      // Resource timing observer
      const resourceObserver = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'resource') {
            this.processResourceEntry(entry as PerformanceResourceTiming)
          }
        })
      })
      this.observers.set('resource', resourceObserver)

      // Paint timing observer
      const paintObserver = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'paint') {
            this.processPaintEntry(entry)
          }
        })
      })
      this.observers.set('paint', paintObserver)

      // Layout shift observer
      const layoutObserver = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'layout-shift') {
            this.processLayoutShiftEntry(entry)
          }
        })
      })
      this.observers.set('layout-shift', layoutObserver)
    }
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    this.recordMetric({
      id: `nav-${Date.now()}`,
      name: 'Page Load Time',
      value: entry.loadEventEnd - entry.navigationStart,
      unit: 'ms',
      category: 'rendering',
      severity: 'medium',
    })

    this.recordMetric({
      id: `ttfb-${Date.now()}`,
      name: 'Time to First Byte',
      value: entry.responseStart - entry.navigationStart,
      unit: 'ms',
      category: 'network',
      severity: 'medium',
    })
  }

  private processResourceEntry(entry: PerformanceResourceTiming): void {
    this.recordNetworkMetrics({
      requestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: entry.name,
      method: 'GET',
      duration: entry.responseEnd - entry.requestStart,
      responseSize: entry.transferSize || 0,
      cacheHit: entry.transferSize === 0 && entry.decodedBodySize > 0,
      retryCount: 0,
      timestamp: new Date(entry.startTime),
    })
  }

  private processPaintEntry(entry: PerformanceEntry): void {
    this.recordMetric({
      id: `paint-${entry.name}-${Date.now()}`,
      name: entry.name,
      value: entry.startTime,
      unit: 'ms',
      category: 'rendering',
      severity: entry.name === 'first-contentful-paint' ? 'high' : 'medium',
    })
  }

  private processLayoutShiftEntry(entry: any): void {
    this.recordMetric({
      id: `cls-${Date.now()}`,
      name: 'Cumulative Layout Shift',
      value: entry.value,
      unit: 'score',
      category: 'rendering',
      severity: entry.value > 0.1 ? 'high' : 'low',
    })
  }

  private startMemoryMonitoring(): void {
    if (typeof window === 'undefined' || !('performance' in window)) return

    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        this.recordMetric({
          id: `memory-${Date.now()}`,
          name: 'Heap Used',
          value: memory.usedJSHeapSize,
          unit: 'bytes',
          category: 'memory',
          severity: memory.usedJSHeapSize > 50 * 1024 * 1024 ? 'high' : 'low',
        })
      }
    }

    setInterval(checkMemory, 5000) // Check every 5 seconds
  }

  private startNetworkMonitoring(): void {
    // Monitor fetch requests
    if (typeof window !== 'undefined' && window.fetch) {
      const originalFetch = window.fetch
      window.fetch = async (...args) => {
        const startTime = performance.now()
        const url =
          args[0] instanceof Request ? args[0].url : args[0].toString()

        try {
          const response = await originalFetch(...args)
          const endTime = performance.now()

          this.recordNetworkMetrics({
            requestId: `fetch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url,
            method: args[1]?.method || 'GET',
            duration: endTime - startTime,
            responseSize: parseInt(
              response.headers.get('content-length') || '0'
            ),
            cacheHit: response.headers.get('x-cache') === 'HIT',
            retryCount: 0,
            timestamp: new Date(),
          })

          return response
        } catch (error) {
          const endTime = performance.now()

          this.recordNetworkMetrics({
            requestId: `fetch-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url,
            method: args[1]?.method || 'GET',
            duration: endTime - startTime,
            responseSize: 0,
            cacheHit: false,
            retryCount: 0,
            errorType: error instanceof Error ? error.name : 'Unknown',
            timestamp: new Date(),
          })

          throw error
        }
      }
    }
  }

  private startInteractionMonitoring(): void {
    if (typeof window === 'undefined') return

    // Monitor click interactions
    document.addEventListener('click', event => {
      const startTime = performance.now()
      const target = event.target as Element

      // Use requestAnimationFrame to measure response time
      requestAnimationFrame(() => {
        const responseTime = performance.now() - startTime

        this.recordInteractionMetrics({
          interactionId: `click-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'click',
          target:
            target.tagName +
            (target.id ? `#${target.id}` : '') +
            (target.className ? `.${target.className.split(' ')[0]}` : ''),
          duration: 0,
          responseTime,
          successful: true,
          timestamp: new Date(),
        })
      })
    })

    // Monitor scroll interactions
    let scrollTimeout: NodeJS.Timeout
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        this.recordInteractionMetrics({
          interactionId: `scroll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'scroll',
          target: 'window',
          duration: 0,
          responseTime: 16, // Assume 60fps target
          successful: true,
          timestamp: new Date(),
        })
      }, 100)
    })
  }

  private shouldSample(): boolean {
    return Math.random() < this.samplingRate
  }

  private checkBudgetViolation(metric: PerformanceMetric): void {
    const budget = this.budgets.find(
      b =>
        b.category === metric.category &&
        b.metric === metric.name.toLowerCase().replace(/\s+/g, '')
    )

    if (budget && metric.value > budget.threshold) {
      const violation: PerformanceBudgetViolation = {
        metric,
        budget,
        severity: budget.action,
        timestamp: new Date(),
      }

      this.onViolation?.(violation)
    }
  }

  private checkComponentBudgets(metrics: ComponentMetrics): void {
    if (metrics.renderTime > 16) {
      this.recordMetric({
        id: `component-slow-${Date.now()}`,
        name: 'Slow Component Render',
        value: metrics.renderTime,
        unit: 'ms',
        category: 'rendering',
        severity: metrics.renderTime > 100 ? 'critical' : 'high',
        metadata: { componentName: metrics.componentName },
      })
    }
  }

  private checkNetworkBudgets(metrics: NetworkMetrics): void {
    if (metrics.duration > 3000) {
      this.recordMetric({
        id: `network-slow-${Date.now()}`,
        name: 'Slow Network Request',
        value: metrics.duration,
        unit: 'ms',
        category: 'network',
        severity: 'high',
        metadata: { url: metrics.url },
      })
    }
  }

  private checkBundleBudgets(metrics: BundleMetrics): void {
    if (metrics.size > 512 * 1024) {
      this.recordMetric({
        id: `bundle-large-${Date.now()}`,
        name: 'Large Bundle Size',
        value: metrics.size,
        unit: 'bytes',
        category: 'bundle',
        severity: 'medium',
        metadata: { chunkName: metrics.chunkName },
      })
    }
  }

  private checkInteractionBudgets(metrics: UserInteractionMetrics): void {
    if (metrics.responseTime > 100) {
      this.recordMetric({
        id: `interaction-slow-${Date.now()}`,
        name: 'Slow Interaction Response',
        value: metrics.responseTime,
        unit: 'ms',
        category: 'interaction',
        severity: 'medium',
        metadata: { interactionType: metrics.type, target: metrics.target },
      })
    }
  }

  private emitMetricEvent(metric: PerformanceMetric): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('performance-metric', {
          detail: metric,
        })
      )
    }
  }

  private calculateOverallScore(): number {
    const categories = this.getCategoryMetrics()
    const weights = {
      rendering: 0.3,
      network: 0.25,
      memory: 0.2,
      interaction: 0.15,
      bundle: 0.1,
    }

    let totalScore = 0
    let totalWeight = 0

    Object.entries(categories).forEach(([category, stats]) => {
      const weight = weights[category as keyof typeof weights] || 0.1
      const score = this.calculateCategoryScore(
        category as PerformanceCategory,
        stats
      )
      totalScore += score * weight
      totalWeight += weight
    })

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0
  }

  private calculateCategoryScore(
    category: PerformanceCategory,
    stats: any
  ): number {
    // Simple scoring algorithm - can be enhanced
    const violationRatio = stats.violations / Math.max(stats.total, 1)
    return Math.max(0, 100 - violationRatio * 100)
  }

  private getCategoryMetrics(): Record<string, any> {
    const result: Record<string, any> = {}

    this.metrics.forEach((metrics, category) => {
      const recent = metrics.filter(
        m => Date.now() - m.timestamp.getTime() < 60000 // Last minute
      )

      result[category] = {
        total: recent.length,
        average:
          recent.length > 0
            ? recent.reduce((sum, m) => sum + m.value, 0) / recent.length
            : 0,
        violations: recent.filter(
          m => m.severity === 'high' || m.severity === 'critical'
        ).length,
        trend: this.calculateTrend(metrics),
      }
    })

    return result
  }

  private calculateTrend(
    metrics: PerformanceMetric[]
  ): 'improving' | 'stable' | 'degrading' {
    if (metrics.length < 10) return 'stable'

    const recent = metrics.slice(-5)
    const older = metrics.slice(-10, -5)

    const recentAvg =
      recent.reduce((sum, m) => sum + m.value, 0) / recent.length
    const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length

    const change = (recentAvg - olderAvg) / olderAvg

    if (change > 0.1) return 'degrading'
    if (change < -0.1) return 'improving'
    return 'stable'
  }

  private getComponentSummary(): any {
    const components = Array.from(this.componentMetrics.values())
    return {
      total: components.length,
      slowest: components
        .sort((a, b) => b.renderTime - a.renderTime)
        .slice(0, 5),
      averageRenderTime:
        components.reduce((sum, c) => sum + c.renderTime, 0) /
          components.length || 0,
    }
  }

  private getNetworkSummary(): any {
    const recent = this.networkMetrics.filter(
      m => Date.now() - m.timestamp.getTime() < 300000 // Last 5 minutes
    )

    return {
      totalRequests: recent.length,
      averageDuration:
        recent.reduce((sum, r) => sum + r.duration, 0) / recent.length || 0,
      cacheHitRate: recent.filter(r => r.cacheHit).length / recent.length || 0,
      errorRate: recent.filter(r => r.errorType).length / recent.length || 0,
    }
  }

  private getBundleSummary(): any {
    const bundles = Array.from(this.bundleMetrics.values())
    return {
      totalBundles: bundles.length,
      totalSize: bundles.reduce((sum, b) => sum + b.size, 0),
      averageLoadTime:
        bundles.reduce((sum, b) => sum + b.loadTime, 0) / bundles.length || 0,
    }
  }

  private getInteractionSummary(): any {
    const recent = this.interactionMetrics.filter(
      m => Date.now() - m.timestamp.getTime() < 300000 // Last 5 minutes
    )

    return {
      totalInteractions: recent.length,
      averageResponseTime:
        recent.reduce((sum, i) => sum + i.responseTime, 0) / recent.length || 0,
      successRate: recent.filter(i => i.successful).length / recent.length || 0,
    }
  }

  private getRecentViolations(): PerformanceBudgetViolation[] {
    // Implementation for getting recent violations
    return []
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    // Add recommendations based on current metrics
    const componentMetrics = this.getComponentSummary()
    if (componentMetrics.averageRenderTime > 16) {
      recommendations.push('Consider optimizing component render times')
    }

    const networkMetrics = this.getNetworkSummary()
    if (networkMetrics.cacheHitRate < 0.7) {
      recommendations.push('Improve caching strategy for better performance')
    }

    return recommendations
  }

  private analyzeTrends(): any {
    // Implementation for trend analysis
    return {}
  }

  private identifyBottlenecks(): any {
    // Implementation for bottleneck identification
    return {}
  }

  private suggestOptimizations(): any {
    // Implementation for optimization suggestions
    return {}
  }

  private getCurrentFPS(): number {
    // Implementation for current FPS calculation
    return 60
  }

  private getCurrentMemoryUsage(): number {
    if (
      typeof window !== 'undefined' &&
      'performance' in window &&
      'memory' in performance
    ) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }

  private getCurrentNetworkActivity(): number {
    // Implementation for current network activity
    return 0
  }

  private getCurrentCPUUsage(): number {
    // Implementation for CPU usage estimation
    return 0
  }

  private getAverageRenderTime(): number {
    const components = Array.from(this.componentMetrics.values())
    return (
      components.reduce((sum, c) => sum + c.renderTime, 0) /
        components.length || 0
    )
  }

  private calculateAnalysisConfidence(): number {
    // Implementation for analysis confidence calculation
    return 0.85
  }

  private findSlowComponents(): ComponentMetrics[] {
    return Array.from(this.componentMetrics.values())
      .filter(c => c.renderTime > 16)
      .sort((a, b) => b.renderTime - a.renderTime)
  }

  private findLargeBundles(): BundleMetrics[] {
    return Array.from(this.bundleMetrics.values())
      .filter(b => b.size > 512 * 1024)
      .sort((a, b) => b.size - a.size)
  }

  private findSlowRequests(): NetworkMetrics[] {
    return this.networkMetrics
      .filter(r => r.duration > 1000)
      .sort((a, b) => b.duration - a.duration)
  }

  private priorityWeight(priority: string): number {
    switch (priority) {
      case 'critical':
        return 4
      case 'high':
        return 3
      case 'medium':
        return 2
      case 'low':
        return 1
      default:
        return 0
    }
  }

  private getMonitoringDuration(): number {
    // Implementation for monitoring duration calculation
    return Date.now()
  }

  private getTotalMetricsCount(): number {
    return Array.from(this.metrics.values()).reduce(
      (sum, arr) => sum + arr.length,
      0
    )
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup()
    }, 60000) // Cleanup every minute
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.maxMetricsAge

    // Clean old metrics
    this.metrics.forEach((metrics, category) => {
      const filtered = metrics.filter(m => m.timestamp.getTime() > cutoff)
      this.metrics.set(category, filtered)
    })

    // Clean old component metrics
    this.componentMetrics.forEach((metrics, component) => {
      if (metrics.lastUpdate.getTime() < cutoff) {
        this.componentMetrics.delete(component)
      }
    })
  }
}

// Additional interfaces
export interface PerformanceBudgetViolation {
  metric: PerformanceMetric
  budget: PerformanceBudget
  severity: 'warn' | 'error' | 'block'
  timestamp: Date
}

export interface PerformanceSummary {
  overall: number
  categories: Record<string, any>
  components: any
  network: any
  bundles: any
  interactions: any
  violations: PerformanceBudgetViolation[]
  recommendations: string[]
  timestamp: Date
}

export interface RealTimeMetrics {
  fps: number
  memoryUsage: number
  networkActivity: number
  cpuUsage: number
  renderTime: number
  timestamp: Date
}

export interface PerformanceAnalysis {
  trends: any
  bottlenecks: any
  optimizations: any
  score: number
  confidence: number
  timestamp: Date
}

export interface OptimizationSuggestion {
  type: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  effort: 'low' | 'medium' | 'high'
  actions: string[]
}

export interface PerformanceExport {
  metadata: {
    exportDate: Date
    monitoringDuration: number
    samplingRate: number
    totalMetrics: number
  }
  metrics: Record<string, PerformanceMetric[]>
  components: Record<string, ComponentMetrics>
  network: NetworkMetrics[]
  bundles: Record<string, BundleMetrics>
  interactions: UserInteractionMetrics[]
  budgets: PerformanceBudget[]
  summary: PerformanceSummary
}

// Singleton instance
export const performanceMonitor = new AdvancedPerformanceMonitor()
