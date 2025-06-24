/**
 * PRISMY MOBILE PERFORMANCE OPTIMIZER
 * Comprehensive mobile performance monitoring and optimization
 */

import React from 'react'

export interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number // First Contentful Paint
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  ttfb: number // Time to First Byte
  
  // Mobile-specific metrics
  touchLatency: number
  scrollPerformance: number
  memoryUsage: number
  batteryLevel?: number
  connectionSpeed: string
  
  // App-specific metrics
  translationLatency: number
  ocrProcessingTime: number
  cacheHitRate: number
  
  // Timestamps
  measurementTime: Date
}

export interface DeviceInfo {
  userAgent: string
  platform: string
  language: string
  screenResolution: string
  viewportSize: string
  devicePixelRatio: number
  hardwareConcurrency: number
  deviceMemory?: number
  connectionType?: string
  batteryCharging?: boolean
  batteryLevel?: number
}

export interface PerformanceOptimization {
  id: string
  name: string
  description: string
  impact: 'high' | 'medium' | 'low'
  implementation: () => void
  isActive: boolean
  metrics?: string[]
}

export interface PerformanceConfig {
  enableMetricsCollection: boolean
  enableAutoOptimizations: boolean
  enableResourceHints: boolean
  enableImageOptimization: boolean
  enableCodeSplitting: boolean
  enableServiceWorkerCaching: boolean
  metricsReportingInterval: number
  optimizationThresholds: {
    fcp: number
    lcp: number
    fid: number
    cls: number
    touchLatency: number
    memoryUsage: number
  }
}

