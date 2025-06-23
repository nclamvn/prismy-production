'use client'

import { 
  lazy, 
  Suspense, 
  useState, 
  useEffect, 
  useRef, 
  useCallback,
  Component,
  ComponentType,
  ReactNode 
} from 'react'
import { Skeleton } from '@/components/ui/Skeleton'

/* ============================================================================ */
/* PRISMY ADVANCED LAZY LOADING SYSTEM */
/* Intelligent component lazy loading with optimization */
/* ============================================================================ */

interface LazyLoadOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
  placeholder?: ReactNode
  delay?: number
  preload?: boolean
  priority?: 'high' | 'normal' | 'low'
}

// Enhanced lazy loading hook with intersection observer
export function useLazyLoad(options: LazyLoadOptions = {}) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true,
    delay = 0,
    preload = false,
    priority = 'normal'
  } = options

  const [isVisible, setIsVisible] = useState(preload)
  const [isLoaded, setIsLoaded] = useState(false)
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element || isVisible) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setIsVisible(true), delay)
          } else {
            setIsVisible(true)
          }
          
          if (triggerOnce) {
            observer.unobserve(element)
          }
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [threshold, rootMargin, triggerOnce, delay, isVisible])

  // Priority-based loading
  useEffect(() => {
    if (isVisible && !isLoaded) {
      const loadingDelay = priority === 'high' ? 0 : priority === 'normal' ? 100 : 200
      
      setTimeout(() => {
        setIsLoaded(true)
      }, loadingDelay)
    }
  }, [isVisible, isLoaded, priority])

  return { isVisible, isLoaded, elementRef }
}

// Lazy component wrapper with advanced features
export function LazyComponent<T = any>({
  component: LazyComponent,
  fallback,
  skeleton,
  errorBoundary = true,
  retryCount = 3,
  timeout = 10000,
  ...lazyOptions
}: {
  component: () => Promise<{ default: ComponentType<T> }>
  fallback?: ReactNode
  skeleton?: ReactNode
  errorBoundary?: boolean
  retryCount?: number
  timeout?: number
} & LazyLoadOptions & T) {
  
  const { isVisible, isLoaded, elementRef } = useLazyLoad(lazyOptions)
  const [error, setError] = useState<Error | null>(null)
  const [retries, setRetries] = useState(0)
  
  // Dynamic import with retry logic
  const [Component, setComponent] = useState<ComponentType<T> | null>(null)
  
  useEffect(() => {
    if (!isLoaded) return

    const loadComponent = async () => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Component load timeout')), timeout)
        )
        
        const componentPromise = LazyComponent()
        const result = await Promise.race([componentPromise, timeoutPromise])
        
        setComponent(() => result.default)
        setError(null)
      } catch (err) {
        const error = err as Error
        setError(error)
        
        if (retries < retryCount) {
          setTimeout(() => {
            setRetries(prev => prev + 1)
            setError(null)
          }, 1000 * Math.pow(2, retries)) // Exponential backoff
        }
      }
    }

    loadComponent()
  }, [isLoaded, retries, retryCount, timeout])

  // Error boundary wrapper
  const ErrorBoundaryWrapper = errorBoundary ? LazyErrorBoundary : 'div'

  if (!isVisible) {
    return (
      <div ref={elementRef as any} className="lazy-placeholder">
        {skeleton || fallback || <Skeleton className="h-32 w-full" />}
      </div>
    )
  }

  if (error && retries >= retryCount) {
    return (
      <div className="lazy-error p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-600 text-sm">Failed to load component</p>
        <button 
          onClick={() => setRetries(0)}
          className="mt-2 text-xs text-red-800 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!Component) {
    return skeleton || fallback || <Skeleton className="h-32 w-full animate-pulse" />
  }

  return (
    <ErrorBoundaryWrapper>
      <Component {...(lazyOptions as T)} />
    </ErrorBoundaryWrapper>
  )
}

// Pre-built lazy components for common UI elements
export const LazyComponents = {
  // Charts and data visualization
  Chart: lazy(() => import('@/components/ui/Chart').catch(() => ({ default: () => <div>Chart unavailable</div> }))),
  
  // Complex forms
  FormBuilder: lazy(() => import('@/components/forms/FormBuilder')),
  
  // Media components
  VideoPlayer: lazy(() => import('@/components/media/VideoPlayer')),
  ImageGallery: lazy(() => import('@/components/media/ImageGallery')),
  
  // Dashboard components
  Analytics: lazy(() => import('@/components/dashboard/Analytics')),
  Reports: lazy(() => import('@/components/dashboard/Reports')),
  
  // Editor components
  RichTextEditor: lazy(() => import('@/components/editor/RichTextEditor')),
  CodeEditor: lazy(() => import('@/components/editor/CodeEditor')),
  
  // Third-party integrations
  PaymentForm: lazy(() => import('@/components/payment/PaymentForm')),
  ChatWidget: lazy(() => import('@/components/chat/ChatWidget')),
}

