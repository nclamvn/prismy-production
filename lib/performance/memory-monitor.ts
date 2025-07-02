// Memory Leak Detection and Prevention System
// Advanced memory monitoring with leak detection and automatic cleanup

import { performanceMonitor } from './advanced-monitor'

// Memory monitoring interfaces
export interface MemorySnapshot {
  id: string
  timestamp: Date
  heapUsed: number
  heapTotal: number
  external: number
  rss?: number
  arrayBuffers?: number
  stackTrace?: string[]
  componentCounts?: Map<string, number>
  eventListenerCounts?: Map<string, number>
  observerCounts?: Map<string, number>
}

export interface MemoryLeak {
  id: string
  type: 'component' | 'listener' | 'observer' | 'closure' | 'timeout' | 'memory'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  firstDetected: Date
  lastDetected: Date
  growthRate: number // bytes per second
  affectedComponents: string[]
  stackTrace?: string[]
  recommendations: string[]
  autoFixAttempted: boolean
  autoFixSuccessful?: boolean
}

export interface MemoryThresholds {
  heapWarning: number // bytes
  heapError: number // bytes
  growthRateWarning: number // bytes per minute
  componentCountWarning: number
  listenerCountWarning: number
  snapshotInterval: number // milliseconds
  retentionPeriod: number // milliseconds
}

export interface CleanupAction {
  id: string
  type:
    | 'removeListener'
    | 'disconnectObserver'
    | 'clearTimeout'
    | 'forceGC'
    | 'componentCleanup'
  target: string
  executed: boolean
  successful?: boolean
  timestamp: Date
  impact?: number // bytes freed
}

// Default memory thresholds
const DEFAULT_THRESHOLDS: MemoryThresholds = {
  heapWarning: 50 * 1024 * 1024, // 50MB
  heapError: 100 * 1024 * 1024, // 100MB
  growthRateWarning: 1024 * 1024, // 1MB per minute
  componentCountWarning: 1000,
  listenerCountWarning: 500,
  snapshotInterval: 10000, // 10 seconds
  retentionPeriod: 60 * 60 * 1000, // 1 hour
}

// Memory Monitor Class
export class MemoryMonitor {
  private snapshots: MemorySnapshot[] = []
  private detectedLeaks: Map<string, MemoryLeak> = new Map()
  private cleanupActions: CleanupAction[] = []
  private thresholds: MemoryThresholds
  private isMonitoring = false
  private snapshotInterval?: NodeJS.Timeout
  private componentRegistry: Map<string, WeakRef<any>> = new Map()
  private listenerRegistry: Map<
    string,
    { target: any; type: string; listener: any }
  > = new Map()
  private observerRegistry: Map<string, any> = new Map()
  private timeoutRegistry: Set<NodeJS.Timeout> = new Set()
  private intervalRegistry: Set<NodeJS.Timeout> = new Set()
  private onLeakDetected?: (leak: MemoryLeak) => void
  private onThresholdExceeded?: (
    threshold: keyof MemoryThresholds,
    value: number
  ) => void

