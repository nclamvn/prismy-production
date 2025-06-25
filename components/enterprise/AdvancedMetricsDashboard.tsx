'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Activity, 
  DollarSign, 
  Users, 
  Clock,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Brain,
  FileText,
  Calendar,
  Filter,
  Download,
  Settings,
  Info
} from 'lucide-react'
import { motionSafe, slideUp, staggerContainer, fadeIn } from '@/lib/motion'
import OptimizedComponentWrapper from '@/components/optimization/OptimizedComponentWrapper'
import RealtimeDataVisualization from './RealtimeDataVisualization'

interface KPIMetric {
  id: string
  name: string
  value: number
  previousValue: number
  unit: string
  format: 'number' | 'percentage' | 'currency' | 'time'
  trend: 'up' | 'down' | 'stable'
  target?: number
  category: 'performance' | 'cost' | 'quality' | 'user'
  description: string
}

interface AlertConfig {
  id: string
  metricId: string
  type: 'threshold' | 'trend' | 'anomaly'
  condition: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  isActive: boolean
}

interface AdvancedMetricsDashboardProps {
  language?: 'vi' | 'en'
  organizationId: string
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d'
  onMetricClick?: (metric: KPIMetric) => void
  onAlertTriggered?: (alert: AlertConfig) => void
}

