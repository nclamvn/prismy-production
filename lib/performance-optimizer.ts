// Performance optimization utilities for complex AI features

// Memory management
export class MemoryOptimizer {
  private static memoryUsage = new Map<string, number>()
  private static memoryThreshold = 100 * 1024 * 1024 // 100MB

  static trackMemoryUsage(componentId: string, size: number) {
    this.memoryUsage.set(componentId, size)

    if (this.getTotalMemoryUsage() > this.memoryThreshold) {
      this.optimizeMemory()
    }
  }

  static getTotalMemoryUsage(): number {
    return Array.from(this.memoryUsage.values()).reduce(
      (total, size) => total + size,
      0
    )
  }

  static optimizeMemory() {
    // Clear unused components
    const sortedComponents = Array.from(this.memoryUsage.entries()).sort(
      ([, a], [, b]) => b - a
    )

    // Remove largest memory consumers that aren't currently active
    sortedComponents.slice(5).forEach(([componentId]) => {
      this.memoryUsage.delete(componentId)
    })

    // Trigger garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      ;(window as any).gc()
    }
  }

  static clearComponent(componentId: string) {
    this.memoryUsage.delete(componentId)
  }
}

// Frame rate optimization
export class FrameRateOptimizer {
  private static rafCallbacks = new Set<() => void>()
  private static isRunning = false
  private static lastFrameTime = 0
  private static frameCount = 0
  private static fps = 60

  static addCallback(callback: () => void) {
    this.rafCallbacks.add(callback)
    this.startLoop()
  }

  static removeCallback(callback: () => void) {
    this.rafCallbacks.delete(callback)
    if (this.rafCallbacks.size === 0) {
      this.stopLoop()
    }
  }

  private static startLoop() {
    if (this.isRunning) return
    this.isRunning = true
    this.animate()
  }

  private static stopLoop() {
    this.isRunning = false
  }

  private static animate() {
    if (!this.isRunning) return

    const now = performance.now()
    const deltaTime = now - this.lastFrameTime

    // Calculate FPS
    this.frameCount++
    if (this.frameCount % 60 === 0) {
      this.fps = Math.round(1000 / (deltaTime / 60))
    }

    // Only update if frame rate is acceptable
    if (deltaTime >= 16.67) {
      // 60fps target
      this.rafCallbacks.forEach(callback => {
        try {
          callback()
        } catch (error) {
          console.error('RAF callback error:', error)
        }
      })
      this.lastFrameTime = now
    }

    requestAnimationFrame(() => this.animate())
  }

  static getFPS(): number {
    return this.fps
  }
}

// Resource loading optimization
export class ResourceOptimizer {
  private static loadedResources = new Map<string, any>()
  private static loadingPromises = new Map<string, Promise<any>>()

  static async loadResource<T>(
    key: string,
    loader: () => Promise<T>
  ): Promise<T> {
    // Return cached resource if available
    if (this.loadedResources.has(key)) {
      return this.loadedResources.get(key)
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)
    }

    // Start new loading process
    const promise = loader()
      .then(resource => {
        this.loadedResources.set(key, resource)
        this.loadingPromises.delete(key)
        return resource
      })
      .catch(error => {
        this.loadingPromises.delete(key)
        throw error
      })

    this.loadingPromises.set(key, promise)
    return promise
  }

  static preloadResource<T>(key: string, loader: () => Promise<T>) {
    // Start loading in background
    setTimeout(() => {
      this.loadResource(key, loader).catch(console.error)
    }, 100)
  }

  static clearCache() {
    this.loadedResources.clear()
    this.loadingPromises.clear()
  }
}

// Debouncing for expensive operations
export class OperationOptimizer {
  private static debounceTimers = new Map<string, NodeJS.Timeout>()
  private static throttleLastRun = new Map<string, number>()

  static debounce<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const existingTimer = this.debounceTimers.get(key)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      const timer = setTimeout(() => {
        fn(...args)
        this.debounceTimers.delete(key)
      }, delay)

      this.debounceTimers.set(key, timer)
    }
  }

  static throttle<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const lastRun = this.throttleLastRun.get(key) || 0
      const now = Date.now()

      if (now - lastRun >= limit) {
        fn(...args)
        this.throttleLastRun.set(key, now)
      }
    }
  }
}

// Virtual scrolling for large lists
export class VirtualScrollOptimizer {
  static calculateVisibleItems(
    scrollTop: number,
    containerHeight: number,
    itemHeight: number,
    totalItems: number,
    overscan: number = 5
  ) {
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan
    )
    const endIndex = Math.min(
      totalItems - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )

    return {
      startIndex,
      endIndex,
      visibleItems: endIndex - startIndex + 1,
    }
  }

  static getItemStyle(index: number, itemHeight: number) {
    return {
      position: 'absolute' as const,
      top: index * itemHeight,
      height: itemHeight,
      width: '100%',
    }
  }
}

