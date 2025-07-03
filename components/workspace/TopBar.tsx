'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Home, Settings, Bell, Search, Menu } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { UserMenu } from '@/components/auth/UserMenu'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LanguageSelector } from '@/components/ui/LanguageSelector'
import { Logo } from '@/components/ui/Logo'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/hooks/useI18n'
import { HeaderSearchTrigger, MiniSearchTrigger } from '@/components/search/SearchTrigger'
import { useSearch } from '@/components/search/SearchProvider'
interface TopBarProps {
  onToggleSidebar?: () => void
  onToggleAgentPane?: () => void
  className?: string
}

/**
 * TopBar - Workspace top navigation
 * Responsive design: 64px height on desktop, adaptive on mobile
 */
export function TopBar({ 
  onToggleSidebar, 
  onToggleAgentPane,
  className = ''
}: TopBarProps) {
  const { user, loading, sessionRestored } = useAuth()
  const { t } = useI18n()
  const { openSearch } = useSearch()
  const router = useRouter()

  // 🐛 DEBUG: Log user state to trace avatar issue
  console.log('🔍 [TopBar] Auth state:', { 
    hasUser: !!user, 
    userEmail: user?.email, 
    loading, 
    sessionRestored 
  })

  return (
    <header className={`workspace-topbar fixed top-0 left-0 right-0 flex items-center justify-between px-4 h-14 z-topbar bg-white border-b border-gray-200 ${className}`}>
      {/* Left section */}
      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Mobile hamburger menu */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleSidebar}
          className="md:hidden h-8 w-8"
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        <Link href="/" className="flex items-center space-x-2">
          <Home className="h-5 w-5 text-secondary hover:text-primary transition-colors" />
        </Link>
        
        <div className="hidden md:block h-6 w-px bg-workspace-divider" />
        
        <div className="hidden sm:block">
          <Logo size={20} showText={true} textSize="sm" />
        </div>
      </div>

      {/* Center section - Search (hidden on mobile) */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <HeaderSearchTrigger 
          onOpenSearch={openSearch}
          className="w-full"
        />
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-1 md:space-x-3">
        {/* Mobile search button */}
        <MiniSearchTrigger 
          onOpenSearch={openSearch}
          className="md:hidden"
        />

        {/* Language selector */}
        <LanguageSelector />
        
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications (hidden on mobile) */}
        <Button variant="ghost" size="icon" className="hidden md:flex relative h-8 w-8">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-status-error rounded-full" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* Settings (hidden on mobile) */}
        <Button variant="ghost" size="icon" className="hidden md:flex h-8 w-8">
          <Settings className="h-4 w-4" />
          <span className="sr-only">{t('auth.settings')}</span>
        </Button>

        <div className="hidden md:block h-6 w-px bg-workspace-divider" />

        {/* User menu with debug states */}
        {loading ? (
          <div className="flex items-center px-3 py-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <span className="ml-2 text-xs text-gray-400 hidden sm:block">Loading...</span>
          </div>
        ) : user ? (
          <UserMenu />
        ) : (
          <div className="flex items-center px-3 py-2">
            <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-xs">?</span>
            </div>
            <span className="ml-2 text-xs text-red-600 hidden sm:block">No User</span>
          </div>
        )}
      </div>
    </header>
  )
}