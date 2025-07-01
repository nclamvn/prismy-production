// Component Performance Profiler
// Real-time component performance monitoring and optimization

'use client'

import React, { Profiler, ProfilerOnRenderCallback, useEffect, useState, useMemo } from 'react'
import { performanceMonitor, ComponentMetrics } from '../../lib/performance/advanced-monitor'
import { cn } from '../../lib/utils'

// Component profiler interfaces
interface ProfilerData {
  id: string
  phase: 'mount' | 'update'
  actualDuration: number
  baseDuration: number
  startTime: number
  commitTime: number
  interactions: Set<any>
}

interface ComponentPerformanceData {
  componentName: string
  renderCount: number
  totalRenderTime: number
  averageRenderTime: number
  lastRenderTime: number
  mountTime: number
  updateTimes: number[]
  memorySnapshots: number[]
  propsChanges: number
  rerenderReasons: string[]
  optimizationSuggestions: string[]
  performanceScore: number
  trend: 'improving' | 'stable' | 'degrading'
  timestamp: Date
}

interface ProfilerProps {
  children: React.ReactNode
  id: string
  name?: string
  enabled?: boolean
  detailed?: boolean
  onPerformanceUpdate?: (data: ComponentPerformanceData) => void
}

interface ProfilerManagerProps {
  children: React.ReactNode
  showOverlay?: boolean
  showAlerts?: boolean
  performanceThreshold?: number
}

// Component Performance Profiler
export const ComponentProfiler: React.FC<ProfilerProps> = ({
  children,
  id,
  name,
  enabled = true,
  detailed = false,
  onPerformanceUpdate
}) => {
  const [performanceData, setPerformanceData] = useState<ComponentPerformanceData | null>(null)
  const [renderHistory, setRenderHistory] = useState<ProfilerData[]>([])
  const [memoryBaseline, setMemoryBaseline] = useState<number>(0)

  // Track component lifecycle
  useEffect(() => {
    const componentName = name || id
    const startTime = performance.now()
    
    // Record mount time
    const mountTime = performance.now() - startTime
    
    // Get memory baseline
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (performance as any)) {
      setMemoryBaseline((performance as any).memory.usedJSHeapSize)
    }

    // Initial performance data
    const initialData: ComponentPerformanceData = {
      componentName,
      renderCount: 0,
      totalRenderTime: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      mountTime,
      updateTimes: [],
      memorySnapshots: [],
      propsChanges: 0,
      rerenderReasons: [],
      optimizationSuggestions: [],
      performanceScore: 100,
      trend: 'stable',
      timestamp: new Date()
    }

    setPerformanceData(initialData)

    // Record component metrics
    performanceMonitor.recordComponentMetrics({
      componentName,
      renderTime: 0,
      mountTime,
      updateCount: 0,
      errorCount: 0,
      memoryUsage: memoryBaseline,
      propsSize: 0,
      childrenCount: React.Children.count(children),
      lastUpdate: new Date()
    })

    return () => {
      // Cleanup and final metrics
      if (performanceData) {
        performanceMonitor.recordComponentMetrics({
          componentName,
          renderTime: performanceData.averageRenderTime,
          mountTime: performanceData.mountTime,
          updateCount: performanceData.renderCount,
          errorCount: 0,
          memoryUsage: getCurrentMemoryUsage(),
          propsSize: estimatePropsSize(children),
          childrenCount: React.Children.count(children),
          lastUpdate: new Date()
        })
      }
    }
  }, [])

  // Profiler callback
  const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration, baseDuration, startTime, commitTime, interactions) => {
    if (!enabled) return

    const profilerData: ProfilerData = {
      id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
      interactions
    }

    // Update render history
    setRenderHistory(prev => [...prev.slice(-19), profilerData]) // Keep last 20 renders

    // Update performance data
    setPerformanceData(prev => {
      if (!prev) return null

      const newRenderCount = prev.renderCount + 1
      const newTotalRenderTime = prev.totalRenderTime + actualDuration
      const newAverageRenderTime = newTotalRenderTime / newRenderCount
      const newUpdateTimes = [...prev.updateTimes, actualDuration].slice(-10) // Keep last 10

      // Calculate memory usage
      const currentMemory = getCurrentMemoryUsage()
      const newMemorySnapshots = [...prev.memorySnapshots, currentMemory].slice(-10)

      // Analyze rerender reasons
      const rerenderReasons = analyzeRerenderReasons(profilerData, prev)

      // Generate optimization suggestions
      const optimizationSuggestions = generateOptimizationSuggestions({
        ...prev,
        renderCount: newRenderCount,
        averageRenderTime: newAverageRenderTime,
        lastRenderTime: actualDuration,
        updateTimes: newUpdateTimes,
        memorySnapshots: newMemorySnapshots,
        rerenderReasons
      })

      // Calculate performance score
      const performanceScore = calculatePerformanceScore({
        averageRenderTime: newAverageRenderTime,
        renderCount: newRenderCount,
        memoryGrowth: currentMemory - memoryBaseline,
        optimizationSuggestions
      })

      // Determine trend
      const trend = calculateTrend(newUpdateTimes)

      const updatedData: ComponentPerformanceData = {
        ...prev,
        renderCount: newRenderCount,
        totalRenderTime: newTotalRenderTime,
        averageRenderTime: newAverageRenderTime,
        lastRenderTime: actualDuration,
        updateTimes: newUpdateTimes,
        memorySnapshots: newMemorySnapshots,
        rerenderReasons,
        optimizationSuggestions,
        performanceScore,
        trend,
        timestamp: new Date()
      }

      // Record metrics
      performanceMonitor.recordComponentMetrics({
        componentName: prev.componentName,
        renderTime: actualDuration,
        mountTime: prev.mountTime,
        updateCount: newRenderCount,
        errorCount: 0,
        memoryUsage: currentMemory,
        propsSize: estimatePropsSize(children),
        childrenCount: React.Children.count(children),
        lastUpdate: new Date()
      })

      // Trigger callback
      onPerformanceUpdate?.(updatedData)

      return updatedData
    })

    // Log performance alerts
    if (detailed && actualDuration > 16) {
      console.warn(`🐌 Slow render detected in ${name || id}: ${actualDuration.toFixed(2)}ms`)
    }
  }

  if (!enabled) {
    return <>{children}</>
  }

  return (
    <Profiler id={id} onRender={onRender}>
      {children}
      {detailed && performanceData && (
        <ComponentPerformanceOverlay data={performanceData} renderHistory={renderHistory} />
      )}
    </Profiler>
  )
}

