'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { UserMenu } from '@/components/auth/UserMenu'
import { Button } from '@/components/ui/Button'

interface SidebarFooterProps {
  collapsed?: boolean
  className?: string
}

/**
 * SidebarFooter - Footer action bar inside workspace sidebar
 * Contains home button, credits display, upgrade link, and user avatar
 */
export function SidebarFooter({
  collapsed = false,
  className = '',
}: SidebarFooterProps) {
  const router = useRouter()
  const { user, loading, authStable, authTransition } = useAuth()
  const [credits, setCredits] = useState({
    remaining: 0,
    bonus: 0,
    tier: 'free',
  })
  const [creditsLoading, setCreditsLoading] = useState(true)

  const handleHomeClick = () => {
    router.push('/')
  }

  // Fetch credits when user is available and auth is stable
  useEffect(() => {
    if (user && !loading && authStable && !authTransition) {
      const fetchCredits = async () => {
        try {
          setCreditsLoading(true)

          // Auth state is stable, so we can make the API call directly
          const response = await fetch('/api/credits/current')

          // If we still get 401, it indicates a real auth issue
          if (response.status === 401) {
            console.warn('Credits API: Unexpected auth failure despite stable auth state')
            setCredits({ remaining: 0, bonus: 0, tier: 'free' })
            return
          }

          const data = await response.json()

          if (data.success) {
            setCredits(data.credits)
          } else {
            // Only log non-auth errors
            if (data.error !== 'Unauthorized') {
              console.warn('Failed to fetch credits:', data.error)
            }
            // Set default values if API fails
            setCredits({ remaining: 0, bonus: 0, tier: 'free' })
          }
        } catch (error) {
          // Silently handle errors during initial load
          console.debug('Credits fetch error (non-critical):', error)
          setCredits({ remaining: 0, bonus: 0, tier: 'free' })
        } finally {
          setCreditsLoading(false)
        }
      }

      fetchCredits()
    } else if (!user) {
      setCredits({ remaining: 0, bonus: 0, tier: 'free' })
      setCreditsLoading(false)
    }
  }, [user, loading, authStable, authTransition])

  // Note: Mobile hiding handled by CSS classes

  if (loading || creditsLoading || authTransition || !authStable) {
    return (
      <div
        className={`h-14 hidden md:flex items-center justify-center border-t border-border-default bg-surface dark:bg-[#111] ${className}`}
      >
        <div className="animate-pulse flex space-x-2">
          <div className="w-9 h-9 bg-muted rounded-lg"></div>
          <div className="w-16 h-6 bg-muted rounded-full"></div>
          <div className="w-8 h-8 bg-muted rounded-full"></div>
        </div>
      </div>
    )
  }

  if (collapsed) {
    return (
      <div
        className={`h-14 hidden md:flex flex-col items-center justify-center gap-1 border-t border-border-default bg-surface dark:bg-[#111] ${className}`}
      >
        <button
          onClick={handleHomeClick}
          aria-label="Home"
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <Home className="h-5 w-5 text-secondary" />
        </button>
      </div>
    )
  }

  return (
    <div
      className={`h-14 hidden md:flex items-center justify-between px-3 border-t border-border-default bg-surface dark:bg-[#111] ${className}`}
    >
      {/* Home Button */}
      <button
        onClick={handleHomeClick}
        aria-label="Home"
        className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <Home className="h-5 w-5 text-secondary" />
      </button>

      {/* Credits and Upgrade */}
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-1 px-3 py-2 rounded-full bg-zinc-800 text-white text-xs dark:bg-zinc-600 transition-colors"
          role="status"
          aria-label={`${credits.remaining} credits remaining`}
        >
          <Sparkles className="h-3 w-3" />
          <span>{credits.remaining}</span>
        </div>
        <Link
          href="/pricing"
          className="text-sm text-primary hover:underline transition-colors"
          aria-label="Upgrade to get more credits"
        >
          Upgrade
        </Link>
      </div>

      {/* User Avatar / Sign In */}
      {user ? (
        <UserMenu
          user={user}
          trigger={
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-black/10 dark:ring-white/10 overflow-hidden hover:ring-2 hover:ring-accent-brand transition-all"
              aria-label="User menu"
            >
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="User avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-accent-brand text-white text-sm font-medium flex items-center justify-center">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </button>
          }
        />
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push('/login')}
          className="text-xs h-8 px-3"
        >
          Sign In
        </Button>
      )}
    </div>
  )
}
