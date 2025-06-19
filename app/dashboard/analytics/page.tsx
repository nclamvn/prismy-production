'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AuthProvider } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motionSafe, slideUp, staggerContainer } from '@/lib/motion'

function AnalyticsPage() {
  const [language, setLanguage] = useState<'vi' | 'en'>('en')
  const [selectedPeriod, setSelectedPeriod] = useState('30d')

  const content = {
    vi: {
      title: 'Phân tích & Thống kê',
      subtitle: 'Theo dõi hiệu suất dịch thuật và xu hướng sử dụng',
      periods: {
        '7d': '7 ngày',
        '30d': '30 ngày',
        '90d': '90 ngày',
        '1y': '1 năm'
      },
      metrics: {
        totalTranslations: 'Tổng số bản dịch',
        wordsTranslated: 'Từ đã dịch',
        avgAccuracy: 'Độ chính xác TB',
        timeSpent: 'Thời gian sử dụng',
        documentsProcessed: 'Tài liệu đã xử lý',
        languagePairs: 'Cặp ngôn ngữ',
        avgWordsPerDay: 'TB từ/ngày',
        efficiency: 'Hiệu suất'
      },
      charts: {
        translationsOverTime: 'Số lượng dịch theo thời gian',
        languageUsage: 'Sử dụng ngôn ngữ',
        accuracyTrend: 'Xu hướng độ chính xác',
        dailyActivity: 'Hoạt động hàng ngày',
        topLanguages: 'Ngôn ngữ phổ biến',
        weeklyPattern: 'Mẫu hình tuần'
      },
      insights: {
        title: 'Thông tin chi tiết',
        mostActive: 'Ngày hoạt động nhất',
        preferredLanguage: 'Ngôn ngữ ưa thích',
        peakHours: 'Giờ cao điểm',
        growthRate: 'Tốc độ tăng trưởng'
      }
    },
    en: {
      title: 'Analytics & Insights',
      subtitle: 'Track your translation performance and usage trends',
      periods: {
        '7d': '7 days',
        '30d': '30 days',
        '90d': '90 days',
        '1y': '1 year'
      },
      metrics: {
        totalTranslations: 'Total Translations',
        wordsTranslated: 'Words Translated',
        avgAccuracy: 'Avg Accuracy',
        timeSpent: 'Time Spent',
        documentsProcessed: 'Documents Processed',
        languagePairs: 'Language Pairs',
        avgWordsPerDay: 'Avg Words/Day',
        efficiency: 'Efficiency'
      },
      charts: {
        translationsOverTime: 'Translations Over Time',
        languageUsage: 'Language Usage',
        accuracyTrend: 'Accuracy Trend',
        dailyActivity: 'Daily Activity',
        topLanguages: 'Top Languages',
        weeklyPattern: 'Weekly Pattern'
      },
      insights: {
        title: 'Key Insights',
        mostActive: 'Most Active Day',
        preferredLanguage: 'Preferred Language',
        peakHours: 'Peak Hours',
        growthRate: 'Growth Rate'
      }
    }
  }

  // Mock data - in production, fetch from API
  const analyticsData = {
    metrics: {
      totalTranslations: 1234,
      wordsTranslated: 45678,
      avgAccuracy: 98.5,
      timeSpent: 127, // hours
      documentsProcessed: 89,
      languagePairs: 12,
      avgWordsPerDay: 850,
      efficiency: 92.3
    },
    trends: {
      translationsGrowth: '+23%',
      wordsGrowth: '+18%',
      accuracyChange: '+2.1%',
      efficiencyChange: '+5.2%'
    },
    charts: {
      translationsOverTime: [
        { date: '2024-01-01', count: 45 },
        { date: '2024-01-02', count: 52 },
        { date: '2024-01-03', count: 38 },
        { date: '2024-01-04', count: 67 },
        { date: '2024-01-05', count: 58 },
        { date: '2024-01-06', count: 71 },
        { date: '2024-01-07', count: 63 }
      ],
      languageUsage: [
        { language: 'EN → VI', percentage: 35, count: 432 },
        { language: 'VI → EN', percentage: 28, count: 345 },
        { language: 'EN → ES', percentage: 15, count: 185 },
        { language: 'JA → EN', percentage: 12, count: 148 },
        { language: 'Others', percentage: 10, count: 124 }
      ]
    }
  }

  return (
    <DashboardLayout language={language}>
      <motion.div
        variants={motionSafe(staggerContainer)}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div 
          className="mb-6"
          variants={motionSafe(slideUp)}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div>
              <h1 className="heading-2 text-gray-900 mb-2">{content[language].title}</h1>
              <p className="body-base text-gray-600">{content[language].subtitle}</p>
            </div>
            
            {/* Period Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1 mt-4 sm:mt-0">
              {Object.entries(content[language].periods).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPeriod(key)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    selectedPeriod === key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          variants={motionSafe(slideUp)}
        >
          {/* Total Translations */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <span className="text-sm text-green-600 font-medium">{analyticsData.trends.translationsGrowth}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{analyticsData.metrics.totalTranslations.toLocaleString()}</h3>
            <p className="text-sm text-gray-600">{content[language].metrics.totalTranslations}</p>
          </div>

          {/* Words Translated */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm text-green-600 font-medium">{analyticsData.trends.wordsGrowth}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{analyticsData.metrics.wordsTranslated.toLocaleString()}</h3>
            <p className="text-sm text-gray-600">{content[language].metrics.wordsTranslated}</p>
          </div>

          {/* Average Accuracy */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm text-green-600 font-medium">{analyticsData.trends.accuracyChange}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{analyticsData.metrics.avgAccuracy}%</h3>
            <p className="text-sm text-gray-600">{content[language].metrics.avgAccuracy}</p>
          </div>

          {/* Efficiency */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-sm text-green-600 font-medium">{analyticsData.trends.efficiencyChange}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{analyticsData.metrics.efficiency}%</h3>
            <p className="text-sm text-gray-600">{content[language].metrics.efficiency}</p>
          </div>
        </motion.div>

        {/* Charts Row 1 */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
          variants={motionSafe(slideUp)}
        >
          {/* Translations Over Time */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="heading-4 text-gray-900 mb-4">{content[language].charts.translationsOverTime}</h3>
            <div className="h-64 flex items-end justify-between space-x-2">
              {analyticsData.charts.translationsOverTime.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                    style={{ height: `${(item.count / 80) * 100}%` }}
                  />
                  <span className="text-xs text-gray-500 mt-2">
                    {new Date(item.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Language Usage */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="heading-4 text-gray-900 mb-4">{content[language].charts.languageUsage}</h3>
            <div className="space-y-4">
              {analyticsData.charts.languageUsage.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-gray-400'][index]
                    }`} />
                    <span className="text-sm font-medium text-gray-900">{item.language}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-gray-400'][index]
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Charts Row 2 */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
          variants={motionSafe(slideUp)}
        >
          {/* Daily Activity Pattern */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="heading-4 text-gray-900 mb-4">{content[language].charts.dailyActivity}</h3>
            <div className="space-y-3">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                const activity = [85, 92, 78, 95, 88, 45, 32][index]
                return (
                  <div key={day} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 w-8">{day}</span>
                    <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                        style={{ width: `${activity}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-900 w-8">{activity}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Key Insights */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="heading-4 text-gray-900 mb-4">{content[language].insights.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{content[language].insights.mostActive}</p>
                    <p className="font-medium text-gray-900">Thursday</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{content[language].insights.preferredLanguage}</p>
                    <p className="font-medium text-gray-900">English → Vietnamese</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{content[language].insights.peakHours}</p>
                    <p className="font-medium text-gray-900">2 PM - 4 PM</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{content[language].insights.growthRate}</p>
                    <p className="font-medium text-gray-900">+23% this month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default function Analytics() {
  return (
    <AuthProvider>
      <AnalyticsPage />
    </AuthProvider>
  )
}