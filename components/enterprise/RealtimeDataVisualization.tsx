'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LineChart, 
  Activity, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Settings,
  Maximize2,
  Minimize2,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react'
import { motionSafe, slideUp, fadeIn } from '@/lib/motion'
import OptimizedComponentWrapper from '@/components/optimization/OptimizedComponentWrapper'
import { OperationOptimizer } from '@/lib/performance-optimizer'

interface DataPoint {
  timestamp: number
  value: number
  category?: string
  metadata?: Record<string, any>
}

interface ChartConfig {
  id: string
  title: string
  type: 'line' | 'bar' | 'area' | 'pie'
  dataSource: string
  refreshInterval: number
  maxDataPoints: number
  color: string
  yAxisLabel?: string
  showGrid?: boolean
  showLegend?: boolean
}

interface RealtimeDataVisualizationProps {
  language?: 'vi' | 'en'
  dashboardId: string
  initialCharts?: ChartConfig[]
  onDataUpdate?: (chartId: string, data: DataPoint[]) => void
}

export default function RealtimeDataVisualization({
  language = 'en',
  dashboardId,
  initialCharts = [],
  onDataUpdate
}: RealtimeDataVisualizationProps) {
  const [charts, setCharts] = useState<ChartConfig[]>(initialCharts)
  const [chartData, setChartData] = useState<Record<string, DataPoint[]>>({})
  const [isPlaying, setIsPlaying] = useState(true)
  const [selectedChart, setSelectedChart] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const canvasRefs = useRef<Record<string, HTMLCanvasElement>>({})
  const animationFrames = useRef<Record<string, number>>({})
  const dataBuffers = useRef<Record<string, DataPoint[]>>({})

  const content = {
    vi: {
      title: 'Trực quan hóa dữ liệu thời gian thực',
      subtitle: 'Theo dõi hiệu suất AI agents và hệ thống',
      controls: {
        play: 'Phát',
        pause: 'Tạm dừng',
        refresh: 'Làm mới',
        fullscreen: 'Toàn màn hình',
        minimize: 'Thu nhỏ',
        settings: 'Cài đặt'
      },
      chartTypes: {
        line: 'Đường',
        bar: 'Cột',
        area: 'Vùng',
        pie: 'Tròn'
      },
      metrics: {
        agentTasks: 'Tác vụ Agent',
        systemLoad: 'Tải hệ thống',
        responseTime: 'Thời gian phản hồi',
        accuracy: 'Độ chính xác',
        throughput: 'Thông lượng',
        errorRate: 'Tỷ lệ lỗi'
      }
    },
    en: {
      title: 'Real-time Data Visualization',
      subtitle: 'Monitor AI agent and system performance',
      controls: {
        play: 'Play',
        pause: 'Pause',
        refresh: 'Refresh',
        fullscreen: 'Fullscreen',
        minimize: 'Minimize',
        settings: 'Settings'
      },
      chartTypes: {
        line: 'Line',
        bar: 'Bar',
        area: 'Area',
        pie: 'Pie'
      },
      metrics: {
        agentTasks: 'Agent Tasks',
        systemLoad: 'System Load',
        responseTime: 'Response Time',
        accuracy: 'Accuracy',
        throughput: 'Throughput',
        errorRate: 'Error Rate'
      }
    }
  }

  // Initialize default charts if none provided
  useEffect(() => {
    if (charts.length === 0) {
      const defaultCharts: ChartConfig[] = [
        {
          id: 'agent-tasks',
          title: content[language].metrics.agentTasks,
          type: 'line',
          dataSource: '/api/analytics/realtime/agent-tasks',
          refreshInterval: 2000,
          maxDataPoints: 50,
          color: '#3B82F6',
          yAxisLabel: 'Tasks/min',
          showGrid: true,
          showLegend: false
        },
        {
          id: 'system-load',
          title: content[language].metrics.systemLoad,
          type: 'area',
          dataSource: '/api/analytics/realtime/system-load',
          refreshInterval: 1000,
          maxDataPoints: 60,
          color: '#10B981',
          yAxisLabel: 'CPU %',
          showGrid: true,
          showLegend: false
        },
        {
          id: 'response-time',
          title: content[language].metrics.responseTime,
          type: 'line',
          dataSource: '/api/analytics/realtime/response-time',
          refreshInterval: 1500,
          maxDataPoints: 40,
          color: '#F59E0B',
          yAxisLabel: 'ms',
          showGrid: true,
          showLegend: false
        },
        {
          id: 'agent-accuracy',
          title: content[language].metrics.accuracy,
          type: 'bar',
          dataSource: '/api/analytics/realtime/accuracy',
          refreshInterval: 5000,
          maxDataPoints: 20,
          color: '#8B5CF6',
          yAxisLabel: '%',
          showGrid: true,
          showLegend: false
        }
      ]
      setCharts(defaultCharts)
    }
  }, [language, charts.length])

  // Initialize chart data
  useEffect(() => {
    charts.forEach(chart => {
      if (!chartData[chart.id]) {
        setChartData(prev => ({
          ...prev,
          [chart.id]: []
        }))
        dataBuffers.current[chart.id] = []
      }
    })
  }, [charts])

  // Real-time data fetching
  useEffect(() => {
    if (!isPlaying) return

    const intervals: Record<string, NodeJS.Timeout> = {}

    charts.forEach(chart => {
      const fetchData = async () => {
        try {
          // Simulate real-time data for demo
          const newDataPoint: DataPoint = {
            timestamp: Date.now(),
            value: generateRealtimeValue(chart.id),
            category: chart.id
          }

          // Update data buffer
          if (!dataBuffers.current[chart.id]) {
            dataBuffers.current[chart.id] = []
          }
          
          dataBuffers.current[chart.id].push(newDataPoint)
          
          // Keep only the latest maxDataPoints
          if (dataBuffers.current[chart.id].length > chart.maxDataPoints) {
            dataBuffers.current[chart.id] = dataBuffers.current[chart.id].slice(-chart.maxDataPoints)
          }

          // Update state with throttling
          const throttledUpdate = OperationOptimizer.throttle(
            `chart-update-${chart.id}`,
            () => {
              setChartData(prev => ({
                ...prev,
                [chart.id]: [...dataBuffers.current[chart.id]]
              }))
              
              onDataUpdate?.(chart.id, dataBuffers.current[chart.id])
            },
            100
          )
          
          throttledUpdate()
        } catch (error) {
          console.error(`Failed to fetch data for chart ${chart.id}:`, error)
        }
      }

      // Initial fetch
      fetchData()
      
      // Set up interval
      intervals[chart.id] = setInterval(fetchData, chart.refreshInterval)
    })

    return () => {
      Object.values(intervals).forEach(clearInterval)
    }
  }, [charts, isPlaying, onDataUpdate])

  // Canvas rendering
  useEffect(() => {
    charts.forEach(chart => {
      const canvas = canvasRefs.current[chart.id]
      if (!canvas || !chartData[chart.id]) return

      const renderChart = () => {
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas size
        const rect = canvas.getBoundingClientRect()
        const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        ctx.scale(dpr, dpr)

        // Clear canvas
        ctx.clearRect(0, 0, rect.width, rect.height)

        const data = chartData[chart.id]
        if (data.length === 0) return

        // Chart dimensions
        const padding = { top: 20, right: 20, bottom: 40, left: 60 }
        const chartWidth = rect.width - padding.left - padding.right
        const chartHeight = rect.height - padding.top - padding.bottom

        // Get data range
        const values = data.map(d => d.value)
        const minValue = Math.min(...values)
        const maxValue = Math.max(...values)
        const valueRange = maxValue - minValue || 1

        // Draw grid if enabled
        if (chart.showGrid) {
          ctx.strokeStyle = '#E5E7EB'
          ctx.lineWidth = 1

          // Horizontal grid lines
          for (let i = 0; i <= 5; i++) {
            const y = padding.top + (chartHeight / 5) * i
            ctx.beginPath()
            ctx.moveTo(padding.left, y)
            ctx.lineTo(padding.left + chartWidth, y)
            ctx.stroke()
          }

          // Vertical grid lines
          for (let i = 0; i <= 10; i++) {
            const x = padding.left + (chartWidth / 10) * i
            ctx.beginPath()
            ctx.moveTo(x, padding.top)
            ctx.lineTo(x, padding.top + chartHeight)
            ctx.stroke()
          }
        }

        // Draw chart based on type
        switch (chart.type) {
          case 'line':
            drawLineChart(ctx, data, chart, padding, chartWidth, chartHeight, minValue, valueRange)
            break
          case 'area':
            drawAreaChart(ctx, data, chart, padding, chartWidth, chartHeight, minValue, valueRange)
            break
          case 'bar':
            drawBarChart(ctx, data, chart, padding, chartWidth, chartHeight, minValue, valueRange)
            break
        }

        // Draw axes labels
        ctx.fillStyle = '#6B7280'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'

        // Y-axis label
        if (chart.yAxisLabel) {
          ctx.save()
          ctx.translate(15, padding.top + chartHeight / 2)
          ctx.rotate(-Math.PI / 2)
          ctx.fillText(chart.yAxisLabel, 0, 0)
          ctx.restore()
        }

        // Y-axis values
        ctx.textAlign = 'right'
        for (let i = 0; i <= 5; i++) {
          const value = minValue + (valueRange / 5) * (5 - i)
          const y = padding.top + (chartHeight / 5) * i
          ctx.fillText(value.toFixed(1), padding.left - 10, y + 4)
        }
      }

      // Use animation frame for smooth rendering
      if (animationFrames.current[chart.id]) {
        cancelAnimationFrame(animationFrames.current[chart.id])
      }
      
      animationFrames.current[chart.id] = requestAnimationFrame(renderChart)
    })

    return () => {
      Object.values(animationFrames.current).forEach(cancelAnimationFrame)
    }
  }, [chartData, charts])

  const drawLineChart = (
    ctx: CanvasRenderingContext2D,
    data: DataPoint[],
    chart: ChartConfig,
    padding: any,
    chartWidth: number,
    chartHeight: number,
    minValue: number,
    valueRange: number
  ) => {
    if (data.length < 2) return

    ctx.strokeStyle = chart.color
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    data.forEach((point, index) => {
      const x = padding.left + (index / (data.length - 1)) * chartWidth
      const y = padding.top + chartHeight - ((point.value - minValue) / valueRange) * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Draw points
    ctx.fillStyle = chart.color
    data.forEach((point, index) => {
      const x = padding.left + (index / (data.length - 1)) * chartWidth
      const y = padding.top + chartHeight - ((point.value - minValue) / valueRange) * chartHeight

      ctx.beginPath()
      ctx.arc(x, y, 3, 0, 2 * Math.PI)
      ctx.fill()
    })
  }

  const drawAreaChart = (
    ctx: CanvasRenderingContext2D,
    data: DataPoint[],
    chart: ChartConfig,
    padding: any,
    chartWidth: number,
    chartHeight: number,
    minValue: number,
    valueRange: number
  ) => {
    if (data.length < 2) return

    // Create gradient
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight)
    gradient.addColorStop(0, chart.color + '80')
    gradient.addColorStop(1, chart.color + '10')

    ctx.fillStyle = gradient

    ctx.beginPath()
    // Start from bottom left
    ctx.moveTo(padding.left, padding.top + chartHeight)
    
    data.forEach((point, index) => {
      const x = padding.left + (index / (data.length - 1)) * chartWidth
      const y = padding.top + chartHeight - ((point.value - minValue) / valueRange) * chartHeight
      ctx.lineTo(x, y)
    })
    
    // Close path to bottom right
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight)
    ctx.closePath()
    ctx.fill()

    // Draw line on top
    drawLineChart(ctx, data, chart, padding, chartWidth, chartHeight, minValue, valueRange)
  }

  const drawBarChart = (
    ctx: CanvasRenderingContext2D,
    data: DataPoint[],
    chart: ChartConfig,
    padding: any,
    chartWidth: number,
    chartHeight: number,
    minValue: number,
    valueRange: number
  ) => {
    const barWidth = chartWidth / data.length * 0.8
    const barSpacing = chartWidth / data.length * 0.2

    ctx.fillStyle = chart.color

    data.forEach((point, index) => {
      const x = padding.left + index * (chartWidth / data.length) + barSpacing / 2
      const barHeight = ((point.value - minValue) / valueRange) * chartHeight
      const y = padding.top + chartHeight - barHeight

      ctx.fillRect(x, y, barWidth, barHeight)
    })
  }

  const generateRealtimeValue = (chartId: string): number => {
    const baseValues = {
      'agent-tasks': 25,
      'system-load': 65,
      'response-time': 180,
      'agent-accuracy': 95
    }

    const base = baseValues[chartId as keyof typeof baseValues] || 50
    const variation = base * 0.2
    return base + (Math.random() - 0.5) * variation
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleRefresh = () => {
    setChartData({})
    dataBuffers.current = {}
    charts.forEach(chart => {
      dataBuffers.current[chart.id] = []
    })
  }

  const handleFullscreen = (chartId: string) => {
    setSelectedChart(isFullscreen ? null : chartId)
    setIsFullscreen(!isFullscreen)
  }

  return (
    <OptimizedComponentWrapper
      componentId={`realtime-visualization-${dashboardId}`}
      enablePerformanceOptimization={true}
      enableAccessibilityEnhancements={true}
      ariaLabel={content[language].title}
      ariaDescription={content[language].subtitle}
      role="application"
    >
      <motion.div
        variants={motionSafe(slideUp)}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Activity className="w-6 h-6 text-blue-600" />
              <span>{content[language].title}</span>
            </h2>
            <p className="text-gray-600 mt-1">{content[language].subtitle}</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePlayPause}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isPlaying
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              aria-label={isPlaying ? content[language].controls.pause : content[language].controls.play}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? content[language].controls.pause : content[language].controls.play}</span>
            </button>

            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{content[language].controls.refresh}</span>
            </button>
          </div>
        </div>

        {/* Real-time Status */}
        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm font-medium text-gray-900">
              {isPlaying 
                ? (language === 'vi' ? 'Đang cập nhật...' : 'Live updating...')
                : (language === 'vi' ? 'Tạm dừng' : 'Paused')
              }
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {language === 'vi' ? 'Số biểu đồ:' : 'Charts:'} {charts.length}
          </div>
          <div className="text-sm text-gray-600">
            {language === 'vi' ? 'Điểm dữ liệu:' : 'Data points:'} {Object.values(chartData).reduce((sum, data) => sum + data.length, 0)}
          </div>
        </div>

        {/* Charts Grid */}
        <AnimatePresence>
          {isFullscreen && selectedChart ? (
            // Fullscreen view
            <motion.div
              variants={motionSafe(fadeIn)}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed inset-0 z-50 bg-white flex flex-col"
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {charts.find(c => c.id === selectedChart)?.title}
                </h3>
                <button
                  onClick={() => handleFullscreen(selectedChart)}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>{content[language].controls.minimize}</span>
                </button>
              </div>
              <div className="flex-1 p-6">
                <canvas
                  ref={(el) => {
                    if (el && selectedChart) {
                      canvasRefs.current[selectedChart] = el
                    }
                  }}
                  className="w-full h-full border border-gray-200 rounded-lg"
                  style={{ minHeight: '500px' }}
                />
              </div>
            </motion.div>
          ) : (
            // Grid view
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {charts.map((chart) => (
                <motion.div
                  key={chart.id}
                  variants={motionSafe(slideUp)}
                  className="bg-white p-6 rounded-xl border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{chart.title}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: chart.color }}
                        />
                        <span className="text-sm text-gray-600 capitalize">
                          {content[language].chartTypes[chart.type]}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFullscreen(chart.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      aria-label={content[language].controls.fullscreen}
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>

                  <canvas
                    ref={(el) => {
                      if (el) {
                        canvasRefs.current[chart.id] = el
                      }
                    }}
                    className="w-full h-64 border border-gray-100 rounded-lg"
                  />

                  <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                    <span>
                      {language === 'vi' ? 'Điểm dữ liệu:' : 'Data points:'} {chartData[chart.id]?.length || 0}
                    </span>
                    <span>
                      {language === 'vi' ? 'Cập nhật:' : 'Update:'} {chart.refreshInterval}ms
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </OptimizedComponentWrapper>
  )
}