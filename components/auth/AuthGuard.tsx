'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '@/lib/supabase-browser'
import { User } from '@supabase/supabase-js'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = getBrowserClient()

    // Check initial auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
      
      if (!user) {
        router.push('/')
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      
      if (!session?.user) {
        router.push('/')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-brand mx-auto mb-4"></div>
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}