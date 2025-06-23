'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useUnifiedAuthContext } from '@/contexts/UnifiedAuthProvider'
import { useWorkspaceLoading } from '@/contexts/LoadingContext'
import { motionSafe, slideUp, staggerContainer, fadeIn } from '@/lib/motion'
import { WorkspaceErrorBoundary } from '@/components/ErrorBoundary'
import AuthenticatedLayout from '@/components/layouts/AuthenticatedLayout'
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
  const { user, loading, sessionRestored } = useAuth()
  const { handleSignIn, isAuthModalOpen } = useUnifiedAuthContext()
  const { isLoading: workspaceLoading, setLoading: setWorkspaceLoading } =
    useWorkspaceLoading()
  const [currentMode, setCurrentMode] = useState<WorkspaceMode>('documents')

  // Prevent infinite auth loops
  const authTriggeredRef = useRef(false)
  const authTimeoutRef = useRef<NodeJS.Timeout>()

  // Loading timeout to prevent infinite loading on refresh
  const loadingTimeoutRef = useRef<NodeJS.Timeout>()
  const [loadingTimedOut, setLoadingTimedOut] = useState(false)

  // Enhanced loading timeout mechanism with session restoration awareness
  useEffect(() => {
    if (loading && !sessionRestored && !loadingTimedOut) {
      console.log('🔄 Workspace: Starting session restore timeout (12s)')
      loadingTimeoutRef.current = setTimeout(() => {
        console.log(
          '⏰ Workspace: Session restore timeout - proceeding with auth check'
        )
        setLoadingTimedOut(true)
      }, 12000) // 12 second timeout to allow for session restoration
    } else if (!loading || sessionRestored) {
      // Clear timeout if loading finishes or session is restored
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
      setLoadingTimedOut(false)
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [loading, sessionRestored, loadingTimedOut])

  // Enhanced auth check with session restoration awareness
  useEffect(() => {
    // Clear any existing timeout
    if (authTimeoutRef.current) {
      clearTimeout(authTimeoutRef.current)
    }

    // Only trigger auth after session restoration is complete
    if (
      sessionRestored && // Wait for session restoration
      !loading &&
      !user &&
      !isAuthModalOpen &&
      !authTriggeredRef.current
    ) {
      console.log(
        '🔐 Workspace: Session restored, no user found - triggering auth modal'
      )
      authTimeoutRef.current = setTimeout(() => {
        authTriggeredRef.current = true
        handleSignIn({ redirectTo: '/workspace' })
      }, 1000) // 1 second delay after session restoration
    }

    // Reset auth trigger when user becomes available
    if (user) {
      console.log('✅ Workspace: User authenticated successfully')
      authTriggeredRef.current = false
      setLoadingTimedOut(false)
    }

    return () => {
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current)
      }
    }
  }, [sessionRestored, loading, user, isAuthModalOpen, handleSignIn])

  // Coordinate workspace loading state
  useEffect(() => {
    setWorkspaceLoading(loading)
  }, [loading, setWorkspaceLoading])

  // Show loading while session is being restored or initial auth check
  if (
    (loading && !sessionRestored) ||
    (sessionRestored && !user && !authTriggeredRef.current && !loadingTimedOut)
  ) {
    const loadingMessage = !sessionRestored
      ? language === 'vi'
        ? 'Đang khôi phục phiên...'
        : 'Restoring session...'
      : language === 'vi'
        ? 'Đang tải...'
        : 'Loading...'

    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mb-4 mx-auto"></div>
          <p className="body-base text-gray-600">{loadingMessage}</p>
          {process.env.NODE_ENV === 'development' && (
            <p className="body-xs text-gray-400 mt-2">
              Debug: loading={loading.toString()}, sessionRestored=
              {sessionRestored.toString()}, user={user ? 'present' : 'null'}
            </p>
          )}
        </div>
      </div>
    )
  }

  // If session is restored but no user, return null (auth modal will handle it)
  if (sessionRestored && !user) {
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
    <AuthenticatedLayout>
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
    </AuthenticatedLayout>
  )
}

export default function WorkspacePage() {
  return (
    <WorkspaceErrorBoundary>
      <WorkspaceContent />
    </WorkspaceErrorBoundary>
  )
}
