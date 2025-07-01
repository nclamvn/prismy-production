import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface WorkspaceLayoutProps {
  children: React.ReactNode
  className?: string
  sidebar?: React.ReactNode
  rightPanel?: React.ReactNode
  showChatDrawer?: boolean
  onToggleChatDrawer?: () => void
}

export function WorkspaceLayout({ 
  children, 
  className,
  sidebar,
  rightPanel,
  showChatDrawer = false,
  onToggleChatDrawer
}: WorkspaceLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className={cn("h-screen flex bg-white", className)}>
      {/* Left Sidebar */}
      {sidebar && (
        <aside className={cn(
          "border-r border-gray-200 bg-gray-50 transition-all duration-200",
          sidebarCollapsed ? "w-16" : "w-64"
        )}>
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
              {!sidebarCollapsed && (
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-6 rounded bg-accent flex items-center justify-center">
                    <span className="text-white font-bold text-xs">P</span>
                  </div>
                  <span className="font-semibold text-gray-900">Workspace</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="h-8 w-8"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {sidebarCollapsed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  )}
                </svg>
              </Button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto">
              {sidebar}
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation/Toolbar */}
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-gray-900">Translation Workspace</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Chat Toggle */}
            <Button
              variant={showChatDrawer ? "default" : "ghost"}
              size="sm"
              onClick={onToggleChatDrawer}
              className="flex items-center space-x-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>AI Agent</span>
            </Button>

            {/* Profile Menu */}
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center">
                <span className="text-white text-xs font-medium">U</span>
              </div>
            </Button>
          </div>
        </header>

        {/* Two-Pane Content */}
        <div className="flex-1 flex min-h-0">
          {/* Left Pane - Main Content */}
          <main className={cn(
            "flex-1 bg-white overflow-hidden",
            rightPanel ? "border-r border-gray-200" : ""
          )}>
            {children}
          </main>

          {/* Right Pane - Optional Panel */}
          {rightPanel && (
            <aside className="w-96 bg-gray-50 border-l border-gray-200 overflow-y-auto">
              {rightPanel}
            </aside>
          )}
        </div>
      </div>

      {/* Chat Drawer Overlay */}
      {showChatDrawer && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onToggleChatDrawer}
          />
          
          {/* Chat Drawer */}
          <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 z-50 flex flex-col shadow-xl">
            {/* Chat Header */}
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6">
              <h2 className="text-lg font-semibold text-gray-900">AI Translation Agent</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleChatDrawer}
                className="h-8 w-8"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            {/* Chat Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {/* Sample chat messages */}
                <div className="flex items-start space-x-3">
                  <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-medium">AI</span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="text-sm text-gray-900">
                        Hello! I'm your AI translation assistant. I can help you with document translation, 
                        quality checks, and language optimization.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 justify-end">
                  <div className="flex-1 max-w-xs">
                    <div className="bg-accent rounded-lg p-3">
                      <p className="text-sm text-white">
                        Can you help me translate this document to Vietnamese?
                      </p>
                    </div>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600 text-xs font-medium">U</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Ask the AI agent..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />
                <Button size="sm">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}