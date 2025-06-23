'use client'

import { useEffect, useRef, useCallback } from 'react'

/* ============================================================================ */
/* PRISMY PREDICTIVE PRELOADING SYSTEM */
/* Intelligent resource loading based on user behavior patterns */
/* ============================================================================ */

interface PredictiveLoadingConfig {
  enableMouseTracking?: boolean
  enableScrollPrediction?: boolean
  enableRoutePrediction?: boolean
  enableResourcePrediction?: boolean
  aggressiveness?: 'conservative' | 'moderate' | 'aggressive'
  maxPredictions?: number
  cooldownMs?: number
}

interface UserIntent {
  route?: string
  element?: string
  confidence: number
  timestamp: number
  type: 'hover' | 'scroll' | 'viewport' | 'pattern'
}

export class PredictiveLoader {
  private static instance: PredictiveLoader
  private config: Required<PredictiveLoadingConfig>
  private userIntents: UserIntent[] = []
  private preloadedResources = new Set<string>()
  private mouseTracker: MouseTracker | null = null
  private scrollPredictor: ScrollPredictor | null = null
  private routePredictor: RoutePredictor | null = null
  private lastPrediction = 0

  private constructor(config: PredictiveLoadingConfig = {}) {
    this.config = {
      enableMouseTracking: config.enableMouseTracking ?? true,
      enableScrollPrediction: config.enableScrollPrediction ?? true,
      enableRoutePrediction: config.enableRoutePrediction ?? true,
      enableResourcePrediction: config.enableResourcePrediction ?? true,
      aggressiveness: config.aggressiveness ?? 'moderate',
      maxPredictions: config.maxPredictions ?? 5,
      cooldownMs: config.cooldownMs ?? 1000,
    }

    this.initialize()
  }

  static getInstance(config?: PredictiveLoadingConfig): PredictiveLoader {
    if (!PredictiveLoader.instance) {
      PredictiveLoader.instance = new PredictiveLoader(config)
    }
    return PredictiveLoader.instance
  }

  private initialize() {
    if (typeof window === 'undefined') return

    if (this.config.enableMouseTracking) {
      this.mouseTracker = new MouseTracker()
      this.mouseTracker.onHoverIntent = this.handleHoverIntent.bind(this)
    }

    if (this.config.enableScrollPrediction) {
      this.scrollPredictor = new ScrollPredictor()
      this.scrollPredictor.onScrollIntent = this.handleScrollIntent.bind(this)
    }

    if (this.config.enableRoutePrediction) {
      this.routePredictor = new RoutePredictor()
      this.routePredictor.onRouteIntent = this.handleRouteIntent.bind(this)
    }

    // Cleanup old intents periodically
    setInterval(() => this.cleanupIntents(), 30000)
  }

  private handleHoverIntent(element: HTMLElement, confidence: number) {
    const intent: UserIntent = {
      element: element.tagName.toLowerCase(),
      confidence,
      timestamp: Date.now(),
      type: 'hover',
    }

    // Predict route if it's a link
    if (element.tagName === 'A') {
      const href = element.getAttribute('href')
      if (href && this.isInternalRoute(href)) {
        intent.route = href
      }
    }

    this.addIntent(intent)
  }

  private handleScrollIntent(direction: 'up' | 'down', velocity: number) {
    const confidence = Math.min(velocity / 1000, 1) // Normalize velocity
    const intent: UserIntent = {
      confidence,
      timestamp: Date.now(),
      type: 'scroll',
    }

    this.addIntent(intent)
  }

  private handleRouteIntent(route: string, confidence: number) {
    const intent: UserIntent = {
      route,
      confidence,
      timestamp: Date.now(),
      type: 'pattern',
    }

    this.addIntent(intent)
  }

  private addIntent(intent: UserIntent) {
    this.userIntents.push(intent)
    
    // Limit intent history
    if (this.userIntents.length > 100) {
      this.userIntents = this.userIntents.slice(-50)
    }

    this.processPredictions()
  }

  private processPredictions() {
    const now = Date.now()
    
    // Respect cooldown
    if (now - this.lastPrediction < this.config.cooldownMs) {
      return
    }

    const predictions = this.generatePredictions()
    
    if (predictions.length > 0) {
      this.lastPrediction = now
      this.executePredictions(predictions)
    }
  }

  private generatePredictions(): Array<{ resource: string; confidence: number }> {
    const recent = this.userIntents.filter(
      intent => Date.now() - intent.timestamp < 10000
    )

    if (recent.length === 0) return []

    const predictions: Array<{ resource: string; confidence: number }> = []
    
    // Route predictions
    const routeIntents = recent.filter(intent => intent.route)
    if (routeIntents.length > 0) {
      const routeMap = new Map<string, number>()
      
      routeIntents.forEach(intent => {
        const route = intent.route!
        const existing = routeMap.get(route) || 0
        routeMap.set(route, existing + intent.confidence)
      })

      Array.from(routeMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, this.config.maxPredictions)
        .forEach(([route, confidence]) => {
          if (confidence > this.getConfidenceThreshold()) {
            predictions.push({ resource: route, confidence })
          }
        })
    }

    return predictions
  }

