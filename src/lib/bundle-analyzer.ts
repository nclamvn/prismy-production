// Bundle Analysis and Performance Monitoring
import { useState, useEffect } from 'react'

export interface BundleMetrics {
  bundleSize: number
  gzippedSize: number
  loadTime: number
  parsedSize: number
  modules: ModuleInfo[]
  chunks: ChunkInfo[]
  assets: AssetInfo[]
}

export interface ModuleInfo {
  name: string
  size: number
  gzippedSize: number
  parsedSize: number
  isNodeModule: boolean
  reasons: string[]
}

export interface ChunkInfo {
  name: string
  size: number
  files: string[]
  modules: number
  isEntry: boolean
  isAsync: boolean
}

export interface AssetInfo {
  name: string
  size: number
  type: 'js' | 'css' | 'image' | 'font' | 'other'
  cached: boolean
  loadTime?: number
}

export interface PerformanceMetrics {
  firstContentfulPaint: number
  largestContentfulPaint: number
  firstInputDelay: number
  cumulativeLayoutShift: number
  timeToInteractive: number
  bundleMetrics: BundleMetrics | null
}

class BundleAnalyzer {
  private metricsCache: Map<string, any> = new Map()
  private observers: Map<string, PerformanceObserver> = new Map()

  // Initialize performance monitoring
  initializeMonitoring() {
    if (typeof window === 'undefined') return

    try {
      // Monitor Web Vitals
      this.observeWebVitals()
      
      // Monitor Resource Loading
      this.observeResourceTiming()
      
      // Monitor Navigation Timing
      this.observeNavigationTiming()
      
      // Monitor Bundle Loading
      this.observeBundleMetrics()
      
      console.info('Performance monitoring initialized')
    } catch (error) {
      console.error({ error }, 'Failed to initialize performance monitoring')
    }
  }

