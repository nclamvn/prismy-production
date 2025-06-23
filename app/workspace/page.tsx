'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useWorkspaceLoading } from '@/contexts/LoadingContext'
import { motionSafe, slideUp, staggerContainer, fadeIn } from '@/lib/motion'
import { WorkspaceErrorBoundary } from '@/components/ErrorBoundary'
import AuthenticatedLayout from '@/components/layouts/AuthenticatedLayout'
import AuthGuard from '@/components/auth/AuthGuard'
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
  const { isLoading: workspaceLoading, setLoading: setWorkspaceLoading } =
    useWorkspaceLoading()
  const [currentMode, setCurrentMode] = useState<WorkspaceMode>('documents')

  // AuthGuard handles authentication checks

  // Log workspace component lifecycle
  useEffect(() => {
    console.log('💼 Workspace: Component mounted', {
      user: user ? 'authenticated' : 'guest',
      loading,
    })

    return () => {
      console.log('💼 Workspace: Component unmounting')
    }
  }, [])

  // Update user state logging
  useEffect(() => {
    if (user) {
      console.log('✅ Workspace: User authenticated', user.email)
    }
  }, [user])

  // Coordinate workspace loading state
  useEffect(() => {
    setWorkspaceLoading(loading)
  }, [loading, setWorkspaceLoading])

  // Show loading while auth is being checked
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

  // AuthGuard ensures user is authenticated at this point
  if (!user) {
    console.warn(
      '⚠️ Workspace: No user but AuthGuard should have prevented this'
    )
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
    <AuthGuard requireAuth redirectTo="/">
      <WorkspaceErrorBoundary>
        <WorkspaceContent />
      </WorkspaceErrorBoundary>
    </AuthGuard>
  )
}
