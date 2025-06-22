'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { motionSafe, slideUp, staggerContainer, fadeIn } from '@/lib/motion'
import AuthModal from '@/components/auth/AuthModal'
import WorkspaceLayout from '@/components/workspace/WorkspaceLayout'
import DocumentMode from '@/components/workspace/modes/DocumentMode'
import IntelligenceMode from '@/components/workspace/modes/IntelligenceMode'
import AnalyticsMode from '@/components/workspace/modes/AnalyticsMode'
import APIMode from '@/components/workspace/modes/APIMode'
import EnterpriseMode from '@/components/workspace/modes/EnterpriseMode'
import BillingMode from '@/components/workspace/modes/BillingMode'
import SettingsMode from '@/components/workspace/modes/SettingsMode'

export type WorkspaceMode =
  | 'documents'
  | 'intelligence'
  | 'analytics'
  | 'api'
  | 'enterprise'
  | 'billing'
  | 'settings'

function WorkspaceContent() {
  const { language } = useLanguage()
  const { user, loading } = useAuth()
  const [currentMode, setCurrentMode] = useState<WorkspaceMode>('documents')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Redirect to login if not authenticated
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <motion.div
          className="text-center max-w-md"
          variants={motionSafe(staggerContainer)}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            variants={motionSafe(slideUp)}
            className="heading-2 text-gray-900 mb-4"
          >
            {language === 'vi' ? 'Cần đăng nhập' : 'Authentication Required'}
          </motion.h1>
          <motion.p
            variants={motionSafe(slideUp)}
            className="body-base text-gray-600 mb-6"
          >
            {language === 'vi'
              ? 'Vui lòng đăng nhập để truy cập không gian làm việc Prismy'
              : 'Please sign in to access your Prismy workspace'}
          </motion.p>
          <motion.div variants={motionSafe(slideUp)}>
            <button
              onClick={() => {
                console.log('🔘 Sign In button clicked!')
                console.log('📊 Current modal state:', isAuthModalOpen)
                setIsAuthModalOpen(true)
                console.log('📊 Setting modal state to: true')
              }}
              className="btn-primary btn-pill-lg"
            >
              {language === 'vi' ? 'Đăng nhập' : 'Sign In'}
            </button>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  const renderCurrentMode = () => {
    switch (currentMode) {
      case 'documents':
        return <DocumentMode language={language} />
      case 'intelligence':
        return <IntelligenceMode language={language} />
      case 'analytics':
        return <AnalyticsMode language={language} />
      case 'api':
        return <APIMode language={language} />
      case 'enterprise':
        return <EnterpriseMode language={language} />
      case 'billing':
        return <BillingMode language={language} />
      case 'settings':
        return <SettingsMode language={language} />
      default:
        return <DocumentMode language={language} />
    }
  }

  return (
    <div className="min-h-screen bg-bg-main">
      <motion.div
        variants={motionSafe(fadeIn)}
        initial="hidden"
        animate="visible"
        className="h-screen flex flex-col"
      >
        <WorkspaceLayout
          currentMode={currentMode}
          onModeChange={setCurrentMode}
          language={language}
          user={user}
        >
          {renderCurrentMode()}
        </WorkspaceLayout>
      </motion.div>

      {/* Auth Modal - only show when not authenticated */}
      {!user && (
        <>
          {console.log('🎭 Rendering AuthModal:', { 
            isAuthModalOpen, 
            user: !!user,
            shouldShow: !user && isAuthModalOpen 
          })}
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => {
              console.log('🚪 AuthModal close requested')
              setIsAuthModalOpen(false)
            }}
            initialMode="signin"
            language={language}
          />
        </>
      )}
    </div>
  )
}

export default function WorkspacePage() {
  return (
    <AuthProvider>
      <WorkspaceContent />
    </AuthProvider>
  )
}
