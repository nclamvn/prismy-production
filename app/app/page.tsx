'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Rocket } from 'lucide-react'
import { WorkspaceLayout } from '@/components/layouts/WorkspaceLayout'

// Force dynamic rendering to avoid SSR issues with auth
export const dynamic = 'force-dynamic'

export default function WorkspacePage() {
  const { user, loading, sessionRestored } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [authSettled, setAuthSettled] = useState(false)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Add a small delay after auth is restored to ensure all components
  // have time to receive the auth state before rendering
  useEffect(() => {
    if (sessionRestored && user) {
      const timer = setTimeout(() => {
        setAuthSettled(true)
      }, 300) // Small delay to let auth state propagate

      return () => clearTimeout(timer)
    } else if (sessionRestored && !user) {
      setAuthSettled(true) // No delay needed when redirecting
    }
  }, [sessionRestored, user])

  // Wait for auth to be fully initialized before making decisions
  useEffect(() => {
    if (mounted && sessionRestored && !loading && !user) {
      // Only redirect if we're certain there's no user after session is restored
      router.replace('/login')
    }
  }, [mounted, sessionRestored, loading, user, router])

  // Show loading state during hydration or while auth is initializing
  // Extended loading state to ensure auth is fully settled
  if (!mounted || loading || !sessionRestored || (user && !authSettled)) {
    return (
      <div className="h-screen flex items-center justify-center bg-workspace-canvas">
        <div className="text-center">
          <Rocket
            size={32}
            className="text-accent-brand mx-auto mb-4 animate-pulse"
          />
          <p className="text-secondary">Loading workspace...</p>
        </div>
      </div>
    )
  }

  // If we have a user and auth has settled, show the workspace
  if (user && authSettled) {
    return <WorkspaceLayout />
  }

  // Fallback loading state (should not be reached due to useEffect redirect)
  return (
    <div className="h-screen flex items-center justify-center bg-workspace-canvas">
      <div className="text-center">
        <Rocket size={32} className="text-accent-brand mx-auto mb-4" />
        <p className="text-secondary">Checking authentication...</p>
      </div>
    </div>
  )
}
