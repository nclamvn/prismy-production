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
  const { user, loading } = useAuth()
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

  // Loading timeout mechanism to prevent infinite loading on refresh
  useEffect(() => {
    if (loading && !loadingTimedOut) {
      console.log('🔄 Workspace: Starting loading timeout (10s)')
      loadingTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Workspace: Loading timeout reached, showing auth modal')
        setLoadingTimedOut(true)
        authTriggeredRef.current = true
        handleSignIn({ redirectTo: '/workspace' })
      }, 10000) // 10 second timeout
    } else if (!loading) {
      // Clear timeout if loading finishes normally
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
  }, [loading, loadingTimedOut, handleSignIn])

  // Debounced auth check to prevent infinite loops
  useEffect(() => {
    // Clear any existing timeout
    if (authTimeoutRef.current) {
      clearTimeout(authTimeoutRef.current)
    }

    // Only trigger auth if we haven't already and conditions are met
    if (
      !loading &&
      !user &&
      !isAuthModalOpen &&
      !authTriggeredRef.current &&
      !loadingTimedOut
    ) {
      console.log('🔐 Workspace: Triggering auth modal (no user found)')
      authTimeoutRef.current = setTimeout(() => {
        authTriggeredRef.current = true
        handleSignIn({ redirectTo: '/workspace' })
      }, 500) // 500ms debounce
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
  }, [loading, user, isAuthModalOpen, handleSignIn, loadingTimedOut])

  // Coordinate workspace loading state
  useEffect(() => {
    setWorkspaceLoading(loading)
  }, [loading, setWorkspaceLoading])

  // Show loading only while initially checking auth
  if (loading && !loadingTimedOut) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mb-4 mx-auto"></div>
          <p className="body-base text-gray-600">
            {language === 'vi' ? 'Đang tải...' : 'Loading...'}
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="body-xs text-gray-400 mt-2">
              Debug: loading={loading.toString()}, user=
              {user ? 'present' : 'null'}
            </p>
          )}
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