// Canvas optimization
export class CanvasOptimizer {
  private static canvasPool = new Map<string, HTMLCanvasElement[]>()

  static getCanvas(
    width: number,
    height: number,
    poolKey?: string
  ): HTMLCanvasElement {
    const key = poolKey || `${width}x${height}`
    const pool = this.canvasPool.get(key) || []

    let canvas = pool.pop()
    if (!canvas) {
      canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
    }

    return canvas
  }

  static returnCanvas(canvas: HTMLCanvasElement, poolKey?: string) {
    const key = poolKey || `${canvas.width}x${canvas.height}`
    const pool = this.canvasPool.get(key) || []

    // Clear canvas
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    // Limit pool size
    if (pool.length < 10) {
      pool.push(canvas)
      this.canvasPool.set(key, pool)
    }
  }

  static optimizeCanvasContext(ctx: CanvasRenderingContext2D) {
    // Disable image smoothing for better performance when not needed
    ctx.imageSmoothingEnabled = false

    // Use will-change CSS property on parent element
    const canvas = ctx.canvas
    if (canvas.parentElement) {
      canvas.parentElement.style.willChange = 'transform'
    }
  }
}

// Battery and performance monitoring
export class PerformanceMonitor {
  private static metrics = {
    frameRate: 60,
    memoryUsage: 0,
    batteryLevel: 1,
    isLowPowerMode: false,
  }

  static async initialize() {
    // Monitor battery if available
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery()
        this.metrics.batteryLevel = battery.level

        battery.addEventListener('levelchange', () => {
          this.metrics.batteryLevel = battery.level
          this.metrics.isLowPowerMode = battery.level < 0.2
        })
      } catch (error) {
        console.warn('Battery API not available:', error)
      }
    }

    // Monitor memory if available
    if ('memory' in performance) {
      const updateMemory = () => {
        const memory = (performance as any).memory
        this.metrics.memoryUsage =
          memory.usedJSHeapSize / memory.totalJSHeapSize
      }

      setInterval(updateMemory, 5000)
      updateMemory()
    }

    // Monitor frame rate
    FrameRateOptimizer.addCallback(() => {
      this.metrics.frameRate = FrameRateOptimizer.getFPS()
    })
  }

  static getPerformanceLevel(): 'high' | 'medium' | 'low' {
    if (this.metrics.isLowPowerMode || this.metrics.batteryLevel < 0.2) {
      return 'low'
    }

    if (this.metrics.frameRate < 30 || this.metrics.memoryUsage > 0.8) {
      return 'medium'
    }

    return 'high'
  }

  static getMetrics() {
    return { ...this.metrics }
  }

  static shouldReduceAnimations(): boolean {
    return (
      this.getPerformanceLevel() === 'low' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  }
}

// Web Worker optimization
export class WorkerOptimizer {
  private static workers = new Map<string, Worker>()
  private static workerQueue = new Map<
    string,
    Array<{
      task: any
      resolve: (value: any) => void
      reject: (reason: any) => void
    }>
  >()

  static createWorker(name: string, script: string): Worker {
    if (this.workers.has(name)) {
      return this.workers.get(name)!
    }

    const blob = new Blob([script], { type: 'application/javascript' })
    const worker = new Worker(URL.createObjectURL(blob))

    worker.onmessage = event => {
      const queue = this.workerQueue.get(name) || []
      const pendingTask = queue.shift()

      if (pendingTask) {
        if (event.data.error) {
          pendingTask.reject(new Error(event.data.error))
        } else {
          pendingTask.resolve(event.data.result)
        }
      }

      this.workerQueue.set(name, queue)
    }

    this.workers.set(name, worker)
    return worker
  }

  static async executeTask<T>(workerName: string, task: any): Promise<T> {
    const worker = this.workers.get(workerName)
    if (!worker) {
      throw new Error(`Worker ${workerName} not found`)
    }

    return new Promise<T>((resolve, reject) => {
      const queue = this.workerQueue.get(workerName) || []
      queue.push({ task, resolve, reject })
      this.workerQueue.set(workerName, queue)

      if (queue.length === 1) {
        worker.postMessage(task)
      }
    })
  }

  static terminateWorker(name: string) {
    const worker = this.workers.get(name)
    if (worker) {
      worker.terminate()
      this.workers.delete(name)
      this.workerQueue.delete(name)
    }
  }
}

export default {
  MemoryOptimizer,
  FrameRateOptimizer,
  ResourceOptimizer,
  OperationOptimizer,
  VirtualScrollOptimizer,
  CanvasOptimizer,
  PerformanceMonitor,
  WorkerOptimizer,
}