  constructor(thresholds: Partial<MemoryThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds }
    this.setupLeakDetection()
  }

  // Start memory monitoring
  public startMonitoring(
    options: {
      onLeakDetected?: (leak: MemoryLeak) => void
      onThresholdExceeded?: (
        threshold: keyof MemoryThresholds,
        value: number
      ) => void
    } = {}
  ): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.onLeakDetected = options.onLeakDetected
    this.onThresholdExceeded = options.onThresholdExceeded

    // Take initial snapshot
    this.takeSnapshot()

    // Start periodic monitoring
    this.snapshotInterval = setInterval(() => {
      this.takeSnapshot()
      this.analyzeMemoryUsage()
      this.detectLeaks()
      this.performAutomaticCleanup()
    }, this.thresholds.snapshotInterval)

    // Hook into global objects for tracking
    this.instrumentGlobalObjects()

    console.log('🔍 Memory monitoring started')
  }

  // Stop memory monitoring
  public stopMonitoring(): void {
    if (!this.isMonitoring) return

    this.isMonitoring = false

    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval)
      this.snapshotInterval = undefined
    }

    this.cleanup()
    console.log('🛑 Memory monitoring stopped')
  }

  // Take memory snapshot
  public takeSnapshot(): MemorySnapshot {
    const snapshot: MemorySnapshot = {
      id: `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      heapUsed: this.getHeapUsed(),
      heapTotal: this.getHeapTotal(),
      external: this.getExternalMemory(),
      rss: this.getRSS(),
      arrayBuffers: this.getArrayBufferMemory(),
      stackTrace: this.captureStackTrace(),
      componentCounts: this.getComponentCounts(),
      eventListenerCounts: this.getEventListenerCounts(),
      observerCounts: this.getObserverCounts(),
    }

    this.snapshots.push(snapshot)

    // Keep only recent snapshots
    const cutoff = Date.now() - this.thresholds.retentionPeriod
    this.snapshots = this.snapshots.filter(s => s.timestamp.getTime() > cutoff)

    return snapshot
  }

  // Register component for tracking
  public registerComponent(id: string, component: any): void {
    this.componentRegistry.set(id, new WeakRef(component))
  }

  // Unregister component
  public unregisterComponent(id: string): void {
    this.componentRegistry.delete(id)
  }

  // Register event listener for tracking
  public registerEventListener(
    id: string,
    target: any,
    type: string,
    listener: any
  ): void {
    this.listenerRegistry.set(id, { target, type, listener })
  }

  // Unregister event listener
  public unregisterEventListener(id: string): void {
    const entry = this.listenerRegistry.get(id)
    if (entry) {
      try {
        entry.target.removeEventListener(entry.type, entry.listener)
        this.listenerRegistry.delete(id)
      } catch (error) {
        console.warn('Failed to remove event listener:', error)
      }
    }
  }

  // Register observer for tracking
  public registerObserver(id: string, observer: any): void {
    this.observerRegistry.set(id, observer)
  }

  // Unregister observer
  public unregisterObserver(id: string): void {
    const observer = this.observerRegistry.get(id)
    if (observer) {
      try {
        if (typeof observer.disconnect === 'function') {
          observer.disconnect()
        }
        this.observerRegistry.delete(id)
      } catch (error) {
        console.warn('Failed to disconnect observer:', error)
      }
    }
  }

  // Register timeout for tracking
  public registerTimeout(timeout: NodeJS.Timeout): void {
    this.timeoutRegistry.add(timeout)
  }

  // Register interval for tracking
  public registerInterval(interval: NodeJS.Timeout): void {
    this.intervalRegistry.add(interval)
  }

  // Force garbage collection (if available)
  public forceGarbageCollection(): boolean {
    if (
      typeof window !== 'undefined' &&
      'gc' in window &&
      typeof (window as any).gc === 'function'
    ) {
      try {
        ;(window as any).gc()
        return true
      } catch (error) {
        console.warn('Failed to force garbage collection:', error)
        return false
      }
    }
    return false
  }

  // Get memory usage summary
  public getMemoryUsage(): {
    current: MemorySnapshot
    peak: MemorySnapshot | null
    trend: 'stable' | 'increasing' | 'decreasing'
    growthRate: number
    leakCount: number
  } {
    const current = this.snapshots[this.snapshots.length - 1]
    const peak = this.snapshots.reduce(
      (max, snapshot) =>
        snapshot.heapUsed > (max?.heapUsed || 0) ? snapshot : max,
      null as MemorySnapshot | null
    )

    const trend = this.calculateMemoryTrend()
    const growthRate = this.calculateGrowthRate()

    return {
      current,
      peak,
      trend,
      growthRate,
      leakCount: this.detectedLeaks.size,
    }
  }

  // Get detected leaks
  public getDetectedLeaks(): MemoryLeak[] {
    return Array.from(this.detectedLeaks.values()).sort((a, b) => {
      // Sort by severity, then by growth rate
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
      if (severityDiff !== 0) return severityDiff
      return b.growthRate - a.growthRate
    })
  }

  // Get cleanup history
  public getCleanupHistory(): CleanupAction[] {
    return [...this.cleanupActions].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    )
  }

  // Manual cleanup
  public performManualCleanup(): {
    actionsPerformed: number
    memoryFreed: number
    errors: string[]
  } {
    const actionsPerformed = this.performAutomaticCleanup()
    const memoryBefore = this.getHeapUsed()

    // Force garbage collection
    this.forceGarbageCollection()

    const memoryAfter = this.getHeapUsed()
    const memoryFreed = Math.max(0, memoryBefore - memoryAfter)

    const errors = this.cleanupActions
      .filter(action => !action.successful)
      .map(action => `Failed to ${action.type} for ${action.target}`)

    return {
      actionsPerformed,
      memoryFreed,
      errors,
    }
  }

  // Export memory data
  public exportMemoryData(): {
    snapshots: MemorySnapshot[]
    leaks: MemoryLeak[]
    cleanupActions: CleanupAction[]
    thresholds: MemoryThresholds
    summary: any
  } {
    return {
      snapshots: this.snapshots,
      leaks: Array.from(this.detectedLeaks.values()),
      cleanupActions: this.cleanupActions,
      thresholds: this.thresholds,
      summary: this.getMemoryUsage(),
    }
  }

  // Private methods
  private setupLeakDetection(): void {
    // Set up FinalizationRegistry for detecting unreleased objects
    if (typeof FinalizationRegistry !== 'undefined') {
      const registry = new FinalizationRegistry((id: string) => {
        // Object was garbage collected
        this.handleObjectFinalization(id)
      })

      // Store registry for later use
      ;(this as any).finalizationRegistry = registry
    }
  }

  private instrumentGlobalObjects(): void {
    if (typeof window === 'undefined') return

    // Hook setTimeout
    const originalSetTimeout = window.setTimeout
    window.setTimeout = (...args: any[]) => {
      const timeout = originalSetTimeout.apply(window, args)
      this.registerTimeout(timeout)
      return timeout
    }

    // Hook setInterval
    const originalSetInterval = window.setInterval
    window.setInterval = (...args: any[]) => {
      const interval = originalSetInterval.apply(window, args)
      this.registerInterval(interval)
      return interval
    }

    // Hook addEventListener
    const originalAddEventListener = EventTarget.prototype.addEventListener
    EventTarget.prototype.addEventListener = function (
      type: string,
      listener: any,
      options?: any
    ) {
      const listenerId = `listener-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      memoryMonitor.registerEventListener(listenerId, this, type, listener)
      return originalAddEventListener.call(this, type, listener, options)
    }
  }

  private analyzeMemoryUsage(): void {
    const current = this.snapshots[this.snapshots.length - 1]
    if (!current) return

    // Check thresholds
    if (current.heapUsed > this.thresholds.heapError) {
      this.onThresholdExceeded?.('heapError', current.heapUsed)
    } else if (current.heapUsed > this.thresholds.heapWarning) {
      this.onThresholdExceeded?.('heapWarning', current.heapUsed)
    }

    // Check growth rate
    const growthRate = this.calculateGrowthRate()
    if (growthRate > this.thresholds.growthRateWarning) {
      this.onThresholdExceeded?.('growthRateWarning', growthRate)
    }

    // Record performance metrics
    performanceMonitor.recordMetric({
      id: `memory-usage-${Date.now()}`,
      name: 'Heap Used',
      value: current.heapUsed,
      unit: 'bytes',
      category: 'memory',
      severity: current.heapUsed > this.thresholds.heapWarning ? 'high' : 'low',
    })
  }

  private detectLeaks(): void {
    if (this.snapshots.length < 5) return // Need enough data

    // Detect memory leaks
    this.detectMemoryGrowthLeaks()
    this.detectComponentLeaks()
    this.detectListenerLeaks()
    this.detectObserverLeaks()
  }

  private detectMemoryGrowthLeaks(): void {
    const recent = this.snapshots.slice(-5)
    const growthRate = this.calculateGrowthRateFromSnapshots(recent)

    if (growthRate > this.thresholds.growthRateWarning) {
      const leakId = 'memory-growth-leak'
      const existingLeak = this.detectedLeaks.get(leakId)

      if (existingLeak) {
        existingLeak.lastDetected = new Date()
        existingLeak.growthRate = growthRate
      } else {
        const leak: MemoryLeak = {
          id: leakId,
          type: 'memory',
          severity:
            growthRate > this.thresholds.growthRateWarning * 2
              ? 'high'
              : 'medium',
          description: `Memory usage growing at ${(growthRate / 1024).toFixed(1)} KB/minute`,
          firstDetected: new Date(),
          lastDetected: new Date(),
          growthRate,
          affectedComponents: [],
          recommendations: [
            'Check for memory leaks in components',
            'Review event listener cleanup',
            'Consider forcing garbage collection',
          ],
          autoFixAttempted: false,
        }

        this.detectedLeaks.set(leakId, leak)
        this.onLeakDetected?.(leak)
      }
    }
  }

  private detectComponentLeaks(): void {
    const componentCounts = this.getComponentCounts()
    const totalComponents = Array.from(componentCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    )

    if (totalComponents > this.thresholds.componentCountWarning) {
      const leakId = 'component-count-leak'
      const existingLeak = this.detectedLeaks.get(leakId)

      if (!existingLeak) {
        const leak: MemoryLeak = {
          id: leakId,
          type: 'component',
          severity: 'medium',
          description: `High component count: ${totalComponents}`,
          firstDetected: new Date(),
          lastDetected: new Date(),
          growthRate: 0,
          affectedComponents: Array.from(componentCounts.keys()),
          recommendations: [
            'Review component cleanup on unmount',
            'Check for memory leaks in component state',
            'Consider component pooling',
          ],
          autoFixAttempted: false,
        }

        this.detectedLeaks.set(leakId, leak)
        this.onLeakDetected?.(leak)
      }
    }
  }

  private detectListenerLeaks(): void {
    const listenerCount = this.listenerRegistry.size

    if (listenerCount > this.thresholds.listenerCountWarning) {
      const leakId = 'listener-count-leak'
      const existingLeak = this.detectedLeaks.get(leakId)

      if (!existingLeak) {
        const leak: MemoryLeak = {
          id: leakId,
          type: 'listener',
          severity: 'medium',
          description: `High event listener count: ${listenerCount}`,
          firstDetected: new Date(),
          lastDetected: new Date(),
          growthRate: 0,
          affectedComponents: [],
          recommendations: [
            'Remove event listeners on component unmount',
            'Use AbortController for automatic cleanup',
            'Review event delegation patterns',
          ],
          autoFixAttempted: false,
        }

        this.detectedLeaks.set(leakId, leak)
        this.onLeakDetected?.(leak)
      }
    }
  }

  private detectObserverLeaks(): void {
    const observerCount = this.observerRegistry.size

    if (observerCount > 100) {
      // Reasonable threshold for observers
      const leakId = 'observer-count-leak'
      const existingLeak = this.detectedLeaks.get(leakId)

      if (!existingLeak) {
        const leak: MemoryLeak = {
          id: leakId,
          type: 'observer',
          severity: 'medium',
          description: `High observer count: ${observerCount}`,
          firstDetected: new Date(),
          lastDetected: new Date(),
          growthRate: 0,
          affectedComponents: [],
          recommendations: [
            'Disconnect observers on component unmount',
            'Review IntersectionObserver usage',
            'Check ResizeObserver cleanup',
          ],
          autoFixAttempted: false,
        }

        this.detectedLeaks.set(leakId, leak)
        this.onLeakDetected?.(leak)
      }
    }
  }

  private performAutomaticCleanup(): number {
    let actionsPerformed = 0

    // Clean up dead component references
    this.componentRegistry.forEach((weakRef, id) => {
      if (weakRef.deref() === undefined) {
        this.componentRegistry.delete(id)
        actionsPerformed++
      }
    })

    // Clean up orphaned listeners
    const orphanedListeners: string[] = []
    this.listenerRegistry.forEach((entry, id) => {
      try {
        // Check if target still exists
        if (
          !entry.target ||
          entry.target.nodeType === Node.DOCUMENT_FRAGMENT_NODE
        ) {
          orphanedListeners.push(id)
        }
      } catch {
        orphanedListeners.push(id)
      }
    })

    orphanedListeners.forEach(id => {
      this.unregisterEventListener(id)
      actionsPerformed++
    })

    // Clean up completed timeouts
    const completedTimeouts: NodeJS.Timeout[] = []
    this.timeoutRegistry.forEach(timeout => {
      // In real implementation, you'd need a way to check if timeout completed
      // This is a simplified version
    })

    return actionsPerformed
  }

  private handleObjectFinalization(id: string): void {
    // Object was garbage collected
    console.log(`Object ${id} was garbage collected`)
  }

  private calculateMemoryTrend(): 'stable' | 'increasing' | 'decreasing' {
    if (this.snapshots.length < 3) return 'stable'

    const recent = this.snapshots.slice(-3)
    const trend = recent[2].heapUsed - recent[0].heapUsed
    const threshold = 1024 * 1024 // 1MB

    if (trend > threshold) return 'increasing'
    if (trend < -threshold) return 'decreasing'
    return 'stable'
  }

  private calculateGrowthRate(): number {
    if (this.snapshots.length < 2) return 0

    const recent = this.snapshots.slice(-2)
    const timeDiff =
      recent[1].timestamp.getTime() - recent[0].timestamp.getTime()
    const memoryDiff = recent[1].heapUsed - recent[0].heapUsed

    return timeDiff > 0 ? (memoryDiff / timeDiff) * 60000 : 0 // bytes per minute
  }

  private calculateGrowthRateFromSnapshots(
    snapshots: MemorySnapshot[]
  ): number {
    if (snapshots.length < 2) return 0

    const first = snapshots[0]
    const last = snapshots[snapshots.length - 1]
    const timeDiff = last.timestamp.getTime() - first.timestamp.getTime()
    const memoryDiff = last.heapUsed - first.heapUsed

    return timeDiff > 0 ? (memoryDiff / timeDiff) * 60000 : 0 // bytes per minute
  }

  private getHeapUsed(): number {
    if (
      typeof window !== 'undefined' &&
      'performance' in window &&
      'memory' in (performance as any)
    ) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }

  private getHeapTotal(): number {
    if (
      typeof window !== 'undefined' &&
      'performance' in window &&
      'memory' in (performance as any)
    ) {
      return (performance as any).memory.totalJSHeapSize
    }
    return 0
  }

  private getExternalMemory(): number {
    // Browser doesn't provide external memory info
    return 0
  }

  private getRSS(): number {
    // Browser doesn't provide RSS info
    return 0
  }

  private getArrayBufferMemory(): number {
    // Estimate ArrayBuffer usage (simplified)
    return 0
  }

  private captureStackTrace(): string[] {
    const stack = new Error().stack
    return stack ? stack.split('\n').slice(2, 10) : []
  }

  private getComponentCounts(): Map<string, number> {
    const counts = new Map<string, number>()

    this.componentRegistry.forEach((weakRef, id) => {
      const component = weakRef.deref()
      if (component) {
        const componentName = component.constructor?.name || 'Unknown'
        counts.set(componentName, (counts.get(componentName) || 0) + 1)
      }
    })

    return counts
  }

  private getEventListenerCounts(): Map<string, number> {
    const counts = new Map<string, number>()

    this.listenerRegistry.forEach(entry => {
      counts.set(entry.type, (counts.get(entry.type) || 0) + 1)
    })

    return counts
  }

  private getObserverCounts(): Map<string, number> {
    const counts = new Map<string, number>()

    this.observerRegistry.forEach(observer => {
      const observerType = observer.constructor?.name || 'Unknown'
      counts.set(observerType, (counts.get(observerType) || 0) + 1)
    })

    return counts
  }

  private cleanup(): void {
    // Clear all registries
    this.componentRegistry.clear()
    this.observerRegistry.forEach(observer => {
      try {
        if (typeof observer.disconnect === 'function') {
          observer.disconnect()
        }
      } catch (error) {
        console.warn('Failed to disconnect observer during cleanup:', error)
      }
    })
    this.observerRegistry.clear()

    // Clear timeouts and intervals
    this.timeoutRegistry.forEach(timeout => {
      try {
        clearTimeout(timeout)
      } catch (error) {
        console.warn('Failed to clear timeout during cleanup:', error)
      }
    })
    this.timeoutRegistry.clear()

    this.intervalRegistry.forEach(interval => {
      try {
        clearInterval(interval)
      } catch (error) {
        console.warn('Failed to clear interval during cleanup:', error)
      }
    })
    this.intervalRegistry.clear()
  }
}

