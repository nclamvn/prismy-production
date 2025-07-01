'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useUnifiedAuthContext } from '@/contexts/UnifiedAuthProvider'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import WorkspaceSkeleton from '@/components/workspace/WorkspaceSkeleton'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAuth?: boolean
}

export default function AuthGuard({
  children,
  fallback,
  requireAuth = true,
}: AuthGuardProps) {
  const { user, loading, sessionRestored } = useAuth()
  const { handleSignIn } = useUnifiedAuthContext()
  const { language } = useSSRSafeLanguage()
  const pathname = usePathname()
  const authCheckedRef = useRef(false)

  // Check if we're on workspace pages for better skeleton loading
  const isWorkspacePage =
    pathname.startsWith('/workspace') || pathname.startsWith('/dashboard')

  useEffect(() => {
    // Wait for session to be restored before checking auth
    if (!sessionRestored || loading) {
      return
    }

    // If auth is required and no user, open auth modal (but stay on current page)
    if (requireAuth && !user && !authCheckedRef.current) {
      authCheckedRef.current = true

      // Open auth modal with current page as redirect target
      handleSignIn({
        initialMode: 'signin',
        redirectTo: window.location.pathname,
      })
    }

    // Reset auth check when user becomes available
    if (user) {
      authCheckedRef.current = false
    }
  }, [sessionRestored, loading, user, requireAuth, handleSignIn])

  // Optimized loading states - prevent flicker with immediate rendering
  if (!sessionRestored || loading) {
    if (fallback) {
      return <>{fallback}</>
    }

    // Show workspace skeleton for workspace pages only
    if (isWorkspacePage) {
      return <WorkspaceSkeleton />
    }

    // For other pages, render nothing to prevent flicker
    return null
  }

  // If auth is required and no user, show workspace skeleton only for workspace pages
  if (requireAuth && !user) {
    if (isWorkspacePage) {
      return <WorkspaceSkeleton />
    }

    // For other pages, render nothing to prevent flicker
    return null
  }

  // Render children if auth check passes
  return <>{children}</>
}