  private getConfidenceThreshold(): number {
    switch (this.config.aggressiveness) {
      case 'conservative': return 0.8
      case 'moderate': return 0.6
      case 'aggressive': return 0.4
      default: return 0.6
    }
  }

  private async executePredictions(predictions: Array<{ resource: string; confidence: number }>) {
    for (const prediction of predictions) {
      if (this.preloadedResources.has(prediction.resource)) continue

      try {
        await this.preloadResource(prediction.resource)
        this.preloadedResources.add(prediction.resource)
      } catch (error) {
        console.debug('Predictive loading failed:', prediction.resource, error)
      }
    }
  }

  private async preloadResource(resource: string) {
    if (resource.startsWith('/')) {
      // Route preloading
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = resource
      document.head.appendChild(link)

      // Also preload the page component if it's a known route
      if (this.config.enableResourcePrediction) {
        await this.preloadPageComponent(resource)
      }
    } else {
      // Regular resource preloading
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = resource
      document.head.appendChild(link)
    }
  }

  private async preloadPageComponent(route: string) {
    const routeMap: Record<string, () => Promise<any>> = {
      '/workspace': () => import('@/app/workspace/page'),
      '/pricing': () => import('@/app/pricing/page'),
      '/features': () => import('@/app/features/page'),
      '/documents': () => import('@/app/documents/page'),
    }

    const loader = routeMap[route]
    if (loader) {
      await loader()
    }
  }

  private isInternalRoute(href: string): boolean {
    return href.startsWith('/') || href.startsWith(window.location.origin)
  }

  private cleanupIntents() {
    const cutoff = Date.now() - 60000 // 1 minute
    this.userIntents = this.userIntents.filter(intent => intent.timestamp > cutoff)
  }

  // Public API
  preloadRoute(route: string) {
    this.preloadResource(route)
  }

  preloadImage(src: string) {
    if (this.preloadedResources.has(src)) return

    const img = new Image()
    img.src = src
    this.preloadedResources.add(src)
  }

  preloadFont(fontFamily: string, fontUrl: string) {
    if (this.preloadedResources.has(fontUrl)) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'font'
    link.type = 'font/woff2'
    link.href = fontUrl
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
    
    this.preloadedResources.add(fontUrl)
  }
}

// Mouse tracking for hover predictions
class MouseTracker {
  private hoverTimeouts = new Map<HTMLElement, NodeJS.Timeout>()
  private lastMousePosition = { x: 0, y: 0 }
  private mouseVelocity = 0
  
  onHoverIntent?: (element: HTMLElement, confidence: number) => void

  constructor() {
    this.initialize()
  }

  private initialize() {
    document.addEventListener('mousemove', this.handleMouseMove.bind(this), { passive: true })
    document.addEventListener('mouseover', this.handleMouseOver.bind(this), { passive: true })
    document.addEventListener('mouseout', this.handleMouseOut.bind(this), { passive: true })
  }

  private handleMouseMove(event: MouseEvent) {
    const dx = event.clientX - this.lastMousePosition.x
    const dy = event.clientY - this.lastMousePosition.y
    this.mouseVelocity = Math.sqrt(dx * dx + dy * dy)
    
    this.lastMousePosition = { x: event.clientX, y: event.clientY }
  }

  private handleMouseOver(event: MouseEvent) {
    const element = event.target as HTMLElement
    if (!this.isInteractiveElement(element)) return

    const delay = this.getHoverDelay()
    const timeout = setTimeout(() => {
      const confidence = this.calculateHoverConfidence()
      this.onHoverIntent?.(element, confidence)
    }, delay)

    this.hoverTimeouts.set(element, timeout)
  }

  private handleMouseOut(event: MouseEvent) {
    const element = event.target as HTMLElement
    const timeout = this.hoverTimeouts.get(element)
    
    if (timeout) {
      clearTimeout(timeout)
      this.hoverTimeouts.delete(element)
    }
  }

  private isInteractiveElement(element: HTMLElement): boolean {
    const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']
    return interactiveTags.includes(element.tagName) || 
           element.hasAttribute('data-preload') ||
           element.closest('[data-preload]') !== null
  }

  private getHoverDelay(): number {
    // Slower mouse = longer delay = higher confidence
    if (this.mouseVelocity < 5) return 300
    if (this.mouseVelocity < 20) return 500
    return 800
  }

