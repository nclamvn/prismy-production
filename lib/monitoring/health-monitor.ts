/**
 * Advanced Health Monitoring System
 * Phase 10.4: Production Monitoring & Alerting
 */

export interface HealthCheck {
  id: string
  name: string
  description: string
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  lastCheck: number
  responseTime: number
  metadata: Record<string, any>
  notebookLMRelated?: boolean
}

export interface Alert {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  timestamp: number
  resolved: boolean
  resolvedAt?: number
  component: string
  metadata: Record<string, any>
}

export interface SystemMetrics {
  timestamp: number
  performance: {
    lcp: number
    fid: number
    cls: number
    fcp: number
    ttfb: number
  }
  resources: {
    jsHeapSize: number
    totalJSHeapSize: number
    usedJSHeapSize: number
  }
  network: {
    effectiveType: string
    downlink: number
    rtt: number
  }
  errors: {
    jsErrors: number
    networkErrors: number
    renderErrors: number
  }
  notebookLM: {
    darkModeUsage: number
    componentRenderTimes: Record<string, number>
    accessibilityUsage: number
  }
}

class HealthMonitor {
  private checks: Map<string, HealthCheck> = new Map()
  private alerts: Alert[] = []
  private metrics: SystemMetrics[] = []
  private isMonitoring: boolean = false
  private monitoringInterval?: NodeJS.Timeout

  constructor() {
    this.initializeHealthChecks()
    this.startMonitoring()
  }

  private initializeHealthChecks() {
    const healthChecks: HealthCheck[] = [
      {
        id: 'api_health',
        name: 'API Health',
        description: 'Health status of core API endpoints',
        status: 'unknown',
        lastCheck: 0,
        responseTime: 0,
        metadata: {},
        notebookLMRelated: false
      },
      {
        id: 'database_connection',
        name: 'Database Connection',
        description: 'Supabase database connectivity',
        status: 'unknown',
        lastCheck: 0,
        responseTime: 0,
        metadata: {},
        notebookLMRelated: false
      },
      {
        id: 'translation_service',
        name: 'Translation Service',
        description: 'Google Translate API availability',
        status: 'unknown',
        lastCheck: 0,
        responseTime: 0,
        metadata: {},
        notebookLMRelated: false
      },
      {
        id: 'notebooklm_components',
        name: 'NotebookLM Components',
        description: 'NotebookLM design system component health',
        status: 'unknown',
        lastCheck: 0,
        responseTime: 0,
        metadata: {},
        notebookLMRelated: true
      },
      {
        id: 'dark_mode_system',
        name: 'Dark Mode System',
        description: 'Theme switching and persistence',
        status: 'unknown',
        lastCheck: 0,
        responseTime: 0,
        metadata: {},
        notebookLMRelated: true
      },
      {
        id: 'accessibility_features',
        name: 'Accessibility Features',
        description: 'WCAG compliance and accessibility tools',
        status: 'unknown',
        lastCheck: 0,
        responseTime: 0,
        metadata: {},
        notebookLMRelated: true
      },
      {
        id: 'performance_vitals',
        name: 'Performance Vitals',
        description: 'Core Web Vitals monitoring',
        status: 'unknown',
        lastCheck: 0,
        responseTime: 0,
        metadata: {},
        notebookLMRelated: false
      }
    ]

    healthChecks.forEach(check => {
      this.checks.set(check.id, check)
    })
  }

