/**
 * UI/UX Polish Sprint - Phase 4: Search Trigger Component
 * 
 * Search trigger button with keyboard shortcut display
 * Provides easy access to global search functionality
 */

'use client'

import React from 'react'
import { Search, Command } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { MotionButton } from '@/components/motion/MotionComponents'

interface SearchTriggerProps {
  onOpenSearch: () => void
  className?: string
  variant?: 'button' | 'input' | 'icon'
  showShortcut?: boolean
  placeholder?: string
}

export function SearchTrigger({ 
  onOpenSearch, 
  className = '',
  variant = 'input',
  showShortcut = true,
  placeholder = 'Search...'
}: SearchTriggerProps) {
  
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const shortcutKey = isMac ? '⌘' : 'Ctrl'
  
  if (variant === 'icon') {
    return (
      <MotionButton
        onClick={onOpenSearch}
        preset="subtle"
        className={`p-2 rounded-lg bg-transparent hover:bg-workspace-hover transition-colors ${className}`}
        title={`Search (${shortcutKey}+K)`}
      >
        <Search className="h-5 w-5 text-muted" />
      </MotionButton>
    )
  }
  
  if (variant === 'button') {
    return (
      <MotionButton
        onClick={onOpenSearch}
        preset="standard"
        className={`flex items-center gap-2 px-3 py-2 bg-workspace-panel border border-workspace-border rounded-lg hover:bg-workspace-hover transition-colors ${className}`}
      >
        <Search className="h-4 w-4 text-muted" />
        <span className="text-muted">{placeholder}</span>
        {showShortcut && (
          <div className="flex items-center gap-1 ml-auto">
            <kbd className="px-1.5 py-0.5 text-xs bg-workspace-border rounded text-secondary">
              {shortcutKey}
            </kbd>
            <kbd className="px-1.5 py-0.5 text-xs bg-workspace-border rounded text-secondary">
              K
            </kbd>
          </div>
        )}
      </MotionButton>
    )
  }
  
  // Default: input variant
  return (
    <div
      onClick={onOpenSearch}
      className={`
        flex items-center gap-3 px-4 py-2.5 
        bg-workspace-panel border border-workspace-border rounded-lg 
        hover:bg-workspace-hover hover:border-workspace-border-hover
        transition-all duration-150 cursor-pointer
        ${className}
      `}
    >
      <Search className="h-4 w-4 text-muted flex-shrink-0" />
      
      <span className="text-muted text-sm flex-1 text-left">
        {placeholder}
      </span>
      
      {showShortcut && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <kbd className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 text-xs bg-workspace-border rounded text-secondary font-mono">
            {isMac ? (
              <Command className="h-3 w-3" />
            ) : (
              'Ctrl'
            )}
          </kbd>
          <kbd className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 text-xs bg-workspace-border rounded text-secondary font-mono">
            K
          </kbd>
        </div>
      )}
    </div>
  )
}

/**
 * Mini search trigger for tight spaces
 */
export function MiniSearchTrigger({ onOpenSearch, className = '' }: {
  onOpenSearch: () => void
  className?: string
}) {
  return (
    <button
      onClick={onOpenSearch}
      className={`
        flex items-center justify-center w-8 h-8 
        rounded-md hover:bg-workspace-hover 
        transition-colors duration-150
        ${className}
      `}
      title="Search (Cmd+K)"
    >
      <Search className="h-4 w-4 text-muted" />
    </button>
  )
}

/**
 * Search trigger with custom styling for headers
 */
export function HeaderSearchTrigger({ onOpenSearch, className = '' }: {
  onOpenSearch: () => void
  className?: string
}) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
  
  return (
    <div
      onClick={onOpenSearch}
      className={`
        flex items-center gap-2 px-3 py-1.5 
        bg-workspace-panel/50 backdrop-blur-sm
        border border-workspace-border/50 rounded-md 
        hover:bg-workspace-panel hover:border-workspace-border
        transition-all duration-150 cursor-pointer
        min-w-[200px]
        ${className}
      `}
    >
      <Search className="h-4 w-4 text-muted" />
      
      <span className="text-muted text-sm flex-1">
        Quick search...
      </span>
      
      <div className="flex items-center gap-0.5">
        <kbd className="h-5 px-1 text-[10px] bg-workspace-border/70 rounded text-secondary font-mono flex items-center">
          {isMac ? '⌘' : '⌃'}
        </kbd>
        <kbd className="h-5 px-1 text-[10px] bg-workspace-border/70 rounded text-secondary font-mono flex items-center">
          K
        </kbd>
      </div>
    </div>
  )
}

/**
 * Floating search trigger for mobile
 */
export function FloatingSearchTrigger({ onOpenSearch, className = '' }: {
  onOpenSearch: () => void
  className?: string
}) {
  return (
    <MotionButton
      onClick={onOpenSearch}
      preset="prominent"
      className={`
        fixed bottom-6 right-6 z-50
        w-14 h-14 rounded-full
        bg-primary text-primary-foreground
        shadow-lg shadow-primary/20
        flex items-center justify-center
        ${className}
      `}
    >
      <Search className="h-6 w-6" />
    </MotionButton>
  )
}

export default SearchTrigger