export default function AdvancedMetricsDashboard({
  language = 'en',
  organizationId,
  timeRange = '24h',
  onMetricClick,
  onAlertTriggered
}: AdvancedMetricsDashboardProps) {
  const [metrics, setMetrics] = useState<KPIMetric[]>([])
  const [alerts, setAlerts] = useState<AlertConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showAlerts, setShowAlerts] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const content = {
    vi: {
      title: 'Dashboard Chỉ Số Nâng Cao',
      subtitle: 'Theo dõi KPI và hiệu suất toàn diện',
      categories: {
        all: 'Tất cả',
        performance: 'Hiệu suất',
        cost: 'Chi phí',
        quality: 'Chất lượng',
        user: 'Người dùng'
      },
      metrics: {
        agentEfficiency: 'Hiệu suất Agent',
        processingSpeed: 'Tốc độ xử lý',
        accuracyRate: 'Tỷ lệ chính xác',
        costPerTask: 'Chi phí mỗi tác vụ',
        userSatisfaction: 'Hài lòng người dùng',
        systemUptime: 'Thời gian hoạt động',
        throughput: 'Thông lượng',
        errorRate: 'Tỷ lệ lỗi',
        responseTime: 'Thời gian phản hồi',
        resourceUtilization: 'Sử dụng tài nguyên',
        costSavings: 'Tiết kiệm chi phí',
        userAdoption: 'Áp dụng người dùng'
      },
      alerts: {
        title: 'Cảnh báo',
        high: 'Cao',
        medium: 'Trung bình',
        low: 'Thấp',
        critical: 'Nghiêm trọng'
      },
      actions: {
        refresh: 'Làm mới',
        export: 'Xuất',
        filter: 'Lọc',
        settings: 'Cài đặt',
        viewDetails: 'Xem chi tiết'
      },
      trends: {
        up: 'Tăng',
        down: 'Giảm',
        stable: 'Ổn định'
      }
    },
    en: {
      title: 'Advanced Metrics Dashboard',
      subtitle: 'Comprehensive KPI and performance monitoring',
      categories: {
        all: 'All',
        performance: 'Performance',
        cost: 'Cost',
        quality: 'Quality',
        user: 'User'
      },
      metrics: {
        agentEfficiency: 'Agent Efficiency',
        processingSpeed: 'Processing Speed',
        accuracyRate: 'Accuracy Rate',
        costPerTask: 'Cost per Task',
        userSatisfaction: 'User Satisfaction',
        systemUptime: 'System Uptime',
        throughput: 'Throughput',
        errorRate: 'Error Rate',
        responseTime: 'Response Time',
        resourceUtilization: 'Resource Utilization',
        costSavings: 'Cost Savings',
        userAdoption: 'User Adoption'
      },
      alerts: {
        title: 'Alerts',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
        critical: 'Critical'
      },
      actions: {
        refresh: 'Refresh',
        export: 'Export',
        filter: 'Filter',
        settings: 'Settings',
        viewDetails: 'View Details'
      },
      trends: {
        up: 'Up',
        down: 'Down',
        stable: 'Stable'
      }
    }
  }

  // Initialize metrics and alerts
  useEffect(() => {
    fetchMetricsData()
    initializeAlerts()
  }, [organizationId, timeRange])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchMetricsData()
      checkAlerts()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  const fetchMetricsData = async () => {
    try {
      setLoading(true)
      
      // Simulate API call - replace with real endpoint
      const mockMetrics: KPIMetric[] = [
        {
          id: 'agent-efficiency',
          name: content[language].metrics.agentEfficiency,
          value: 92.5,
          previousValue: 89.2,
          unit: '%',
          format: 'percentage',
          trend: 'up',
          target: 95,
          category: 'performance',
          description: 'Overall efficiency of AI agents across all tasks'
        },
        {
          id: 'processing-speed',
          name: content[language].metrics.processingSpeed,
          value: 3.2,
          previousValue: 3.8,
          unit: 's',
          format: 'time',
          trend: 'up', // Lower is better for time
          target: 3.0,
          category: 'performance',
          description: 'Average time to process documents'
        },
        {
          id: 'accuracy-rate',
          name: content[language].metrics.accuracyRate,
          value: 97.8,
          previousValue: 97.1,
          unit: '%',
          format: 'percentage',
          trend: 'up',
          target: 98,
          category: 'quality',
          description: 'Accuracy of AI agent outputs'
        },
        {
          id: 'cost-per-task',
          name: content[language].metrics.costPerTask,
          value: 1.85,
          previousValue: 2.12,
          unit: '$',
          format: 'currency',
          trend: 'up', // Lower is better for cost
          target: 1.50,
          category: 'cost',
          description: 'Average cost per completed task'
        },
        {
          id: 'user-satisfaction',
          name: content[language].metrics.userSatisfaction,
          value: 4.7,
          previousValue: 4.5,
          unit: '/5',
          format: 'number',
          trend: 'up',
          target: 4.8,
          category: 'user',
          description: 'User satisfaction rating'
        },
        {
          id: 'system-uptime',
          name: content[language].metrics.systemUptime,
          value: 99.97,
          previousValue: 99.94,
          unit: '%',
          format: 'percentage',
          trend: 'up',
          target: 99.9,
          category: 'performance',
          description: 'System availability and uptime'
        },
        {
          id: 'throughput',
          name: content[language].metrics.throughput,
          value: 2847,
          previousValue: 2634,
          unit: '/hour',
          format: 'number',
          trend: 'up',
          target: 3000,
          category: 'performance',
          description: 'Tasks completed per hour'
        },
        {
          id: 'error-rate',
          name: content[language].metrics.errorRate,
          value: 1.2,
          previousValue: 1.8,
          unit: '%',
          format: 'percentage',
          trend: 'up', // Lower is better for errors
          target: 1.0,
          category: 'quality',
          description: 'Percentage of tasks with errors'
        },
        {
          id: 'response-time',
          name: content[language].metrics.responseTime,
          value: 245,
          previousValue: 289,
          unit: 'ms',
          format: 'number',
          trend: 'up', // Lower is better for response time
          target: 200,
          category: 'performance',
          description: 'Average API response time'
        },
        {
          id: 'resource-utilization',
          name: content[language].metrics.resourceUtilization,
          value: 73.5,
          previousValue: 78.2,
          unit: '%',
          format: 'percentage',
          trend: 'up', // Lower is better for efficiency
          target: 70,
          category: 'performance',
          description: 'Server resource utilization'
        },
        {
          id: 'cost-savings',
          name: content[language].metrics.costSavings,
          value: 145000,
          previousValue: 132000,
          unit: '$',
          format: 'currency',
          trend: 'up',
          target: 150000,
          category: 'cost',
          description: 'Total cost savings from automation'
        },
        {
          id: 'user-adoption',
          name: content[language].metrics.userAdoption,
          value: 847,
          previousValue: 792,
          unit: ' users',
          format: 'number',
          trend: 'up',
          target: 1000,
          category: 'user',
          description: 'Active users this month'
        }
      ]

      setMetrics(mockMetrics)
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const initializeAlerts = () => {
    const alertConfigs: AlertConfig[] = [
      {
        id: 'alert-1',
        metricId: 'error-rate',
        type: 'threshold',
        condition: 'value > 2.0',
        severity: 'high',
        message: 'Error rate exceeds acceptable threshold',
        isActive: false
      },
      {
        id: 'alert-2',
        metricId: 'system-uptime',
        type: 'threshold',
        condition: 'value < 99.5',
        severity: 'critical',
        message: 'System uptime below SLA requirement',
        isActive: false
      },
      {
        id: 'alert-3',
        metricId: 'response-time',
        type: 'trend',
        condition: 'increasing > 10%',
        severity: 'medium',
        message: 'Response time showing increasing trend',
        isActive: false
      }
    ]
    setAlerts(alertConfigs)
  }

  const checkAlerts = () => {
    alerts.forEach(alert => {
      const metric = metrics.find(m => m.id === alert.metricId)
      if (!metric) return

      let shouldTrigger = false

      switch (alert.type) {
        case 'threshold':
          // Simple threshold check
          if (alert.condition.includes('value >')) {
            const threshold = parseFloat(alert.condition.split('>')[1])
            shouldTrigger = metric.value > threshold
          } else if (alert.condition.includes('value <')) {
            const threshold = parseFloat(alert.condition.split('<')[1])
            shouldTrigger = metric.value < threshold
          }
          break
        case 'trend':
          // Trend analysis
          const changePercent = ((metric.value - metric.previousValue) / metric.previousValue) * 100
          if (alert.condition.includes('increasing >')) {
            const threshold = parseFloat(alert.condition.split('>')[1].replace('%', ''))
            shouldTrigger = changePercent > threshold
          }
          break
      }

      if (shouldTrigger && !alert.isActive) {
        alert.isActive = true
        onAlertTriggered?.(alert)
      } else if (!shouldTrigger && alert.isActive) {
        alert.isActive = false
      }
    })
    
    setAlerts([...alerts])
  }

  const filteredMetrics = useMemo(() => {
    if (selectedCategory === 'all') {
      return metrics
    }
    return metrics.filter(metric => metric.category === selectedCategory)
  }, [metrics, selectedCategory])

  const activeAlerts = useMemo(() => {
    return alerts.filter(alert => alert.isActive)
  }, [alerts])

  const formatValue = (metric: KPIMetric) => {
    switch (metric.format) {
      case 'currency':
        return `${metric.unit}${metric.value.toLocaleString()}`
      case 'percentage':
        return `${metric.value.toFixed(1)}${metric.unit}`
      case 'time':
        return `${metric.value.toFixed(1)}${metric.unit}`
      default:
        return `${metric.value.toLocaleString()}${metric.unit}`
    }
  }

  const getTrendIcon = (metric: KPIMetric) => {
    const isImprovement = 
      (metric.format === 'time' || metric.format === 'currency' || metric.id.includes('error') || metric.id.includes('cost')) 
        ? metric.value < metric.previousValue 
        : metric.value > metric.previousValue

    if (isImprovement) {
      return <TrendingUp className="w-4 h-4 text-green-500" />
    } else if (metric.value === metric.previousValue) {
      return <Activity className="w-4 h-4 text-gray-500" />
    } else {
      return <TrendingDown className="w-4 h-4 text-red-500" />
    }
  }

  const getTrendPercent = (metric: KPIMetric) => {
    const change = metric.value - metric.previousValue
    const percent = Math.abs((change / metric.previousValue) * 100)
    const isImprovement = 
      (metric.format === 'time' || metric.format === 'currency' || metric.id.includes('error') || metric.id.includes('cost')) 
        ? change < 0 
        : change > 0

    return {
      percent: percent.toFixed(1),
      isImprovement,
      isNeutral: change === 0
    }
  }

  const getMetricIcon = (metric: KPIMetric) => {
    const iconMap: Record<string, React.ReactNode> = {
      'agent-efficiency': <Brain className="w-5 h-5" />,
      'processing-speed': <Zap className="w-5 h-5" />,
      'accuracy-rate': <Target className="w-5 h-5" />,
      'cost-per-task': <DollarSign className="w-5 h-5" />,
      'user-satisfaction': <Users className="w-5 h-5" />,
      'system-uptime': <Activity className="w-5 h-5" />,
      'throughput': <BarChart3 className="w-5 h-5" />,
      'error-rate': <AlertTriangle className="w-5 h-5" />,
      'response-time': <Clock className="w-5 h-5" />,
      'resource-utilization': <Activity className="w-5 h-5" />,
      'cost-savings': <DollarSign className="w-5 h-5" />,
      'user-adoption': <Users className="w-5 h-5" />
    }
    return iconMap[metric.id] || <BarChart3 className="w-5 h-5" />
  }

  const getCategoryColor = (category: string) => {
    const colorMap = {
      performance: 'from-blue-500 to-blue-600',
      cost: 'from-green-500 to-green-600',
      quality: 'from-purple-500 to-purple-600',
      user: 'from-orange-500 to-orange-600'
    }
    return colorMap[category as keyof typeof colorMap] || 'from-gray-500 to-gray-600'
  }

  const getAlertSeverityColor = (severity: string) => {
    const colorMap = {
      low: 'bg-blue-100 text-blue-800 border-blue-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    }
    return colorMap[severity as keyof typeof colorMap] || colorMap.low
  }

  const handleExport = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      timeRange,
      organizationId,
      metrics: filteredMetrics,
      alerts: activeAlerts
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `metrics-dashboard-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <OptimizedComponentWrapper
      componentId={`advanced-metrics-${organizationId}`}
      enablePerformanceOptimization={true}
      enableAccessibilityEnhancements={true}
      ariaLabel={content[language].title}
      ariaDescription={content[language].subtitle}
      role="application"
    >
      <motion.div
        variants={motionSafe(staggerContainer)}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={motionSafe(slideUp)} className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {content[language].title}
            </h2>
            <p className="text-gray-600">{content[language].subtitle}</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(content[language].categories).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {/* Auto-refresh toggle */}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Auto-refresh</span>
            </label>

            {/* Export button */}
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              <span>{content[language].actions.export}</span>
            </button>
          </div>
        </motion.div>

        {/* Active Alerts */}
        <AnimatePresence>
          {showAlerts && activeAlerts.length > 0 && (
            <motion.div
              variants={motionSafe(fadeIn)}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-red-50 border border-red-200 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-red-900 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{content[language].alerts.title}</span>
                </h3>
                <button
                  onClick={() => setShowAlerts(false)}
                  className="text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${getAlertSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{alert.message}</span>
                      <span className="text-xs uppercase">
                        {content[language].alerts[alert.severity as keyof typeof content[typeof language]['alerts']]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Metrics Grid */}
        <motion.div variants={motionSafe(slideUp)}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredMetrics.map((metric) => {
              const trend = getTrendPercent(metric)
              
              return (
                <motion.div
                  key={metric.id}
                  variants={motionSafe(slideUp)}
                  className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => onMetricClick?.(metric)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 bg-gradient-to-r ${getCategoryColor(metric.category)} rounded-lg text-white`}>
                      {getMetricIcon(metric)}
                    </div>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(metric)}
                      <span className={`text-sm font-medium ${
                        trend.isNeutral ? 'text-gray-500' : 
                        trend.isImprovement ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {trend.percent}%
                      </span>
                    </div>
                  </div>

                  <div className="mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {formatValue(metric)}
                    </h3>
                    <p className="text-sm text-gray-600">{metric.name}</p>
                  </div>

                  {metric.target && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Target: {formatValue({...metric, value: metric.target})}</span>
                        <span>{((metric.value / metric.target) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            metric.value >= metric.target ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="capitalize">{metric.category}</span>
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      title={metric.description}
                    >
                      <Info className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Real-time Visualization */}
        <motion.div variants={motionSafe(slideUp)}>
          <RealtimeDataVisualization
            language={language}
            dashboardId={`metrics-${organizationId}`}
            onDataUpdate={(chartId, data) => {
              // Handle real-time data updates
              console.log(`Chart ${chartId} updated with ${data.length} points`)
            }}
          />
        </motion.div>
      </motion.div>
    </OptimizedComponentWrapper>
  )
}