'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()

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
        // User is already authenticated - use Next.js router for SPA navigation
        const targetRedirect = options.redirectTo || '/workspace'
        router.push(targetRedirect)
      } else {
        // User needs to authenticate
        openAuthModal({
          initialMode: 'signup',
          ...options,
        })
      }
    },
    [user, openAuthModal, router]
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

    // Close modal first to prevent state conflicts
    closeAuthModal()

    // Handle redirect after modal is closed
    if (redirectTo) {
      // Use setTimeout to ensure modal close state is updated
      setTimeout(() => {
        router.push(redirectTo)
      }, 100)
    }
  }, [onSuccess, redirectTo, closeAuthModal, router])

  // Handle authentication error
  const handleAuthError = useCallback(
    (error: string) => {
      if (onError) {
        onError(error)
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
