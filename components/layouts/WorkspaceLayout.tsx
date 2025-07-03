'use client'

import React, { useState, useEffect } from 'react'
import { TopBar } from '@/components/workspace/TopBar'
import { SideNav } from '@/components/workspace/SideNav' 
import { JobSidebar } from '@/components/workspace/JobSidebar'
import { CanvasArea } from '@/components/workspace/CanvasArea'
import { AgentPane } from '@/components/workspace/AgentPane'
import { BatchDropProvider } from '@/components/batch/BatchDropProvider'
import { AuthDebugPanel } from '@/components/debug/AuthDebugPanel'

interface WorkspaceLayoutProps {
  children?: React.ReactNode
  className?: string
}

/**
 * WorkspaceLayout - Enterprise-grade responsive layout system
 * 
 * Layout Breakpoints:
 * - Desktop (1440px+): 3-column (SideNav + Canvas + AgentPane/JobSidebar)
 * - Laptop (1024px+): 2-column (SideNav + Canvas) with overlay panels
 * - Tablet (768px+): 1-column with collapsible sidebar
 * - Mobile (640px-): Full single column with drawer navigation
 */
export function WorkspaceLayout({ 
  children, 
  className = '' 
}: WorkspaceLayoutProps) {
  // Layout state
  const [sideNavCollapsed, setSideNavCollapsed] = useState(false)
  const [agentPaneOpen, setAgentPaneOpen] = useState(true)
  const [jobSidebarOpen, setJobSidebarOpen] = useState(false)
  const [agentPaneMaximized, setAgentPaneMaximized] = useState(false)
  const [activeSection, setActiveSection] = useState('documents')
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  // Responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const newIsMobile = width < 768
      const newIsTablet = width >= 768 && width < 1024
      
      setIsMobile(newIsMobile)
      setIsTablet(newIsTablet)

      // Auto-collapse sidebar on smaller screens
      if (newIsMobile) {
        setSideNavCollapsed(true)
        setAgentPaneOpen(false)
        setJobSidebarOpen(false)
      } else if (newIsTablet) {
        setAgentPaneOpen(false)
        setJobSidebarOpen(false)
      } else {
        // Desktop - restore default state
        setSideNavCollapsed(false)
        setAgentPaneOpen(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Layout handlers
  const handleToggleSideNav = () => {
    setSideNavCollapsed(!sideNavCollapsed)
  }

  const handleToggleAgentPane = () => {
    setAgentPaneOpen(!agentPaneOpen)
    // Close job sidebar if agent pane is opening
    if (!agentPaneOpen && jobSidebarOpen) {
      setJobSidebarOpen(false)
    }
  }

  const handleToggleJobSidebar = () => {
    setJobSidebarOpen(!jobSidebarOpen)
    // Close agent pane if job sidebar is opening
    if (!jobSidebarOpen && agentPaneOpen) {
      setAgentPaneOpen(false)
    }
  }

  const handleToggleAgentMaximize = () => {
    setAgentPaneMaximized(!agentPaneMaximized)
  }

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
  }

  // Determine grid layout class based on current state
  const getGridLayoutClass = () => {
    if (agentPaneMaximized) return 'workspace-grid-mobile'
    if (isMobile) return 'workspace-grid-mobile'
    
    const hasRightPanel = agentPaneOpen || jobSidebarOpen
    
    if (sideNavCollapsed && hasRightPanel) return 'workspace-grid-collapsed'
    if (sideNavCollapsed && !hasRightPanel) return 'workspace-grid-main'
    if (!sideNavCollapsed && hasRightPanel) return 'workspace-grid-full'
    return 'workspace-grid-main'
  }

  return (
    <BatchDropProvider>
      <div className={`layout-root-workspace min-h-full h-full flex flex-col bg-[#F9FAFB] overflow-hidden ${className}`}>
        {/* Top Bar - Always visible - Fixed position */}
        <TopBar 
          onToggleSidebar={handleToggleSideNav}
          onToggleAgentPane={handleToggleAgentPane}
        />

        {/* Main workspace grid */}
        <div className={`flex-1 min-h-0 ${getGridLayoutClass()}`}>
        {/* Left Sidebar - SideNav */}
        {(!isMobile || !sideNavCollapsed) && (
          <SideNav
            collapsed={sideNavCollapsed}
            onToggleCollapse={handleToggleSideNav}
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
          />
        )}

        {/* Main Canvas Area */}
        <CanvasArea 
          activeSection={activeSection}
          className="flex-1"
        />

        {/* Right Panel - Agent Pane or Job Sidebar */}
        {(agentPaneOpen || jobSidebarOpen) && !isMobile && (
          <>
            {agentPaneOpen && (
              <AgentPane
                isOpen={agentPaneOpen}
                onClose={() => setAgentPaneOpen(false)}
                onToggleMaximize={handleToggleAgentMaximize}
                isMaximized={agentPaneMaximized}
              />
            )}

            {jobSidebarOpen && (
              <JobSidebar
                isOpen={jobSidebarOpen}
                onClose={() => setJobSidebarOpen(false)}
              />
            )}
          </>
        )}
      </div>

      {/* Mobile overlays */}
      {isMobile && (
        <>
          {/* Mobile sidebar overlay */}
          {!sideNavCollapsed && (
            <>
              <div 
                className="fixed inset-0 bg-overlay z-overlay"
                onClick={() => setSideNavCollapsed(true)}
              />
              <div className="fixed left-0 top-[var(--layout-topbar-height)] bottom-0 z-modal">
                <SideNav
                  collapsed={false}
                  onToggleCollapse={() => setSideNavCollapsed(true)}
                  activeSection={activeSection}
                  onSectionChange={handleSectionChange}
                />
              </div>
            </>
          )}

          {/* Mobile agent pane overlay */}
          {agentPaneOpen && (
            <>
              <div 
                className="fixed inset-0 bg-overlay z-overlay"
                onClick={() => setAgentPaneOpen(false)}
              />
              <div className="fixed right-0 top-[var(--layout-topbar-height)] bottom-0 z-modal w-full max-w-md">
                <AgentPane
                  isOpen={agentPaneOpen}
                  onClose={() => setAgentPaneOpen(false)}
                  onToggleMaximize={handleToggleAgentMaximize}
                  isMaximized={agentPaneMaximized}
                />
              </div>
            </>
          )}

          {/* Mobile job sidebar overlay */}
          {jobSidebarOpen && (
            <>
              <div 
                className="fixed inset-0 bg-overlay z-overlay"
                onClick={() => setJobSidebarOpen(false)}
              />
              <div className="fixed right-0 top-[var(--layout-topbar-height)] bottom-0 z-modal w-full max-w-sm">
                <JobSidebar
                  isOpen={jobSidebarOpen}
                  onClose={() => setJobSidebarOpen(false)}
                />
              </div>
            </>
          )}
        </>
      )}

      {/* Floating Action Buttons for mobile */}
      {isMobile && (
        <div className="fixed bottom-4 right-4 flex flex-col space-y-2 z-sticky">
          {/* Job sidebar toggle */}
          <button
            onClick={handleToggleJobSidebar}
            className="w-12 h-12 bg-primary-blue text-white rounded-full shadow-lg flex items-center justify-center"
          >
            <span className="text-sm font-medium">Jobs</span>
          </button>

          {/* Agent pane toggle */}
          <button
            onClick={handleToggleAgentPane}
            className="w-12 h-12 bg-accent-brand text-white rounded-full shadow-lg flex items-center justify-center"
          >
            <span className="text-sm font-medium">AI</span>
          </button>
        </div>
      )}

        {/* Custom children content (if provided) */}
        {children}

        {/* 🐛 DEBUG: Auth state panel for debugging avatar issue */}
        {process.env.NODE_ENV === 'development' && <AuthDebugPanel />}
      </div>
    </BatchDropProvider>
  )
}