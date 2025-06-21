/**
 * Lazy Wrapper Component for Performance Optimization
 * Provides loading states and error boundaries for lazy-loaded components
 */

import React, { Suspense, ComponentType } from 'react'
import { Loader2 } from 'lucide-react'

interface LazyWrapperProps {
  children: React.ReactNode
  fallback?: React.ComponentType
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>
  className?: string
}

const DefaultFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
)

const DefaultErrorFallback: ComponentType<{ error: Error; retry: () => void }> = ({ 
  error, 
  retry 
}) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="text-red-500 mb-4">
      <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      Failed to load component
    </h3>
    <p className="text-gray-600 mb-4">
      {error.message || 'Something went wrong'}
    </p>
    <button
      onClick={retry}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
    >
      Try Again
    </button>
  </div>
)

class LazyErrorBoundary extends React.Component<
  { 
    children: React.ReactNode
    fallback: ComponentType<{ error: Error; retry: () => void }>
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Lazy component error:', error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback
      return <Fallback error={this.state.error} retry={this.retry} />
    }

    return this.props.children
  }
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback: Fallback = DefaultFallback,
  errorFallback: ErrorFallback = DefaultErrorFallback,
  className
}) => {
  return (
    <div className={className}>
      <LazyErrorBoundary fallback={ErrorFallback}>
        <Suspense fallback={<Fallback />}>
          {children}
        </Suspense>
      </LazyErrorBoundary>
    </div>
  )
}

// HOC for wrapping components with lazy loading
export const withLazyWrapper = <P extends object>(
  Component: ComponentType<P>,
  options: Partial<LazyWrapperProps> = {}
) => {
  return (props: P) => (
    <LazyWrapper {...options}>
      <Component {...props} />
    </LazyWrapper>
  )
}

// Preloader component for critical resources
export const PreloadIndicator: React.FC<{ 
  resources: string[]
  onLoad?: () => void 
}> = ({ resources, onLoad }) => {
  const [loaded, setLoaded] = React.useState(0)
  const total = resources.length

  React.useEffect(() => {
    let loadedCount = 0
    
    resources.forEach(async (resource) => {
      try {
        // Simulate resource loading
        await new Promise(resolve => setTimeout(resolve, 100))
        loadedCount++
        setLoaded(loadedCount)
        
        if (loadedCount === total && onLoad) {
          onLoad()
        }
      } catch (error) {
        console.warn(`Failed to preload: ${resource}`)
      }
    })
  }, [resources, total, onLoad])

  if (loaded === total) return null

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 border">
      <div className="flex items-center space-x-3">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        <div>
          <p className="text-sm font-medium">Loading resources...</p>
          <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(loaded / total) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}