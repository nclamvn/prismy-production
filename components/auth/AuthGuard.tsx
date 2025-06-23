'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useUnifiedAuthContext } from '@/contexts/UnifiedAuthProvider'
import { useLanguage } from '@/contexts/LanguageContext'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
  requireAuth?: boolean
}

export default function AuthGuard({
  children,
  fallback,
  redirectTo = '/',
  requireAuth = true,
}: AuthGuardProps) {
  const { user, loading, sessionRestored } = useAuth()
  const { handleSignIn } = useUnifiedAuthContext()
  const { language } = useLanguage()
  const router = useRouter()
  const authCheckedRef = useRef(false)

  useEffect(() => {
    // Wait for session to be restored before checking auth
    if (!sessionRestored || loading) {
      return
    }

    // If auth is required and no user, handle redirect
    if (requireAuth && !user && !authCheckedRef.current) {
      console.log('🔒 AuthGuard: No user found, redirecting to auth modal')
      authCheckedRef.current = true

      // Open auth modal and redirect to fallback
      handleSignIn({
        initialMode: 'signin',
        redirectTo: window.location.pathname,
      })

      // Navigate to fallback page
      router.push(redirectTo)
    }

    // Reset auth check when user becomes available
    if (user) {
      authCheckedRef.current = false
    }
  }, [
    sessionRestored,
    loading,
    user,
    requireAuth,
    handleSignIn,
    redirectTo,
    router,
  ])

  // Show loading state while checking auth
  if (!sessionRestored || loading) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mb-4 mx-auto"></div>
          <p className="body-base text-gray-600">
            {language === 'vi'
              ? 'Đang kiểm tra phiên...'
              : 'Checking session...'}
          </p>
        </div>
      </div>
    )
  }

  // If auth is required and no user, don't render children
  if (requireAuth && !user) {
    return null
  }

  // Render children if auth check passes
  return <>{children}</>
}
