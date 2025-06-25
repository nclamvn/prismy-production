'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motionSafe, slideUp, staggerContainer, fadeIn } from '@/lib/motion'
import { 
  Workflow, 
  Plus, 
  Play, 
  Pause, 
  Settings, 
  Calendar,
  Clock,
  Users,
  FileText,
  Brain,
  Zap,
  BarChart3,
  Filter,
  Search,
  Star,
  Download,
  Upload,
  Edit3,
  Trash2,
  Copy,
  Eye,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react'
import WorkflowBuilder from '@/components/workflows/WorkflowBuilder'
import TemplateMarketplace from '@/components/workflows/TemplateMarketplace'
import AutomationManager from '@/components/workflows/AutomationManager'

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: 'document' | 'legal' | 'financial' | 'research' | 'custom'
  tags: string[]
  complexity: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  usageCount: number
  rating: number
  author: string
  isPublic: boolean
  isFeatured: boolean
  steps: WorkflowStep[]
  variables: WorkflowVariable[]
  createdAt: string
  updatedAt: string
}

interface WorkflowStep {
  id: string
  type: 'agent' | 'condition' | 'action' | 'delay' | 'webhook'
  name: string
  description: string
  config: Record<string, any>
  position: { x: number, y: number }
  connections: string[]
}

interface WorkflowVariable {
  id: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'file' | 'array'
  defaultValue?: any
  required: boolean
  description: string
}

interface ActiveWorkflow {
  id: string
  templateId: string
  name: string
  status: 'running' | 'paused' | 'completed' | 'failed'
  progress: number
  startedAt: string
  lastActivity: string
  currentStep: string
  executionTime: number
  instanceCount: number
}

interface WorkflowsPageProps {
  language?: 'vi' | 'en'
}

