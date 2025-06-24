/**
 * Lazy Loading Utilities for Performance Optimization
 * Implements dynamic imports and code splitting strategies
 */

import React, { lazy, ComponentType } from 'react'

// Lazy load heavy components
export const LazyDocumentViewer = lazy(() => 
  import('@/components/documents/DocumentViewer').then(module => ({
    default: module.default
  }))
)

export const LazyDocumentIntelligence = lazy(() => 
  import('@/components/documents/DocumentIntelligence').then(module => ({
    default: module.default
  }))
)

export const LazyAdminMonitoring = lazy(() => 
  import('@/components/admin/MonitoringDashboard').then(module => ({
    default: module.default
  }))
)

export const LazyAdvancedDocumentUpload = lazy(() => 
  import('@/components/documents/legacy/AdvancedDocumentUpload').then(module => ({
    default: module.default
  }))
)

// Lazy load API documentation
export const LazySwaggerUI = lazy(() => 
  import('swagger-ui-react').then(module => ({
    default: module.default
  }))
)

// Lazy load heavy libraries
export const lazyLoadPDFJS = () => 
  import('pdfjs-dist').then(module => module.default)

export const lazyLoadExcelJS = () => 
  import('exceljs').then(module => module.default)

export const lazyLoadMammoth = () => 
  import('mammoth').then(module => module.default)

// Route-based code splitting helpers
export const createLazyRoute = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): T => {
  return lazy(importFn) as T
}

// Dynamic feature loading
export const loadFeatureModule = async (featureName: string) => {
  switch (featureName) {
    case 'ocr':
      return lazyLoadTesseract()
    case 'pdf':
      return lazyLoadPDFJS()
    case 'excel':
      return lazyLoadXLSX()
    case 'word':
      return lazyLoadMammoth()
    default:
      throw new Error(`Unknown feature: ${featureName}`)
  }
}

// Preload critical features
export const preloadCriticalFeatures = () => {
  // Preload on user interaction
  const preloadFeatures = ['ocr', 'pdf']
  
  const preload = () => {
    preloadFeatures.forEach(feature => {
      loadFeatureModule(feature).catch(() => {
        // Silently fail - not critical
      })
    })
  }

  // Preload on first user interaction
  const events = ['mousedown', 'touchstart', 'keydown']
  const handler = () => {
    preload()
    events.forEach(event => {
      document.removeEventListener(event, handler)
    })
  }

  events.forEach(event => {
    document.addEventListener(event, handler, { once: true })
  })
}

// Intersection observer for lazy loading
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  }

  return new IntersectionObserver(callback, defaultOptions)
}

// Lazy component wrapper with loading state
export const withLazyLoading = <P extends object>(
  LazyComponent: ComponentType<P>,
  LoadingComponent?: ComponentType<{}>
) => {
  const DefaultLoading = () => React.createElement('div', null, 'Loading...')
  return (props: P) => 
    React.createElement(
      React.Suspense,
      { fallback: LoadingComponent ? React.createElement(LoadingComponent) : React.createElement(DefaultLoading) },
      React.createElement(LazyComponent, props)
    )
}

// Bundle size monitoring
export const logBundleSize = (componentName: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📦 Loaded component: ${componentName}`)
  }
}