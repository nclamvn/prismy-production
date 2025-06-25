'use client'

// Simplified Workspace Page for MVP
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { motionSafe, slideUp, staggerContainer } from '@/lib/motion'
import AuthenticatedLayout from '@/components/layouts/AuthenticatedLayout'
import AuthGuard from '@/components/auth/AuthGuard'
import WorkspaceLayout from '@/components/workspace/WorkspaceLayout'
import SimpleTranslationInterface from '@/components/workspace/SimpleTranslationInterface'

export type WorkspaceMode = 'translation' | 'billing' | 'settings'

export default function Workspace() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const [activeMode, setActiveMode] = useState<WorkspaceMode>('translation')

  const content = {
    vi: {
      title: 'Không gian làm việc',
      subtitle: 'Quản lý dự án dịch thuật của bạn',
      modes: {
        translation: 'Dịch thuật',
        billing: 'Thanh toán',
        settings: 'Cài đặt'
      }
    },
    en: {
      title: 'Workspace',
      subtitle: 'Manage your translation projects',
      modes: {
        translation: 'Translation',
        billing: 'Billing', 
        settings: 'Settings'
      }
    }
  }

  const renderActiveMode = () => {
    switch (activeMode) {
      case 'translation':
        return <SimpleTranslationInterface />
      case 'billing':
        return (
          <div className="bg-white rounded-xl p-8 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Billing Management
            </h3>
            <p className="text-gray-600">Billing features coming soon...</p>
          </div>
        )
      case 'settings':
        return (
          <div className="bg-white rounded-xl p-8 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Settings
            </h3>
            <p className="text-gray-600">Settings panel coming soon...</p>
          </div>
        )
      default:
        return <SimpleTranslationInterface />
    }
  }

  return (
    <AuthGuard>
      <AuthenticatedLayout>
        <WorkspaceLayout>
          <motion.div
            className="space-y-6"
            variants={motionSafe(staggerContainer)}
            initial="hidden"
            animate="visible"
          >
            {/* Header */}
            <motion.div
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center"
              variants={motionSafe(slideUp)}
            >
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {content[language].title}
                </h1>
                <p className="text-gray-600">
                  {content[language].subtitle}
                </p>
              </div>
            </motion.div>

            {/* Mode Navigation */}
            <motion.div
              className="flex space-x-1 bg-gray-100 rounded-lg p-1"
              variants={motionSafe(slideUp)}
            >
              {(Object.keys(content[language].modes) as WorkspaceMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setActiveMode(mode)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeMode === mode
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {content[language].modes[mode]}
                </button>
              ))}
            </motion.div>

            {/* Active Mode Content */}
            <motion.div variants={motionSafe(slideUp)}>
              {renderActiveMode()}
            </motion.div>
          </motion.div>
        </WorkspaceLayout>
      </AuthenticatedLayout>
    </AuthGuard>
  )
}