// Performance Overlay
interface PerformanceOverlayProps {
  data: ComponentPerformanceData
  renderHistory: ProfilerData[]
}

const ComponentPerformanceOverlay: React.FC<PerformanceOverlayProps> = ({ data, renderHistory }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '↗️'
      case 'degrading': return '↘️'
      default: return '➡️'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded-lg border p-4 max-w-sm">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <div className={cn("w-3 h-3 rounded-full", {
            'bg-green-500': data.performanceScore >= 90,
            'bg-yellow-500': data.performanceScore >= 70 && data.performanceScore < 90,
            'bg-red-500': data.performanceScore < 70
          })} />
          <span className="font-medium text-sm">{data.componentName}</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className={cn("text-sm font-bold", getScoreColor(data.performanceScore))}>
            {data.performanceScore}
          </span>
          <span className="text-sm">{getTrendIcon(data.trend)}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3 text-xs">
          {/* Basic metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="font-medium text-gray-600">Avg Render</div>
              <div>{data.averageRenderTime.toFixed(2)}ms</div>
            </div>
            <div>
              <div className="font-medium text-gray-600">Renders</div>
              <div>{data.renderCount}</div>
            </div>
            <div>
              <div className="font-medium text-gray-600">Mount Time</div>
              <div>{data.mountTime.toFixed(2)}ms</div>
            </div>
            <div>
              <div className="font-medium text-gray-600">Memory</div>
              <div>{formatBytes(data.memorySnapshots[data.memorySnapshots.length - 1] || 0)}</div>
            </div>
          </div>

          {/* Render history sparkline */}
          <div>
            <div className="font-medium text-gray-600 mb-1">Render Times</div>
            <div className="flex items-end space-x-1 h-8">
              {data.updateTimes.slice(-10).map((time, index) => (
                <div
                  key={index}
                  className={cn("w-2 rounded-t", {
                    'bg-green-400': time <= 16,
                    'bg-yellow-400': time > 16 && time <= 33,
                    'bg-red-400': time > 33
                  })}
                  style={{ height: `${Math.min((time / 50) * 100, 100)}%` }}
                  title={`${time.toFixed(2)}ms`}
                />
              ))}
            </div>
          </div>

          {/* Optimization suggestions */}
          {data.optimizationSuggestions.length > 0 && (
            <div>
              <div className="font-medium text-gray-600 mb-1">Suggestions</div>
              <ul className="space-y-1">
                {data.optimizationSuggestions.slice(0, 3).map((suggestion, index) => (
                  <li key={index} className="text-xs text-gray-700">
                    • {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rerender reasons */}
          {data.rerenderReasons.length > 0 && (
            <div>
              <div className="font-medium text-gray-600 mb-1">Rerender Reasons</div>
              <ul className="space-y-1">
                {data.rerenderReasons.slice(0, 3).map((reason, index) => (
                  <li key={index} className="text-xs text-gray-700">
                    • {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Profiler Manager for Global Performance Monitoring
export const ProfilerManager: React.FC<ProfilerManagerProps> = ({
  children,
  showOverlay = false,
  showAlerts = true,
  performanceThreshold = 16
}) => {
  const [globalPerformance, setGlobalPerformance] = useState<{
    totalComponents: number
    slowComponents: number
    averageRenderTime: number
    memoryUsage: number
    alerts: string[]
  }>({
    totalComponents: 0,
    slowComponents: 0,
    averageRenderTime: 0,
    memoryUsage: 0,
    alerts: []
  })

  const [componentData, setComponentData] = useState<Map<string, ComponentPerformanceData>>(new Map())

  useEffect(() => {
    const updateGlobalPerformance = () => {
      const components = Array.from(componentData.values())
      const slowComponents = components.filter(c => c.averageRenderTime > performanceThreshold)
      const totalRenderTime = components.reduce((sum, c) => sum + c.averageRenderTime, 0)
      const currentMemory = getCurrentMemoryUsage()

      const alerts: string[] = []
      if (slowComponents.length > 0) {
        alerts.push(`${slowComponents.length} slow components detected`)
      }
      if (currentMemory > 50 * 1024 * 1024) {
        alerts.push('High memory usage detected')
      }

      setGlobalPerformance({
        totalComponents: components.length,
        slowComponents: slowComponents.length,
        averageRenderTime: components.length > 0 ? totalRenderTime / components.length : 0,
        memoryUsage: currentMemory,
        alerts
      })
    }

    const interval = setInterval(updateGlobalPerformance, 1000)
    return () => clearInterval(interval)
  }, [componentData, performanceThreshold])

  const handleComponentUpdate = (data: ComponentPerformanceData) => {
    setComponentData(prev => new Map(prev.set(data.componentName, data)))
  }

  // Wrap children with profiler if they're not already wrapped
  const wrappedChildren = React.Children.map(children, (child, index) => {
    if (React.isValidElement(child) && child.type !== ComponentProfiler) {
      const componentName = (child.type as any).displayName || (child.type as any).name || `Component-${index}`
      return (
        <ComponentProfiler
          key={componentName}
          id={componentName}
          name={componentName}
          onPerformanceUpdate={handleComponentUpdate}
        >
          {child}
        </ComponentProfiler>
      )
    }
    return child
  })

  return (
    <>
      {wrappedChildren}
      
      {showOverlay && (
        <GlobalPerformanceOverlay 
          performance={globalPerformance}
          components={Array.from(componentData.values())}
        />
      )}
      
      {showAlerts && globalPerformance.alerts.length > 0 && (
        <PerformanceAlerts alerts={globalPerformance.alerts} />
      )}
    </>
  )
}

// Global Performance Overlay
interface GlobalPerformanceOverlayProps {
  performance: any
  components: ComponentPerformanceData[]
}

const GlobalPerformanceOverlay: React.FC<GlobalPerformanceOverlayProps> = ({ performance, components }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white shadow-lg rounded-lg border p-4 max-w-md">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="font-medium">Performance Monitor</h3>
        <div className="flex items-center space-x-2">
          <div className={cn("w-3 h-3 rounded-full", {
            'bg-green-500': performance.slowComponents === 0,
            'bg-yellow-500': performance.slowComponents > 0 && performance.slowComponents < 3,
            'bg-red-500': performance.slowComponents >= 3
          })} />
          <span className="text-sm">{performance.slowComponents} slow</span>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="font-medium text-gray-600">Components</div>
              <div>{performance.totalComponents}</div>
            </div>
            <div>
              <div className="font-medium text-gray-600">Avg Render</div>
              <div>{performance.averageRenderTime.toFixed(2)}ms</div>
            </div>
            <div>
              <div className="font-medium text-gray-600">Memory</div>
              <div>{formatBytes(performance.memoryUsage)}</div>
            </div>
            <div>
              <div className="font-medium text-gray-600">Slow Components</div>
              <div className="text-red-600">{performance.slowComponents}</div>
            </div>
          </div>

          {components.length > 0 && (
            <div>
              <div className="font-medium text-gray-600 mb-2">Top Components by Render Time</div>
              <div className="space-y-1">
                {components
                  .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
                  .slice(0, 5)
                  .map((component, index) => (
                    <div key={component.componentName} className="flex justify-between text-xs">
                      <span className="truncate">{component.componentName}</span>
                      <span className={cn({
                        'text-red-600': component.averageRenderTime > 33,
                        'text-yellow-600': component.averageRenderTime > 16 && component.averageRenderTime <= 33,
                        'text-green-600': component.averageRenderTime <= 16
                      })}>
                        {component.averageRenderTime.toFixed(1)}ms
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Performance Alerts
interface PerformanceAlertsProps {
  alerts: string[]
}

const PerformanceAlerts: React.FC<PerformanceAlertsProps> = ({ alerts }) => {
  return (
    <div className="fixed top-4 left-4 z-50 space-y-2">
      {alerts.map((alert, index) => (
        <div
          key={index}
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center space-x-2"
        >
          <span>⚠️</span>
          <span className="text-sm">{alert}</span>
        </div>
      ))}
    </div>
  )
}

// Helper functions
function getCurrentMemoryUsage(): number {
  if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (performance as any)) {
    return (performance as any).memory.usedJSHeapSize
  }
  return 0
}

function estimatePropsSize(children: React.ReactNode): number {
  // Simple estimation of props size
  try {
    return JSON.stringify(children).length
  } catch {
    return 0
  }
}

function analyzeRerenderReasons(profilerData: ProfilerData, prevData: ComponentPerformanceData): string[] {
  const reasons: string[] = []

  // Check if it's a mount or update
  if (profilerData.phase === 'mount') {
    reasons.push('Component mounted')
  } else {
    reasons.push('Props or state changed')
  }

  // Check render duration
  if (profilerData.actualDuration > 16) {
    reasons.push('Slow render detected')
  }

  // Check if there are interactions
  if (profilerData.interactions.size > 0) {
    reasons.push('User interaction triggered')
  }

  return reasons
}

function generateOptimizationSuggestions(data: ComponentPerformanceData): string[] {
  const suggestions: string[] = []

  if (data.averageRenderTime > 16) {
    suggestions.push('Consider using React.memo() to prevent unnecessary re-renders')
    suggestions.push('Use useMemo() for expensive calculations')
    suggestions.push('Use useCallback() for function props')
  }

  if (data.renderCount > 50 && data.averageRenderTime > 5) {
    suggestions.push('Component re-renders frequently - check props dependencies')
  }

  const memoryGrowth = data.memorySnapshots.length > 1 
    ? data.memorySnapshots[data.memorySnapshots.length - 1] - data.memorySnapshots[0] 
    : 0

  if (memoryGrowth > 1024 * 1024) { // 1MB growth
    suggestions.push('Memory usage is growing - check for memory leaks')
  }

  if (data.rerenderReasons.includes('Slow render detected')) {
    suggestions.push('Break component into smaller sub-components')
    suggestions.push('Consider virtualizing large lists')
  }

  return suggestions
}

function calculatePerformanceScore(data: {
  averageRenderTime: number
  renderCount: number
  memoryGrowth: number
  optimizationSuggestions: string[]
}): number {
  let score = 100

  // Penalty for slow renders
  if (data.averageRenderTime > 16) {
    score -= Math.min(50, (data.averageRenderTime - 16) * 2)
  }

  // Penalty for memory growth
  if (data.memoryGrowth > 1024 * 1024) {
    score -= 20
  }

  // Penalty for optimization suggestions
  score -= data.optimizationSuggestions.length * 5

  return Math.max(0, Math.round(score))
}

function calculateTrend(updateTimes: number[]): 'improving' | 'stable' | 'degrading' {
  if (updateTimes.length < 5) return 'stable'

  const recent = updateTimes.slice(-3)
  const older = updateTimes.slice(-6, -3)

  const recentAvg = recent.reduce((sum, time) => sum + time, 0) / recent.length
  const olderAvg = older.reduce((sum, time) => sum + time, 0) / older.length

  const change = (recentAvg - olderAvg) / olderAvg

  if (change > 0.2) return 'degrading'
  if (change < -0.2) return 'improving'
  return 'stable'
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// HOC for automatic profiling
export function withProfiler<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    id?: string
    enabled?: boolean
    detailed?: boolean
  } = {}
) {
  const ProfiledComponent = React.forwardRef<any, P>((props, ref) => {
    const componentName = options.id || Component.displayName || Component.name || 'Anonymous'
    
    return (
      <ComponentProfiler
        id={componentName}
        name={componentName}
        enabled={options.enabled}
        detailed={options.detailed}
      >
        <Component {...props} ref={ref} />
      </ComponentProfiler>
    )
  })

  ProfiledComponent.displayName = `withProfiler(${Component.displayName || Component.name})`
  
  return ProfiledComponent
}

export default ComponentProfiler