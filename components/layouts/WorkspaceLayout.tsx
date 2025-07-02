import React from 'react'
import BrandLogo from '@/components/ui/BrandLogo'

interface WorkspaceLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  chatPanel?: React.ReactNode
}

/**
 * Workspace Layout - NotebookML inspired
 * Three-column layout: Sidebar + Main + Chat Panel
 */
export function WorkspaceLayout({
  children,
  sidebar,
  chatPanel,
}: WorkspaceLayoutProps) {
  return (
    <div className="workspace-grid">
      {/* Sidebar */}
      <aside className="bg-surface border-r border-muted overflow-y-auto">
        {sidebar || <DefaultSidebar />}
      </aside>

      {/* Main Content */}
      <main className="bg-default overflow-y-auto">{children}</main>

      {/* Chat Panel */}
      {chatPanel && (
        <aside className="bg-surface border-l border-muted overflow-y-auto">
          {chatPanel}
        </aside>
      )}
    </div>
  )
}

function DefaultSidebar() {
  return (
    <div className="p-4">
      <div className="mb-6">
        <BrandLogo size={24} showText={true} linkHref="" />
      </div>

      <nav className="space-y-2">
        <SidebarItem icon="📄" label="Documents" active />
        <SidebarItem icon="🔄" label="Translate" />
        <SidebarItem icon="💬" label="Chat" />
        <SidebarItem icon="⚙️" label="Settings" />
      </nav>

      <div className="mt-8 pt-4 border-t border-muted">
        <div className="text-xs text-muted mb-2">Recent</div>
        <div className="space-y-1">
          <div className="text-sm text-secondary hover:text-primary cursor-pointer py-1">
            Annual_Report_2024.pdf
          </div>
          <div className="text-sm text-secondary hover:text-primary cursor-pointer py-1">
            Contract_Review.docx
          </div>
          <div className="text-sm text-secondary hover:text-primary cursor-pointer py-1">
            Meeting_Notes.txt
          </div>
        </div>
      </div>
    </div>
  )
}

interface SidebarItemProps {
  icon: string
  label: string
  active?: boolean
}

function SidebarItem({ icon, label, active = false }: SidebarItemProps) {
  return (
    <div
      className={`flex items-center space-x-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
        active
          ? 'bg-accent-brand-light text-accent-brand'
          : 'text-secondary hover:text-primary hover:bg-bg-muted'
      }`}
    >
      <span>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}
