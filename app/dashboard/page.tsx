'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import AIOnboarding from '@/components/onboarding/AIOnboarding'
import SmartUserJourney from '@/components/onboarding/SmartUserJourney'
import AIFeatureIntroduction from '@/components/onboarding/AIFeatureIntroduction'
import PerformanceAccessibilityMonitor from '@/components/monitoring/PerformanceAccessibilityMonitor'
import { motionSafe, slideUp, zenBreathe } from '@/lib/motion'
import { FileText, Upload, Clock, Zap, TrendingUp, Users, Brain } from 'lucide-react'

interface DashboardStats {
  totalTranslations: number
  thisMonth: number
  wordsTranslated: number
  documentsProcessed: number
  agentsActive: number
  swarmEfficiency: number
}

interface RecentActivity {
  id: string
  type: 'translation' | 'document' | 'agent' | 'collaboration'
  text: string
  time: string
  timestamp: Date
}

function DashboardOverview() {
  const [language, setLanguage] = useState<'vi' | 'en'>('en')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showUserJourney, setShowUserJourney] = useState(true)
  const { user } = useAuth()
  const router = useRouter()

  const content = {
    vi: {
      welcome: 'Chào mừng trở lại',
      overview: 'Tổng quan',
      quickStats: 'Thống kê nhanh',
      recentActivity: 'Hoạt động gần đây',
      stats: {
        totalTranslations: 'Tổng số bản dịch',
        thisMonth: 'Tháng này',
        wordsTranslated: 'Từ đã dịch',
        documentsProcessed: 'Tài liệu đã xử lý',
        accuracy: 'Độ chính xác',
        languages: 'Ngôn ngữ',
      },
      activities: [
        {
          type: 'translation',
          text: 'Đã dịch tài liệu "Report.pdf"',
          time: '2 giờ trước',
        },
        {
          type: 'document',
          text: 'Tải lên "Contract.docx"',
          time: '5 giờ trước',
        },
        {
          type: 'translation',
          text: 'Dịch văn bản từ EN sang VI',
          time: '1 ngày trước',
        },
      ],
      quickActions: {
        title: 'Thao tác nhanh',
        newTranslation: 'Dịch mới',
        uploadDocument: 'Tải tài liệu',
        viewHistory: 'Xem lịch sử',
      },
    },
    en: {
      welcome: 'Welcome back',
      overview: 'Overview',
      quickStats: 'Quick Stats',
      recentActivity: 'Recent Activity',
      stats: {
        totalTranslations: 'Total Translations',
        thisMonth: 'This Month',
        wordsTranslated: 'Words Translated',
        documentsProcessed: 'Documents Processed',
        accuracy: 'Accuracy',
        languages: 'Languages',
      },
      activities: [
        {
          type: 'translation',
          text: 'Translated document "Report.pdf"',
          time: '2 hours ago',
        },
        {
          type: 'document',
          text: 'Uploaded "Contract.docx"',
          time: '5 hours ago',
        },
        {
          type: 'translation',
          text: 'Translated text from EN to VI',
          time: '1 day ago',
        },
      ],
      quickActions: {
        title: 'Quick Actions',
        newTranslation: 'New Translation',
        uploadDocument: 'Upload Document',
        viewHistory: 'View History',
      },
    },
  }

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch dashboard analytics
      const [analyticsRes, agentsRes, historyRes] = await Promise.all([
        fetch('/api/analytics/dashboard'),
        fetch('/api/agents/dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_swarm_insights' })
        }),
        fetch('/api/dashboard/recent-activity')
      ])

      // Process analytics data
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        
        setStats({
          totalTranslations: analyticsData.data?.totalTranslations || 0,
          thisMonth: analyticsData.data?.thisMonth || 0,
          wordsTranslated: analyticsData.data?.wordsTranslated || 0,
          documentsProcessed: analyticsData.data?.documentsProcessed || 0,
          agentsActive: 0,
          swarmEfficiency: 0
        })
      }

      // Process agent data
      if (agentsRes.ok) {
        const agentData = await agentsRes.json()
        if (agentData.success) {
          setStats(prev => prev ? {
            ...prev,
            agentsActive: agentData.data?.insights?.totalAgents || 0,
            swarmEfficiency: Math.round((agentData.data?.insights?.averageEfficiency || 0) * 100)
          } : null)
        }
      }

      // Process activity data
      if (historyRes.ok) {
        const historyData = await historyRes.json()
        if (historyData.data) {
          setActivities(historyData.data.slice(0, 5)) // Show last 5 activities
        }
      }

    } catch (error) {
      console.error('Dashboard data fetch failed:', error)
      setError('Không thể tải dữ liệu dashboard')
      
      // Fallback to basic stats
      setStats({
        totalTranslations: 0,
        thisMonth: 0,
        wordsTranslated: 0,
        documentsProcessed: 0,
        agentsActive: 0,
        swarmEfficiency: 0
      })
    } finally {
      setLoading(false)
    }
  }

  // Quick action handlers
  const handleNewTranslation = () => {
    router.push('/workspace')
  }

  const handleUploadDocument = () => {
    router.push('/documents')
  }

  const handleViewHistory = () => {
    router.push('/dashboard/history')
  }

  const handleViewAgents = () => {
    router.push('/dashboard/agents')
  }

  // Loading skeleton component
  const StatSkeleton = () => (
    <div className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
        <div className="w-12 h-4 bg-gray-200 rounded"></div>
      </div>
      <div className="w-16 h-8 bg-gray-200 rounded mb-2"></div>
      <div className="w-24 h-4 bg-gray-200 rounded"></div>
    </div>
  )

  return (
    <DashboardLayout language={language}>
      <motion.div
        variants={motionSafe(zenBreathe)}
        initial="hidden"
        animate="visible"
      >
        {/* Welcome Header */}
        <motion.div className="mb-8" variants={motionSafe(slideUp)}>
          <h1 className="heading-2 text-gray-900">
            {content[language].welcome},{' '}
            {user?.user_metadata?.full_name || user?.email?.split('@')[0]}!
          </h1>
          <p className="body-lg text-gray-600 mt-2">
            {content[language].overview}
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div className="mb-8" variants={motionSafe(slideUp)}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading-4 text-gray-900">
              {content[language].quickStats}
            </h2>
            {error && (
              <button 
                onClick={fetchDashboardData}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <>
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
              </>
            ) : (
              <>
                {/* Total Translations */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-sm text-green-600 font-medium">
                      {stats?.totalTranslations && stats.totalTranslations > 0 ? '+12%' : '—'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {stats?.totalTranslations?.toLocaleString() || '0'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {content[language].stats.totalTranslations}
                  </p>
                </div>

                {/* This Month */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <span className="text-sm text-green-600 font-medium">
                      {stats?.thisMonth && stats.thisMonth > 0 ? '+23%' : '—'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {stats?.thisMonth?.toLocaleString() || '0'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {content[language].stats.thisMonth}
                  </p>
                </div>

                {/* Words Translated */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Zap className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-sm text-green-600 font-medium">
                      {stats?.wordsTranslated && stats.wordsTranslated > 0 ? '+18%' : '—'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {stats?.wordsTranslated ? 
                      (stats.wordsTranslated > 1000 ? 
                        `${(stats.wordsTranslated / 1000).toFixed(1)}K` : 
                        stats.wordsTranslated.toLocaleString()
                      ) : '0'
                    }
                  </h3>
                  <p className="text-sm text-gray-600">
                    {content[language].stats.wordsTranslated}
                  </p>
                </div>

                {/* AI Agents Active */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Brain className="w-6 h-6 text-indigo-600" />
                    </div>
                    <span className="text-sm text-blue-600 font-medium">
                      {stats?.swarmEfficiency ? `${stats.swarmEfficiency}%` : '—'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {stats?.agentsActive?.toLocaleString() || '0'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {language === 'vi' ? 'AI Agents Hoạt Động' : 'Active AI Agents'}
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div className="mb-8" variants={motionSafe(slideUp)}>
          <h2 className="heading-4 text-gray-900 mb-4">
            {content[language].quickActions.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={handleNewTranslation}
              className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <FileText className="w-8 h-8 mb-3" />
              <p className="font-medium">
                {content[language].quickActions.newTranslation}
              </p>
            </button>

            <button 
              onClick={handleUploadDocument}
              className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <Upload className="w-8 h-8 mb-3" />
              <p className="font-medium">
                {content[language].quickActions.uploadDocument}
              </p>
            </button>

            <button 
              onClick={handleViewAgents}
              className="p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <Brain className="w-8 h-8 mb-3" />
              <p className="font-medium">
                {language === 'vi' ? 'Quản Lý AI Agents' : 'Manage AI Agents'}
              </p>
            </button>

            <button 
              onClick={handleViewHistory}
              className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <Clock className="w-8 h-8 mb-3" />
              <p className="font-medium">
                {content[language].quickActions.viewHistory}
              </p>
            </button>
          </div>
        </motion.div>

        {/* AI Feature Introduction - Compact View */}
        <motion.div className="mb-8" variants={motionSafe(slideUp)}>
          <h2 className="heading-4 text-gray-900 mb-4">
            {language === 'vi' ? 'Khám phá AI Features' : 'Explore AI Features'}
          </h2>
          <AIFeatureIntroduction 
            language={language} 
            compact={true}
            onFeatureSelect={(featureId) => {
              if (featureId === 'agents') {
                router.push('/dashboard/agents')
              } else if (featureId === 'cross-doc' || featureId === 'predictive') {
                router.push('/dashboard/insights')
              } else {
                router.push('/dashboard/enterprise')
              }
            }}
          />
        </motion.div>

        {/* User Journey Progress */}
        {showUserJourney && (
          <motion.div className="mb-8" variants={motionSafe(slideUp)}>
            <SmartUserJourney 
              language={language}
              onMilestoneComplete={(milestone) => {
                console.log('Milestone completed:', milestone)
              }}
            />
          </motion.div>
        )}

        {/* Performance & Accessibility Monitor */}
        <motion.div className="mb-8" variants={motionSafe(slideUp)}>
          <PerformanceAccessibilityMonitor 
            language={language}
            onOptimizationSuggestion={(suggestion) => {
              console.log('Optimization suggestion:', suggestion)
              // Could show notification to user
            }}
          />
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={motionSafe(slideUp)}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading-4 text-gray-900">
              {content[language].recentActivity}
            </h2>
            <button 
              onClick={() => router.push('/dashboard/history')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>{language === 'vi' ? 'Xem tất cả' : 'View all'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="divide-y divide-gray-200">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="w-3/4 h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {activities.map((activity) => {
                  const getActivityIcon = (type: string) => {
                    switch (type) {
                      case 'translation':
                        return <FileText className="w-5 h-5 text-blue-600" />
                      case 'document':
                        return <Upload className="w-5 h-5 text-purple-600" />
                      case 'agent':
                        return <Brain className="w-5 h-5 text-indigo-600" />
                      case 'collaboration':
                        return <Users className="w-5 h-5 text-green-600" />
                      default:
                        return <FileText className="w-5 h-5 text-gray-600" />
                    }
                  }

                  const getActivityColor = (type: string) => {
                    switch (type) {
                      case 'translation':
                        return 'bg-blue-100'
                      case 'document':
                        return 'bg-purple-100'
                      case 'agent':
                        return 'bg-indigo-100'
                      case 'collaboration':
                        return 'bg-green-100'
                      default:
                        return 'bg-gray-100'
                    }
                  }

                  return (
                    <div
                      key={activity.id}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{activity.text}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {language === 'vi' 
                    ? 'Chưa có hoạt động nào. Hãy bắt đầu dịch tài liệu đầu tiên!' 
                    : 'No recent activity. Start by translating your first document!'
                  }
                </p>
                <button 
                  onClick={handleNewTranslation}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {language === 'vi' ? 'Bắt đầu dịch' : 'Start translating'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* AI Onboarding Modal */}
      <AIOnboarding 
        language={language}
        onComplete={() => {
          setShowOnboarding(false)
          // Refresh dashboard data after onboarding
          fetchDashboardData()
        }}
      />
    </DashboardLayout>
  )
}

export default function DashboardPage() {
  return <DashboardOverview />
}

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'
