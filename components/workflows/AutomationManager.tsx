'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Calendar,
  Clock,
  Repeat,
  Users,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Filter,
  Search,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Eye,
  MoreVertical
} from 'lucide-react'
import { motionSafe, slideUp, staggerContainer, fadeIn } from '@/lib/motion'
import OptimizedComponentWrapper from '@/components/optimization/OptimizedComponentWrapper'

interface AutomationRule {
  id: string
  name: string
  description: string
  workflowId: string
  workflowName: string
  trigger: {
    type: 'schedule' | 'event' | 'webhook' | 'file_upload' | 'manual'
    config: Record<string, any>
    isActive: boolean
  }
  conditions: Array<{
    id: string
    field: string
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists'
    value: any
  }>
  actions: Array<{
    id: string
    type: 'run_workflow' | 'send_notification' | 'update_database' | 'call_webhook'
    config: Record<string, any>
  }>
  schedule?: {
    type: 'once' | 'recurring'
    startDate: string
    endDate?: string
    recurrence: {
      frequency: 'daily' | 'weekly' | 'monthly'
      interval: number
      daysOfWeek?: number[]
      dayOfMonth?: number
      time: string
    }
  }
  status: 'active' | 'paused' | 'disabled'
  stats: {
    totalRuns: number
    successfulRuns: number
    failedRuns: number
    lastRun?: string
    nextRun?: string
    averageExecutionTime: number
  }
  createdAt: string
  updatedAt: string
  createdBy: string
}

interface AutomationExecution {
  id: string
  ruleId: string
  ruleName: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  startTime: string
  endTime?: string
  duration?: number
  triggeredBy: 'schedule' | 'manual' | 'event'
  input: Record<string, any>
  output?: Record<string, any>
  error?: string
  logs: Array<{
    timestamp: string
    level: 'info' | 'warning' | 'error'
    message: string
  }>
}

interface AutomationManagerProps {
  language?: 'vi' | 'en'
  onCreateRule?: () => void
  onEditRule?: (rule: AutomationRule) => void
}