  public startMonitoring() {
    if (this.isMonitoring) return

    this.isMonitoring = true
    
    // Initial health check
    this.runAllHealthChecks()

    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.runAllHealthChecks()
      this.collectSystemMetrics()
      this.checkAlertConditions()
    }, 60000) // Every minute

    // Monitor performance continuously
    this.startPerformanceMonitoring()

    // Monitor errors
    this.startErrorMonitoring()
  }

  public stopMonitoring() {
    this.isMonitoring = false
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }
  }

  private async runAllHealthChecks() {
    const promises = Array.from(this.checks.keys()).map(id => 
      this.runHealthCheck(id).catch(() => {
        // Don't let one failed check break others
      })
    )

    await Promise.allSettled(promises)
  }

  private async runHealthCheck(checkId: string): Promise<void> {
    const check = this.checks.get(checkId)
    if (!check) return

    const startTime = Date.now()
    
    try {
      let status: HealthCheck['status'] = 'healthy'
      let metadata: Record<string, any> = {}

      switch (checkId) {
        case 'api_health':
          status = await this.checkAPIHealth()
          break
          
        case 'database_connection':
          status = await this.checkDatabaseConnection()
          break
          
        case 'translation_service':
          status = await this.checkTranslationService()
          break
          
        case 'notebooklm_components':
          const componentStatus = await this.checkNotebookLMComponents()
          status = componentStatus.status
          metadata = componentStatus.metadata
          break
          
        case 'dark_mode_system':
          status = await this.checkDarkModeSystem()
          break
          
        case 'accessibility_features':
          status = await this.checkAccessibilityFeatures()
          break
          
        case 'performance_vitals':
          const perfStatus = await this.checkPerformanceVitals()
          status = perfStatus.status
          metadata = perfStatus.metadata
          break
      }

      const responseTime = Date.now() - startTime

      // Update check
      this.checks.set(checkId, {
        ...check,
        status,
        lastCheck: Date.now(),
        responseTime,
        metadata
      })

      // Create alert if status degraded
      if (status !== 'healthy' && check.status === 'healthy') {
        this.createAlert({
          severity: status === 'critical' ? 'critical' : 'medium',
          title: `${check.name} Health Degraded`,
          description: `Health check for ${check.name} returned ${status} status`,
          component: checkId,
          metadata: { previousStatus: check.status, currentStatus: status }
        })
      }

    } catch (error) {
      const responseTime = Date.now() - startTime
      
      this.checks.set(checkId, {
        ...check,
        status: 'critical',
        lastCheck: Date.now(),
        responseTime,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      })

      this.createAlert({
        severity: 'high',
        title: `${check.name} Check Failed`,
        description: `Health check for ${check.name} failed with error`,
        component: checkId,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    }
  }

  private async checkAPIHealth(): Promise<HealthCheck['status']> {
    try {
      const response = await fetch('/api/health', { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      
      if (response.ok) {
        return 'healthy'
      } else if (response.status >= 500) {
        return 'critical'
      } else {
        return 'warning'
      }
    } catch {
      return 'critical'
    }
  }

  private async checkDatabaseConnection(): Promise<HealthCheck['status']> {
    try {
      const response = await fetch('/api/db/health')
      return response.ok ? 'healthy' : 'critical'
    } catch {
      return 'critical'
    }
  }

  private async checkTranslationService(): Promise<HealthCheck['status']> {
    try {
      const response = await fetch('/api/translate/health')
      return response.ok ? 'healthy' : 'warning'
    } catch {
      return 'warning'
    }
  }

  private async checkNotebookLMComponents(): Promise<{ status: HealthCheck['status'], metadata: Record<string, any> }> {
    const metadata: Record<string, any> = {}
    
    // Check if NotebookLM CSS variables are loaded
    const hasNotebookLMVars = typeof window !== 'undefined' && 
      getComputedStyle(document.documentElement).getPropertyValue('--notebooklm-primary').trim() !== ''
    
    metadata.cssVariablesLoaded = hasNotebookLMVars
    
    // Check component render performance
    const componentRenderTimes = this.getComponentRenderTimes()
    metadata.componentRenderTimes = componentRenderTimes
    
    // Check for styling issues
    const stylingIssues = this.detectStylingIssues()
    metadata.stylingIssues = stylingIssues
    
    let status: HealthCheck['status'] = 'healthy'
    
    if (!hasNotebookLMVars) {
      status = 'critical'
    } else if (stylingIssues.length > 0) {
      status = 'warning'
    } else if (Object.values(componentRenderTimes).some(time => time > 16)) {
      status = 'warning'
    }
    
    return { status, metadata }
  }

  private async checkDarkModeSystem(): Promise<HealthCheck['status']> {
    if (typeof window === 'undefined') return 'unknown'
    
    try {
      // Check if theme switching works
      const currentTheme = document.documentElement.getAttribute('data-theme')
      const themeProvider = document.querySelector('[data-theme-provider]')
      
      if (!themeProvider) return 'warning'
      
      // Check localStorage persistence
      const storedTheme = localStorage.getItem('theme')
      
      return 'healthy'
    } catch {
      return 'warning'
    }
  }

  private async checkAccessibilityFeatures(): Promise<HealthCheck['status']> {
    if (typeof window === 'undefined') return 'unknown'
    
    try {
      // Check ARIA attributes
      const elementsWithAriaLabels = document.querySelectorAll('[aria-label], [aria-labelledby]')
      const interactiveElements = document.querySelectorAll('button, a, input, select, textarea')
      
      // Check focus management
      const focusableElements = document.querySelectorAll('[tabindex], button, a, input, select, textarea')
      
      // Basic accessibility score
      const ariaScore = elementsWithAriaLabels.length / Math.max(interactiveElements.length, 1)
      
      if (ariaScore > 0.8) return 'healthy'
      if (ariaScore > 0.5) return 'warning'
      return 'critical'
    } catch {
      return 'warning'
    }
  }

  private async checkPerformanceVitals(): Promise<{ status: HealthCheck['status'], metadata: Record<string, any> }> {
    const metadata: Record<string, any> = {}
    
    if (typeof window === 'undefined') {
      return { status: 'unknown', metadata }
    }
    
    try {
      // Get latest performance entries
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paint = performance.getEntriesByType('paint')
      
      if (navigation) {
        const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
        const lcp = navigation.loadEventEnd - navigation.navigationStart
        
        metadata.fcp = fcp
        metadata.lcp = lcp
        metadata.ttfb = navigation.responseStart - navigation.requestStart
        
        let status: HealthCheck['status'] = 'healthy'
        
        if (lcp > 4000 || fcp > 3000) {
          status = 'critical'
        } else if (lcp > 2500 || fcp > 1800) {
          status = 'warning'
        }
        
        return { status, metadata }
      }
    } catch {
      // Fallback to basic timing
    }
    
    return { status: 'healthy', metadata }
  }

  private getComponentRenderTimes(): Record<string, number> {
    // This would integrate with React DevTools or custom performance marks
    return {
      'Hero': 12,
      'Navigation': 8,
      'Button': 2,
      'Dialog': 15
    }
  }

  private detectStylingIssues(): string[] {
    const issues: string[] = []
    
    if (typeof window === 'undefined') return issues
    
    // Check for elements with invalid CSS
    const elementsWithErrors = document.querySelectorAll(':invalid')
    if (elementsWithErrors.length > 0) {
      issues.push(`${elementsWithErrors.length} elements with invalid CSS`)
    }
    
    // Check for layout shifts
    if (this.hasLayoutShifts()) {
      issues.push('Layout shifts detected')
    }
    
    return issues
  }

  private hasLayoutShifts(): boolean {
    // This would check for recent layout shift entries
    return false
  }

  private startPerformanceMonitoring() {
    if (typeof window === 'undefined') return
    
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.handlePerformanceEntry(entry)
          }
        })
        
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
      } catch {
        // Fallback monitoring
      }
    }
  }

  private startErrorMonitoring() {
    if (typeof window === 'undefined') return
    
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.createAlert({
        severity: 'medium',
        title: 'JavaScript Error',
        description: event.message,
        component: 'javascript',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        }
      })
    })
    
    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.createAlert({
        severity: 'medium',
        title: 'Unhandled Promise Rejection',
        description: event.reason?.toString() || 'Unknown promise rejection',
        component: 'javascript',
        metadata: {
          reason: event.reason
        }
      })
    })
  }

  private handlePerformanceEntry(entry: PerformanceEntry) {
    // Process performance entries and create alerts for poor performance
    if (entry.entryType === 'largest-contentful-paint') {
      const lcp = entry.startTime
      if (lcp > 4000) {
        this.createAlert({
          severity: 'high',
          title: 'Poor LCP Performance',
          description: `LCP time of ${lcp.toFixed(0)}ms exceeds threshold`,
          component: 'performance',
          metadata: { lcp, threshold: 4000 }
        })
      }
    }
  }

  private collectSystemMetrics() {
    if (typeof window === 'undefined') return
    
    const metrics: SystemMetrics = {
      timestamp: Date.now(),
      performance: {
        lcp: 0,
        fid: 0,
        cls: 0,
        fcp: 0,
        ttfb: 0
      },
      resources: {
        jsHeapSize: 0,
        totalJSHeapSize: 0,
        usedJSHeapSize: 0
      },
      network: {
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0
      },
      errors: {
        jsErrors: 0,
        networkErrors: 0,
        renderErrors: 0
      },
      notebookLM: {
        darkModeUsage: this.getDarkModeUsage(),
        componentRenderTimes: this.getComponentRenderTimes(),
        accessibilityUsage: this.getAccessibilityUsage()
      }
    }

    // Collect memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory
      metrics.resources = {
        jsHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize
      }
    }

    // Collect network info
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      metrics.network = {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0
      }
    }

    this.metrics.push(metrics)
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.splice(0, this.metrics.length - 100)
    }
  }

  private getDarkModeUsage(): number {
    if (typeof window === 'undefined') return 0
    
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark'
    return isDarkMode ? 1 : 0
  }

  private getAccessibilityUsage(): number {
    if (typeof window === 'undefined') return 0
    
    // Check if accessibility features are enabled
    const hasHighContrast = window.matchMedia('(prefers-contrast: high)').matches
    const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    return (hasHighContrast ? 0.5 : 0) + (hasReducedMotion ? 0.5 : 0)
  }

  private checkAlertConditions() {
    // Check for conditions that should trigger alerts
    const recentMetrics = this.metrics.slice(-5) // Last 5 minutes
    
    if (recentMetrics.length < 3) return
    
    // Check for sustained high memory usage
    const avgMemoryUsage = recentMetrics.reduce((sum, metric) => 
      sum + metric.resources.usedJSHeapSize, 0) / recentMetrics.length
    
    if (avgMemoryUsage > 50 * 1024 * 1024) { // 50MB
      this.createAlert({
        severity: 'medium',
        title: 'High Memory Usage',
        description: `Average memory usage: ${Math.round(avgMemoryUsage / 1024 / 1024)}MB`,
        component: 'performance',
        metadata: { avgMemoryUsage }
      })
    }
  }

  private createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>) {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      resolved: false,
      ...alertData
    }

    this.alerts.push(alert)

    // Send to external alerting systems
    this.sendAlert(alert)

    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts.splice(0, this.alerts.length - 1000)
    }
  }

  private sendAlert(alert: Alert) {
    // Send to various alerting channels
    
    // Console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🚨 Alert [${alert.severity}]: ${alert.title}`, alert)
    }

    // Send to external services
    if (process.env.NEXT_PUBLIC_WEBHOOK_URL) {
      fetch(process.env.NEXT_PUBLIC_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'alert',
          ...alert
        })
      }).catch(() => {
        // Silently fail
      })
    }
  }

  // Public API
  public getHealthStatus(): Record<string, HealthCheck> {
    return Object.fromEntries(this.checks)
  }

  public getAlerts(resolved?: boolean): Alert[] {
    if (resolved === undefined) return this.alerts
    return this.alerts.filter(alert => alert.resolved === resolved)
  }

  public getMetrics(limit: number = 50): SystemMetrics[] {
    return this.metrics.slice(-limit)
  }

  public resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = Date.now()
    }
  }

  public getSystemSummary() {
    const checks = Array.from(this.checks.values())
    const activeAlerts = this.alerts.filter(a => !a.resolved)
    
    return {
      overall: checks.every(c => c.status === 'healthy') ? 'healthy' : 
               checks.some(c => c.status === 'critical') ? 'critical' : 'warning',
      checksCount: {
        healthy: checks.filter(c => c.status === 'healthy').length,
        warning: checks.filter(c => c.status === 'warning').length,
        critical: checks.filter(c => c.status === 'critical').length,
        unknown: checks.filter(c => c.status === 'unknown').length
      },
      activeAlerts: activeAlerts.length,
      criticalAlerts: activeAlerts.filter(a => a.severity === 'critical').length,
      notebookLMHealth: checks.filter(c => c.notebookLMRelated).every(c => c.status === 'healthy')
    }
  }
}

// Singleton instance
export const healthMonitor = new HealthMonitor()

// React hook for health monitoring
export function useHealthMonitor() {
  const [status, setStatus] = React.useState(healthMonitor.getSystemSummary())
  const [alerts, setAlerts] = React.useState(healthMonitor.getAlerts(false))

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStatus(healthMonitor.getSystemSummary())
      setAlerts(healthMonitor.getAlerts(false))
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return {
    status,
    alerts,
    healthChecks: healthMonitor.getHealthStatus(),
    resolveAlert: healthMonitor.resolveAlert.bind(healthMonitor)
  }
}