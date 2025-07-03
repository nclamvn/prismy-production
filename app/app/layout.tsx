'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Force dynamic rendering to avoid SSR issues with auth
export const dynamic = 'force-dynamic'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, sessionRestored } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect after session restoration is complete AND no user is found
    if (sessionRestored && !loading && !user) {
      router.replace('/login?next=/app')
    }
  }, [sessionRestored, loading, user, router])

  // Show loading while session is being restored OR while loading
  if (!sessionRestored || loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-brand"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="workspace flex h-full">
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
