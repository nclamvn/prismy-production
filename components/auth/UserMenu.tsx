'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '@/lib/supabase-browser'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/Button'

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = getBrowserClient()

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    setLoading(true)
    const supabase = getBrowserClient()
    await supabase.auth.signOut()
    router.push('/')
    setLoading(false)
  }

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-bg-muted transition-colors"
      >
        <div className="w-8 h-8 bg-accent-brand rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {user.email?.[0].toUpperCase()}
          </span>
        </div>
        <span className="text-sm text-primary hidden sm:block">
          {user.email}
        </span>
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-surface border border-border-default rounded-lg shadow-lg py-2 z-50">
            <div className="px-4 py-2 border-b border-border-default">
              <div className="text-sm font-medium text-primary">
                {user.email}
              </div>
              <div className="text-xs text-muted mt-1">
                Free Trial • 14 days left
              </div>
            </div>

            <div className="py-2">
              <MenuItem
                onClick={() => {
                  router.push('/workspace')
                  setShowMenu(false)
                }}
              >
                Workspace
              </MenuItem>
              <MenuItem
                onClick={() => {
                  router.push('/settings')
                  setShowMenu(false)
                }}
              >
                Settings
              </MenuItem>
              <MenuItem
                onClick={() => {
                  router.push('/billing')
                  setShowMenu(false)
                }}
              >
                Billing & Usage
              </MenuItem>
            </div>

            <div className="border-t border-border-default pt-2">
              <MenuItem
                onClick={handleSignOut}
                disabled={loading}
                className="text-red-600 hover:bg-red-50"
              >
                {loading ? 'Signing out...' : 'Sign Out'}
              </MenuItem>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

interface MenuItemProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}

function MenuItem({ children, onClick, disabled, className = '' }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-4 py-2 text-sm hover:bg-bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  )
}