'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { motionSafe, slideUp, staggerContainer } from '@/lib/motion'
import {
  BarChart3,
  TrendingUp,
  Clock,
  Globe,
  FileText,
  Users,
  Zap,
  Calendar,
  Download,
  Filter,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
} from 'lucide-react'

interface AnalyticsModeProps {
  language: 'vi' | 'en'
}

export default function AnalyticsMode({ language }: AnalyticsModeProps) {
  const [timeRange, setTimeRange] = useState('30d')

  const content = {
    vi: {
      title: 'Thống kê sử dụng',
      subtitle: 'Theo dõi hiệu suất và phân tích xu hướng sử dụng',
      overview: {
        title: 'Tổng quan',
        totalDocuments: 'Tổng tài liệu',
        wordsTranslated: 'Từ đã dịch',
        languages: 'Ngôn ngữ',
        accuracy: 'Độ chính xác',
        apiCalls: 'Lượt gọi API',
        activeUsers: 'Người dùng hoạt động',
      },
      charts: {
        usage: 'Biểu đồ sử dụng',
        languages: 'Ngôn ngữ phổ biến',
        documents: 'Loại tài liệu',
        performance: 'Hiệu suất',
      },
      activity: {
        title: 'Hoạt động gần đây',
        timeRanges: {
          '7d': '7 ngày',
          '30d': '30 ngày',
          '90d': '90 ngày',
          '1y': '1 năm',
        },
      },
      export: {
        title: 'Xuất báo cáo',
        pdf: 'Xuất PDF',
        csv: 'Xuất CSV',
        excel: 'Xuất Excel',
      },
    },
    en: {
      title: 'Usage Analytics',
      subtitle: 'Monitor performance and analyze usage trends',
      overview: {
        title: 'Overview',
        totalDocuments: 'Total Documents',
        wordsTranslated: 'Words Translated',
        languages: 'Languages',
        accuracy: 'Accuracy',
        apiCalls: 'API Calls',
        activeUsers: 'Active Users',
      },
      charts: {
        usage: 'Usage Chart',
        languages: 'Popular Languages',
        documents: 'Document Types',
        performance: 'Performance',
      },
      activity: {
        title: 'Recent Activity',
        timeRanges: {
          '7d': '7 days',
          '30d': '30 days',
          '90d': '90 days',
          '1y': '1 year',
        },
      },
      export: {
        title: 'Export Reports',
        pdf: 'Export PDF',
        csv: 'Export CSV',
        excel: 'Export Excel',
      },
    },
  }

  const statsData = [
    {
      label: content[language].overview.totalDocuments,
      value: '2,847',
      change: '+15.3%',
      trend: 'up',
      icon: FileText,
    },
    {
      label: content[language].overview.wordsTranslated,
      value: '1.2M',
      change: '+23.1%',
      trend: 'up',
      icon: Globe,
    },
    {
      label: content[language].overview.languages,
      value: '15',
      change: '+2',
      trend: 'up',
      icon: Users,
    },
    {
      label: content[language].overview.accuracy,
      value: '99.8%',
      change: '+0.2%',
      trend: 'up',
      icon: Zap,
    },
  ]

  const recentActivity = [
    {
      type: 'document',
      action: language === 'vi' ? 'Đã dịch tài liệu' : 'Translated document',
      target: 'Annual Report 2024.pdf',
      time: '2 hours ago',
      status: 'completed',
    },
    {
      type: 'api',
      action: language === 'vi' ? 'Gọi API dịch thuật' : 'Translation API call',
      target: 'batch_translate_v1',
      time: '3 hours ago',
      status: 'completed',
    },
    {
      type: 'analysis',
      action:
        language === 'vi' ? 'Phân tích AI hoàn thành' : 'AI analysis completed',
      target: 'Contract Agreement.docx',
      time: '5 hours ago',
      status: 'completed',
    },
    {
      type: 'document',
      action: language === 'vi' ? 'Tải lên tài liệu' : 'Document uploaded',
      target: 'Research Notes.txt',
      time: '1 day ago',
      status: 'completed',
    },
  ]

  const languageStats = [
    { lang: 'English', count: 1247, percentage: 45 },
    { lang: 'Vietnamese', count: 892, percentage: 32 },
    { lang: 'Chinese', count: 334, percentage: 12 },
    { lang: 'Japanese', count: 223, percentage: 8 },
    { lang: 'Korean', count: 151, percentage: 3 },
  ]

  return (
    <div className="h-full p-6">
      <motion.div
        variants={motionSafe(staggerContainer)}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header */}
        <motion.div
          variants={motionSafe(slideUp)}
          className="flex items-center justify-between"
        >
          <div>
            <h2 className="heading-2 text-gray-900 mb-4">
              {content[language].title}
            </h2>
            <p className="body-lg text-gray-600">
              {content[language].subtitle}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-border-subtle rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(content[language].activity.timeRanges).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>

            <button className="btn-secondary btn-pill-compact-md">
              <Filter size={16} className="mr-2" />
              {language === 'vi' ? 'Lọc' : 'Filter'}
            </button>

            <button className="btn-primary btn-pill-compact-md">
              <Download size={16} className="mr-2" />
              {content[language].export.title}
            </button>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div variants={motionSafe(slideUp)}>
          <h3 className="heading-4 text-gray-900 mb-6">
            {content[language].overview.title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsData.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <div
                  key={index}
                  className="bg-white rounded-3xl border border-border-subtle p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <IconComponent size={24} className="text-gray-600" />
                    <div
                      className={`flex items-center space-x-1 ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {stat.trend === 'up' ? (
                        <ArrowUp size={16} />
                      ) : (
                        <ArrowDown size={16} />
                      )}
                      <span className="body-sm font-medium">{stat.change}</span>
                    </div>
                  </div>
                  <div className="heading-2 text-gray-900 mb-2">
                    {stat.value}
                  </div>
                  <div className="body-sm text-gray-500">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Usage Chart */}
          <motion.div
            variants={motionSafe(slideUp)}
            className="bg-white rounded-3xl border border-border-subtle p-6"
          >
            <h3 className="heading-4 text-gray-900 mb-6">
              {content[language].charts.usage}
            </h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl">
              <div className="text-center">
                <BarChart3 size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="body-sm text-gray-500">
                  {language === 'vi'
                    ? 'Biểu đồ sử dụng theo thời gian'
                    : 'Usage chart over time'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Language Distribution */}
          <motion.div
            variants={motionSafe(slideUp)}
            className="bg-white rounded-3xl border border-border-subtle p-6"
          >
            <h3 className="heading-4 text-gray-900 mb-6">
              {content[language].charts.languages}
            </h3>
            <div className="space-y-4">
              {languageStats.map((lang, index) => (
                <div key={index} className="flex items-center">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="body-sm font-medium text-gray-900">
                        {lang.lang}
                      </span>
                      <span className="body-sm text-gray-500">
                        {lang.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${lang.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          variants={motionSafe(slideUp)}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          <div className="lg:col-span-2 bg-white rounded-3xl border border-border-subtle p-6">
            <h3 className="heading-4 text-gray-900 mb-6">
              {content[language].activity.title}
            </h3>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center p-4 rounded-2xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {activity.type === 'document' && (
                        <FileText size={18} className="text-blue-600" />
                      )}
                      {activity.type === 'api' && (
                        <Zap size={18} className="text-blue-600" />
                      )}
                      {activity.type === 'analysis' && (
                        <BarChart3 size={18} className="text-blue-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="body-sm font-medium text-gray-900">
                      {activity.action}
                    </div>
                    <div className="body-sm text-gray-600">
                      {activity.target}
                    </div>
                    <div className="body-xs text-gray-500 mt-1">
                      {activity.time}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-white rounded-3xl border border-border-subtle p-6">
            <h3 className="heading-4 text-gray-900 mb-6">
              {content[language].export.title}
            </h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-4 rounded-2xl border border-border-subtle hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <FileText size={20} className="text-gray-600 mr-3" />
                  <span className="body-sm font-medium text-gray-900">
                    {content[language].export.pdf}
                  </span>
                </div>
                <Download size={16} className="text-gray-400" />
              </button>

              <button className="w-full flex items-center justify-between p-4 rounded-2xl border border-border-subtle hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <BarChart3 size={20} className="text-gray-600 mr-3" />
                  <span className="body-sm font-medium text-gray-900">
                    {content[language].export.csv}
                  </span>
                </div>
                <Download size={16} className="text-gray-400" />
              </button>

              <button className="w-full flex items-center justify-between p-4 rounded-2xl border border-border-subtle hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <TrendingUp size={20} className="text-gray-600 mr-3" />
                  <span className="body-sm font-medium text-gray-900">
                    {content[language].export.excel}
                  </span>
                </div>
                <Download size={16} className="text-gray-400" />
              </button>
            </div>

            {/* Quick Insights */}
            <div className="mt-8 p-4 bg-blue-50 rounded-2xl">
              <h4 className="body-sm font-medium text-blue-900 mb-2">
                {language === 'vi' ? 'Thông tin nhanh' : 'Quick Insight'}
              </h4>
              <p className="body-xs text-blue-700">
                {language === 'vi'
                  ? 'Hoạt động dịch thuật tăng 23% trong 30 ngày qua. Tiếng Anh vẫn là ngôn ngữ được sử dụng nhiều nhất.'
                  : 'Translation activity increased 23% in the last 30 days. English remains the most used language.'}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
