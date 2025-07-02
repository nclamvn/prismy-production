'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Rocket } from 'lucide-react'
import { WorkspaceLayout } from '@/components/layouts/WorkspaceLayout'

// Force dynamic rendering to avoid SSR issues with auth
export const dynamic = 'force-dynamic'

export default function WorkspacePage() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Show loading state during hydration
  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-workspace-canvas">
        <div className="text-center">
          <Rocket size={32} className="text-accent-brand mx-auto mb-4" />
          <p className="text-secondary">Loading workspace...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-workspace-canvas">
        <div className="text-center">
          <p className="text-secondary">Please sign in to access the workspace.</p>
        </div>
      </div>
    )
  }

  return <WorkspaceLayout />
}