  private calculateHoverConfidence(): number {
    // Lower velocity = higher confidence
    if (this.mouseVelocity < 5) return 0.9
    if (this.mouseVelocity < 20) return 0.7
    return 0.5
  }
}

// Scroll prediction for content loading
class ScrollPredictor {
  private scrollHistory: Array<{ position: number; timestamp: number }> = []
  private lastScrollPosition = 0
  private scrollDirection: 'up' | 'down' = 'down'
  
  onScrollIntent?: (direction: 'up' | 'down', velocity: number) => void

  constructor() {
    this.initialize()
  }

  private initialize() {
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true })
  }

  private handleScroll() {
    const position = window.pageYOffset
    const timestamp = Date.now()
    
    this.scrollHistory.push({ position, timestamp })
    
    // Keep only recent history
    if (this.scrollHistory.length > 10) {
      this.scrollHistory = this.scrollHistory.slice(-5)
    }

    // Calculate velocity and direction
    if (this.scrollHistory.length >= 2) {
      const recent = this.scrollHistory[this.scrollHistory.length - 1]
      const previous = this.scrollHistory[this.scrollHistory.length - 2]
      
      const distance = recent.position - previous.position
      const time = recent.timestamp - previous.timestamp
      const velocity = Math.abs(distance) / time * 1000 // pixels per second
      
      this.scrollDirection = distance > 0 ? 'down' : 'up'
      
      // Trigger intent if velocity is significant
      if (velocity > 500) {
        this.onScrollIntent?.(this.scrollDirection, velocity)
      }
    }

    this.lastScrollPosition = position
  }
}

// Route prediction based on navigation patterns
class RoutePredictor {
  private routeHistory: Array<{ route: string; timestamp: number }> = []
  private patterns = new Map<string, string[]>()
  
  onRouteIntent?: (route: string, confidence: number) => void

  constructor() {
    this.initialize()
  }

  private initialize() {
    // Track route changes
    this.recordRoute(window.location.pathname)
    
    // Listen for route changes (works with Next.js)
    window.addEventListener('popstate', () => {
      this.recordRoute(window.location.pathname)
    })
  }

  private recordRoute(route: string) {
    this.routeHistory.push({ route, timestamp: Date.now() })
    
    // Keep only recent history
    if (this.routeHistory.length > 20) {
      this.routeHistory = this.routeHistory.slice(-10)
    }

    this.updatePatterns()
    this.predictNextRoute()
  }

  private updatePatterns() {
    if (this.routeHistory.length < 2) return

    // Build sequence patterns
    for (let i = 1; i < this.routeHistory.length; i++) {
      const current = this.routeHistory[i].route
      const previous = this.routeHistory[i - 1].route
      
      if (!this.patterns.has(previous)) {
        this.patterns.set(previous, [])
      }
      
      this.patterns.get(previous)!.push(current)
    }
  }

  private predictNextRoute() {
    if (this.routeHistory.length === 0) return

    const currentRoute = this.routeHistory[this.routeHistory.length - 1].route
    const possibleNext = this.patterns.get(currentRoute)
    
    if (!possibleNext || possibleNext.length === 0) return

    // Find most common next route
    const frequency = new Map<string, number>()
    possibleNext.forEach(route => {
      frequency.set(route, (frequency.get(route) || 0) + 1)
    })

    const mostLikely = Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])[0]

    if (mostLikely) {
      const confidence = mostLikely[1] / possibleNext.length
      if (confidence > 0.3) {
        this.onRouteIntent?.(mostLikely[0], confidence)
      }
    }
  }
}

// React hook for predictive loading
export function usePredictiveLoading(config?: PredictiveLoadingConfig) {
  const predictiveLoader = useRef<PredictiveLoader | null>(null)

  useEffect(() => {
    predictiveLoader.current = PredictiveLoader.getInstance(config)
    
    return () => {
      // Cleanup if needed
    }
  }, [])

  const preloadRoute = useCallback((route: string) => {
    predictiveLoader.current?.preloadRoute(route)
  }, [])

  const preloadImage = useCallback((src: string) => {
    predictiveLoader.current?.preloadImage(src)
  }, [])

  const preloadFont = useCallback((fontFamily: string, fontUrl: string) => {
    predictiveLoader.current?.preloadFont(fontFamily, fontUrl)
  }, [])

  return {
    preloadRoute,
    preloadImage, 
    preloadFont,
  }
}

// Component for enabling predictive loading
export function PredictiveLoadingProvider({ 
  children, 
  config 
}: { 
  children: React.ReactNode
  config?: PredictiveLoadingConfig 
}) {
  usePredictiveLoading(config)
  
  return <>{children}</>
}

// Export the main class and utilities
export { PredictiveLoader }
export default PredictiveLoader