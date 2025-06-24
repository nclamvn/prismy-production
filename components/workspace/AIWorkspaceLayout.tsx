'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  MessageSquare, 
  Bot, 
  Settings, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus
} from 'lucide-react'

import { useLanguage } from '@/contexts/LanguageContext'
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth'

// Import new styles
import '../../styles/notebooklm-design-tokens.css'
import '../../styles/ai-workspace-components.css'

interface AIWorkspaceLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  rightPanel?: React.ReactNode
  showRightPanel?: boolean
  onToggleRightPanel?: () => void
}

interface NavigationItem {
  id: string
  label: string
  labelVi: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  onClick?: () => void
  badge?: number
  active?: boolean
}

interface Document {
  id: string
  title: string
  type: 'pdf' | 'docx' | 'txt' | 'image'
  size: string
  lastModified: string
  agentsAssigned: string[]
}

export default function AIWorkspaceLayout({ 
  children, 
  sidebar, 
  rightPanel, 
  showRightPanel = true,
  onToggleRightPanel 
}: AIWorkspaceLayoutProps) {
  const { language, content } = useLanguage()
  const { user } = useUnifiedAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeDocuments, setActiveDocuments] = useState<Document[]>([])

  // Sample navigation items
  const navigationItems: NavigationItem[] = [
    {
      id: 'documents',
      label: 'Active Documents',
      labelVi: 'Tài Liệu Đang Xử Lý',
      icon: FileText,
      badge: activeDocuments.length
    },
    {
      id: 'agents',
      label: 'AI Agents',
      labelVi: 'AI Agents',
      icon: Bot,
      badge: 5
    },
    {
      id: 'conversations',
      label: 'Conversations',
      labelVi: 'Cuộc Trò Chuyện',
      icon: MessageSquare,
      badge: 3
    },
    {
      id: 'settings',
      label: 'Settings',
      labelVi: 'Cài Đặt',
      icon: Settings
    }
  ]

  // Cultural time adaptation
  const getCulturalRhythm = () => {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 11) return 'morning'
    if (hour >= 18 && hour < 22) return 'evening'
    return 'neutral'
  }

  const culturalClass = `vn-${getCulturalRhythm()}-energy`

  // Sample active documents
  useEffect(() => {
    setActiveDocuments([
      {
        id: '1',
        title: 'Vietnamese Business Contract.pdf',
        type: 'pdf',
        size: '2.4 MB',
        lastModified: '2 minutes ago',
        agentsAssigned: ['Legal Expert', 'Cultural Advisor']
      },
      {
        id: '2',
        title: 'Financial Report Q4.docx',
        type: 'docx',
        size: '1.8 MB',
        lastModified: '15 minutes ago',
        agentsAssigned: ['Financial Analyst']
      },
      {
        id: '3',
        title: 'Project Proposal.txt',
        type: 'txt',
        size: '156 KB',
        lastModified: '1 hour ago',
        agentsAssigned: ['Project Manager', 'Content Strategist']
      }
    ])
  }, [])

  return (
    <div className={`workspace-container ${culturalClass}`}>
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`workspace-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
        animate={{
          width: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          {!sidebarCollapsed && (
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">PRISMY</h1>
                <p className="text-xs text-gray-500">AI Document Workspace</p>
              </div>
            </motion.div>
          )}
          
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>

        {/* Search */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={language === 'vi' ? 'Tìm kiếm tài liệu...' : 'Search documents...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          {/* Quick Actions */}
          <div className="nav-section">
            {!sidebarCollapsed && (
              <h3 className="nav-section-title">
                {language === 'vi' ? 'Hành Động Nhanh' : 'Quick Actions'}
              </h3>
            )}
            <motion.button
              className="w-full flex items-center gap-3 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mb-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium">
                  {language === 'vi' ? 'Tải Lên Tài Liệu' : 'Upload Document'}
                </span>
              )}
            </motion.button>
          </div>

          {/* Navigation Items */}
          <div className="nav-section">
            {!sidebarCollapsed && (
              <h3 className="nav-section-title">
                {language === 'vi' ? 'Không Gian Làm Việc' : 'Workspace'}
              </h3>
            )}
            
            {navigationItems.map((item) => (
              <motion.a
                key={item.id}
                href={item.href || '#'}
                className="nav-item"
                whileHover={{ x: 2 }}
                transition={{ duration: 0.2 }}
              >
                <item.icon className="nav-item-icon" />
                {!sidebarCollapsed && (
                  <>
                    <span className="nav-item-text flex-1">
                      {language === 'vi' ? item.labelVi : item.label}
                    </span>
                    {item.badge && item.badge > 0 && (
                      <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </motion.a>
            ))}
          </div>

          {/* Active Documents */}
          {!sidebarCollapsed && activeDocuments.length > 0 && (
            <div className="nav-section">
              <h3 className="nav-section-title">
                {language === 'vi' ? 'Tài Liệu Gần Đây' : 'Recent Documents'}
              </h3>
              
              {activeDocuments.slice(0, 3).map((doc) => (
                <motion.div
                  key={doc.id}
                  className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors mb-2"
                  whileHover={{ x: 2 }}
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {doc.lastModified}
                    </p>
                    <div className="flex gap-1 mt-1">
                      {doc.agentsAssigned.slice(0, 2).map((agent, index) => (
                        <span
                          key={index}
                          className="inline-block w-2 h-2 bg-green-400 rounded-full"
                          title={agent}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </nav>

        {/* User Profile */}
        {!sidebarCollapsed && user && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {user.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
              <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                <Settings className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </motion.aside>

      {/* Main Content Area */}
      <main className="workspace-main">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          
          <h1 className="text-lg font-semibold text-gray-900">PRISMY</h1>
          
          {onToggleRightPanel && (
            <button
              onClick={onToggleRightPanel}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Bot className="w-6 h-6 text-gray-600" />
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="workspace-content">
          {children}
        </div>
      </main>

      {/* Right Panel */}
      <AnimatePresence>
        {showRightPanel && (
          <motion.aside
            className="workspace-rightpanel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'var(--rightpanel-width)', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {rightPanel}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}

// Export additional components for workspace
export { default as AIChatInterface } from './AIChatInterface'
export { default as DocumentViewer } from './DocumentViewer'
export { default as AgentDashboard } from './AgentDashboard'