  // Observe Core Web Vitals
  private observeWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        
        if (lastEntry) {
          this.recordMetric('lcp', lastEntry.startTime)
          console.info({
            metric: 'LCP',
            value: lastEntry.startTime,
            element: lastEntry.element?.tagName
          }, 'Largest Contentful Paint measured')
        }
      })
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.set('lcp', lcpObserver)
    }

    // First Input Delay (FID)
    if ('PerformanceObserver' in window) {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          this.recordMetric('fid', entry.processingStart - entry.startTime)
          console.info({
            metric: 'FID',
            value: entry.processingStart - entry.startTime,
            eventType: entry.name
          }, 'First Input Delay measured')
        })
      })
      
      fidObserver.observe({ entryTypes: ['first-input'] })
      this.observers.set('fid', fidObserver)
    }

    // Cumulative Layout Shift (CLS)
    if ('PerformanceObserver' in window) {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        
        this.recordMetric('cls', clsValue)
        console.info({
          metric: 'CLS',
          value: clsValue
        }, 'Cumulative Layout Shift updated')
      })
      
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.set('cls', clsObserver)
    }
  }

  // Observe resource loading performance
  private observeResourceTiming() {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          const resourceInfo = {
            name: entry.name,
            type: this.getResourceType(entry.name),
            size: entry.transferSize || 0,
            loadTime: entry.responseEnd - entry.startTime,
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
            serverTime: entry.responseStart - entry.requestStart,
            networkTime: entry.responseEnd - entry.responseStart
          }
          
          this.recordResourceMetric(resourceInfo)
          
          // Log slow resources
          if (resourceInfo.loadTime > 1000) {
            console.warn({
              resource: resourceInfo.name,
              loadTime: resourceInfo.loadTime,
              size: resourceInfo.size
            }, 'Slow resource detected')
          }
        })
      })
      
      resourceObserver.observe({ entryTypes: ['resource'] })
      this.observers.set('resource', resourceObserver)
    }
  }

  // Observe navigation timing
  private observeNavigationTiming() {
    if ('PerformanceObserver' in window) {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          const metrics = {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            domInteractive: entry.domInteractive - entry.navigationStart,
            firstPaint: this.getFirstPaint(),
            firstContentfulPaint: this.getFirstContentfulPaint()
          }
          
          this.recordMetric('navigation', metrics)
          console.info({
            ...metrics
          }, 'Navigation timing measured')
        })
      })
      
      navigationObserver.observe({ entryTypes: ['navigation'] })
      this.observers.set('navigation', navigationObserver)
    }
  }

  // Monitor bundle-specific metrics
  private observeBundleMetrics() {
    // Monitor script loading
    const scripts = document.querySelectorAll('script[src]')
    const bundlePromises: Promise<AssetInfo>[] = []
    
    scripts.forEach((script: any) => {
      if (script.src.includes('/_next/static/')) {
        bundlePromises.push(this.measureAssetLoad(script.src, 'js'))
      }
    })

    // Monitor CSS loading
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]')
    stylesheets.forEach((link: any) => {
      if (link.href.includes('/_next/static/')) {
        bundlePromises.push(this.measureAssetLoad(link.href, 'css'))
      }
    })

    Promise.all(bundlePromises).then((assets) => {
      const bundleMetrics = this.calculateBundleMetrics(assets)
      this.recordMetric('bundle', bundleMetrics)
      
      console.info({
        totalSize: bundleMetrics.bundleSize,
        assetsCount: assets.length,
        totalLoadTime: bundleMetrics.loadTime
      }, 'Bundle metrics calculated')
    })
  }

  // Measure individual asset loading
  private async measureAssetLoad(url: string, type: 'js' | 'css'): Promise<AssetInfo> {
    const startTime = performance.now()
    
    try {
      const response = await fetch(url, { method: 'HEAD' })
      const endTime = performance.now()
      
      return {
        name: url,
        size: parseInt(response.headers.get('content-length') || '0'),
        type,
        cached: response.headers.get('cache-control')?.includes('max-age') || false,
        loadTime: endTime - startTime
      }
    } catch (error) {
      return {
        name: url,
        size: 0,
        type,
        cached: false,
        loadTime: performance.now() - startTime
      }
    }
  }

  // Calculate bundle metrics from assets
  private calculateBundleMetrics(assets: AssetInfo[]): BundleMetrics {
    const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0)
    const totalLoadTime = Math.max(...assets.map(asset => asset.loadTime || 0))
    
    return {
      bundleSize: totalSize,
      gzippedSize: Math.floor(totalSize * 0.3), // Estimate
      loadTime: totalLoadTime,
      parsedSize: totalSize,
      modules: [], // Would be populated with webpack stats
      chunks: [], // Would be populated with webpack stats
      assets
    }
  }

  // Get resource type from URL
  private getResourceType(url: string): AssetInfo['type'] {
    if (url.endsWith('.js')) return 'js'
    if (url.endsWith('.css')) return 'css'
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image'
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font'
    return 'other'
  }

  // Get First Paint timing
  private getFirstPaint(): number {
    const entry = performance.getEntriesByName('first-paint')[0]
    return entry?.startTime || 0
  }

  // Get First Contentful Paint timing
  private getFirstContentfulPaint(): number {
    const entry = performance.getEntriesByName('first-contentful-paint')[0]
    return entry?.startTime || 0
  }

  // Record performance metrics
  private recordMetric(key: string, value: any) {
    this.metricsCache.set(key, {
      value,
      timestamp: Date.now()
    })
  }

  // Record resource metrics
  private recordResourceMetric(resource: any) {
    const resources = this.metricsCache.get('resources') || []
    resources.push(resource)
    this.metricsCache.set('resources', resources)
  }

  // Get all performance metrics
  getPerformanceMetrics(): PerformanceMetrics {
    const fcp = this.metricsCache.get('navigation')?.value?.firstContentfulPaint || 0
    const lcp = this.metricsCache.get('lcp')?.value || 0
    const fid = this.metricsCache.get('fid')?.value || 0
    const cls = this.metricsCache.get('cls')?.value || 0
    const tti = this.calculateTTI()
    const bundleMetrics = this.metricsCache.get('bundle')?.value || null

    return {
      firstContentfulPaint: fcp,
      largestContentfulPaint: lcp,
      firstInputDelay: fid,
      cumulativeLayoutShift: cls,
      timeToInteractive: tti,
      bundleMetrics
    }
  }

  // Calculate Time to Interactive (simplified)
  private calculateTTI(): number {
    const navigation = this.metricsCache.get('navigation')?.value
    if (!navigation) return 0
    
    // Simplified TTI calculation
    return navigation.domInteractive || 0
  }

  // Get bundle optimization suggestions
  getBundleOptimizationSuggestions(): string[] {
    const suggestions: string[] = []
    const metrics = this.getPerformanceMetrics()
    const resources = this.metricsCache.get('resources') || []
    
    // Check bundle size
    if (metrics.bundleMetrics && metrics.bundleMetrics.bundleSize > 1000000) {
      suggestions.push('Consider code splitting to reduce bundle size')
    }
    
    // Check for large resources
    const largeResources = resources.filter((r: any) => r.size > 500000)
    if (largeResources.length > 0) {
      suggestions.push('Large resources detected - consider compression or lazy loading')
    }
    
    // Check for uncached resources
    const uncachedResources = resources.filter((r: any) => !r.cached)
    if (uncachedResources.length > 5) {
      suggestions.push('Many uncached resources - improve caching strategy')
    }
    
    // Check Core Web Vitals
    if (metrics.largestContentfulPaint > 2500) {
      suggestions.push('LCP is slow - optimize largest content elements')
    }
    
    if (metrics.firstInputDelay > 100) {
      suggestions.push('FID is high - optimize JavaScript execution')
    }
    
    if (metrics.cumulativeLayoutShift > 0.1) {
      suggestions.push('CLS is high - fix layout shifts')
    }
    
    return suggestions
  }

  // Generate performance report
  generateReport(): any {
    const metrics = this.getPerformanceMetrics()
    const suggestions = this.getBundleOptimizationSuggestions()
    const resources = this.metricsCache.get('resources') || []
    
    return {
      timestamp: Date.now(),
      metrics,
      suggestions,
      resources: resources.slice(0, 20), // Top 20 resources
      summary: {
        overallScore: this.calculateOverallScore(metrics),
        criticalIssues: suggestions.length,
        resourcesAnalyzed: resources.length
      }
    }
  }

  // Calculate overall performance score (0-100)
  private calculateOverallScore(metrics: PerformanceMetrics): number {
    let score = 100
    
    // Deduct points for poor Core Web Vitals
    if (metrics.firstContentfulPaint > 1800) score -= 20
    if (metrics.largestContentfulPaint > 2500) score -= 25
    if (metrics.firstInputDelay > 100) score -= 20
    if (metrics.cumulativeLayoutShift > 0.1) score -= 20
    if (metrics.timeToInteractive > 3800) score -= 15
    
    return Math.max(0, score)
  }

  // Clean up observers
  cleanup() {
    this.observers.forEach((observer) => {
      observer.disconnect()
    })
    this.observers.clear()
    this.metricsCache.clear()
  }

  // Export metrics for external tools
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    const report = this.generateReport()
    
    if (format === 'csv') {
      // Convert to CSV format
      const headers = ['metric', 'value', 'timestamp']
      const rows = Object.entries(report.metrics).map(([key, value]) => 
        [key, value, report.timestamp].join(',')
      )
      return [headers.join(','), ...rows].join('\n')
    }
    
    return JSON.stringify(report, null, 2)
  }
}

// Singleton instance
export const bundleAnalyzer = new BundleAnalyzer()

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  // Wait for page load before starting monitoring
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      bundleAnalyzer.initializeMonitoring()
    })
  } else {
    bundleAnalyzer.initializeMonitoring()
  }
}

// React hook for performance metrics
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  
  useEffect(() => {
    const updateMetrics = () => {
      const newMetrics = bundleAnalyzer.getPerformanceMetrics()
      const newSuggestions = bundleAnalyzer.getBundleOptimizationSuggestions()
      
      setMetrics(newMetrics)
      setSuggestions(newSuggestions)
    }
    
    // Initial update
    updateMetrics()
    
    // Update every 5 seconds
    const interval = setInterval(updateMetrics, 5000)
    
    return () => clearInterval(interval)
  }, [])
  
  return { metrics, suggestions }
}

// Types are already exported above with their declarations