export default function AutomationManager({
  language = 'en',
  onCreateRule,
  onEditRule
}: AutomationManagerProps) {
  const [activeTab, setActiveTab] = useState<'rules' | 'executions' | 'analytics'>('rules')
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([])
  const [executions, setExecutions] = useState<AutomationExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [triggerFilter, setTriggerFilter] = useState<string>('all')
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null)
  const [showRuleModal, setShowRuleModal] = useState(false)

  const content = {
    vi: {
      title: 'Automation Manager',
      subtitle: 'Quản lý và theo dõi automation rules',
      tabs: {
        rules: 'Automation Rules',
        executions: 'Execution History',
        analytics: 'Analytics'
      },
      status: {
        all: 'Tất cả',
        active: 'Đang hoạt động',
        paused: 'Tạm dừng',
        disabled: 'Vô hiệu',
        running: 'Đang chạy',
        completed: 'Hoàn thành',
        failed: 'Thất bại',
        cancelled: 'Đã hủy'
      },
      triggers: {
        all: 'Tất cả triggers',
        schedule: 'Lịch trình',
        event: 'Sự kiện',
        webhook: 'Webhook',
        file_upload: 'Upload file',
        manual: 'Thủ công'
      },
      actions: {
        create: 'Tạo Rule',
        edit: 'Chỉnh sửa',
        delete: 'Xóa',
        duplicate: 'Sao chép',
        run: 'Chạy ngay',
        pause: 'Tạm dừng',
        resume: 'Tiếp tục',
        view: 'Xem',
        enable: 'Kích hoạt',
        disable: 'Vô hiệu'
      },
      metrics: {
        totalRules: 'Tổng Rules',
        activeRules: 'Rules hoạt động',
        totalExecutions: 'Tổng executions',
        successRate: 'Tỷ lệ thành công',
        averageTime: 'Thời gian TB',
        lastRun: 'Chạy lần cuối',
        nextRun: 'Chạy tiếp theo',
        duration: 'Thời lượng',
        triggeredBy: 'Kích hoạt bởi'
      },
      frequencies: {
        daily: 'Hàng ngày',
        weekly: 'Hàng tuần',
        monthly: 'Hàng tháng'
      },
      placeholder: {
        search: 'Tìm kiếm automation rules...',
        noRules: 'Chưa có automation rules',
        noExecutions: 'Chưa có execution history'
      }
    },
    en: {
      title: 'Automation Manager',
      subtitle: 'Manage and monitor automation rules',
      tabs: {
        rules: 'Automation Rules',
        executions: 'Execution History',
        analytics: 'Analytics'
      },
      status: {
        all: 'All',
        active: 'Active',
        paused: 'Paused',
        disabled: 'Disabled',
        running: 'Running',
        completed: 'Completed',
        failed: 'Failed',
        cancelled: 'Cancelled'
      },
      triggers: {
        all: 'All Triggers',
        schedule: 'Schedule',
        event: 'Event',
        webhook: 'Webhook',
        file_upload: 'File Upload',
        manual: 'Manual'
      },
      actions: {
        create: 'Create Rule',
        edit: 'Edit',
        delete: 'Delete',
        duplicate: 'Duplicate',
        run: 'Run Now',
        pause: 'Pause',
        resume: 'Resume',
        view: 'View',
        enable: 'Enable',
        disable: 'Disable'
      },
      metrics: {
        totalRules: 'Total Rules',
        activeRules: 'Active Rules',
        totalExecutions: 'Total Executions',
        successRate: 'Success Rate',
        averageTime: 'Avg Time',
        lastRun: 'Last Run',
        nextRun: 'Next Run',
        duration: 'Duration',
        triggeredBy: 'Triggered By'
      },
      frequencies: {
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly'
      },
      placeholder: {
        search: 'Search automation rules...',
        noRules: 'No automation rules found',
        noExecutions: 'No execution history'
      }
    }
  }

  useEffect(() => {
    fetchAutomationData()
  }, [])

  const fetchAutomationData = async () => {
    try {
      setLoading(true)

      // Mock automation rules data
      const mockRules: AutomationRule[] = [
        {
          id: 'rule-1',
          name: language === 'vi' ? 'Xử lý hợp đồng tự động' : 'Automatic Contract Processing',
          description: language === 'vi' 
            ? 'Tự động xử lý hợp đồng mới khi được upload'
            : 'Automatically process new contracts when uploaded',
          workflowId: 'workflow-1',
          workflowName: 'Contract Analysis Workflow',
          trigger: {
            type: 'file_upload',
            config: {
              fileTypes: ['pdf', 'docx'],
              folder: '/contracts'
            },
            isActive: true
          },
          conditions: [
            {
              id: 'cond-1',
              field: 'file.size',
              operator: 'less_than',
              value: 10485760 // 10MB
            },
            {
              id: 'cond-2',
              field: 'file.name',
              operator: 'contains',
              value: 'contract'
            }
          ],
          actions: [
            {
              id: 'action-1',
              type: 'run_workflow',
              config: {
                workflowId: 'workflow-1',
                parameters: {
                  documentFile: '${trigger.file}'
                }
              }
            },
            {
              id: 'action-2',
              type: 'send_notification',
              config: {
                recipient: 'legal@company.com',
                subject: 'New contract processed',
                template: 'contract_analysis_complete'
              }
            }
          ],
          status: 'active',
          stats: {
            totalRuns: 47,
            successfulRuns: 45,
            failedRuns: 2,
            lastRun: '2024-06-25T10:30:00Z',
            averageExecutionTime: 156
          },
          createdAt: '2024-05-15T09:00:00Z',
          updatedAt: '2024-06-20T14:30:00Z',
          createdBy: 'admin'
        },
        {
          id: 'rule-2',
          name: language === 'vi' ? 'Báo cáo tài chính hàng ngày' : 'Daily Financial Report',
          description: language === 'vi'
            ? 'Tạo báo cáo tài chính tự động mỗi ngày'
            : 'Generate automated financial reports daily',
          workflowId: 'workflow-2',
          workflowName: 'Financial Report Generation',
          trigger: {
            type: 'schedule',
            config: {},
            isActive: true
          },
          conditions: [],
          actions: [
            {
              id: 'action-3',
              type: 'run_workflow',
              config: {
                workflowId: 'workflow-2',
                parameters: {
                  reportDate: '${today}'
                }
              }
            }
          ],
          schedule: {
            type: 'recurring',
            startDate: '2024-06-01',
            recurrence: {
              frequency: 'daily',
              interval: 1,
              time: '08:00'
            }
          },
          status: 'active',
          stats: {
            totalRuns: 25,
            successfulRuns: 24,
            failedRuns: 1,
            lastRun: '2024-06-25T08:00:00Z',
            nextRun: '2024-06-26T08:00:00Z',
            averageExecutionTime: 320
          },
          createdAt: '2024-06-01T10:00:00Z',
          updatedAt: '2024-06-20T16:00:00Z',
          createdBy: 'finance_team'
        },
        {
          id: 'rule-3',
          name: language === 'vi' ? 'Cảnh báo nghiên cứu thị trường' : 'Market Research Alert',
          description: language === 'vi'
            ? 'Thông báo khi có dữ liệu thị trường mới'
            : 'Alert when new market data is available',
          workflowId: 'workflow-3',
          workflowName: 'Market Research Analysis',
          trigger: {
            type: 'webhook',
            config: {
              url: '/api/webhooks/market-data',
              secret: 'webhook_secret_123'
            },
            isActive: true
          },
          conditions: [
            {
              id: 'cond-3',
              field: 'data.market',
              operator: 'equals',
              value: 'technology'
            }
          ],
          actions: [
            {
              id: 'action-4',
              type: 'run_workflow',
              config: {
                workflowId: 'workflow-3',
                parameters: {
                  marketData: '${webhook.payload}'
                }
              }
            }
          ],
          status: 'paused',
          stats: {
            totalRuns: 12,
            successfulRuns: 11,
            failedRuns: 1,
            lastRun: '2024-06-23T15:45:00Z',
            averageExecutionTime: 89
          },
          createdAt: '2024-06-10T11:00:00Z',
          updatedAt: '2024-06-24T09:30:00Z',
          createdBy: 'research_team'
        }
      ]

      // Mock execution history
      const mockExecutions: AutomationExecution[] = [
        {
          id: 'exec-1',
          ruleId: 'rule-1',
          ruleName: mockRules[0].name,
          status: 'completed',
          startTime: '2024-06-25T10:30:00Z',
          endTime: '2024-06-25T10:32:36Z',
          duration: 156,
          triggeredBy: 'event',
          input: {
            file: {
              name: 'service_agreement_2024.pdf',
              size: 2457600,
              type: 'application/pdf'
            }
          },
          output: {
            analysisResult: {
              contractType: 'service_agreement',
              parties: ['Company A', 'Company B'],
              terms: 12,
              riskLevel: 'low'
            }
          },
          logs: [
            {
              timestamp: '2024-06-25T10:30:00Z',
              level: 'info',
              message: 'Automation rule triggered by file upload'
            },
            {
              timestamp: '2024-06-25T10:30:15Z',
              level: 'info',
              message: 'Starting workflow execution'
            },
            {
              timestamp: '2024-06-25T10:32:36Z',
              level: 'info',
              message: 'Workflow completed successfully'
            }
          ]
        },
        {
          id: 'exec-2',
          ruleId: 'rule-2',
          ruleName: mockRules[1].name,
          status: 'completed',
          startTime: '2024-06-25T08:00:00Z',
          endTime: '2024-06-25T08:05:20Z',
          duration: 320,
          triggeredBy: 'schedule',
          input: {
            reportDate: '2024-06-25'
          },
          output: {
            report: {
              totalRevenue: 125000,
              totalExpenses: 78000,
              profit: 47000,
              reportUrl: '/reports/financial_2024-06-25.pdf'
            }
          },
          logs: [
            {
              timestamp: '2024-06-25T08:00:00Z',
              level: 'info',
              message: 'Scheduled automation triggered'
            },
            {
              timestamp: '2024-06-25T08:05:20Z',
              level: 'info',
              message: 'Financial report generated successfully'
            }
          ]
        },
        {
          id: 'exec-3',
          ruleId: 'rule-1',
          ruleName: mockRules[0].name,
          status: 'failed',
          startTime: '2024-06-24T14:15:00Z',
          endTime: '2024-06-24T14:16:30Z',
          duration: 90,
          triggeredBy: 'event',
          input: {
            file: {
              name: 'corrupted_file.pdf',
              size: 1024,
              type: 'application/pdf'
            }
          },
          error: 'Failed to parse PDF file: File appears to be corrupted',
          logs: [
            {
              timestamp: '2024-06-24T14:15:00Z',
              level: 'info',
              message: 'Automation rule triggered by file upload'
            },
            {
              timestamp: '2024-06-24T14:16:30Z',
              level: 'error',
              message: 'Failed to parse PDF file: File appears to be corrupted'
            }
          ]
        }
      ]

      setAutomationRules(mockRules)
      setExecutions(mockExecutions)
    } catch (error) {
      console.error('Failed to fetch automation data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRules = automationRules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rule.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || rule.status === statusFilter
    const matchesTrigger = triggerFilter === 'all' || rule.trigger.type === triggerFilter

    return matchesSearch && matchesStatus && matchesTrigger
  })

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      disabled: 'bg-gray-100 text-gray-800',
      running: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || colors.active
  }

  const getTriggerIcon = (type: string) => {
    const icons = {
      schedule: <Calendar className="w-4 h-4" />,
      event: <TrendingUp className="w-4 h-4" />,
      webhook: <Settings className="w-4 h-4" />,
      file_upload: <FileText className="w-4 h-4" />,
      manual: <Users className="w-4 h-4" />
    }
    return icons[type as keyof typeof icons] || <Settings className="w-4 h-4" />
  }

  const handleToggleRule = (ruleId: string) => {
    setAutomationRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { 
            ...rule, 
            status: rule.status === 'active' ? 'paused' : 'active',
            updatedAt: new Date().toISOString()
          }
        : rule
    ))
  }

  const handleRunRule = (ruleId: string) => {
    console.log('Running automation rule:', ruleId)
    // Would trigger manual execution
  }

  const handleDeleteRule = (ruleId: string) => {
    setAutomationRules(prev => prev.filter(rule => rule.id !== ruleId))
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatLastRun = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else {
      return `${diffDays}d ago`
    }
  }

  return (
    <OptimizedComponentWrapper
      componentId="automation-manager"
      enablePerformanceOptimization={true}
      enableAccessibilityEnhancements={true}
      ariaLabel={content[language].title}
      ariaDescription={content[language].subtitle}
    >
      <motion.div
        variants={motionSafe(staggerContainer)}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={motionSafe(slideUp)} className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {content[language].title}
            </h2>
            <p className="text-gray-600">{content[language].subtitle}</p>
          </div>

          <button
            onClick={onCreateRule}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>{content[language].actions.create}</span>
          </button>
        </motion.div>

        {/* Overview Stats */}
        <motion.div variants={motionSafe(slideUp)}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">+3</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{automationRules.length}</h3>
              <p className="text-sm text-gray-600">{content[language].metrics.totalRules}</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm text-blue-600 font-medium">Live</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {automationRules.filter(r => r.status === 'active').length}
              </h3>
              <p className="text-sm text-gray-600">{content[language].metrics.activeRules}</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">+15</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{executions.length}</h3>
              <p className="text-sm text-gray-600">{content[language].metrics.totalExecutions}</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">96%</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">96%</h3>
              <p className="text-sm text-gray-600">{content[language].metrics.successRate}</p>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div variants={motionSafe(slideUp)}>
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {(['rules', 'executions', 'analytics'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {content[language].tabs[tab]}
                </button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'rules' && (
            <motion.div
              key="rules"
              variants={motionSafe(fadeIn)}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-6"
            >
              {/* Filters */}
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder={content[language].placeholder.search}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(content[language].status).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>

                  <select
                    value={triggerFilter}
                    onChange={(e) => setTriggerFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(content[language].triggers).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {filteredRules.length} rules
                  </span>
                </div>
              </div>

              {/* Rules List */}
              <div className="space-y-4">
                {filteredRules.map((rule) => (
                  <motion.div
                    key={rule.id}
                    variants={motionSafe(slideUp)}
                    className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-lg ${getStatusColor(rule.status)}`}>
                              {content[language].status[rule.status]}
                            </span>
                            <div className="flex items-center space-x-1 text-gray-500">
                              {getTriggerIcon(rule.trigger.type)}
                              <span className="text-sm">{content[language].triggers[rule.trigger.type]}</span>
                            </div>
                          </div>
                          <p className="text-gray-600 mb-3">{rule.description}</p>
                          <div className="text-sm text-gray-500">
                            Workflow: {rule.workflowName}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleRunRule(rule.id)}
                            className="p-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50"
                            title={content[language].actions.run}
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleRule(rule.id)}
                            className="p-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                            title={rule.status === 'active' ? content[language].actions.pause : content[language].actions.resume}
                          >
                            {rule.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => onEditRule?.(rule)}
                            className="p-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                            title={content[language].actions.edit}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                            title={content[language].actions.delete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">{content[language].metrics.totalRuns}:</span>
                          <span className="ml-1 font-medium">{rule.stats.totalRuns}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">{content[language].metrics.successRate}:</span>
                          <span className="ml-1 font-medium">
                            {Math.round((rule.stats.successfulRuns / rule.stats.totalRuns) * 100)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">{content[language].metrics.lastRun}:</span>
                          <span className="ml-1 font-medium">
                            {rule.stats.lastRun ? formatLastRun(rule.stats.lastRun) : 'Never'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">{content[language].metrics.averageTime}:</span>
                          <span className="ml-1 font-medium">{formatDuration(rule.stats.averageExecutionTime)}</span>
                        </div>
                      </div>

                      {rule.schedule && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-2 text-sm text-blue-800">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {content[language].frequencies[rule.schedule.recurrence.frequency]} at {rule.schedule.recurrence.time}
                            </span>
                            {rule.stats.nextRun && (
                              <span>• Next: {new Date(rule.stats.nextRun).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredRules.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">{content[language].placeholder.noRules}</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'executions' && (
            <motion.div
              key="executions"
              variants={motionSafe(fadeIn)}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Execution History</h3>
              </div>

              {executions.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {executions.map((execution) => (
                    <div key={execution.id} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">{execution.ruleName}</h4>
                          <p className="text-sm text-gray-500">
                            Started {new Date(execution.startTime).toLocaleString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 text-sm font-medium rounded-lg ${getStatusColor(execution.status)}`}>
                          {content[language].status[execution.status]}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-500">{content[language].metrics.duration}:</span>
                          <span className="ml-1 font-medium">
                            {execution.duration ? formatDuration(execution.duration) : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">{content[language].metrics.triggeredBy}:</span>
                          <span className="ml-1 font-medium capitalize">{execution.triggeredBy}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Logs:</span>
                          <span className="ml-1 font-medium">{execution.logs.length} entries</span>
                        </div>
                        <div className="flex justify-end">
                          <button className="text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>

                      {execution.error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                            <div>
                              <div className="text-sm font-medium text-red-800">Error</div>
                              <div className="text-sm text-red-700">{execution.error}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">{content[language].placeholder.noExecutions}</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              variants={motionSafe(fadeIn)}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Dashboard</h3>
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Analytics charts and insights would be displayed here</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </OptimizedComponentWrapper>
  )
}