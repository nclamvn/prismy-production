'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export function UserMenu() {
  const { user, signOut, profile } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Get display name from profile or user metadata, fallback to email
  const displayName = 
    profile?.full_name || 
    user?.user_metadata?.full_name || 
    user?.email?.split('@')[0] || 
    'User'

  // Get user initials for avatar
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user?.email?.[0].toUpperCase() || 'U'
  }

  const handleSignOut = async () => {
    setLoading(true)
    setShowMenu(false) // Close menu immediately
    
    try {
      // Use enhanced signOut with redirect
      await signOut('/')
      // Note: signOut will handle the redirect, so no need for router.push
    } catch (error) {
      console.error('Sign out error:', error)
      // If sign out fails, still redirect to home
      router.push('/')
    } finally {
      setLoading(false)
    }
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
            {getInitials()}
          </span>
        </div>
        <span className="text-sm text-primary hidden sm:block">
          {displayName}
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
                {displayName}
              </div>
              <div className="text-xs text-muted mt-1">
                {user.email}
              </div>
              <div className="text-xs text-muted mt-1">
                Free Trial • 14 days left
              </div>
            </div>

            <div className="py-2">
              <MenuItem
                onClick={() => {
                  router.push('/app')
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

function MenuItem({
  children,
  onClick,
  disabled,
  className = '',
}: MenuItemProps) {
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
