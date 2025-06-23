'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export interface UnifiedAuthOptions {
  initialMode?: 'signin' | 'signup'
  redirectTo?: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function useUnifiedAuth() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [redirectTo, setRedirectTo] = useState<string | undefined>()
  const [onSuccess, setOnSuccess] = useState<(() => void) | undefined>()
  const [onError, setOnError] = useState<
    ((error: string) => void) | undefined
  >()

  const { user } = useAuth()

  // Open auth modal with specific configuration
  const openAuthModal = useCallback((options: UnifiedAuthOptions = {}) => {
    const {
      initialMode = 'signin',
      redirectTo: targetRedirect,
      onSuccess: successCallback,
      onError: errorCallback,
    } = options

    setAuthMode(initialMode)
    setRedirectTo(targetRedirect)
    setOnSuccess(() => successCallback)
    setOnError(() => errorCallback)
    setIsAuthModalOpen(true)
  }, [])

  // Close auth modal and reset state
  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false)
    setRedirectTo(undefined)
    setOnSuccess(undefined)
    setOnError(undefined)
  }, [])

  // Handle "Get Started" action - unified for all entry points
  const handleGetStarted = useCallback(
    (options: UnifiedAuthOptions = {}) => {
      if (user) {
        // User is already authenticated
        const targetRedirect = options.redirectTo || '/workspace'
        window.location.href = targetRedirect
      } else {
        // User needs to authenticate
        openAuthModal({
          initialMode: 'signup',
          ...options,
        })
      }
    },
    [user, openAuthModal]
  )

  // Handle "Sign In" action
  const handleSignIn = useCallback(
    (options: UnifiedAuthOptions = {}) => {
      openAuthModal({
        initialMode: 'signin',
        ...options,
      })
    },
    [openAuthModal]
  )

  // Handle authentication success
  const handleAuthSuccess = useCallback(() => {
    if (onSuccess) {
      onSuccess()
    }

    if (redirectTo) {
      // OAuth providers will handle the redirect automatically
      // For email/password auth, we handle it in the modal
      console.log('🎯 Auth success, redirecting to:', redirectTo)
    }

    closeAuthModal()
  }, [onSuccess, redirectTo, closeAuthModal])

  // Handle authentication error
  const handleAuthError = useCallback(
    (error: string) => {
      if (onError) {
        onError(error)
      } else {
        console.error('🚨 Auth error:', error)
      }
    },
    [onError]
  )

  return {
    // State
    isAuthModalOpen,
    authMode,
    redirectTo,

    // Actions
    openAuthModal,
    closeAuthModal,
    handleGetStarted,
    handleSignIn,
    handleAuthSuccess,
    handleAuthError,

    // For backward compatibility
    setIsAuthModalOpen,
    setAuthMode,
  }
}
