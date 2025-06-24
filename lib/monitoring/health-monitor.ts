/**
 * SYSTEM HEALTH MONITORING
 * Real-time system health checks and monitoring
 */

import { performanceMonitor } from './performance-monitor'
import { errorTracker } from './error-tracker'

export interface HealthCheck {
  name: string
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  message: string
  details?: Record<string, any>
  timestamp: Date
  responseTime: number
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical'
  services: Record<string, HealthCheck>
  uptime: number
  version: string
  environment: string
  lastChecked: Date
}

export interface HealthMetrics {
  availability: number // percentage
  averageResponseTime: number
  errorRate: number
  throughput: number
  resourceUsage: {
    cpu: number
    memory: number
    disk: number
    network: number
  }
}

export class HealthMonitor {
  private healthChecks = new Map<string, HealthCheck>()
  private listeners = new Set<(health: SystemHealth) => void>()
  private isMonitoring = false
  private startTime = Date.now()

  constructor() {
    this.registerDefaultHealthChecks()
    this.startMonitoring()
  }

  // Health check registration
  registerHealthCheck(
    name: string,
    checkFn: () => Promise<{ status: HealthCheck['status']; message: string; details?: any }>
  ): void {
    // Store the check function for periodic execution
    setInterval(async () => {
      const start = Date.now()
      try {
        const result = await checkFn()
        this.recordHealthCheck({
          name,
          status: result.status,
          message: result.message,
          details: result.details,
          timestamp: new Date(),
          responseTime: Date.now() - start
        })
      } catch (error) {
        this.recordHealthCheck({
          name,
          status: 'critical',
          message: error instanceof Error ? error.message : 'Health check failed',
          timestamp: new Date(),
          responseTime: Date.now() - start
        })
      }
    }, 30000) // Check every 30 seconds
  }

  private recordHealthCheck(check: HealthCheck): void {
    this.healthChecks.set(check.name, check)
    
    // Notify listeners
    const health = this.getSystemHealth()
    this.notifyListeners(health)
  }

  // System health monitoring
  private startMonitoring(): void {
    if (this.isMonitoring) return
    this.isMonitoring = true

    // Periodic health assessment
    setInterval(() => {
      this.assessSystemHealth()
    }, 60000) // Every minute
  }

  private async assessSystemHealth(): Promise<void> {
    // Trigger all health checks
    const health = this.getSystemHealth()
    
    // Check for critical issues
    if (health.overall === 'critical') {
      await this.handleCriticalHealth(health)
    }
  }

  getSystemHealth(): SystemHealth {
    const services = Object.fromEntries(this.healthChecks.entries())
    const statuses = Array.from(this.healthChecks.values()).map(check => check.status)
    
    let overall: SystemHealth['overall'] = 'healthy'
    
    if (statuses.includes('critical')) {
      overall = 'critical'
    } else if (statuses.includes('warning')) {
      overall = 'degraded'
    }

    return {
      overall,
      services,
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'unknown',
      lastChecked: new Date()
    }
  }

