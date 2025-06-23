'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useUnifiedAuthContext } from '@/contexts/UnifiedAuthProvider'
import { motionSafe, slideUp, staggerContainer, fadeIn } from '@/lib/motion'
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
  const { handleSignIn } = useUnifiedAuthContext()
  const [currentMode, setCurrentMode] = useState<WorkspaceMode>('documents')
  const [authModalOpened, setAuthModalOpened] = useState(false)
  const [authTimeout, setAuthTimeout] = useState(false)

  // Auto-open sign in modal if user is not authenticated
  useEffect(() => {
    if (!loading && !user && !authModalOpened) {
      setAuthModalOpened(true)
      handleSignIn({
        redirectTo: '/workspace',
        onSuccess: () => {
          // Authentication successful, staying on workspace
        },
      })
    }
  }, [loading, user, authModalOpened, handleSignIn])

  // Set timeout for authentication loading
  useEffect(() => {
    if (!user && !loading) {
      const timer = setTimeout(() => {
        setAuthTimeout(true)
      }, 10000) // 10 second timeout

      return () => clearTimeout(timer)
    }
  }, [user, loading])

  // Show loading state only while initially checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mb-4 mx-auto"></div>
          <p className="body-base text-gray-600">
            {language === 'vi' ? 'Đang tải...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  // If not authenticated and timeout reached, show message
  if (!user && authTimeout) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="heading-3 text-gray-900 mb-4">
            {language === 'vi' ? 'Cần đăng nhập' : 'Authentication Required'}
          </h2>
          <p className="body-base text-gray-600 mb-6">
            {language === 'vi'
              ? 'Vui lòng đăng nhập để truy cập không gian làm việc'
              : 'Please sign in to access your workspace'}
          </p>
          <button
            onClick={() => handleSignIn({ redirectTo: '/workspace' })}
            className="btn-primary btn-pill-lg"
          >
            {language === 'vi' ? 'Đăng nhập' : 'Sign In'}
          </button>
        </div>
      </div>
    )
  }

  // If not authenticated but within timeout, show authenticating message
  if (!user) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mb-4 mx-auto"></div>
          <p className="body-base text-gray-600">
            {language === 'vi' ? 'Đang xác thực...' : 'Authenticating...'}
          </p>
        </div>
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
