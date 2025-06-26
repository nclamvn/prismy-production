/**
 * Bundle Optimization Utilities
 * Phase 10.1: Real-world Performance Optimization
 */

// Dynamic imports for heavy components
export const LazyComponents = {
  // Dashboard components
  DashboardAnalytics: () => import('@/app/dashboard/analytics/page').then(m => ({ default: m.default })),
  EnterpriseAnalytics: () => import('@/app/dashboard/enterprise/analytics/page').then(m => ({ default: m.default })),
  WorkflowsPage: () => import('@/app/dashboard/workflows/page').then(m => ({ default: m.default })),
  
  // Heavy feature components
  DocumentProcessor: () => import('@/components/workspace/DocumentProcessor').catch(() => ({ default: () => null })),
  AdvancedEditor: () => import('@/components/workspace/AdvancedEditor').catch(() => ({ default: () => null })),
  PredictiveInsights: () => import('@/components/workspace/dashboard/PredictiveInsights').catch(() => ({ default: () => null })),
  
  // PDF and OCR components (heavy libraries)
  PDFViewer: () => import('@/components/document/PDFViewer').catch(() => ({ default: () => null })),
  OCRProcessor: () => import('@/components/document/OCRProcessor').catch(() => ({ default: () => null })),
}

// Optimized icon loading
export const IconLoader = {
  // Load only required icons dynamically
  loadIcon: async (iconName: string) => {
    try {
      const iconModule = await import(`lucide-react/dist/esm/icons/${iconName.toLowerCase().replace(/([A-Z])/g, '-$1').substring(1)}.js`)
      return iconModule.default || iconModule[iconName]
    } catch {
      // Fallback to a default icon
      const { Circle } = await import('lucide-react')
      return Circle
    }
  },

  // Preload critical icons
  preloadCriticalIcons: async () => {
    const criticalIcons = [
      'Menu', 'X', 'User', 'Settings', 'Search', 'Upload', 
      'Download', 'Check', 'AlertTriangle', 'Home'
    ]
    
    return Promise.allSettled(
      criticalIcons.map(icon => IconLoader.loadIcon(icon))
    )
  }
}

// Code splitting utilities
export const CodeSplitting = {
  // Wrap components with lazy loading
  withLazyLoading: <T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    fallback?: React.ComponentType
  ) => {
    const LazyComponent = React.lazy(importFn)
    
    return (props: React.ComponentProps<T>) => (
      <React.Suspense 
        fallback={
          fallback ? React.createElement(fallback, props) : 
          <div className="animate-pulse bg-gray-200 rounded h-32 w-full" />
        }
      >
        <LazyComponent {...props} />
      </React.Suspense>
    )
  },

  // Route-level code splitting
  createLazyRoute: (importFn: () => Promise<{ default: React.ComponentType }>) => {
    return React.lazy(importFn)
  }
}

// Bundle analysis utilities
export const BundleAnalyzer = {
  // Log bundle information in development
  logBundleInfo: () => {
    if (process.env.NODE_ENV === 'development') {
      console.group('📦 Bundle Information')
      console.log('Environment:', process.env.NODE_ENV)
      console.log('Build time:', process.env.BUILD_TIME || 'Not available')
      console.log('Version:', process.env.NEXT_PUBLIC_APP_VERSION)
      console.groupEnd()
    }
  },

  // Performance marks for bundle loading
  markBundleLoad: (bundleName: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`bundle-${bundleName}-start`)
    }
  },

  measureBundleLoad: (bundleName: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`bundle-${bundleName}-end`)
      performance.measure(
        `bundle-${bundleName}`,
        `bundle-${bundleName}-start`,
        `bundle-${bundleName}-end`
      )
    }
  }
}

// Tree shaking helpers
export const TreeShaking = {
  // Import only what's needed from large libraries
  importOptimized: {
    // Framer Motion - import specific components
    motion: {
      div: () => import('framer-motion').then(m => ({ motion: { div: m.motion.div } })),
      span: () => import('framer-motion').then(m => ({ motion: { span: m.motion.span } })),
      button: () => import('framer-motion').then(m => ({ motion: { button: m.motion.button } })),
    },
    
    // Lucide React - specific icons only
    icons: (iconNames: string[]) => {
      return Promise.all(
        iconNames.map(name => IconLoader.loadIcon(name))
      )
    }
  }
}

// Critical resource hints
export const ResourceHints = {
  // Preload critical resources
  preloadCritical: () => {
    if (typeof document !== 'undefined') {
      // Preload critical fonts
      const fontLink = document.createElement('link')
      fontLink.rel = 'preload'
      fontLink.href = '/fonts/inter-var.woff2'
      fontLink.as = 'font'
      fontLink.type = 'font/woff2'
      fontLink.crossOrigin = 'anonymous'
      document.head.appendChild(fontLink)

      // Preload critical images
      const logoLink = document.createElement('link')
      logoLink.rel = 'preload'
      logoLink.href = '/logo.svg'
      logoLink.as = 'image'
      document.head.appendChild(logoLink)
    }
  },

  // Prefetch next likely resources
  prefetchNextPages: (pages: string[]) => {
    if (typeof document !== 'undefined') {
      pages.forEach(page => {
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = page
        document.head.appendChild(link)
      })
    }
  }
}

// Performance budget enforcement
export const PerformanceBudget = {
  thresholds: {
    javascript: 500 * 1024, // 500KB
    css: 50 * 1024,         // 50KB
    images: 1024 * 1024,    // 1MB
    fonts: 100 * 1024,      // 100KB
  },

  checkBudget: (resourceType: keyof typeof PerformanceBudget.thresholds, size: number) => {
    const threshold = PerformanceBudget.thresholds[resourceType]
    const isWithinBudget = size <= threshold
    
    if (!isWithinBudget && process.env.NODE_ENV === 'development') {
      console.warn(
        `⚠️ Performance Budget Exceeded: ${resourceType} (${Math.round(size / 1024)}KB > ${Math.round(threshold / 1024)}KB)`
      )
    }
    
    return isWithinBudget
  }
}

export default {
  LazyComponents,
  IconLoader,
  CodeSplitting,
  BundleAnalyzer,
  TreeShaking,
  ResourceHints,
  PerformanceBudget
}