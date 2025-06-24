'use client'

import React, { createContext, useContext, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useUnifiedAuth, type UnifiedAuthOptions } from '@/hooks/useUnifiedAuth'
import { AuthErrorBoundary } from '@/components/ErrorBoundary'
import AuthModal from '@/components/auth/AuthModal'

interface UnifiedAuthContextType {
  isAuthModalOpen: boolean
  authMode: 'signin' | 'signup'
  redirectTo?: string
  openAuthModal: (options?: UnifiedAuthOptions) => void
  closeAuthModal: () => void
  handleGetStarted: (options?: UnifiedAuthOptions) => void
  handleSignIn: (options?: UnifiedAuthOptions) => void
  handleAuthSuccess: () => void
  handleAuthError: (error: string) => void
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(
  undefined
)

export function UnifiedAuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { language } = useLanguage()
  const unifiedAuth = useUnifiedAuth()

  // Listen for openAuthModal events from AuthErrorHandler
  useEffect(() => {
    const handleOpenAuthModal = () => {
      unifiedAuth.openAuthModal({ mode: 'signin' })
    }

    window.addEventListener('openAuthModal', handleOpenAuthModal)
    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuthModal)
    }
  }, [unifiedAuth])

  return (
    <UnifiedAuthContext.Provider value={unifiedAuth}>
      {children}

      {/* Single AuthModal instance for the entire app */}
      <AuthErrorBoundary>
        <AuthModal
          isOpen={unifiedAuth.isAuthModalOpen}
          onClose={unifiedAuth.closeAuthModal}
          initialMode={unifiedAuth.authMode}
          language={language}
          redirectTo={unifiedAuth.redirectTo}
        />
      </AuthErrorBoundary>
    </UnifiedAuthContext.Provider>
  )
}

export function useUnifiedAuthContext() {
  const context = useContext(UnifiedAuthContext)
  if (context === undefined) {
    throw new Error(
      'useUnifiedAuthContext must be used within a UnifiedAuthProvider'
    )
  }
  return context
}
