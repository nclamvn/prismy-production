'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Home,
  BarChart3,
  Shield,
  HelpCircle
} from 'lucide-react'

interface UnifiedUserMenuProps {
  className?: string
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  variant?: 'simple' | 'workspace' // Controls which features to show
  showSubscriptionTier?: boolean
  showAdminPanel?: boolean
}

export default function UnifiedUserMenu({ 
  className = '', 
  position = 'top-right',
  variant = 'workspace',
  showSubscriptionTier = true,
  showAdminPanel = true
}: UnifiedUserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { user, profile, signOut } = useAuth()
  const router = useRouter()

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Don't render if no user
  if (!user) return null

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
    router.push('/')
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    setIsOpen(false)
  }

  // Position classes for the dropdown
  const positionClasses = {
    'top-right': 'top-full right-0 mt-2',
    'top-left': 'top-full left-0 mt-2',
    'bottom-right': 'bottom-full right-0 mb-2',
    'bottom-left': 'bottom-full left-0 mb-2'
  }

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User'
  const avatarLetter = (profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()
  const userTier = user.user_metadata?.subscription_tier || 'free'
  const isAdmin = profile?.role === 'admin'

  if (variant === 'simple') {
    // Simple version similar to original UserMenu
    return (
      <div className={`relative ${className}`} ref={menuRef}>
        {/* User Avatar Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-1 focus:ring-gray-300"
          aria-label="Open user menu"
        >
          <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">{avatarLetter}</span>
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className={`absolute ${positionClasses[position]} w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50`}>
            <Link
              href="/workspace"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              Go to Workspace
            </Link>
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    )
  }

  // Workspace version (enhanced)
  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 transition-all duration-200"
        style={{
          borderRadius: 'var(--shape-corner-medium)',
          backgroundColor: isOpen ? 'var(--notebooklm-primary-light)' : 'transparent'
        }}
        aria-label="Open user menu"
      >
        <div 
          className="w-8 h-8 flex items-center justify-center"
          style={{
            backgroundColor: 'var(--notebooklm-primary)',
            borderRadius: 'var(--shape-corner-medium)'
          }}
        >
          <span 
            className="text-sm font-medium"
            style={{ color: 'var(--surface-elevated)' }}
          >
            {avatarLetter}
          </span>
        </div>
        
        <div className="hidden md:flex flex-col items-start">
          <span 
            className="text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {displayName}
          </span>
          {showSubscriptionTier && (
            <span 
              className="text-xs capitalize"
              style={{ color: 'var(--text-secondary)' }}
            >
              {userTier} tier
            </span>
          )}
        </div>
        
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-secondary)' }}
        />
      </button>

      {/* Enhanced Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${positionClasses[position]} w-56 py-2 z-50`}
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderRadius: 'var(--shape-corner-medium)',
              boxShadow: 'var(--elevation-level-3)',
              border: `1px solid var(--surface-outline)`
            }}
          >
            {/* User Info Header */}
            <div 
              className="px-4 py-3 border-b"
              style={{ borderColor: 'var(--surface-outline)' }}
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--notebooklm-primary-light)',
                    borderRadius: 'var(--shape-corner-medium)'
                  }}
                >
                  <span 
                    className="font-medium"
                    style={{
                      color: 'var(--notebooklm-primary)',
                      fontSize: 'var(--sys-label-medium-size)'
                    }}
                  >
                    {avatarLetter}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ color: 'var(--text-primary)' }}>
                    {displayName}
                  </p>
                  <p 
                    className="text-xs truncate"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {user.email}
                  </p>
                  {showSubscriptionTier && (
                    <p 
                      className="text-xs capitalize font-medium"
                      style={{ 
                        color: userTier === 'pro' ? 'var(--success-500)' : 'var(--text-muted)' 
                      }}
                    >
                      {userTier} plan
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => handleNavigation('/dashboard')}
                className="flex items-center w-full px-4 py-2 text-sm transition-colors duration-200"
                style={{
                  color: 'var(--text-primary)',
                  ':hover': { backgroundColor: 'var(--surface-panel)' }
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-panel)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Home className="w-4 h-4 mr-3" />
                Dashboard
              </button>

              <button
                onClick={() => handleNavigation('/dashboard/analytics')}
                className="flex items-center w-full px-4 py-2 text-sm transition-colors duration-200"
                style={{ color: 'var(--text-primary)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-panel)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <BarChart3 className="w-4 h-4 mr-3" />
                Analytics
              </button>

              {showAdminPanel && isAdmin && (
                <button
                  onClick={() => handleNavigation('/admin')}
                  className="flex items-center w-full px-4 py-2 text-sm transition-colors duration-200"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-panel)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Shield className="w-4 h-4 mr-3" />
                  Admin Panel
                </button>
              )}

              <button
                onClick={() => handleNavigation('/dashboard/settings')}
                className="flex items-center w-full px-4 py-2 text-sm transition-colors duration-200"
                style={{ color: 'var(--text-primary)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-panel)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </button>

              <button
                onClick={() => window.open('/support', '_blank')}
                className="flex items-center w-full px-4 py-2 text-sm transition-colors duration-200"
                style={{ color: 'var(--text-primary)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-panel)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <HelpCircle className="w-4 h-4 mr-3" />
                Help & Support
              </button>
            </div>

            {/* Sign Out */}
            <div 
              className="border-t pt-1"
              style={{ borderColor: 'var(--surface-outline)' }}
            >
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-2 text-sm transition-colors duration-200"
                style={{ color: 'var(--error-500)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-panel)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}