function WorkflowsPage({ language = 'en' }: WorkflowsPageProps) {
  const [activeTab, setActiveTab] = useState<'builder' | 'marketplace' | 'automation' | 'active'>('marketplace')
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [activeWorkflows, setActiveWorkflows] = useState<ActiveWorkflow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all')

  const { user } = useAuth()

  const content = {
    vi: {
      title: 'Workflows & Automation',
      subtitle: 'Tạo và quản lý quy trình tự động thông minh',
      tabs: {
        marketplace: 'Template Marketplace',
        builder: 'Workflow Builder',
        automation: 'Automation Manager',
        active: 'Active Workflows'
      },
      categories: {
        all: 'Tất cả',
        document: 'Tài liệu',
        legal: 'Pháp lý',
        financial: 'Tài chính',
        research: 'Nghiên cứu',
        custom: 'Tùy chỉnh'
      },
      complexity: {
        all: 'Tất cả mức độ',
        beginner: 'Cơ bản',
        intermediate: 'Trung cấp',
        advanced: 'Nâng cao'
      },
      status: {
        running: 'Đang chạy',
        paused: 'Tạm dừng',
        completed: 'Hoàn thành',
        failed: 'Thất bại'
      },
      actions: {
        create: 'Tạo mới',
        edit: 'Chỉnh sửa',
        clone: 'Sao chép',
        delete: 'Xóa',
        run: 'Chạy',
        pause: 'Tạm dừng',
        stop: 'Dừng',
        view: 'Xem',
        export: 'Xuất',
        import: 'Nhập',
        share: 'Chia sẻ'
      },
      metrics: {
        totalTemplates: 'Tổng templates',
        activeWorkflows: 'Workflows đang chạy',
        completedToday: 'Hoàn thành hôm nay',
        averageTime: 'Thời gian trung bình',
        successRate: 'Tỷ lệ thành công',
        usageCount: 'Lượt sử dụng',
        rating: 'Đánh giá',
        estimatedTime: 'Thời gian ước tính'
      },
      placeholder: {
        search: 'Tìm kiếm templates...',
        noResults: 'Không tìm thấy kết quả',
        noWorkflows: 'Chưa có workflow nào đang chạy'
      }
    },
    en: {
      title: 'Workflows & Automation',
      subtitle: 'Create and manage intelligent automation workflows',
      tabs: {
        marketplace: 'Template Marketplace',
        builder: 'Workflow Builder',
        automation: 'Automation Manager',
        active: 'Active Workflows'
      },
      categories: {
        all: 'All',
        document: 'Document',
        legal: 'Legal',
        financial: 'Financial',
        research: 'Research',
        custom: 'Custom'
      },
      complexity: {
        all: 'All Levels',
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced'
      },
      status: {
        running: 'Running',
        paused: 'Paused',
        completed: 'Completed',
        failed: 'Failed'
      },
      actions: {
        create: 'Create New',
        edit: 'Edit',
        clone: 'Clone',
        delete: 'Delete',
        run: 'Run',
        pause: 'Pause',
        stop: 'Stop',
        view: 'View',
        export: 'Export',
        import: 'Import',
        share: 'Share'
      },
      metrics: {
        totalTemplates: 'Total Templates',
        activeWorkflows: 'Active Workflows',
        completedToday: 'Completed Today',
        averageTime: 'Average Time',
        successRate: 'Success Rate',
        usageCount: 'Usage Count',
        rating: 'Rating',
        estimatedTime: 'Estimated Time'
      },
      placeholder: {
        search: 'Search templates...',
        noResults: 'No results found',
        noWorkflows: 'No active workflows'
      }
    }
  }

  useEffect(() => {
    fetchWorkflowData()
  }, [])

  const fetchWorkflowData = async () => {
    try {
      setLoading(true)

      // Mock templates data
      const mockTemplates: WorkflowTemplate[] = [
        {
          id: 'template-1',
          name: language === 'vi' ? 'Xử Lý Tài Liệu Hợp Đồng' : 'Contract Document Processing',
          description: language === 'vi' 
            ? 'Workflow tự động phân tích, trích xuất thông tin quan trọng từ hợp đồng và tạo báo cáo tóm tắt'
            : 'Automated workflow to analyze, extract key information from contracts and generate summary reports',
          category: 'legal',
          tags: ['contract', 'analysis', 'extraction', 'legal'],
          complexity: 'intermediate',
          estimatedTime: '15-30 min',
          usageCount: 1247,
          rating: 4.8,
          author: 'Legal Team',
          isPublic: true,
          isFeatured: true,
          steps: [
            {
              id: 'step-1',
              type: 'agent',
              name: 'Legal Agent Analysis',
              description: 'Analyze contract terms and conditions',
              config: { agentType: 'legal', analysisType: 'contract' },
              position: { x: 100, y: 100 },
              connections: ['step-2']
            },
            {
              id: 'step-2',
              type: 'action',
              name: 'Generate Report',
              description: 'Create comprehensive contract analysis report',
              config: { reportType: 'contract_analysis', format: 'pdf' },
              position: { x: 300, y: 100 },
              connections: []
            }
          ],
          variables: [
            {
              id: 'var-1',
              name: 'contractFile',
              type: 'file',
              required: true,
              description: 'Contract document to analyze'
            }
          ],
          createdAt: '2024-01-15',
          updatedAt: '2024-06-20'
        },
        {
          id: 'template-2',
          name: language === 'vi' ? 'Phân Tích Báo Cáo Tài Chính' : 'Financial Report Analysis',
          description: language === 'vi'
            ? 'Workflow tự động phân tích báo cáo tài chính, tính toán các chỉ số và đưa ra insights'
            : 'Automated workflow to analyze financial reports, calculate metrics and provide insights',
          category: 'financial',
          tags: ['finance', 'analysis', 'metrics', 'reporting'],
          complexity: 'advanced',
          estimatedTime: '45-60 min',
          usageCount: 892,
          rating: 4.6,
          author: 'Finance Team',
          isPublic: true,
          isFeatured: true,
          steps: [
            {
              id: 'step-1',
              type: 'agent',
              name: 'Financial Agent',
              description: 'Analyze financial data and metrics',
              config: { agentType: 'financial', analysisDepth: 'comprehensive' },
              position: { x: 100, y: 100 },
              connections: ['step-2', 'step-3']
            },
            {
              id: 'step-2',
              type: 'action',
              name: 'Calculate KPIs',
              description: 'Calculate key financial performance indicators',
              config: { kpiTypes: ['roi', 'profit_margin', 'liquidity'] },
              position: { x: 300, y: 50 },
              connections: ['step-4']
            },
            {
              id: 'step-3',
              type: 'action',
              name: 'Risk Assessment',
              description: 'Assess financial risks and opportunities',
              config: { riskCategories: ['market', 'credit', 'operational'] },
              position: { x: 300, y: 150 },
              connections: ['step-4']
            },
            {
              id: 'step-4',
              type: 'action',
              name: 'Generate Dashboard',
              description: 'Create interactive financial dashboard',
              config: { dashboardType: 'executive', includeCharts: true },
              position: { x: 500, y: 100 },
              connections: []
            }
          ],
          variables: [
            {
              id: 'var-1',
              name: 'financialData',
              type: 'file',
              required: true,
              description: 'Financial report or data file'
            },
            {
              id: 'var-2',
              name: 'reportPeriod',
              type: 'string',
              defaultValue: 'quarterly',
              required: false,
              description: 'Reporting period (monthly, quarterly, annual)'
            }
          ],
          createdAt: '2024-02-10',
          updatedAt: '2024-06-18'
        },
        {
          id: 'template-3',
          name: language === 'vi' ? 'Nghiên Cứu Thị Trường Tự Động' : 'Automated Market Research',
          description: language === 'vi'
            ? 'Workflow thu thập và phân tích dữ liệu thị trường từ nhiều nguồn khác nhau'
            : 'Workflow to collect and analyze market data from multiple sources',
          category: 'research',
          tags: ['research', 'market', 'analysis', 'data'],
          complexity: 'beginner',
          estimatedTime: '30-45 min',
          usageCount: 567,
          rating: 4.4,
          author: 'Research Team',
          isPublic: true,
          isFeatured: false,
          steps: [
            {
              id: 'step-1',
              type: 'agent',
              name: 'Research Agent',
              description: 'Gather market research data',
              config: { agentType: 'research', sources: ['web', 'reports', 'apis'] },
              position: { x: 100, y: 100 },
              connections: ['step-2']
            },
            {
              id: 'step-2',
              type: 'action',
              name: 'Data Analysis',
              description: 'Analyze collected market data',
              config: { analysisType: 'trend_analysis', includeForecasting: true },
              position: { x: 300, y: 100 },
              connections: ['step-3']
            },
            {
              id: 'step-3',
              type: 'action',
              name: 'Generate Insights',
              description: 'Create market insights and recommendations',
              config: { insightType: 'strategic', includeRecommendations: true },
              position: { x: 500, y: 100 },
              connections: []
            }
          ],
          variables: [
            {
              id: 'var-1',
              name: 'marketSegment',
              type: 'string',
              required: true,
              description: 'Target market segment to research'
            },
            {
              id: 'var-2',
              name: 'geographicScope',
              type: 'string',
              defaultValue: 'global',
              required: false,
              description: 'Geographic scope of research'
            }
          ],
          createdAt: '2024-03-05',
          updatedAt: '2024-06-15'
        }
      ]

      // Mock active workflows data
      const mockActiveWorkflows: ActiveWorkflow[] = [
        {
          id: 'active-1',
          templateId: 'template-1',
          name: 'Contract Analysis - Project Alpha',
          status: 'running',
          progress: 65,
          startedAt: '2024-06-25T10:30:00Z',
          lastActivity: '2024-06-25T11:15:00Z',
          currentStep: 'Legal Agent Analysis',
          executionTime: 2700, // seconds
          instanceCount: 1
        },
        {
          id: 'active-2',
          templateId: 'template-2',
          name: 'Q2 Financial Analysis',
          status: 'running',
          progress: 25,
          startedAt: '2024-06-25T09:00:00Z',
          lastActivity: '2024-06-25T11:20:00Z',
          currentStep: 'Calculate KPIs',
          executionTime: 8400, // seconds
          instanceCount: 1
        },
        {
          id: 'active-3',
          templateId: 'template-3',
          name: 'AI Market Research',
          status: 'completed',
          progress: 100,
          startedAt: '2024-06-25T08:00:00Z',
          lastActivity: '2024-06-25T10:45:00Z',
          currentStep: 'Generate Insights',
          executionTime: 9900, // seconds
          instanceCount: 1
        }
      ]

      setTemplates(mockTemplates)
      setActiveWorkflows(mockActiveWorkflows)
    } catch (error) {
      console.error('Failed to fetch workflow data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesComplexity = selectedComplexity === 'all' || template.complexity === selectedComplexity

    return matchesSearch && matchesCategory && matchesComplexity
  })

  const getStatusColor = (status: string) => {
    const colors = {
      running: 'bg-blue-100 text-blue-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || colors.running
  }

  const getComplexityColor = (complexity: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    }
    return colors[complexity as keyof typeof colors] || colors.beginner
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      document: <FileText className="w-5 h-5" />,
      legal: <Users className="w-5 h-5" />,
      financial: <BarChart3 className="w-5 h-5" />,
      research: <Brain className="w-5 h-5" />,
      custom: <Settings className="w-5 h-5" />
    }
    return icons[category as keyof typeof icons] || icons.document
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const handleRunTemplate = (templateId: string) => {
    console.log('Running template:', templateId)
    // Would integrate with workflow execution engine
  }

  const handleCloneTemplate = (templateId: string) => {
    console.log('Cloning template:', templateId)
    // Would create a copy for editing
  }

  if (loading) {
    return (
      <DashboardLayout language={language}>
        <div className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
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
            <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Upload className="w-4 h-4" />
              <span>{content[language].actions.import}</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              <span>{content[language].actions.create}</span>
            </button>
          </div>
        </motion.div>

        {/* Overview Stats */}
        <motion.div variants={motionSafe(slideUp)}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Workflow className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">+12</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{templates.length}</h3>
              <p className="text-sm text-gray-600">{content[language].metrics.totalTemplates}</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm text-blue-600 font-medium">Live</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {activeWorkflows.filter(w => w.status === 'running').length}
              </h3>
              <p className="text-sm text-gray-600">{content[language].metrics.activeWorkflows}</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">+8</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {activeWorkflows.filter(w => w.status === 'completed').length}
              </h3>
              <p className="text-sm text-gray-600">{content[language].metrics.completedToday}</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <span className="text-sm text-green-600 font-medium">-15%</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">24m</h3>
              <p className="text-sm text-gray-600">{content[language].metrics.averageTime}</p>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div variants={motionSafe(slideUp)}>
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {(['marketplace', 'builder', 'automation', 'active'] as const).map((tab) => (
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
          {activeTab === 'marketplace' && (
            <motion.div
              key="marketplace"
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
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(content[language].categories).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>

                  <select
                    value={selectedComplexity}
                    onChange={(e) => setSelectedComplexity(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(content[language].complexity).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {filteredTemplates.length} templates
                  </span>
                </div>
              </div>

              {/* Template Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <motion.div
                    key={template.id}
                    variants={motionSafe(slideUp)}
                    className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getCategoryIcon(template.category)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{template.name}</h3>
                            <p className="text-sm text-gray-500">by {template.author}</p>
                          </div>
                        </div>
                        {template.isFeatured && (
                          <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        )}
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {template.description}
                      </p>

                      <div className="flex items-center justify-between mb-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-lg ${getComplexityColor(template.complexity)}`}>
                          {content[language].complexity[template.complexity]}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">{template.rating}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{template.estimatedTime}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{template.usageCount}</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {template.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            +{template.tags.length - 3}
                          </span>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRunTemplate(template.id)}
                          className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                        >
                          <Play className="w-4 h-4" />
                          <span>{content[language].actions.run}</span>
                        </button>
                        <button
                          onClick={() => handleCloneTemplate(template.id)}
                          className="p-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12">
                  <Workflow className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">{content[language].placeholder.noResults}</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'builder' && (
            <motion.div
              key="builder"
              variants={motionSafe(fadeIn)}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <WorkflowBuilder language={language} />
            </motion.div>
          )}

          {activeTab === 'automation' && (
            <motion.div
              key="automation"
              variants={motionSafe(fadeIn)}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <AutomationManager language={language} />
            </motion.div>
          )}

          {activeTab === 'active' && (
            <motion.div
              key="active"
              variants={motionSafe(fadeIn)}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-6"
            >
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {content[language].tabs.active}
                  </h3>
                </div>

                {activeWorkflows.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {activeWorkflows.map((workflow) => (
                      <div key={workflow.id} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">{workflow.name}</h4>
                            <p className="text-sm text-gray-500">
                              Started {new Date(workflow.startedAt).toLocaleString()}
                            </p>
                          </div>
                          <span className={`px-3 py-1 text-sm font-medium rounded-lg ${getStatusColor(workflow.status)}`}>
                            {content[language].status[workflow.status]}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-gray-600">Progress</div>
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${workflow.progress}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{workflow.progress}%</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Current Step</div>
                            <div className="font-medium text-gray-900">{workflow.currentStep}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Execution Time</div>
                            <div className="font-medium text-gray-900">{formatDuration(workflow.executionTime)}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            Last activity: {new Date(workflow.lastActivity).toLocaleTimeString()}
                          </div>
                          <div className="flex space-x-2">
                            {workflow.status === 'running' && (
                              <button className="p-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                                <Pause className="w-4 h-4" />
                              </button>
                            )}
                            <button className="p-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">{content[language].placeholder.noWorkflows}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  )
}

export default function WorkflowsPageRoute() {
  return <WorkflowsPage />
}