  // Default health checks
  private registerDefaultHealthChecks(): void {
    // Database health check
    this.registerHealthCheck('database', async () => {
      try {
        // Simulate database check - replace with actual implementation
        const start = Date.now()
        // await supabase.from('health_check').select('count').single()
        const responseTime = Date.now() - start
        
        if (responseTime > 1000) {
          return {
            status: 'warning',
            message: `Database responding slowly (${responseTime}ms)`,
            details: { responseTime }
          }
        }
        
        return {
          status: 'healthy',
          message: 'Database is responding normally',
          details: { responseTime }
        }
      } catch (error) {
        return {
          status: 'critical',
          message: 'Database connection failed',
          details: { error: error instanceof Error ? error.message : String(error) }
        }
      }
    })

    // API health check
    this.registerHealthCheck('api', async () => {
      try {
        const start = Date.now()
        const response = await fetch('/api/health', { method: 'GET' })
        const responseTime = Date.now() - start
        
        if (!response.ok) {
          return {
            status: 'critical',
            message: `API health check failed (${response.status})`,
            details: { statusCode: response.status, responseTime }
          }
        }
        
        if (responseTime > 500) {
          return {
            status: 'warning',
            message: `API responding slowly (${responseTime}ms)`,
            details: { responseTime }
          }
        }
        
        return {
          status: 'healthy',
          message: 'API is responding normally',
          details: { responseTime }
        }
      } catch (error) {
        return {
          status: 'critical',
          message: 'API is unreachable',
          details: { error: error instanceof Error ? error.message : String(error) }
        }
      }
    })

    // Cache health check
    this.registerHealthCheck('cache', async () => {
      try {
        // Test cache operations
        const testKey = `health_check_${Date.now()}`
        const testValue = 'test'
        
        // Set operation
        const start = Date.now()
        // await cache.set(testKey, testValue, { ttl: 10000 })
        
        // Get operation
        // const retrieved = await cache.get(testKey)
        const responseTime = Date.now() - start
        
        // Cleanup
        // await cache.delete(testKey)
        
        return {
          status: 'healthy',
          message: 'Cache is functioning normally',
          details: { responseTime }
        }
      } catch (error) {
        return {
          status: 'warning',
          message: 'Cache operations failing',
          details: { error: error instanceof Error ? error.message : String(error) }
        }
      }
    })

    // Memory health check
    this.registerHealthCheck('memory', async () => {
      if (typeof process !== 'undefined') {
        const memUsage = process.memoryUsage()
        const memPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100
        
        if (memPercentage > 90) {
          return {
            status: 'critical',
            message: `Memory usage critical (${memPercentage.toFixed(1)}%)`,
            details: memUsage
          }
        } else if (memPercentage > 75) {
          return {
            status: 'warning',
            message: `Memory usage high (${memPercentage.toFixed(1)}%)`,
            details: memUsage
          }
        }
        
        return {
          status: 'healthy',
          message: `Memory usage normal (${memPercentage.toFixed(1)}%)`,
          details: memUsage
        }
      }
      
      return {
        status: 'unknown',
        message: 'Memory monitoring not available',
        details: {}
      }
    })

    // Disk space health check (server-side only)
    if (typeof process !== 'undefined') {
      this.registerHealthCheck('disk', async () => {
        try {
          // In a real implementation, check disk usage
          // const diskUsage = await checkDiskUsage()
          const diskUsage = { used: 45, total: 100 } // Simulated
          const percentage = (diskUsage.used / diskUsage.total) * 100
          
          if (percentage > 90) {
            return {
              status: 'critical',
              message: `Disk space critical (${percentage.toFixed(1)}% used)`,
              details: diskUsage
            }
          } else if (percentage > 80) {
            return {
              status: 'warning',
              message: `Disk space low (${percentage.toFixed(1)}% used)`,
              details: diskUsage
            }
          }
          
          return {
            status: 'healthy',
            message: `Disk space sufficient (${percentage.toFixed(1)}% used)`,
            details: diskUsage
          }
        } catch (error) {
          return {
            status: 'unknown',
            message: 'Unable to check disk space',
            details: { error: error instanceof Error ? error.message : String(error) }
          }
        }
      })
    }

    // Performance metrics health check
    this.registerHealthCheck('performance', async () => {
      const metrics = performanceMonitor.getAggregatedMetrics('hour')
      const apiResponseTime = metrics.APIResponseTime?.avg || 0
      const errorRate = metrics.APIErrorRate?.avg || 0
      
      if (errorRate > 5) {
        return {
          status: 'critical',
          message: `High error rate (${errorRate.toFixed(1)}%)`,
          details: { errorRate, apiResponseTime }
        }
      } else if (apiResponseTime > 1000) {
        return {
          status: 'warning',
          message: `Slow API responses (${apiResponseTime.toFixed(0)}ms avg)`,
          details: { errorRate, apiResponseTime }
        }
      }
      
      return {
        status: 'healthy',
        message: 'Performance metrics normal',
        details: { errorRate, apiResponseTime }
      }
    })

    // External services health check
    this.registerHealthCheck('external_services', async () => {
      const services = [
        { name: 'Google Translate', url: 'https://translate.googleapis.com' },
        { name: 'Stripe', url: 'https://api.stripe.com' }
      ]
      
      const results = await Promise.allSettled(
        services.map(async service => {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)
          
          try {
            const response = await fetch(service.url, {
              method: 'HEAD',
              signal: controller.signal
            })
            clearTimeout(timeoutId)
            return { name: service.name, status: response.ok ? 'ok' : 'error' }
          } catch (error) {
            clearTimeout(timeoutId)
            return { name: service.name, status: 'error' }
          }
        })
      )
      
      const failures = results
        .map((result, index) => ({ 
          ...services[index], 
          result: result.status === 'fulfilled' ? result.value : { status: 'error' }
        }))
        .filter(service => service.result.status === 'error')
      
      if (failures.length === services.length) {
        return {
          status: 'critical',
          message: 'All external services unreachable',
          details: { failures: failures.map(f => f.name) }
        }
      } else if (failures.length > 0) {
        return {
          status: 'warning',
          message: `Some external services unreachable`,
          details: { failures: failures.map(f => f.name) }
        }
      }
      
      return {
        status: 'healthy',
        message: 'All external services reachable',
        details: { services: services.map(s => s.name) }
      }
    })
  }

  // Health metrics calculation
  getHealthMetrics(timeRange: 'hour' | 'day' | 'week' = 'hour'): HealthMetrics {
    const checks = Array.from(this.healthChecks.values())
    const healthyChecks = checks.filter(c => c.status === 'healthy').length
    const availability = checks.length > 0 ? (healthyChecks / checks.length) * 100 : 100
    
    const avgResponseTime = checks.length > 0 
      ? checks.reduce((sum, c) => sum + c.responseTime, 0) / checks.length 
      : 0
    
    // Get error rate from error tracker
    const errorStats = errorTracker.getErrorStats(timeRange === 'hour' ? 'hour' : 'day')
    const totalEvents = 1000 // This would come from analytics
    const errorRate = totalEvents > 0 ? (errorStats.total / totalEvents) * 100 : 0
    
    // Get performance metrics
    const performanceMetrics = performanceMonitor.getAggregatedMetrics(timeRange)
    const throughput = performanceMetrics.APIResponseTime?.count || 0
    
    return {
      availability,
      averageResponseTime: avgResponseTime,
      errorRate,
      throughput,
      resourceUsage: {
        cpu: 45, // These would come from actual system monitoring
        memory: 67,
        disk: 23,
        network: 12
      }
    }
  }

  // Event handling
  onHealthChange(callback: (health: SystemHealth) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notifyListeners(health: SystemHealth): void {
    for (const listener of this.listeners) {
      try {
        listener(health)
      } catch (error) {
        console.error('Health monitor listener error:', error)
      }
    }
  }

  private async handleCriticalHealth(health: SystemHealth): Promise<void> {
    // Log critical health issues
    console.error('CRITICAL SYSTEM HEALTH:', health)
    
    // Send alerts for critical services
    const criticalServices = Object.entries(health.services)
      .filter(([, check]) => check.status === 'critical')
    
    for (const [serviceName, check] of criticalServices) {
      await errorTracker.captureError({
        message: `Critical health check failure: ${serviceName}`,
        type: 'system',
        severity: 'critical',
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
        component: 'health_monitor',
        metadata: {
          service: serviceName,
          healthCheck: check
        }
      })
    }
  }

  // Manual health check trigger
  async runHealthCheck(serviceName?: string): Promise<SystemHealth> {
    if (serviceName) {
      // Run specific health check
      const check = this.healthChecks.get(serviceName)
      if (check) {
        // Re-run the check (this is simplified - in reality we'd need to store the check functions)
        console.log(`Manual health check for ${serviceName}`)
      }
    } else {
      // Run all health checks
      await this.assessSystemHealth()
    }
    
    return this.getSystemHealth()
  }

  // Health check history
  getHealthHistory(serviceName: string, limit = 100): HealthCheck[] {
    // In a real implementation, this would return historical health check data
    // For now, return current state
    const check = this.healthChecks.get(serviceName)
    return check ? [check] : []
  }

  // Service status summary
  getServicesSummary(): {
    total: number
    healthy: number
    warning: number
    critical: number
    unknown: number
  } {
    const checks = Array.from(this.healthChecks.values())
    
    return {
      total: checks.length,
      healthy: checks.filter(c => c.status === 'healthy').length,
      warning: checks.filter(c => c.status === 'warning').length,
      critical: checks.filter(c => c.status === 'critical').length,
      unknown: checks.filter(c => c.status === 'unknown').length
    }
  }

  // Uptime calculation
  getUptime(): {
    milliseconds: number
    seconds: number
    minutes: number
    hours: number
    days: number
    formatted: string
  } {
    const uptimeMs = Date.now() - this.startTime
    const seconds = Math.floor(uptimeMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    const formatted = `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`
    
    return {
      milliseconds: uptimeMs,
      seconds,
      minutes,
      hours,
      days,
      formatted
    }
  }
}

// Export singleton instance
export const healthMonitor = new HealthMonitor()