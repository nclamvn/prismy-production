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
          <div className="rounded-xl p-8" style={{ backgroundColor: 'rgba(251, 250, 249, 1)', border: '1px solid var(--surface-outline)' }}>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Billing Management
            </h3>
            <p className="text-gray-600">Billing features coming soon...</p>
          </div>
        )
      case 'settings':
        return (
          <div className="rounded-xl p-8" style={{ backgroundColor: 'rgba(251, 250, 249, 1)', border: '1px solid var(--surface-outline)' }}>
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
        <WorkspaceLayout
          currentMode={activeMode}
          onModeChange={setActiveMode}
          language={language}
          user={user}
        >
          <motion.div
            className="space-y-6 p-6"
            variants={motionSafe(staggerContainer)}
            initial="hidden"
            animate="visible"
          >
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