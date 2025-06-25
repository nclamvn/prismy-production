'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motionSafe, slideUp, staggerContainer } from '@/lib/motion'
import { 
  Brain, 
  TrendingUp, 
  FileText, 
  Users, 
  Lightbulb,
  Target,
  Zap,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Download,
  Filter
} from 'lucide-react'

interface PredictiveInsight {
  id: string
  title: string
  description: string
  type: 'trend' | 'opportunity' | 'risk' | 'recommendation'
  confidence: number
  impact: 'high' | 'medium' | 'low'
  timeframe: string
  category: 'productivity' | 'cost' | 'quality' | 'user_experience'
  data: {
    currentValue: number
    predictedValue: number
    expectedChange: number
    supportingMetrics: Array<{name: string, value: string}>
  }
}

interface CrossDocumentInsight {
  id: string
  title: string
  documents: Array<{id: string, name: string, type: string}>
  connections: Array<{
    type: 'similarity' | 'conflict' | 'complement' | 'dependency'
    description: string
    confidence: number
  }}
  insights: string[]
  actionableItems: Array<{
    action: string
    priority: 'high' | 'medium' | 'low'
    estimatedTime: string
  }}
}

interface AIRecommendation {
  id: string
  title: string
  description: string
  category: 'optimization' | 'automation' | 'integration' | 'training'
  expectedBenefits: Array<{
    metric: string
    improvement: string
    timeframe: string
  }>
  implementation: {
    complexity: 'low' | 'medium' | 'high'
    estimatedTime: string
    prerequisites: string[]
    steps: string[]
  }
  roi: {
    investment: number
    expectedReturn: number
    paybackPeriod: string
  }
}

interface EnterpriseInsightsProps {
  language?: 'vi' | 'en'
}

