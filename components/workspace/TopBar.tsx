'use client'

import React from 'react'
import Link from 'next/link'
import { Home, Settings, Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { UserMenu } from '@/components/auth/UserMenu'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'

interface TopBarProps {
  onToggleSidebar?: () => void
  onToggleAgentPane?: () => void
  className?: string
}

/**
 * TopBar - Workspace top navigation
 * 64px height, contains branding, search, notifications, user menu
 */
export function TopBar({ 
  onToggleSidebar, 
  onToggleAgentPane,
  className = ''
}: TopBarProps) {
  const { user } = useAuth()

  return (
    <header className={`workspace-topbar flex items-center justify-between px-4 ${className}`}>
      {/* Left section */}
      <div className="flex items-center space-x-4">
        <Link href="/" className="flex items-center space-x-2">
          <Home className="h-5 w-5 text-secondary hover:text-primary transition-colors" />
        </Link>
        
        <div className="h-6 w-px bg-workspace-divider" />
        
        <span className="text-lg font-semibold text-primary">
          Prismy Workspace
        </span>
      </div>

      {/* Center section - Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search documents, jobs..."
            className="w-full h-8 pl-10 pr-4 bg-workspace-canvas border border-workspace-border rounded-lg text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-border-focus transition-all"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-3">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-status-error rounded-full" />
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-workspace-divider" />

        {/* User menu */}
        {user && <UserMenu />}
      </div>
    </header>
  )
}