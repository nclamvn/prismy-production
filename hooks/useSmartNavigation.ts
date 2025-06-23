'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useUnifiedAuthContext } from '@/contexts/UnifiedAuthProvider'

export interface SmartNavigationOptions {
  redirectTo?: string
  forceDestination?: boolean // Override smart logic
  onNavigationStart?: () => void
  onNavigationComplete?: () => void
}

export function useSmartNavigation() {
  const { user, loading } = useAuth()
  const { handleSignIn: unifiedHandleSignIn } = useUnifiedAuthContext()
  const router = useRouter()

  // Smart logo navigation - adapts based on auth state
  const handleLogoClick = useCallback(
    (event?: React.MouseEvent, options: SmartNavigationOptions = {}) => {
      const {
        redirectTo,
        forceDestination = false,
        onNavigationStart,
        onNavigationComplete,
      } = options

      console.log('🏠 SmartNavigation: Logo click', {
        user: user ? 'authenticated' : 'guest',
        ctrlKey: event?.ctrlKey,
        metaKey: event?.metaKey,
        forceDestination,
      })

      if (onNavigationStart) onNavigationStart()

      // Ctrl/Cmd + Click = always go to homepage (override behavior)
      if (event && (event.ctrlKey || event.metaKey)) {
        console.log('🔄 SmartNavigation: Override to homepage (Ctrl/Cmd+Click)')
        router.push('/')
        if (onNavigationComplete) onNavigationComplete()
        return
      }

      // Force specific destination
      if (forceDestination && redirectTo) {
        console.log('🎯 SmartNavigation: Force navigation to', redirectTo)
        router.push(redirectTo)
        if (onNavigationComplete) onNavigationComplete()
        return
      }

      // Smart navigation logic
      if (user) {
        // Authenticated: Primary action is workspace
        const destination = redirectTo || '/workspace'
        console.log(
          '✅ SmartNavigation: Authenticated user, navigating to',
          destination
        )
        router.push(destination)
      } else {
        // Guest: Go to homepage
        console.log('🏠 SmartNavigation: Guest user, navigating to homepage')
        router.push('/')
      }

      if (onNavigationComplete) onNavigationComplete()
    },
    [user, router]
  )

  // Smart Get Started - unified logic for all entry points
  const handleGetStarted = useCallback(
    (options: SmartNavigationOptions = {}) => {
      const {
        redirectTo = '/workspace',
        onNavigationStart,
        onNavigationComplete,
      } = options

      console.log('🚀 SmartNavigation: Get Started click', {
        user: user ? 'authenticated' : 'guest',
        redirectTo,
      })

      if (onNavigationStart) onNavigationStart()

      if (user) {
        // User is authenticated - direct navigation
        console.log(
          '✅ SmartNavigation: Authenticated, direct navigation to',
          redirectTo
        )
        router.push(redirectTo)
        if (onNavigationComplete) onNavigationComplete()
      } else {
        // User needs authentication
        console.log('🔐 SmartNavigation: Not authenticated, opening auth modal')
        unifiedHandleSignIn({
          initialMode: 'signup',
          redirectTo,
          onSuccess: onNavigationComplete,
        })
      }
    },
    [user, unifiedHandleSignIn, router]
  )

  // Smart Back to Home - context-aware homepage navigation
  const handleBackToHome = useCallback(
    (options: SmartNavigationOptions = {}) => {
      const { onNavigationStart, onNavigationComplete } = options

      console.log('🏠 SmartNavigation: Back to Home click')

      if (onNavigationStart) onNavigationStart()

      // Always navigate to homepage, regardless of auth state
      router.push('/')

      if (onNavigationComplete) onNavigationComplete()
    },
    [router]
  )

  // Smart Sign In - always opens auth modal
  const handleSignIn = useCallback(
    (options: SmartNavigationOptions = {}) => {
      const { redirectTo, onNavigationStart, onNavigationComplete } = options

      console.log('🔐 SmartNavigation: Sign In click', { redirectTo })

      if (onNavigationStart) onNavigationStart()

      unifiedHandleSignIn({
        initialMode: 'signin',
        redirectTo,
        onSuccess: onNavigationComplete,
      })
    },
    [unifiedHandleSignIn]
  )

  // Workspace navigation - with auth check
  const handleWorkspaceNavigation = useCallback(
    (options: SmartNavigationOptions = {}) => {
      const { onNavigationStart, onNavigationComplete } = options

      console.log('💼 SmartNavigation: Workspace navigation', {
        user: user ? 'authenticated' : 'guest',
      })

      if (onNavigationStart) onNavigationStart()

      if (user) {
        // Direct navigation to workspace
        router.push('/workspace')
        if (onNavigationComplete) onNavigationComplete()
      } else {
        // Need authentication first
        unifiedHandleSignIn({
          initialMode: 'signin',
          redirectTo: '/workspace',
          onSuccess: onNavigationComplete,
        })
      }
    },
    [user, unifiedHandleSignIn, router]
  )

  return {
    // Navigation handlers
    handleLogoClick,
    handleGetStarted,
    handleBackToHome,
    handleSignIn,
    handleWorkspaceNavigation,

    // State helpers
    isAuthenticated: !!user,
    isLoading: loading,

    // Utility
    navigateTo: (path: string) => {
      console.log('🔄 SmartNavigation: Direct navigation to', path)
      router.push(path)
    },
  }
}