function EnterpriseInsights({ language = 'en' }: EnterpriseInsightsProps) {
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([])
  const [crossDocInsights, setCrossDocInsights] = useState<CrossDocumentInsight[]>([])
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedImpact, setSelectedImpact] = useState<string>('all')

  const { user } = useAuth()

  const content = {
    vi: {
      title: 'Thông Tin Doanh Nghiệp',
      subtitle: 'AI-powered insights và dự đoán xu hướng',
      sections: {
        predictive: 'Dự đoán thông minh',
        crossDocument: 'Phân tích liên tài liệu',
        recommendations: 'Đề xuất AI'
      },
      categories: {
        all: 'Tất cả',
        productivity: 'Năng suất',
        cost: 'Chi phí',
        quality: 'Chất lượng',
        user_experience: 'Trải nghiệm người dùng'
      },
      impact: {
        all: 'Tất cả mức độ',
        high: 'Tác động cao',
        medium: 'Tác động trung bình',
        low: 'Tác động thấp'
      },
      types: {
        trend: 'Xu hướng',
        opportunity: 'Cơ hội',
        risk: 'Rủi ro',
        recommendation: 'Đề xuất'
      },
      connections: {
        similarity: 'Tương đồng',
        conflict: 'Xung đột',
        complement: 'Bổ sung',
        dependency: 'Phụ thuộc'
      },
      complexity: {
        low: 'Thấp',
        medium: 'Trung bình',
        high: 'Cao'
      },
      priority: {
        high: 'Cao',
        medium: 'Trung bình',
        low: 'Thấp'
      },
      actions: {
        viewDetails: 'Xem chi tiết',
        implement: 'Triển khai',
        dismiss: 'Bỏ qua',
        export: 'Xuất',
        filter: 'Lọc'
      },
      metrics: {
        confidence: 'Độ tin cậy',
        timeframe: 'Khung thời gian',
        expectedChange: 'Thay đổi dự kiến',
        roi: 'ROI',
        payback: 'Hoàn vốn',
        complexity: 'Độ phức tạp'
      }
    },
    en: {
      title: 'Enterprise Insights',
      subtitle: 'AI-powered insights and predictive analytics',
      sections: {
        predictive: 'Predictive Intelligence',
        crossDocument: 'Cross-Document Analysis',
        recommendations: 'AI Recommendations'
      },
      categories: {
        all: 'All',
        productivity: 'Productivity',
        cost: 'Cost',
        quality: 'Quality',
        user_experience: 'User Experience'
      },
      impact: {
        all: 'All Impact',
        high: 'High Impact',
        medium: 'Medium Impact',
        low: 'Low Impact'
      },
      types: {
        trend: 'Trend',
        opportunity: 'Opportunity',
        risk: 'Risk',
        recommendation: 'Recommendation'
      },
      connections: {
        similarity: 'Similarity',
        conflict: 'Conflict',
        complement: 'Complement',
        dependency: 'Dependency'
      },
      complexity: {
        low: 'Low',
        medium: 'Medium',
        high: 'High'
      },
      priority: {
        high: 'High',
        medium: 'Medium',
        low: 'Low'
      },
      actions: {
        viewDetails: 'View Details',
        implement: 'Implement',
        dismiss: 'Dismiss',
        export: 'Export',
        filter: 'Filter'
      },
      metrics: {
        confidence: 'Confidence',
        timeframe: 'Timeframe',
        expectedChange: 'Expected Change',
        roi: 'ROI',
        payback: 'Payback',
        complexity: 'Complexity'
      }
    }
  }

  useEffect(() => {
    fetchInsightsData()
  }, [])

  const fetchInsightsData = async () => {
    try {
      setLoading(true)

      // Mock data for comprehensive enterprise insights
      const mockPredictiveInsights: PredictiveInsight[] = [
        {
          id: 'pred-1',
          title: language === 'vi' ? 'Tăng trưởng năng suất dự kiến 23%' : 'Productivity Growth Expected 23%',
          description: language === 'vi' 
            ? 'Phân tích xu hướng cho thấy năng suất sẽ tăng mạnh trong 3 tháng tới'
            : 'Trend analysis shows productivity will increase significantly in next 3 months',
          type: 'trend',
          confidence: 87,
          impact: 'high',
          timeframe: language === 'vi' ? '3 tháng' : '3 months',
          category: 'productivity',
          data: {
            currentValue: 2847,
            predictedValue: 3502,
            expectedChange: 23,
            supportingMetrics: [
              { name: language === 'vi' ? 'Tác vụ/giờ' : 'Tasks/hour', value: '2847 → 3502' },
              { name: language === 'vi' ? 'Agents hiệu quả' : 'Efficient agents', value: '92%' },
              { name: language === 'vi' ? 'Thời gian xử lý' : 'Processing time', value: '-15%' }
            ]
          }
        },
        {
          id: 'pred-2',
          title: language === 'vi' ? 'Tiết kiệm chi phí $180K cơ hội' : 'Cost Savings $180K Opportunity',
          description: language === 'vi'
            ? 'Tối ưu hóa quy trình có thể tiết kiệm đáng kể chi phí vận hành'
            : 'Process optimization could significantly reduce operational costs',
          type: 'opportunity',
          confidence: 92,
          impact: 'high',
          timeframe: language === 'vi' ? '6 tháng' : '6 months',
          category: 'cost',
          data: {
            currentValue: 450000,
            predictedValue: 270000,
            expectedChange: -40,
            supportingMetrics: [
              { name: language === 'vi' ? 'Chi phí/tác vụ' : 'Cost/task', value: '$1.85 → $1.11' },
              { name: language === 'vi' ? 'Tự động hóa' : 'Automation', value: '+35%' },
              { name: language === 'vi' ? 'Hiệu quả' : 'Efficiency', value: '+28%' }
            ]
          }
        },
        {
          id: 'pred-3',
          title: language === 'vi' ? 'Rủi ro tăng lỗi phát hiện' : 'Error Rate Increase Risk Detected',
          description: language === 'vi'
            ? 'Xu hướng tăng nhẹ tỷ lệ lỗi cần được giám sát và khắc phục'
            : 'Slight upward trend in error rates requires monitoring and mitigation',
          type: 'risk',
          confidence: 73,
          impact: 'medium',
          timeframe: language === 'vi' ? '2 tuần' : '2 weeks',
          category: 'quality',
          data: {
            currentValue: 1.2,
            predictedValue: 1.8,
            expectedChange: 50,
            supportingMetrics: [
              { name: language === 'vi' ? 'Tỷ lệ lỗi' : 'Error rate', value: '1.2% → 1.8%' },
              { name: language === 'vi' ? 'Tải hệ thống' : 'System load', value: '78%' },
              { name: language === 'vi' ? 'Phức tạp tác vụ' : 'Task complexity', value: '+12%' }
            ]
          }
        }
      ]

      const mockCrossDocInsights: CrossDocumentInsight[] = [
        {
          id: 'cross-1',
          title: language === 'vi' ? 'Phát hiện mẫu trong hợp đồng pháp lý' : 'Pattern Detection in Legal Contracts',
          documents: [
            { id: 'doc-1', name: 'Service Agreement Q1.pdf', type: 'legal' },
            { id: 'doc-2', name: 'Vendor Contract 2024.pdf', type: 'legal' },
            { id: 'doc-3', name: 'Employment Terms.pdf', type: 'legal' }
          ],
          connections: [
            {
              type: 'similarity',
              description: language === 'vi' 
                ? '85% tương đồng trong điều khoản thanh toán'
                : '85% similarity in payment terms',
              confidence: 92
            },
            {
              type: 'conflict',
              description: language === 'vi'
                ? 'Xung đột trong thời hạn chấm dứt hợp đồng'
                : 'Conflict in contract termination periods',
              confidence: 78
            }
          ],
          insights: [
            language === 'vi' 
              ? 'Chuẩn hóa điều khoản thanh toán có thể giảm 30% thời gian xem xét'
              : 'Standardizing payment terms could reduce review time by 30%',
            language === 'vi'
              ? 'Cần thống nhất thời hạn chấm dứt để tránh rủi ro pháp lý'
              : 'Termination periods need standardization to avoid legal risks'
          ],
          actionableItems: [
            {
              action: language === 'vi' ? 'Tạo template điều khoản thanh toán chuẩn' : 'Create standardized payment terms template',
              priority: 'high',
              estimatedTime: language === 'vi' ? '2 tuần' : '2 weeks'
            },
            {
              action: language === 'vi' ? 'Đánh giá và cập nhật thời hạn chấm dứt' : 'Review and update termination periods',
              priority: 'medium',
              estimatedTime: language === 'vi' ? '1 tuần' : '1 week'
            }
          ]
        },
        {
          id: 'cross-2',
          title: language === 'vi' ? 'Tích hợp dữ liệu tài chính' : 'Financial Data Integration',
          documents: [
            { id: 'doc-4', name: 'Q1 Budget Report.xlsx', type: 'financial' },
            { id: 'doc-5', name: 'Cost Analysis 2024.pdf', type: 'financial' },
            { id: 'doc-6', name: 'ROI Projection.xlsx', type: 'financial' }
          ],
          connections: [
            {
              type: 'complement',
              description: language === 'vi'
                ? 'Dữ liệu ngân sách bổ sung hoàn hảo cho phân tích chi phí'
                : 'Budget data perfectly complements cost analysis',
              confidence: 94
            },
            {
              type: 'dependency',
              description: language === 'vi'
                ? 'Dự báo ROI phụ thuộc vào độ chính xác ngân sách Q1'
                : 'ROI projections depend on Q1 budget accuracy',
              confidence: 88
            }
          ],
          insights: [
            language === 'vi'
              ? 'Tích hợp dữ liệu có thể tăng độ chính xác dự báo lên 25%'
              : 'Data integration could improve forecasting accuracy by 25%',
            language === 'vi'
              ? 'Dashboard tự động có thể tiết kiệm 8 giờ/tuần cho team tài chính'
              : 'Automated dashboard could save 8 hours/week for finance team'
          ],
          actionableItems: [
            {
              action: language === 'vi' ? 'Xây dựng dashboard tài chính tích hợp' : 'Build integrated financial dashboard',
              priority: 'high',
              estimatedTime: language === 'vi' ? '3 tuần' : '3 weeks'
            }
          ]
        }
      ]

      const mockAIRecommendations: AIRecommendation[] = [
        {
          id: 'rec-1',
          title: language === 'vi' ? 'Triển khai Agent Learning Network' : 'Implement Agent Learning Network',
          description: language === 'vi'
            ? 'Hệ thống học máy cho phép agents chia sẻ kiến thức và cải thiện hiệu suất tập thể'
            : 'Machine learning system allowing agents to share knowledge and improve collective performance',
          category: 'optimization',
          expectedBenefits: [
            {
              metric: language === 'vi' ? 'Hiệu suất Agent' : 'Agent Performance',
              improvement: '+35%',
              timeframe: language === 'vi' ? '3 tháng' : '3 months'
            },
            {
              metric: language === 'vi' ? 'Độ chính xác' : 'Accuracy',
              improvement: '+12%',
              timeframe: language === 'vi' ? '2 tháng' : '2 months'
            },
            {
              metric: language === 'vi' ? 'Thời gian training' : 'Training Time',
              improvement: '-45%',
              timeframe: language === 'vi' ? '1 tháng' : '1 month'
            }
          ],
          implementation: {
            complexity: 'high',
            estimatedTime: language === 'vi' ? '8-12 tuần' : '8-12 weeks',
            prerequisites: [
              language === 'vi' ? 'API backend nâng cao' : 'Advanced backend API',
              language === 'vi' ? 'Database mở rộng' : 'Extended database',
              language === 'vi' ? 'Team ML experience' : 'ML team expertise'
            ],
            steps: [
              language === 'vi' ? 'Thiết kế kiến trúc learning network' : 'Design learning network architecture',
              language === 'vi' ? 'Phát triển API chia sẻ knowledge' : 'Develop knowledge sharing API',
              language === 'vi' ? 'Tích hợp với agents hiện tại' : 'Integrate with existing agents',
              language === 'vi' ? 'Testing và optimization' : 'Testing and optimization',
              language === 'vi' ? 'Triển khai production' : 'Production deployment'
            ]
          },
          roi: {
            investment: 95000,
            expectedReturn: 340000,
            paybackPeriod: language === 'vi' ? '4 tháng' : '4 months'
          }
        },
        {
          id: 'rec-2',
          title: language === 'vi' ? 'Tự động hóa Document Preprocessing' : 'Automate Document Preprocessing',
          description: language === 'vi'
            ? 'AI pipeline tự động xử lý, phân loại và chuẩn hóa tài liệu trước khi giao cho agents'
            : 'AI pipeline to automatically process, classify and standardize documents before agent assignment',
          category: 'automation',
          expectedBenefits: [
            {
              metric: language === 'vi' ? 'Thời gian xử lý' : 'Processing Time',
              improvement: '-60%',
              timeframe: language === 'vi' ? '1 tháng' : '1 month'
            },
            {
              metric: language === 'vi' ? 'Độ chính xác phân loại' : 'Classification Accuracy',
              improvement: '+28%',
              timeframe: language === 'vi' ? '2 tuần' : '2 weeks'
            },
            {
              metric: language === 'vi' ? 'Chi phí manual work' : 'Manual Work Cost',
              improvement: '-75%',
              timeframe: language === 'vi' ? '3 tháng' : '3 months'
            }
          ],
          implementation: {
            complexity: 'medium',
            estimatedTime: language === 'vi' ? '4-6 tuần' : '4-6 weeks',
            prerequisites: [
              language === 'vi' ? 'Document processing API' : 'Document processing API',
              language === 'vi' ? 'ML classification models' : 'ML classification models',
              language === 'vi' ? 'Storage infrastructure' : 'Storage infrastructure'
            ],
            steps: [
              language === 'vi' ? 'Phát triển classification model' : 'Develop classification model',
              language === 'vi' ? 'Xây dựng preprocessing pipeline' : 'Build preprocessing pipeline',
              language === 'vi' ? 'Tích hợp với workflow hiện tại' : 'Integrate with current workflow',
              language === 'vi' ? 'Testing và fine-tuning' : 'Testing and fine-tuning'
            ]
          },
          roi: {
            investment: 45000,
            expectedReturn: 180000,
            paybackPeriod: language === 'vi' ? '3 tháng' : '3 months'
          }
        },
        {
          id: 'rec-3',
          title: language === 'vi' ? 'Enterprise User Training Program' : 'Enterprise User Training Program',
          description: language === 'vi'
            ? 'Chương trình đào tạo toàn diện giúp users tận dụng tối đa AI capabilities'
            : 'Comprehensive training program to help users maximize AI capabilities',
          category: 'training',
          expectedBenefits: [
            {
              metric: language === 'vi' ? 'User Adoption' : 'User Adoption',
              improvement: '+45%',
              timeframe: language === 'vi' ? '2 tháng' : '2 months'
            },
            {
              metric: language === 'vi' ? 'Feature Utilization' : 'Feature Utilization',
              improvement: '+65%',
              timeframe: language === 'vi' ? '6 tuần' : '6 weeks'
            },
            {
              metric: language === 'vi' ? 'Support Tickets' : 'Support Tickets',
              improvement: '-40%',
              timeframe: language === 'vi' ? '1 tháng' : '1 month'
            }
          ],
          implementation: {
            complexity: 'low',
            estimatedTime: language === 'vi' ? '3-4 tuần' : '3-4 weeks',
            prerequisites: [
              language === 'vi' ? 'Training content development' : 'Training content development',
              language === 'vi' ? 'Video production setup' : 'Video production setup',
              language === 'vi' ? 'LMS platform' : 'LMS platform'
            ],
            steps: [
              language === 'vi' ? 'Phát triển nội dung training' : 'Develop training content',
              language === 'vi' ? 'Sản xuất video tutorials' : 'Produce video tutorials',
              language === 'vi' ? 'Thiết lập LMS platform' : 'Setup LMS platform',
              language === 'vi' ? 'Pilot với small group' : 'Pilot with small group',
              language === 'vi' ? 'Full rollout' : 'Full rollout'
            ]
          },
          roi: {
            investment: 25000,
            expectedReturn: 120000,
            paybackPeriod: language === 'vi' ? '2 tháng' : '2 months'
          }
        }
      ]

      setPredictiveInsights(mockPredictiveInsights)
      setCrossDocInsights(mockCrossDocInsights)
      setAiRecommendations(mockAIRecommendations)
    } catch (error) {
      console.error('Failed to fetch insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    const colors = {
      trend: 'bg-blue-100 text-blue-800',
      opportunity: 'bg-green-100 text-green-800',
      risk: 'bg-red-100 text-red-800',
      recommendation: 'bg-purple-100 text-purple-800'
    }
    return colors[type as keyof typeof colors] || colors.trend
  }

  const getImpactColor = (impact: string) => {
    const colors = {
      high: 'text-red-600',
      medium: 'text-yellow-600',
      low: 'text-green-600'
    }
    return colors[impact as keyof typeof colors] || colors.medium
  }

  const getConnectionIcon = (type: string) => {
    const icons = {
      similarity: <CheckCircle className="w-4 h-4 text-green-500" />,
      conflict: <AlertTriangle className="w-4 h-4 text-red-500" />,
      complement: <Lightbulb className="w-4 h-4 text-blue-500" />,
      dependency: <ArrowRight className="w-4 h-4 text-purple-500" />
    }
    return icons[type as keyof typeof icons] || icons.similarity
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    }
    return colors[priority as keyof typeof colors] || colors.medium
  }

  const getComplexityColor = (complexity: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-red-600'
    }
    return colors[complexity as keyof typeof colors] || colors.medium
  }

  if (loading) {
    return (
      <DashboardLayout language={language}>
        <div className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map(i => (
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

            {/* Impact Filter */}
            <select
              value={selectedImpact}
              onChange={(e) => setSelectedImpact(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(content[language].impact).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Download className="w-4 h-4" />
              <span>{content[language].actions.export}</span>
            </button>
          </div>
        </motion.div>

        {/* Predictive Intelligence */}
        <motion.div variants={motionSafe(slideUp)}>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <Brain className="w-6 h-6 text-blue-600" />
            <span>{content[language].sections.predictive}</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {predictiveInsights.map((insight) => (
              <div key={insight.id} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-lg ${getTypeColor(insight.type)}`}>
                      {content[language].types[insight.type]}
                    </span>
                    <span className={`text-sm font-medium ${getImpactColor(insight.impact)}`}>
                      {content[language].impact[insight.impact]}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {insight.confidence}% {content[language].metrics.confidence}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {insight.title}
                </h3>
                <p className="text-gray-600 mb-4">{insight.description}</p>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{content[language].metrics.expectedChange}</span>
                    <span className={`font-semibold ${insight.data.expectedChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {insight.data.expectedChange > 0 ? '+' : ''}{insight.data.expectedChange}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{content[language].metrics.timeframe}</span>
                    <span className="text-sm font-medium">{insight.timeframe}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-2">Supporting Metrics:</div>
                  <div className="space-y-1">
                    {insight.data.supportingMetrics.map((metric, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="text-gray-600">{metric.name}</span>
                        <span className="font-medium">{metric.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="mt-4 w-full py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                  {content[language].actions.viewDetails}
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Cross-Document Analysis */}
        <motion.div variants={motionSafe(slideUp)}>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <FileText className="w-6 h-6 text-purple-600" />
            <span>{content[language].sections.crossDocument}</span>
          </h2>

          <div className="space-y-6">
            {crossDocInsights.map((insight) => (
              <div key={insight.id} className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{insight.title}</h3>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Documents */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Documents</h4>
                    <div className="space-y-2">
                      {insight.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                            <div className="text-xs text-gray-500 capitalize">{doc.type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Connections */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Connections</h4>
                    <div className="space-y-2">
                      {insight.connections.map((connection, index) => (
                        <div key={index} className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg">
                          {getConnectionIcon(connection.type)}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {content[language].connections[connection.type]}
                            </div>
                            <div className="text-xs text-gray-600">{connection.description}</div>
                            <div className="text-xs text-gray-500">{connection.confidence}% confidence</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actionable Items */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Action Items</h4>
                    <div className="space-y-2">
                      {insight.actionableItems.map((item, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(item.priority)}`}>
                              {content[language].priority[item.priority]}
                            </span>
                            <span className="text-xs text-gray-500">{item.estimatedTime}</span>
                          </div>
                          <div className="text-sm text-gray-900">{item.action}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="font-medium text-gray-900 mb-2">Key Insights</h4>
                  <ul className="space-y-1">
                    {insight.insights.map((insightText, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>{insightText}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div variants={motionSafe(slideUp)}>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <Target className="w-6 h-6 text-green-600" />
            <span>{content[language].sections.recommendations}</span>
          </h2>

          <div className="space-y-6">
            {aiRecommendations.map((recommendation) => (
              <div key={recommendation.id} className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{recommendation.title}</h3>
                    <p className="text-gray-600">{recommendation.description}</p>
                  </div>
                  <span className="px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-lg capitalize">
                    {recommendation.category}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Expected Benefits */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Expected Benefits</h4>
                    <div className="space-y-2">
                      {recommendation.expectedBenefits.map((benefit, index) => (
                        <div key={index} className="p-3 bg-green-50 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-900">{benefit.metric}</span>
                            <span className="text-sm font-bold text-green-600">{benefit.improvement}</span>
                          </div>
                          <div className="text-xs text-gray-500">{benefit.timeframe}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Implementation */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Implementation</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{content[language].metrics.complexity}</span>
                        <span className={`text-sm font-medium ${getComplexityColor(recommendation.implementation.complexity)}`}>
                          {content[language].complexity[recommendation.implementation.complexity]}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Time</span>
                        <span className="text-sm font-medium">{recommendation.implementation.estimatedTime}</span>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-2">Prerequisites:</div>
                        <ul className="space-y-1">
                          {recommendation.implementation.prerequisites.map((prereq, index) => (
                            <li key={index} className="text-xs text-gray-500 flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>{prereq}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* ROI */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">{content[language].metrics.roi}</h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-gray-600">Investment</div>
                        <div className="text-lg font-bold text-gray-900">${recommendation.roi.investment.toLocaleString()}</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-sm text-gray-600">Expected Return</div>
                        <div className="text-lg font-bold text-green-600">${recommendation.roi.expectedReturn.toLocaleString()}</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-sm text-gray-600">{content[language].metrics.payback}</div>
                        <div className="text-lg font-bold text-purple-600">{recommendation.roi.paybackPeriod}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    {content[language].actions.implement}
                  </button>
                  <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    {content[language].actions.viewDetails}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default function EnterpriseInsightsPage() {
  return <EnterpriseInsights />
}