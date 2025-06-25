'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motionSafe, slideUp, staggerContainer, fadeIn } from '@/lib/motion'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  Brain, 
  Activity,
  Globe,
  Clock,
  Target,
  Zap,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'
import AdvancedMetricsDashboard from '@/components/enterprise/AdvancedMetricsDashboard'

interface AnalyticsData {
  overview: {
    totalDocuments: number
    totalUsers: number
    totalAgents: number
    avgProcessingTime: number
    successRate: number
    costOptimization: number
  }
  trends: {
    documentProcessing: Array<{date: string, count: number, efficiency: number}>
    userActivity: Array<{date: string, activeUsers: number, newUsers: number}>
    agentPerformance: Array<{date: string, tasksCompleted: number, avgAccuracy: number}>
  }
  agentInsights: Array<{
    id: string
    name: string
    type: 'legal' | 'financial' | 'project' | 'research' | 'general'
    tasksCompleted: number
    accuracy: number
    efficiency: number
    costPerTask: number
    trend: 'up' | 'down' | 'stable'
  }>
  departmentBreakdown: Array<{
    department: string
    usage: number
    efficiency: number
    satisfaction: number
    costSavings: number
  }>
  realTimeMetrics: {
    activeAgents: number
    currentTasks: number
    queueLength: number
    systemLoad: number
    responseTime: number
  }
}

interface EnterpriseAnalyticsProps {
  language?: 'vi' | 'en'
}