// Batch lazy loading for multiple components
export function useBatchLazyLoad(components: string[], options: LazyLoadOptions = {}) {
  const [loadedComponents, setLoadedComponents] = useState<Set<string>>(new Set())
  const { elementRef, isVisible } = useLazyLoad(options)

  useEffect(() => {
    if (!isVisible) return

    const loadComponents = async () => {
      const promises = components.map(async (componentName) => {
        try {
          await LazyComponents[componentName as keyof typeof LazyComponents]
          return componentName
        } catch {
          return null
        }
      })

      const results = await Promise.allSettled(promises)
      const loaded = results
        .filter((result) => result.status === 'fulfilled' && result.value)
        .map((result) => (result as PromiseFulfilledResult<string>).value)

      setLoadedComponents(new Set(loaded))
    }

    loadComponents()
  }, [isVisible, components])

  return { loadedComponents, elementRef, isVisible }
}

// Route-based lazy loading
export function LazyRoute({ 
  component, 
  skeleton,
  preload = false 
}: {
  component: () => Promise<{ default: ComponentType<any> }>
  skeleton?: ReactNode
  preload?: boolean
}) {
  const Component = lazy(component)

  // Preload on hover for better UX
  useEffect(() => {
    if (preload) {
      component().catch(() => {}) // Preload silently
    }
  }, [component, preload])

  return (
    <Suspense fallback={skeleton || <RouteLoadingSkeleton />}>
      <Component />
    </Suspense>
  )
}

// Route loading skeleton
function RouteLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

// Enhanced error boundary for lazy components
class LazyErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Lazy component error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="lazy-error-boundary p-4 border border-orange-200 rounded-lg bg-orange-50">
          <h3 className="text-orange-800 font-medium mb-2">Component Error</h3>
          <p className="text-orange-600 text-sm mb-3">
            This component failed to load properly.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="text-orange-800 text-sm underline"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Preload manager for critical components
export class PreloadManager {
  private static instance: PreloadManager
  private preloadedComponents = new Set<string>()
  private preloadQueue: Array<() => Promise<any>> = []

  static getInstance() {
    if (!PreloadManager.instance) {
      PreloadManager.instance = new PreloadManager()
    }
    return PreloadManager.instance
  }

  // Add component to preload queue
  preload(componentName: string, loader: () => Promise<any>, priority: 'high' | 'normal' | 'low' = 'normal') {
    if (this.preloadedComponents.has(componentName)) return

    const preloadTask = async () => {
      try {
        await loader()
        this.preloadedComponents.add(componentName)
      } catch (error) {
        console.warn(`Failed to preload ${componentName}:`, error)
      }
    }

    if (priority === 'high') {
      this.preloadQueue.unshift(preloadTask)
    } else {
      this.preloadQueue.push(preloadTask)
    }

    this.processQueue()
  }

  // Process preload queue with concurrency control
  private async processQueue() {
    const concurrency = 3
    const running: Promise<any>[] = []

    while (this.preloadQueue.length > 0 || running.length > 0) {
      while (running.length < concurrency && this.preloadQueue.length > 0) {
        const task = this.preloadQueue.shift()!
        const promise = task().finally(() => {
          const index = running.indexOf(promise)
          if (index > -1) running.splice(index, 1)
        })
        running.push(promise)
      }

      if (running.length > 0) {
        await Promise.race(running)
      }
    }
  }

  // Preload route components
  preloadRoute(routeName: string) {
    const routeComponents = {
      workspace: () => import('@/app/workspace/page'),
      pricing: () => import('@/app/pricing/page'),
      features: () => import('@/app/features/page'),
      documents: () => import('@/app/documents/page'),
    }

    const loader = routeComponents[routeName as keyof typeof routeComponents]
    if (loader) {
      this.preload(routeName, loader, 'high')
    }
  }
}

// Hook for component preloading
export function usePreload() {
  const preloadManager = PreloadManager.getInstance()

  const preloadComponent = (name: string, loader: () => Promise<any>, priority?: 'high' | 'normal' | 'low') => {
    preloadManager.preload(name, loader, priority)
  }

  const preloadRoute = (routeName: string) => {
    preloadManager.preloadRoute(routeName)
  }

  return { preloadComponent, preloadRoute }
}