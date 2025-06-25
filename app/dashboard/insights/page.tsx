'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import PredictiveInsights from '@/components/workspace/dashboard/PredictiveInsights'
import CrossDocumentIntelligence from '@/components/workspace/dashboard/CrossDocumentIntelligence'
import { motionSafe, slideUp, staggerContainer } from '@/lib/motion'
import { Brain, Zap, TrendingUp, BarChart3 } from 'lucide-react'

function InsightsPage() {
  const [language, setLanguage] = useState<'vi' | 'en'>('en')
  const [activeTab, setActiveTab] = useState<'predictive' | 'cross-document'>('predictive')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load insights data
    setLoading(false)
  }, [])

  const content = {
    vi: {
      title: 'Thông tin thông minh AI',
      subtitle: 'Phân tích dự đoán và thông tin đa tài liệu',
      tabs: {
        predictive: 'Dự đoán thông minh',
        crossDocument: 'Phân tích đa tài liệu'
      },
      description: {
        predictive: 'AI dự đoán nhu cầu và đề xuất tối ưu hóa',
        crossDocument: 'Phân tích mối quan hệ và insights từ nhiều tài liệu'
      }
    },
    en: {
      title: 'AI Insights',
      subtitle: 'Predictive analytics and cross-document intelligence',
      tabs: {
        predictive: 'Predictive Insights',
        crossDocument: 'Cross-Document Analysis'
      },
      description: {
        predictive: 'AI predicts your needs and suggests optimizations',
        crossDocument: 'Analyze relationships and insights across multiple documents'
      }
    }
  }

  return (
    <DashboardLayout language={language}>
      <motion.div
        variants={motionSafe(staggerContainer)}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div className="flex items-center justify-between" variants={motionSafe(slideUp)}>
          <div>
            <h1 className="heading-2 text-gray-900 flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl">
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
              <span>{content[language].title}</span>
            </h1>
            <p className="body-lg text-gray-600 mt-2">
              {content[language].subtitle}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {language === 'vi' ? 'EN' : 'VI'}
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div className="border-b border-gray-200" variants={motionSafe(slideUp)}>
          <nav className="flex space-x-8">
            {[
              { key: 'predictive', label: content[language].tabs.predictive, icon: TrendingUp },
              { key: 'cross-document', label: content[language].tabs.crossDocument, icon: BarChart3 }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === key
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </motion.div>

        {/* Tab Description */}
        <motion.div 
          className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200"
          variants={motionSafe(slideUp)}
        >
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {activeTab === 'predictive' 
                  ? content[language].tabs.predictive
                  : content[language].tabs.crossDocument
                }
              </h3>
              <p className="text-gray-600">
                {activeTab === 'predictive' 
                  ? content[language].description.predictive
                  : content[language].description.crossDocument
                }
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div variants={motionSafe(slideUp)}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'predictive' ? (
                <PredictiveInsights />
              ) : (
                <CrossDocumentIntelligence />
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}

export default function InsightsDashboard() {
  return <InsightsPage />
}