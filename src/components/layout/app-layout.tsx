'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { AppHeader } from './app-header'
import { RightPanel } from './right-panel'

interface FileData {
  name: string
  size: string
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  uploadedAt: string
  translatedTo?: string[]
}

interface AppLayoutProps {
  children: React.ReactNode
  userEmail?: string
}

export function AppLayout({ children, userEmail }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [selectedFile] = useState<FileData | null>(null)

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <AppHeader onMenuToggle={toggleSidebar} userEmail={userEmail} />
        
        {/* Content wrapper */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <div className="h-full p-6">
              {children}
            </div>
          </main>
          
          {/* Right panel */}
          <RightPanel 
            isOpen={rightPanelOpen} 
            onClose={() => setRightPanelOpen(false)}
            selectedFile={selectedFile}
          />
        </div>
      </div>
      
      {/* Mobile overlays */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {rightPanelOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setRightPanelOpen(false)}
        />
      )}
    </div>
  )
}