// Singleton instance
export const memoryMonitor = new MemoryMonitor()

// React Hook for memory monitoring
export function useMemoryMonitor(
  options: {
    enabled?: boolean
    onLeakDetected?: (leak: MemoryLeak) => void
    thresholds?: Partial<MemoryThresholds>
  } = {}
) {
  const { enabled = true, onLeakDetected, thresholds } = options

  React.useEffect(() => {
    if (!enabled) return

    const monitor = new MemoryMonitor(thresholds)
    monitor.startMonitoring({ onLeakDetected })

    return () => {
      monitor.stopMonitoring()
    }
  }, [enabled, onLeakDetected, thresholds])

  return {
    takeSnapshot: () => memoryMonitor.takeSnapshot(),
    getMemoryUsage: () => memoryMonitor.getMemoryUsage(),
    getDetectedLeaks: () => memoryMonitor.getDetectedLeaks(),
    performCleanup: () => memoryMonitor.performManualCleanup(),
    forceGC: () => memoryMonitor.forceGarbageCollection(),
  }
}

// HOC for automatic memory tracking
export function withMemoryTracking<P extends object>(
  Component: React.ComponentType<P>,
  options: { id?: string } = {}
) {
  return React.forwardRef<any, P>((props, ref) => {
    const componentId =
      options.id || Component.displayName || Component.name || 'Unknown'

    React.useEffect(() => {
      const instance = { componentId, props, ref }
      memoryMonitor.registerComponent(componentId, instance)

      return () => {
        memoryMonitor.unregisterComponent(componentId)
      }
    }, [componentId])

    return React.createElement(Component, { ...props, ref })
  })
}

export default memoryMonitor
