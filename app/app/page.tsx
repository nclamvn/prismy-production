'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useWorkspaceStore } from './hooks/useWorkspaceStore'
import { useAuth } from '@/hooks/useAuth'
import {
  FileText,
  History,
  Crown,
  HelpCircle,
  Menu,
  X,
  Globe,
  Rocket,
  User,
  LogOut,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CreditsBadge } from '@/components/auth/CreditsBadge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UploadPanel } from './UploadPanel'
import { DocumentTabs } from './DocumentTabs'
import { TranslationPanel } from './TranslationPanel'
import { ChatPanel } from './ChatPanel'

// Force dynamic rendering to avoid SSR issues with auth
export const dynamic = 'force-dynamic'

export default function WorkspacePage() {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    tier,
    setTier,
    chatPanelOpen,
    setChatPanelOpen,
    documents,
    activeDocumentId,
  } = useWorkspaceStore()

  const { user, signOut, credits, loading: authLoading } = useAuth()
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle welcome parameter for new users
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('welcome') === '1') {
      // Show welcome tooltip or onboarding
      console.log('Welcome new user!')
      // Remove welcome parameter from URL
      window.history.replaceState({}, '', '/app')
    }
  }, [])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const activeDocument = documents.find(d => d.id === activeDocumentId)

  // Show loading state during hydration
  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-default">
        <div className="text-center">
          <Rocket size={32} className="text-accent-brand mx-auto mb-4" />
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-bg-default">
      {/* TopAppBar */}
      <header className="flex-shrink-0 h-14 bg-surface border-b border-border-default px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-bg-muted rounded-lg transition-colors lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center space-x-2">
            <Rocket size={24} className="text-accent-brand" />
            <span className="font-semibold text-primary">Prismy</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Language Toggle */}
          <button
            className="p-2 hover:bg-bg-muted rounded-lg transition-colors"
            aria-label="Switch language"
          >
            <Globe size={16} />
          </button>

          {/* Credits Badge */}
          <CreditsBadge />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full"
                aria-label="User menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.user_metadata?.avatar_url}
                    alt={user?.email || 'User avatar'}
                  />
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase() || <User size={16} />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user?.email && (
                    <p className="text-sm font-medium">{user.email}</p>
                  )}
                  {credits && (
                    <p className="text-xs text-muted-foreground">
                      {credits.credits_left} credits remaining
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
          flex-shrink-0 bg-surface border-r border-border-default transition-all duration-200
          ${
            isMobile
              ? sidebarCollapsed
                ? '-translate-x-full w-0'
                : 'absolute inset-y-0 left-0 z-50 w-64'
              : sidebarCollapsed
                ? 'w-16'
                : 'w-64'
          }
        `}
        >
          {/* Mobile backdrop */}
          {isMobile && !sidebarCollapsed && (
            <div
              className="fixed inset-0 bg-bg-overlay z-40"
              onClick={() => setSidebarCollapsed(true)}
            />
          )}

          <nav className="relative z-50 h-full bg-surface p-3 space-y-2">
            {/* Close button for mobile */}
            {isMobile && (
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="absolute top-3 right-3 p-1 hover:bg-bg-muted rounded-md"
                aria-label="Close sidebar"
              >
                <X size={16} />
              </button>
            )}

            <SidebarItem
              icon={<FileText size={20} />}
              label="Upload"
              active={!activeDocumentId}
              collapsed={sidebarCollapsed}
            />

            <SidebarItem
              icon={<History size={20} />}
              label="History"
              collapsed={sidebarCollapsed}
              count={documents.length}
            />

            <div className="pt-4 border-t border-border-muted">
              <SidebarItem
                icon={<Crown size={20} />}
                label="Billing"
                collapsed={sidebarCollapsed}
                badge={tier === 'free' ? 'pro' : undefined}
                onClick={() => {
                  /* Open billing */
                }}
              />

              <SidebarItem
                icon={<HelpCircle size={20} />}
                label="Help"
                collapsed={sidebarCollapsed}
              />
            </div>
          </nav>
        </aside>

        {/* Main Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Document Tabs */}
          {documents.length > 0 && (
            <div className="flex-shrink-0 border-b border-border-default">
              <DocumentTabs />
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Main Panel */}
            <div className="flex-1 overflow-hidden">
              {!activeDocument ? (
                <UploadPanel />
              ) : (
                <TranslationPanel document={activeDocument} />
              )}
            </div>

            {/* Chat Panel */}
            {activeDocument && (
              <div
                className={`
                flex-shrink-0 border-l border-border-default transition-all duration-200
                ${
                  isMobile
                    ? chatPanelOpen
                      ? 'absolute inset-y-0 right-0 z-40 w-full bg-surface'
                      : 'w-0 overflow-hidden'
                    : chatPanelOpen
                      ? 'w-80'
                      : 'w-0 overflow-hidden'
                }
              `}
              >
                <ChatPanel document={activeDocument} />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Full-width dropzone overlay */}
      <DropZoneOverlay />
    </div>
  )
}

// Sidebar Item Component
interface SidebarItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  collapsed?: boolean
  count?: number
  badge?: string
  onClick?: () => void
}

function SidebarItem({
  icon,
  label,
  active = false,
  collapsed = false,
  count,
  badge,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
        ${
          active
            ? 'bg-accent-brand-light text-accent-brand'
            : 'text-secondary hover:bg-bg-muted hover:text-primary'
        }
        ${collapsed ? 'justify-center' : ''}
      `}
      title={collapsed ? label : undefined}
    >
      {icon}
      {!collapsed && (
        <>
          <span className="flex-1 text-left text-sm font-medium">{label}</span>
          {count !== undefined && count > 0 && (
            <span className="text-xs bg-bg-muted px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
          {badge && (
            <span className="text-xs bg-accent-brand text-white px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </>
      )}
    </button>
  )
}

// Drop Zone Overlay Component
function DropZoneOverlay() {
  const [isDragOver, setIsDragOver] = useState(false)
  const { upload } = useWorkspaceStore()

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      setIsDragOver(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      if (!e.relatedTarget) {
        setIsDragOver(false)
      }
    }

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer?.files || [])
      if (files.length > 0) {
        try {
          await upload(files)
        } catch (error) {
          console.error('Upload error:', error)
          // TODO: Show error toast
        }
      }
    }

    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('drop', handleDrop)

    return () => {
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('dragleave', handleDragLeave)
      document.removeEventListener('drop', handleDrop)
    }
  }, [upload])

  if (!isDragOver) return null

  return (
    <div className="fixed inset-0 z-50 bg-accent-brand-light/90 flex items-center justify-center pointer-events-none">
      <div className="bg-surface border-2 border-dashed border-accent-brand rounded-lg p-8 text-center">
        <FileText size={48} className="text-accent-brand mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-primary mb-2">
          Drop files anywhere to upload
        </h3>
        <p className="text-secondary">PDF, DOCX, and TXT files supported</p>
      </div>
    </div>
  )
}
