'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
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

  // Logo navigation - ALWAYS goes to homepage
  const handleLogoClick = useCallback(
    (event?: React.MouseEvent, options: SmartNavigationOptions = {}) => {
      const { onNavigationStart, onNavigationComplete } = options

      console.log('🏠 SmartNavigation: Logo click - navigating to homepage', {
        currentPath:
          typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        hasRouter: !!router,
        eventType: event?.type || 'unknown',
        eventTarget: event?.target || 'unknown',
        routerAvailable: typeof router?.push === 'function',
      })

      if (onNavigationStart) onNavigationStart()

      try {
        // Prevent default behavior if event exists
        if (event) {
          event.preventDefault()
          event.stopPropagation()
        }

        // Logo ALWAYS goes to homepage regardless of auth state
        console.log('🔄 SmartNavigation: About to call router.push("/")...')
        router.push('/')
        console.log('✅ SmartNavigation: router.push("/") called successfully')

        // Test window navigation as fallback
        if (typeof window !== 'undefined') {
          console.log(
            '🌐 SmartNavigation: Window location available, current:',
            window.location.href
          )
        }
      } catch (error) {
        console.error('❌ SmartNavigation: Error in router.push("/")', error)

        // Fallback to window navigation
        if (typeof window !== 'undefined') {
          console.log(
            '🔄 SmartNavigation: Attempting fallback window navigation'
          )
          try {
            window.location.href = '/'
            console.log('✅ SmartNavigation: Fallback navigation initiated')
          } catch (fallbackError) {
            console.error(
              '❌ SmartNavigation: Fallback navigation failed',
              fallbackError
            )
          }
        }
      }

      if (onNavigationComplete) onNavigationComplete()
    },
    [router]
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

  // Back to Home - always goes to homepage
  const handleBackToHome = useCallback(
    (options: SmartNavigationOptions = {}) => {
      const { onNavigationStart, onNavigationComplete } = options

      console.log('🏠 SmartNavigation: Back to Home click', {
        currentPath:
          typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        hasRouter: !!router,
        routerAvailable: typeof router?.push === 'function',
      })

      if (onNavigationStart) onNavigationStart()

      try {
        // Always navigate to homepage
        console.log(
          '🔄 SmartNavigation: Back to Home - About to call router.push("/")...'
        )
        router.push('/')
        console.log(
          '✅ SmartNavigation: Back to Home - router.push("/") called successfully'
        )
      } catch (error) {
        console.error(
          '❌ SmartNavigation: Back to Home - Error in router.push("/")',
          error
        )

        // Fallback to window navigation
        if (typeof window !== 'undefined') {
          console.log(
            '🔄 SmartNavigation: Back to Home - Attempting fallback window navigation'
          )
          try {
            window.location.href = '/'
            console.log(
              '✅ SmartNavigation: Back to Home - Fallback navigation initiated'
            )
          } catch (fallbackError) {
            console.error(
              '❌ SmartNavigation: Back to Home - Fallback navigation failed',
              fallbackError
            )
          }
        }
      }

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