function EnterpriseAnalytics({ language = 'en' }: EnterpriseAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  const chartRef = useRef<HTMLCanvasElement>(null)
  const realTimeInterval = useRef<NodeJS.Timeout>()
  
  const { user } = useAuth()

  const content = {
    vi: {
      title: 'Phân Tích Doanh Nghiệp',
      subtitle: 'Theo dõi hiệu suất và ROI của AI agents',
      overview: 'Tổng quan',
      trends: 'Xu hướng',
      agentInsights: 'Thông tin chi tiết Agent',
      departmentBreakdown: 'Phân tích theo bộ phận',
      realTimeMetrics: 'Chỉ số thời gian thực',
      timeRanges: {
        '7d': '7 ngày',
        '30d': '30 ngày', 
        '90d': '90 ngày',
        '1y': '1 năm'
      },
      metrics: {
        totalDocuments: 'Tổng tài liệu',
        totalUsers: 'Tổng người dùng',
        totalAgents: 'Tổng AI agents',
        avgProcessingTime: 'Thời gian xử lý TB',
        successRate: 'Tỷ lệ thành công',
        costOptimization: 'Tối ưu chi phí',
        activeAgents: 'Agents hoạt động',
        currentTasks: 'Tác vụ hiện tại',
        queueLength: 'Độ dài hàng đợi',
        systemLoad: 'Tải hệ thống',
        responseTime: 'Thời gian phản hồi'
      },
      actions: {
        refresh: 'Làm mới',
        export: 'Xuất dữ liệu',
        filter: 'Lọc',
        realTime: 'Thời gian thực'
      },
      charts: {
        documentProcessing: 'Xử lý tài liệu',
        userActivity: 'Hoạt động người dùng',
        agentPerformance: 'Hiệu suất Agent',
        efficiency: 'Hiệu suất',
        accuracy: 'Độ chính xác',
        tasks: 'Tác vụ',
        users: 'Người dùng'
      }
    },
    en: {
      title: 'Enterprise Analytics',
      subtitle: 'Track AI agent performance and ROI',
      overview: 'Overview',
      trends: 'Trends',
      agentInsights: 'Agent Insights',
      departmentBreakdown: 'Department Breakdown',
      realTimeMetrics: 'Real-time Metrics',
      timeRanges: {
        '7d': '7 days',
        '30d': '30 days',
        '90d': '90 days', 
        '1y': '1 year'
      },
      metrics: {
        totalDocuments: 'Total Documents',
        totalUsers: 'Total Users',
        totalAgents: 'Total AI Agents',
        avgProcessingTime: 'Avg Processing Time',
        successRate: 'Success Rate',
        costOptimization: 'Cost Optimization',
        activeAgents: 'Active Agents',
        currentTasks: 'Current Tasks',
        queueLength: 'Queue Length',
        systemLoad: 'System Load',
        responseTime: 'Response Time'
      },
      actions: {
        refresh: 'Refresh',
        export: 'Export Data',
        filter: 'Filter',
        realTime: 'Real-time'
      },
      charts: {
        documentProcessing: 'Document Processing',
        userActivity: 'User Activity',
        agentPerformance: 'Agent Performance',
        efficiency: 'Efficiency',
        accuracy: 'Accuracy',
        tasks: 'Tasks',
        users: 'Users'
      }
    }
  }

  // Fetch analytics data
  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedTimeRange, selectedDepartment])

  // Real-time metrics updates
  useEffect(() => {
    if (realTimeEnabled) {
      realTimeInterval.current = setInterval(() => {
        fetchRealTimeMetrics()
      }, 5000)
    } else {
      if (realTimeInterval.current) {
        clearInterval(realTimeInterval.current)
      }
    }

    return () => {
      if (realTimeInterval.current) {
        clearInterval(realTimeInterval.current)
      }
    }
  }, [realTimeEnabled])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [overviewRes, trendsRes, agentsRes, departmentsRes] = await Promise.all([
        fetch(`/api/analytics/overview?timeRange=${selectedTimeRange}&department=${selectedDepartment}`),
        fetch(`/api/analytics/trends?timeRange=${selectedTimeRange}&department=${selectedDepartment}`),
        fetch('/api/agents/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'get_performance_analytics',
            timeRange: selectedTimeRange,
            department: selectedDepartment
          })
        }),
        fetch(`/api/analytics/departments?timeRange=${selectedTimeRange}`)
      ])

      const [overviewData, trendsData, agentsData, departmentsData] = await Promise.all([
        overviewRes.json(),
        trendsRes.json(),
        agentsRes.json(),
        departmentsRes.json()
      ])

      // Mock data for comprehensive analytics
      const mockAnalyticsData: AnalyticsData = {
        overview: {
          totalDocuments: overviewData.data?.totalDocuments || 12547,
          totalUsers: overviewData.data?.totalUsers || 284,
          totalAgents: agentsData.success ? agentsData.data?.totalAgents || 15 : 15,
          avgProcessingTime: 4.2,
          successRate: 98.7,
          costOptimization: 34.5
        },
        trends: {
          documentProcessing: generateTrendData('documents', selectedTimeRange),
          userActivity: generateTrendData('users', selectedTimeRange),
          agentPerformance: generateTrendData('agents', selectedTimeRange)
        },
        agentInsights: [
          {
            id: 'legal-agent',
            name: language === 'vi' ? 'Agent Luật Sư' : 'Legal Agent',
            type: 'legal',
            tasksCompleted: 1247,
            accuracy: 97.8,
            efficiency: 92.5,
            costPerTask: 2.45,
            trend: 'up'
          },
          {
            id: 'financial-agent',
            name: language === 'vi' ? 'Agent Tài Chính' : 'Financial Agent',
            type: 'financial',
            tasksCompleted: 2156,
            accuracy: 96.2,
            efficiency: 89.7,
            costPerTask: 1.89,
            trend: 'up'
          },
          {
            id: 'research-agent',
            name: language === 'vi' ? 'Agent Nghiên Cứu' : 'Research Agent',
            type: 'research',
            tasksCompleted: 3421,
            accuracy: 94.8,
            efficiency: 91.2,
            costPerTask: 1.65,
            trend: 'stable'
          },
          {
            id: 'project-agent',
            name: language === 'vi' ? 'Agent Dự Án' : 'Project Agent',
            type: 'project',
            tasksCompleted: 967,
            accuracy: 95.5,
            efficiency: 87.3,
            costPerTask: 2.12,
            trend: 'down'
          }
        ],
        departmentBreakdown: [
          {
            department: language === 'vi' ? 'Pháp lý' : 'Legal',
            usage: 35.2,
            efficiency: 92.1,
            satisfaction: 4.7,
            costSavings: 45600
          },
          {
            department: language === 'vi' ? 'Tài chính' : 'Finance',
            usage: 28.7,
            efficiency: 89.4,
            satisfaction: 4.5,
            costSavings: 38200
          },
          {
            department: language === 'vi' ? 'Nghiên cứu' : 'Research',
            usage: 21.8,
            efficiency: 94.2,
            satisfaction: 4.8,
            costSavings: 29800
          },
          {
            department: language === 'vi' ? 'Dự án' : 'Operations',
            usage: 14.3,
            efficiency: 86.7,
            satisfaction: 4.3,
            costSavings: 21500
          }
        ],
        realTimeMetrics: {
          activeAgents: 8,
          currentTasks: 23,
          queueLength: 5,
          systemLoad: 67.5,
          responseTime: 245
        }
      }

      setAnalyticsData(mockAnalyticsData)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      setError(language === 'vi' ? 'Không thể tải dữ liệu phân tích' : 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const fetchRealTimeMetrics = async () => {
    try {
      const response = await fetch('/api/analytics/realtime')
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(prev => prev ? {
          ...prev,
          realTimeMetrics: {
            activeAgents: data.activeAgents || Math.floor(Math.random() * 5) + 6,
            currentTasks: data.currentTasks || Math.floor(Math.random() * 10) + 15,
            queueLength: data.queueLength || Math.floor(Math.random() * 8) + 2,
            systemLoad: data.systemLoad || 60 + Math.random() * 20,
            responseTime: data.responseTime || 200 + Math.random() * 100
          }
        } : prev)
      }
    } catch (error) {
      console.error('Failed to fetch real-time metrics:', error)
    }
  }

  const generateTrendData = (type: string, timeRange: string) => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
    const data = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      if (type === 'documents') {
        data.push({
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 50) + 20,
          efficiency: Math.random() * 20 + 80
        })
      } else if (type === 'users') {
        data.push({
          date: date.toISOString().split('T')[0],
          activeUsers: Math.floor(Math.random() * 30) + 15,
          newUsers: Math.floor(Math.random() * 8) + 2
        })
      } else if (type === 'agents') {
        data.push({
          date: date.toISOString().split('T')[0],
          tasksCompleted: Math.floor(Math.random() * 100) + 50,
          avgAccuracy: Math.random() * 10 + 90
        })
      }
    }
    
    return data
  }

  const handleExportData = () => {
    if (!analyticsData) return
    
    const dataToExport = {
      exportDate: new Date().toISOString(),
      timeRange: selectedTimeRange,
      department: selectedDepartment,
      ...analyticsData
    }
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `enterprise-analytics-${selectedTimeRange}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getMetricColor = (value: number, isGood: boolean = true) => {
    if (isGood) {
      return value >= 90 ? 'text-green-600' : value >= 70 ? 'text-yellow-600' : 'text-red-600'
    } else {
      return value <= 30 ? 'text-green-600' : value <= 60 ? 'text-yellow-600' : 'text-red-600'
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <DashboardLayout language={language}>
        <div className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout language={language}>
        <div className="p-8">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchAnalyticsData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {content[language].actions.refresh}
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout language={language}>
      <motion.div
        variants={motionSafe(staggerContainer)}
        initial="hidden"
        animate="visible"
        className="p-8 space-y-8"
      >
        {/* Header */}
        <motion.div variants={motionSafe(slideUp)} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {content[language].title}
            </h1>
            <p className="text-gray-600">{content[language].subtitle}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(content[language].timeRanges).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {/* Real-time Toggle */}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={realTimeEnabled}
                onChange={(e) => setRealTimeEnabled(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">{content[language].actions.realTime}</span>
            </label>

            {/* Action Buttons */}
            <button
              onClick={fetchAnalyticsData}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{content[language].actions.refresh}</span>
            </button>
            
            <button
              onClick={handleExportData}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              <span>{content[language].actions.export}</span>
            </button>
          </div>
        </motion.div>

        {/* Overview Metrics */}
        <motion.div variants={motionSafe(slideUp)}>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {content[language].overview}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">+18%</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {analyticsData?.overview.totalDocuments.toLocaleString()}
              </h3>
              <p className="text-sm text-gray-600">{content[language].metrics.totalDocuments}</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">+12%</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {analyticsData?.overview.totalUsers.toLocaleString()}
              </h3>
              <p className="text-sm text-gray-600">{content[language].metrics.totalUsers}</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm text-blue-600 font-medium">Active</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {analyticsData?.overview.totalAgents}
              </h3>
              <p className="text-sm text-gray-600">{content[language].metrics.totalAgents}</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">-8%</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {analyticsData?.overview.avgProcessingTime}s
              </h3>
              <p className="text-sm text-gray-600">{content[language].metrics.avgProcessingTime}</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <span className={`text-sm font-medium ${getMetricColor(analyticsData?.overview.successRate || 0)}`}>
                  {analyticsData?.overview.successRate}%
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {analyticsData?.overview.successRate}%
              </h3>
              <p className="text-sm text-gray-600">{content[language].metrics.successRate}</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Zap className="w-6 h-6 text-indigo-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">
                  +{analyticsData?.overview.costOptimization}%
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                ${analyticsData?.overview.costOptimization}K
              </h3>
              <p className="text-sm text-gray-600">{content[language].metrics.costOptimization}</p>
            </div>
          </div>
        </motion.div>

        {/* Real-time Metrics */}
        <AnimatePresence>
          {realTimeEnabled && (
            <motion.div
              variants={motionSafe(fadeIn)}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span>{content[language].realTimeMetrics}</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analyticsData?.realTimeMetrics.activeAgents}
                  </div>
                  <div className="text-sm text-gray-600">{content[language].metrics.activeAgents}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analyticsData?.realTimeMetrics.currentTasks}
                  </div>
                  <div className="text-sm text-gray-600">{content[language].metrics.currentTasks}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {analyticsData?.realTimeMetrics.queueLength}
                  </div>
                  <div className="text-sm text-gray-600">{content[language].metrics.queueLength}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                  <div className={`text-2xl font-bold ${getMetricColor(analyticsData?.realTimeMetrics.systemLoad || 0, false)}`}>
                    {Math.round(analyticsData?.realTimeMetrics.systemLoad || 0)}%
                  </div>
                  <div className="text-sm text-gray-600">{content[language].metrics.systemLoad}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                  <div className={`text-2xl font-bold ${getMetricColor(300 - (analyticsData?.realTimeMetrics.responseTime || 0))}`}>
                    {Math.round(analyticsData?.realTimeMetrics.responseTime || 0)}ms
                  </div>
                  <div className="text-sm text-gray-600">{content[language].metrics.responseTime}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agent Insights */}
        <motion.div variants={motionSafe(slideUp)}>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {content[language].agentInsights}
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{content[language].charts.tasks}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{content[language].charts.accuracy}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{content[language].charts.efficiency}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost/Task</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analyticsData?.agentInsights.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{agent.name}</div>
                            <div className="text-sm text-gray-500 capitalize">{agent.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {agent.tasksCompleted.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm font-medium ${getMetricColor(agent.accuracy)}`}>
                          {agent.accuracy}%
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm font-medium ${getMetricColor(agent.efficiency)}`}>
                          {agent.efficiency}%
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">${agent.costPerTask}</div>
                      </td>
                      <td className="px-6 py-4">
                        {getTrendIcon(agent.trend)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Department Breakdown */}
        <motion.div variants={motionSafe(slideUp)}>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {content[language].departmentBreakdown}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {analyticsData?.departmentBreakdown.map((dept) => (
              <div key={dept.department} className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">{dept.department}</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Usage</span>
                      <span className="font-medium">{dept.usage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${dept.usage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Efficiency</span>
                      <span className={`font-medium ${getMetricColor(dept.efficiency)}`}>
                        {dept.efficiency}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${dept.efficiency}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-sm text-gray-600">Cost Savings</div>
                    <div className="text-lg font-bold text-green-600">
                      ${dept.costSavings.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Advanced Metrics Dashboard */}
        <motion.div variants={motionSafe(slideUp)}>
          <AdvancedMetricsDashboard
            language={language}
            organizationId="enterprise"
            timeRange={selectedTimeRange}
            onMetricClick={(metric) => {
              console.log('Metric clicked:', metric)
              // Could navigate to detailed metric view
            }}
            onAlertTriggered={(alert) => {
              console.log('Alert triggered:', alert)
              // Could show notification or take action
            }}
          />
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default function EnterpriseAnalyticsPage() {
  return <EnterpriseAnalytics />
}