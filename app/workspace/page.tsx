'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useUnifiedAuthContext } from '@/contexts/UnifiedAuthProvider'
import { useWorkspaceLoading } from '@/contexts/LoadingContext'
import { motionSafe, slideUp, staggerContainer, fadeIn } from '@/lib/motion'
import { WorkspaceErrorBoundary } from '@/components/ErrorBoundary'
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
  const { handleSignIn, isAuthModalOpen } = useUnifiedAuthContext()
  const { isLoading: workspaceLoading, setLoading: setWorkspaceLoading } =
    useWorkspaceLoading()
  const [currentMode, setCurrentMode] = useState<WorkspaceMode>('documents')

  // Prevent infinite auth loops
  const authTriggeredRef = useRef(false)
  const authTimeoutRef = useRef<NodeJS.Timeout>()

  // Debounced auth check to prevent infinite loops
  useEffect(() => {
    // Clear any existing timeout
    if (authTimeoutRef.current) {
      clearTimeout(authTimeoutRef.current)
    }

    // Only trigger auth if we haven't already and conditions are met
    if (!loading && !user && !isAuthModalOpen && !authTriggeredRef.current) {
      authTimeoutRef.current = setTimeout(() => {
        authTriggeredRef.current = true
        handleSignIn({ redirectTo: '/workspace' })
      }, 500) // 500ms debounce
    }

    // Reset auth trigger when user becomes available
    if (user) {
      authTriggeredRef.current = false
    }

    return () => {
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current)
      }
    }
  }, [loading, user, isAuthModalOpen, handleSignIn])

  // Coordinate workspace loading state
  useEffect(() => {
    setWorkspaceLoading(loading)
  }, [loading, setWorkspaceLoading])

  // Show loading only while initially checking auth
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

  // If no user and not loading, return null (auth modal will handle it)
  if (!user) {
    return null
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
    <WorkspaceErrorBoundary>
      <WorkspaceContent />
    </WorkspaceErrorBoundary>
  )
}
