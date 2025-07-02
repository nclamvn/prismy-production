'use client'

import React, { useState } from 'react'
import { 
  FileText, 
  Upload, 
  Languages, 
  Bot, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface SideNavProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
  activeSection?: string
  onSectionChange?: (section: string) => void
  className?: string
}

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  active?: boolean
}

/**
 * SideNav - Left sidebar navigation
 * 280px width (60px collapsed), contains main navigation and recent activity
 */
export function SideNav({ 
  collapsed = false,
  onToggleCollapse,
  activeSection = 'documents',
  onSectionChange,
  className = ''
}: SideNavProps) {
  const [recentFiles] = useState([
    { name: 'Annual_Report_2024.pdf', status: 'completed', time: '2m ago' },
    { name: 'Contract_Review.docx', status: 'processing', time: '5m ago' },
    { name: 'Meeting_Notes.txt', status: 'error', time: '10m ago' },
    { name: 'Product_Spec.md', status: 'completed', time: '1h ago' },
  ])

  const navItems: NavItem[] = [
    { id: 'documents', label: 'Documents', icon: FileText, badge: 12 },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'translate', label: 'Translate', icon: Languages, badge: 3 },
    { id: 'agent', label: 'AI Agent', icon: Bot },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-status-success" />
      case 'processing':
        return <Clock className="h-3 w-3 text-status-processing animate-spin" />
      case 'error':
        return <XCircle className="h-3 w-3 text-status-error" />
      default:
        return null
    }
  }

  return (
    <aside className={`workspace-sidebar flex flex-col ${collapsed ? 'w-sidebar-collapsed' : 'w-sidebar'} ${className}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 ${collapsed ? 'px-2' : ''}`}>
        {!collapsed && (
          <span className="font-semibold text-primary">Navigation</span>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="p-1 h-6 w-6"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange?.(item.id)}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-workspace-selected text-primary-blue'
                    : 'text-secondary hover:text-primary hover:bg-workspace-hover'
                } ${collapsed ? 'justify-center' : 'justify-between'}`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </div>
                
                {!collapsed && item.badge && (
                  <span className="bg-accent-brand text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Recent Activity */}
      {!collapsed && (
        <div className="p-4 border-t border-workspace-divider">
          <div className="text-xs text-muted mb-3">Recent Files</div>
          <div className="space-y-2">
            {recentFiles.slice(0, 4).map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 text-xs cursor-pointer hover:bg-workspace-hover p-1 rounded"
              >
                {getStatusIcon(file.status)}
                <div className="flex-1 min-w-0">
                  <div className="text-secondary truncate">{file.name}</div>
                  <div className="text-muted">{file.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}