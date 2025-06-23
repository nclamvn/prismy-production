'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motionSafe, slideUp, staggerContainer } from '@/lib/motion'

function DashboardOverview() {
  const [language, setLanguage] = useState<'vi' | 'en'>('en')
  const { user } = useAuth()

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

  return (
    <DashboardLayout language={language}>
      <motion.div
        variants={motionSafe(staggerContainer)}
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
          <h2 className="heading-4 text-gray-900 mb-4">
            {content[language].quickStats}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Translations */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
                  </svg>
                </div>
                <span className="text-sm text-green-600 font-medium">+12%</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">1,234</h3>
              <p className="text-sm text-gray-600">
                {content[language].stats.totalTranslations}
              </p>
            </div>

            {/* This Month */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <span className="text-sm text-green-600 font-medium">+23%</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">89</h3>
              <p className="text-sm text-gray-600">
                {content[language].stats.thisMonth}
              </p>
            </div>

            {/* Words Translated */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <span className="text-sm text-green-600 font-medium">+18%</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">45.2K</h3>
              <p className="text-sm text-gray-600">
                {content[language].stats.wordsTranslated}
              </p>
            </div>

            {/* Documents Processed */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <span className="text-sm text-green-600 font-medium">+7%</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">156</h3>
              <p className="text-sm text-gray-600">
                {content[language].stats.documentsProcessed}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div className="mb-8" variants={motionSafe(slideUp)}>
          <h2 className="heading-4 text-gray-900 mb-4">
            {content[language].quickActions.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-shadow">
              <svg
                className="w-8 h-8 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
              </svg>
              <p className="font-medium">
                {content[language].quickActions.newTranslation}
              </p>
            </button>

            <button className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-shadow">
              <svg
                className="w-8 h-8 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="font-medium">
                {content[language].quickActions.uploadDocument}
              </p>
            </button>

            <button className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-shadow">
              <svg
                className="w-8 h-8 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="font-medium">
                {content[language].quickActions.viewHistory}
              </p>
            </button>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={motionSafe(slideUp)}>
          <h2 className="heading-4 text-gray-900 mb-4">
            {content[language].recentActivity}
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {content[language].activities.map((activity, index) => (
                <div
                  key={index}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-2 rounded-lg ${
                        activity.type === 'translation'
                          ? 'bg-blue-100'
                          : 'bg-purple-100'
                      }`}
                    >
                      {activity.type === 'translation' ? (
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.text}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default function DashboardPage() {
  return <DashboardOverview />
}