class MobilePerformanceOptimizer {
  private config: PerformanceConfig
  private metrics: PerformanceMetrics | null = null
  private deviceInfo: DeviceInfo | null = null
  private optimizations: Map<string, PerformanceOptimization> = new Map()
  private observers: Map<string, PerformanceObserver> = new Map()
  private reportingInterval: number | null = null

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableMetricsCollection: true,
      enableAutoOptimizations: true,
      enableResourceHints: true,
      enableImageOptimization: true,
      enableCodeSplitting: true,
      enableServiceWorkerCaching: true,
      metricsReportingInterval: 30000, // 30 seconds
      optimizationThresholds: {
        fcp: 1500, // 1.5 seconds
        lcp: 2500, // 2.5 seconds
        fid: 100,  // 100ms
        cls: 0.1,  // 0.1 cumulative shift
        touchLatency: 50, // 50ms
        memoryUsage: 50 // 50MB
      },
      ...config
    }

    this.initialize()
  }

  /**
   * Initialize performance monitoring
   */
  private async initialize(): Promise<void> {
    if (typeof window === 'undefined') return

    // Collect device information
    this.deviceInfo = this.collectDeviceInfo()
    
    // Initialize performance monitoring
    if (this.config.enableMetricsCollection) {
      this.initializeMetricsCollection()
    }

    // Register optimizations
    this.registerOptimizations()

    // Apply auto-optimizations
    if (this.config.enableAutoOptimizations) {
      await this.applyAutoOptimizations()
    }

    // Start metrics reporting
    this.startMetricsReporting()

    console.log('[Mobile Performance] Initialized with device:', this.deviceInfo)
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics | null {
    return this.metrics
  }

  /**
   * Get device information
   */
  public getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo
  }

  /**
   * Get performance score (0-100)
   */
  public getPerformanceScore(): number {
    if (!this.metrics) return 0

    const scores = {
      fcp: this.scoreMetric(this.metrics.fcp, this.config.optimizationThresholds.fcp, 3000),
      lcp: this.scoreMetric(this.metrics.lcp, this.config.optimizationThresholds.lcp, 4000),
      fid: this.scoreMetric(this.metrics.fid, this.config.optimizationThresholds.fid, 300, true),
      cls: this.scoreMetric(this.metrics.cls, this.config.optimizationThresholds.cls, 0.25, true),
      touchLatency: this.scoreMetric(this.metrics.touchLatency, this.config.optimizationThresholds.touchLatency, 200, true)
    }

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0)
    return Math.round(totalScore / Object.keys(scores).length)
  }

  /**
   * Get optimization recommendations
   */
  public getOptimizationRecommendations(): PerformanceOptimization[] {
    const recommendations: PerformanceOptimization[] = []

    if (!this.metrics) return recommendations

    for (const optimization of this.optimizations.values()) {
      if (!optimization.isActive && this.shouldApplyOptimization(optimization)) {
        recommendations.push(optimization)
      }
    }

    return recommendations.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 }
      return impactOrder[b.impact] - impactOrder[a.impact]
    })
  }

  /**
   * Apply specific optimization
   */
  public async applyOptimization(optimizationId: string): Promise<boolean> {
    const optimization = this.optimizations.get(optimizationId)
    if (!optimization || optimization.isActive) return false

    try {
      optimization.implementation()
      optimization.isActive = true
      console.log(`[Mobile Performance] Applied optimization: ${optimization.name}`)
      return true
    } catch (error) {
      console.error(`[Mobile Performance] Failed to apply optimization ${optimizationId}:`, error)
      return false
    }
  }

  /**
   * Measure touch latency
   */
  public measureTouchLatency(): Promise<number> {
    return new Promise((resolve) => {
      let startTime: number
      let endTime: number

      const handleTouchStart = (event: TouchEvent) => {
        startTime = performance.now()
      }

      const handleTouchEnd = (event: TouchEvent) => {
        endTime = performance.now()
        const latency = endTime - startTime

        document.removeEventListener('touchstart', handleTouchStart)
        document.removeEventListener('touchend', handleTouchEnd)

        resolve(latency)
      }

      document.addEventListener('touchstart', handleTouchStart, { once: true })
      document.addEventListener('touchend', handleTouchEnd, { once: true })

      // Fallback timeout
      setTimeout(() => {
        document.removeEventListener('touchstart', handleTouchStart)
        document.removeEventListener('touchend', handleTouchEnd)
        resolve(0)
      }, 5000)
    })
  }

  /**
   * Optimize images for mobile
   */
  public optimizeImages(): void {
    const images = document.querySelectorAll('img')
    
    images.forEach((img) => {
      // Add loading="lazy" for offscreen images
      if (!img.hasAttribute('loading')) {
        const rect = img.getBoundingClientRect()
        if (rect.top > window.innerHeight) {
          img.setAttribute('loading', 'lazy')
        }
      }

      // Optimize image format
      if (this.supportsWebP() && !img.src.includes('.webp')) {
        const webpSrc = img.src.replace(/\.(jpg|jpeg|png)$/i, '.webp')
        img.src = webpSrc
      }

      // Add responsive sizing
      if (!img.hasAttribute('sizes')) {
        img.setAttribute('sizes', '(max-width: 768px) 100vw, 50vw')
      }
    })
  }

  /**
   * Optimize JavaScript performance
   */
  public optimizeJavaScript(): void {
    // Defer non-critical scripts
    const scripts = document.querySelectorAll('script[src]')
    scripts.forEach((script) => {
      if (!script.hasAttribute('async') && !script.hasAttribute('defer')) {
        (script as HTMLScriptElement).defer = true
      }
    })

    // Enable passive event listeners
    this.enablePassiveListeners()

    // Optimize animation frame usage
    this.optimizeAnimations()
  }

  /**
   * Reduce memory usage
   */
  public reduceMemoryUsage(): void {
    // Clear unused caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('old') || cacheName.includes('temp')) {
            caches.delete(cacheName)
          }
        })
      })
    }

    // Cleanup DOM nodes
    this.cleanupDOMNodes()

    // Optimize images in memory
    this.optimizeImageMemory()
  }

  /**
   * Preload critical resources
   */
  public preloadCriticalResources(): void {
    const criticalResources = [
      '/api/translate',
      '/lib/translation-service.js',
      '/components/translation'
    ]

    criticalResources.forEach(resource => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = resource
      link.as = resource.endsWith('.js') ? 'script' : 'fetch'
      document.head.appendChild(link)
    })
  }

  /**
   * Enable service worker caching
   */
  public async enableServiceWorkerCaching(): Promise<void> {
    if (!('serviceWorker' in navigator)) return

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('[Mobile Performance] Service worker registered')

      // Update cache strategy based on network conditions
      const connection = this.getNetworkInfo()
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        // Enable aggressive caching for slow connections
        registration.active?.postMessage({
          type: 'ENABLE_AGGRESSIVE_CACHING'
        })
      }
    } catch (error) {
      console.error('[Mobile Performance] Service worker registration failed:', error)
    }
  }

  /**
   * Create performance monitoring component
   */
  public createPerformanceMonitor(): React.ComponentType<{
    showDetails?: boolean
    onOptimizationApplied?: (optimization: PerformanceOptimization) => void
  }> {
    return ({ showDetails = false, onOptimizationApplied }) => {
      const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null)
      const [score, setScore] = React.useState(0)
      const [recommendations, setRecommendations] = React.useState<PerformanceOptimization[]>([])

      React.useEffect(() => {
        const updateMetrics = () => {
          setMetrics(this.getMetrics())
          setScore(this.getPerformanceScore())
          setRecommendations(this.getOptimizationRecommendations())
        }

        updateMetrics()
        const interval = setInterval(updateMetrics, 5000)
        return () => clearInterval(interval)
      }, [])

      const handleApplyOptimization = async (optimization: PerformanceOptimization) => {
        const success = await this.applyOptimization(optimization.id)
        if (success && onOptimizationApplied) {
          onOptimizationApplied(optimization)
        }
      }

      if (!showDetails) {
        return React.createElement(
          'div',
          {
            className: `fixed top-4 right-4 px-3 py-2 rounded-lg text-white text-sm z-50 ${
              score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`
          },
          `Performance: ${score}/100`
        )
      }

      return React.createElement(
        'div',
        {
          className: 'fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-50'
        },
        React.createElement('h3', { className: 'font-bold mb-2' }, 'Performance Monitor'),
        React.createElement('div', { className: 'text-sm space-y-2' },
          React.createElement('div', {}, `Score: ${score}/100`),
          metrics && React.createElement('div', {},
            React.createElement('div', {}, `FCP: ${metrics.fcp.toFixed(0)}ms`),
            React.createElement('div', {}, `LCP: ${metrics.lcp.toFixed(0)}ms`),
            React.createElement('div', {}, `Touch Latency: ${metrics.touchLatency.toFixed(0)}ms`)
          ),
          recommendations.length > 0 && React.createElement(
            'div',
            { className: 'space-y-1' },
            React.createElement('div', { className: 'font-medium' }, 'Recommendations:'),
            ...recommendations.slice(0, 3).map(rec =>
              React.createElement(
                'button',
                {
                  key: rec.id,
                  onClick: () => handleApplyOptimization(rec),
                  className: 'block w-full text-left p-2 bg-blue-50 rounded text-xs hover:bg-blue-100'
                },
                rec.name
              )
            )
          )
        )
      )
    }
  }

  // Private methods

  private collectDeviceInfo(): DeviceInfo {
    const nav = navigator as any
    
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio,
      hardwareConcurrency: navigator.hardwareConcurrency || 1,
      deviceMemory: nav.deviceMemory,
      connectionType: nav.connection?.effectiveType,
      batteryCharging: nav.getBattery ? undefined : undefined,
      batteryLevel: nav.getBattery ? undefined : undefined
    }
  }

  private initializeMetricsCollection(): void {
    // Web Vitals observers
    if ('PerformanceObserver' in window) {
      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.updateMetric('fcp', entry.startTime)
          }
        }
      })
      fcpObserver.observe({ entryTypes: ['paint'] })
      this.observers.set('fcp', fcpObserver)

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.updateMetric('lcp', lastEntry.startTime)
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.set('lcp', lcpObserver)

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.updateMetric('fid', (entry as any).processingStart - entry.startTime)
        }
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
      this.observers.set('fid', fidObserver)

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        this.updateMetric('cls', clsValue)
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.set('cls', clsObserver)
    }

    // Memory usage monitoring
    this.monitorMemoryUsage()

    // Touch latency monitoring
    this.monitorTouchLatency()
  }

  private registerOptimizations(): void {
    this.optimizations.set('image-optimization', {
      id: 'image-optimization',
      name: 'Optimize Images',
      description: 'Convert images to WebP format and add lazy loading',
      impact: 'high',
      implementation: () => this.optimizeImages(),
      isActive: false,
      metrics: ['lcp', 'memoryUsage']
    })

    this.optimizations.set('js-optimization', {
      id: 'js-optimization',
      name: 'Optimize JavaScript',
      description: 'Defer non-critical scripts and enable passive listeners',
      impact: 'medium',
      implementation: () => this.optimizeJavaScript(),
      isActive: false,
      metrics: ['fcp', 'fid', 'touchLatency']
    })

    this.optimizations.set('memory-cleanup', {
      id: 'memory-cleanup',
      name: 'Reduce Memory Usage',
      description: 'Clear unused caches and optimize memory allocation',
      impact: 'medium',
      implementation: () => this.reduceMemoryUsage(),
      isActive: false,
      metrics: ['memoryUsage']
    })

    this.optimizations.set('resource-preload', {
      id: 'resource-preload',
      name: 'Preload Critical Resources',
      description: 'Preload important resources for faster loading',
      impact: 'low',
      implementation: () => this.preloadCriticalResources(),
      isActive: false,
      metrics: ['fcp', 'lcp']
    })
  }

  private async applyAutoOptimizations(): Promise<void> {
    const networkInfo = this.getNetworkInfo()
    
    // Apply optimizations based on network conditions
    if (networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') {
      await this.applyOptimization('image-optimization')
      await this.applyOptimization('memory-cleanup')
    }

    // Apply optimizations based on device capabilities
    if (this.deviceInfo?.deviceMemory && this.deviceInfo.deviceMemory < 4) {
      await this.applyOptimization('memory-cleanup')
    }

    if (this.deviceInfo?.hardwareConcurrency && this.deviceInfo.hardwareConcurrency < 4) {
      await this.applyOptimization('js-optimization')
    }
  }

  private updateMetric(key: keyof PerformanceMetrics, value: number): void {
    if (!this.metrics) {
      this.metrics = {
        fcp: 0,
        lcp: 0,
        fid: 0,
        cls: 0,
        ttfb: 0,
        touchLatency: 0,
        scrollPerformance: 0,
        memoryUsage: 0,
        connectionSpeed: 'unknown',
        translationLatency: 0,
        ocrProcessingTime: 0,
        cacheHitRate: 0,
        measurementTime: new Date()
      }
    }

    this.metrics[key] = value as any
    this.metrics.measurementTime = new Date()
  }

  private scoreMetric(value: number, good: number, poor: number, lower = false): number {
    if (lower) {
      if (value <= good) return 100
      if (value >= poor) return 0
      return Math.round(100 - ((value - good) / (poor - good)) * 100)
    } else {
      if (value <= good) return 100
      if (value >= poor) return 0
      return Math.round(100 - ((value - good) / (poor - good)) * 100)
    }
  }

  private shouldApplyOptimization(optimization: PerformanceOptimization): boolean {
    if (!this.metrics || !optimization.metrics) return false

    return optimization.metrics.some(metric => {
      const value = this.metrics![metric as keyof PerformanceMetrics] as number
      const threshold = this.config.optimizationThresholds[metric as keyof typeof this.config.optimizationThresholds]
      return value > threshold
    })
  }

  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
  }

  private enablePassiveListeners(): void {
    const events = ['touchstart', 'touchmove', 'wheel', 'scroll']
    events.forEach(event => {
      document.addEventListener(event, () => {}, { passive: true })
    })
  }

  private optimizeAnimations(): void {
    // Use transform and opacity for animations
    const style = document.createElement('style')
    style.textContent = `
      .optimized-animation {
        will-change: transform, opacity;
        transform: translateZ(0);
      }
      .smooth-scroll {
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
      }
    `
    document.head.appendChild(style)
  }

  private cleanupDOMNodes(): void {
    // Remove hidden or offscreen elements
    const hiddenElements = document.querySelectorAll('[style*="display: none"], [hidden]')
    hiddenElements.forEach(el => {
      if (!el.hasAttribute('data-keep')) {
        el.remove()
      }
    })
  }

  private optimizeImageMemory(): void {
    const images = document.querySelectorAll('img')
    images.forEach(img => {
      if (img.complete && img.naturalWidth > 0) {
        const rect = img.getBoundingClientRect()
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          // Remove src for offscreen images to free memory
          img.dataset.src = img.src
          img.removeAttribute('src')
        }
      }
    })
  }

  private monitorMemoryUsage(): void {
    if ('memory' in performance) {
      const updateMemory = () => {
        const memory = (performance as any).memory
        this.updateMetric('memoryUsage', memory.usedJSHeapSize / 1024 / 1024) // MB
      }
      
      setInterval(updateMemory, 5000)
    }
  }

  private monitorTouchLatency(): void {
    let touchStartTime = 0
    
    document.addEventListener('touchstart', () => {
      touchStartTime = performance.now()
    }, { passive: true })
    
    document.addEventListener('touchend', () => {
      if (touchStartTime > 0) {
        const latency = performance.now() - touchStartTime
        this.updateMetric('touchLatency', latency)
        touchStartTime = 0
      }
    }, { passive: true })
  }

  private getNetworkInfo(): any {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    return connection || { effectiveType: 'unknown' }
  }

  private startMetricsReporting(): void {
    this.reportingInterval = window.setInterval(() => {
      if (this.metrics) {
        console.log('[Mobile Performance] Metrics:', {
          score: this.getPerformanceScore(),
          ...this.metrics
        })
      }
    }, this.config.metricsReportingInterval)
  }

  public destroy(): void {
    // Clean up observers
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()

    // Clear reporting interval
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval)
    }
  }
}

// Export singleton instance
export const mobilePerformance = new MobilePerformanceOptimizer()

// Export class for customization
export { MobilePerformanceOptimizer }
export type {
  PerformanceMetrics,
  DeviceInfo,
  PerformanceOptimization,
  PerformanceConfig
}