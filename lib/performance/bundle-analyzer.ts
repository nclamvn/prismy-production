/**
 * UI/UX Polish Sprint - Phase 2.2: Bundle Analysis & Monitoring
 * 
 * Advanced bundle analysis for smart chunking optimization
 * Provides insights into bundle size, chunk distribution, and loading performance
 */

export interface BundleChunk {
  id: string
  name: string
  size: number
  gzipSize?: number
  modules: string[]
  dependencies: string[]
}

export interface BundleAnalysis {
  totalSize: number
  totalGzipSize: number
  chunks: BundleChunk[]
  criticalChunks: string[]
  heavyModules: Array<{ name: string; size: number }>
  recommendations: string[]
}

// Bundle size thresholds (in bytes)
export const BUNDLE_THRESHOLDS = {
  // Critical chunks should be under 150KB
  critical: 150 * 1024,
  // Regular chunks should be under 200KB
  regular: 200 * 1024,
  // Async chunks can be larger but under 300KB
  async: 300 * 1024,
  // Total initial bundle should be under 500KB
  initialTotal: 500 * 1024
} as const

// Performance budget configuration
export const PERFORMANCE_BUDGET = {
  // First Contentful Paint target
  fcp: 1500, // ms
  // Largest Contentful Paint target
  lcp: 2500, // ms
  // Time to Interactive target
  tti: 3000, // ms
  // Cumulative Layout Shift target
  cls: 0.1,
  // First Input Delay target
  fid: 100, // ms
  // Total Blocking Time target
  tbt: 300 // ms
} as const

/**
 * Analyzes bundle structure and provides optimization recommendations
 */
export function analyzeBundleStructure(chunks: BundleChunk[]): BundleAnalysis {
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0)
  const totalGzipSize = chunks.reduce((sum, chunk) => sum + (chunk.gzipSize || chunk.size * 0.3), 0)
  
  // Identify critical chunks (framework, auth, UI)
  const criticalChunks = chunks
    .filter(chunk => 
      chunk.name.includes('framework') ||
      chunk.name.includes('auth') ||
      chunk.name.includes('main') ||
      chunk.name.includes('ui-libs')
    )
    .map(chunk => chunk.name)
  
  // Find heavy modules that could be optimized
  const heavyModules = chunks
    .flatMap(chunk => 
      chunk.modules.map(module => ({
        name: module,
        size: chunk.size / chunk.modules.length // Approximate size
      }))
    )
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
  
  // Generate recommendations
  const recommendations = generateOptimizationRecommendations({
    totalSize,
    totalGzipSize,
    chunks,
    criticalChunks,
    heavyModules
  })
  
  return {
    totalSize,
    totalGzipSize,
    chunks,
    criticalChunks,
    heavyModules,
    recommendations
  }
}

/**
 * Generates specific optimization recommendations based on bundle analysis
 */
function generateOptimizationRecommendations(analysis: {
  totalSize: number
  totalGzipSize: number
  chunks: BundleChunk[]
  criticalChunks: string[]
  heavyModules: Array<{ name: string; size: number }>
}): string[] {
  const recommendations: string[] = []
  
  // Check total bundle size
  if (analysis.totalGzipSize > BUNDLE_THRESHOLDS.initialTotal) {
    recommendations.push(
      `Total bundle size (${formatBytes(analysis.totalGzipSize)}) exceeds ${formatBytes(BUNDLE_THRESHOLDS.initialTotal)}. Consider lazy loading more components.`
    )
  }
  
  // Check individual chunk sizes
  const oversizedChunks = analysis.chunks.filter(chunk => 
    chunk.size > BUNDLE_THRESHOLDS.regular
  )
  if (oversizedChunks.length > 0) {
    recommendations.push(
      `${oversizedChunks.length} chunks exceed size limit: ${oversizedChunks.map(c => c.name).join(', ')}`
    )
  }
  
  // Check for heavy modules
  const veryHeavyModules = analysis.heavyModules.filter(module => 
    module.size > 50 * 1024 // 50KB
  )
  if (veryHeavyModules.length > 0) {
    recommendations.push(
      `Consider optimizing heavy modules: ${veryHeavyModules.map(m => m.name).slice(0, 3).join(', ')}`
    )
  }
  
  // Specific library recommendations
  const hasFramerMotion = analysis.chunks.some(chunk => 
    chunk.modules.some(module => module.includes('framer-motion'))
  )
  if (hasFramerMotion) {
    recommendations.push(
      'Framer Motion detected. Consider using motion components selectively and lazy loading animations.'
    )
  }
  
  const hasLargeUILibs = analysis.chunks.some(chunk => 
    chunk.name.includes('ui-libs') && chunk.size > 100 * 1024
  )
  if (hasLargeUILibs) {
    recommendations.push(
      'Large UI library bundle detected. Consider tree-shaking unused components.'
    )
  }
  
  return recommendations
}

/**
 * Monitors runtime bundle loading performance
 */
export class BundlePerformanceMonitor {
  private loadTimes: Map<string, number> = new Map()
  private chunkSizes: Map<string, number> = new Map()
  
  /**
   * Records chunk load time
   */
  recordChunkLoad(chunkName: string, loadTime: number, size: number): void {
    this.loadTimes.set(chunkName, loadTime)
    this.chunkSizes.set(chunkName, size)
    
    // Log slow loading chunks
    if (loadTime > 1000) { // 1 second
      console.warn(`Slow chunk load: ${chunkName} took ${loadTime}ms (${formatBytes(size)})`)
    }
  }
  
  /**
   * Gets performance metrics for all loaded chunks
   */
  getMetrics(): {
    averageLoadTime: number
    slowestChunk: { name: string; time: number } | null
    totalBytesLoaded: number
    chunksLoaded: number
  } {
    const loadTimes = Array.from(this.loadTimes.values())
    const averageLoadTime = loadTimes.length > 0 
      ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length
      : 0
    
    const slowestEntry = Array.from(this.loadTimes.entries())
      .sort(([,a], [,b]) => b - a)[0]
    
    const slowestChunk = slowestEntry 
      ? { name: slowestEntry[0], time: slowestEntry[1] }
      : null
    
    const totalBytesLoaded = Array.from(this.chunkSizes.values())
      .reduce((sum, size) => sum + size, 0)
    
    return {
      averageLoadTime,
      slowestChunk,
      totalBytesLoaded,
      chunksLoaded: this.loadTimes.size
    }
  }
  
  /**
   * Resets monitoring data
   */
  reset(): void {
    this.loadTimes.clear()
    this.chunkSizes.clear()
  }
}

/**
 * Formats bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Estimates bundle impact on Core Web Vitals
 */
export function estimateWebVitalsImpact(bundleSize: number): {
  fcpImpact: number // Additional FCP delay in ms
  lcpImpact: number // Additional LCP delay in ms
  clsRisk: 'low' | 'medium' | 'high'
} {
  // Rough estimates based on bundle size
  // These are simplified calculations for guidance
  const sizeInMB = bundleSize / (1024 * 1024)
  
  // Estimate additional FCP delay (network + parse time)
  const fcpImpact = Math.round(sizeInMB * 150) // ~150ms per MB on average connection
  
  // LCP is often affected by bundle size due to render blocking
  const lcpImpact = Math.round(sizeInMB * 200) // ~200ms per MB
  
  // CLS risk increases with more dynamic content
  let clsRisk: 'low' | 'medium' | 'high' = 'low'
  if (sizeInMB > 1) clsRisk = 'medium'
  if (sizeInMB > 2) clsRisk = 'high'
  
  return {
    fcpImpact,
    lcpImpact,
    clsRisk
  }
}

// Global instance for monitoring
export const bundleMonitor = new BundlePerformanceMonitor()