'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  FileText,
  Languages,
  Download,
  Menu,
  X,
  Plus,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import { useAuth } from '@/contexts/AuthContext'

interface NotebookLMLayoutProps {
  children: React.ReactNode
  activePanel?: 'sources' | 'translate' | 'export'
  onPanelChange?: (panel: 'sources' | 'translate' | 'export') => void
  sourcesPanel?: React.ReactNode
  exportPanel?: React.ReactNode
  exportData?: any
}

/**
 * NOTEBOOKLM-INSPIRED 3-PANEL LAYOUT
 * Transforms Prismy into clean, professional translation workspace
 * Based on NotebookLM's December 2024 redesign
 */
export default function NotebookLMLayout({
  children,
  activePanel = 'translate',
  onPanelChange,
  sourcesPanel,
  exportPanel,
  exportData,
}: NotebookLMLayoutProps) {
  const { language } = useSSRSafeLanguage()
  const { user } = useAuth()
  const pathname = usePathname()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [collapsedPanels, setCollapsedPanels] = useState<Set<string>>(new Set())

  // Panel configuration
  const panels = [
    {
      id: 'sources',
      title: language === 'vi' ? 'Nguồn' : 'Sources',
      icon: FileText,
      description:
        language === 'vi' ? 'Tài liệu và văn bản' : 'Documents and text',
      width: 'w-80', // 320px
    },
    {
      id: 'translate',
      title: language === 'vi' ? 'Dịch Thuật' : 'Translate',
      icon: Languages,
      description:
        language === 'vi'
          ? 'AI translation workspace'
          : 'AI translation workspace',
      width: 'flex-1', // Flexible center panel
    },
    {
      id: 'export',
      title: language === 'vi' ? 'Xuất' : 'Export',
      icon: Download,
      description:
        language === 'vi' ? 'Tải về và chia sẻ' : 'Download and share',
      width: 'w-80', // 320px
    },
  ]

  const togglePanelCollapse = (panelId: string) => {
    const newCollapsed = new Set(collapsedPanels)
    if (newCollapsed.has(panelId)) {
      newCollapsed.delete(panelId)
    } else {
      newCollapsed.add(panelId)
    }
    setCollapsedPanels(newCollapsed)
  }

  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: 'var(--surface-panel)' }}
    >
      {/* NotebookLM-style Header */}
      <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
        {/* Left: Logo and Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <Languages className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Prismy</h1>
          </div>
        </div>

        {/* Center: Panel Navigation (Desktop) */}
        <div className="hidden lg:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {panels.map(panel => (
            <button
              key={panel.id}
              onClick={() => onPanelChange?.(panel.id as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activePanel === panel.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <panel.icon className="w-4 h-4 inline mr-2" />
              {panel.title}
            </button>
          ))}
        </div>

        {/* Right: User Menu */}
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>

          {user ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700 truncate max-w-24">
                {user.email?.split('@')[0]}
              </span>
            </div>
          ) : (
            <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">
              {language === 'vi' ? 'Đăng nhập' : 'Sign In'}
            </button>
          )}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="w-64 h-full bg-white shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">
                  {language === 'vi' ? 'Điều hướng' : 'Navigation'}
                </h2>
                <div className="space-y-2">
                  {panels.map(panel => (
                    <button
                      key={panel.id}
                      onClick={() => {
                        onPanelChange?.(panel.id as any)
                        setIsMobileMenuOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 ${
                        activePanel === panel.id
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <panel.icon className="w-5 h-5" />
                      <div>
                        <div className="font-medium">{panel.title}</div>
                        <div className="text-xs text-gray-500">
                          {panel.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden pb-16 lg:pb-0">
        {panels.map((panel, index) => {
          const isCollapsed = collapsedPanels.has(panel.id)
          const isActive = activePanel === panel.id
          const isCenter = index === 1 // Translate panel is always center

          return (
            <motion.div
              key={panel.id}
              layout
              className={`
                ${isCenter ? 'flex-1' : isCollapsed ? 'w-12' : panel.width}
                ${index === 0 ? 'border-r' : index === 2 ? 'border-l' : 'border-x'}
                border-gray-200 bg-white flex flex-col
                ${!isCenter && 'hidden lg:flex'}
              `}
              initial={false}
              animate={{
                width: isCenter ? undefined : isCollapsed ? 48 : 320,
              }}
              transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
            >
              {/* Panel Header */}
              <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4">
                {!isCollapsed ? (
                  <>
                    <div className="flex items-center gap-3">
                      <panel.icon className="w-5 h-5 text-gray-600" />
                      <h3 className="font-medium text-gray-900">
                        {panel.title}
                      </h3>
                    </div>
                    {!isCenter && (
                      <button
                        onClick={() => togglePanelCollapse(panel.id)}
                        className="p-1 hover:bg-gray-100 rounded hidden lg:block"
                      >
                        {index === 0 ? (
                          <ChevronLeft className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => togglePanelCollapse(panel.id)}
                    className="w-full flex items-center justify-center py-3 hover:bg-gray-100 rounded"
                    title={panel.title}
                  >
                    <panel.icon className="w-5 h-5 text-gray-600" />
                  </button>
                )}
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-hidden">
                {!isCollapsed && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      x: index === 0 ? -20 : index === 2 ? 20 : 0,
                    }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{
                      opacity: 0,
                      x: index === 0 ? -20 : index === 2 ? 20 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    {/* Dynamic content based on panel */}
                    {panel.id === 'translate' ? (
                      children
                    ) : panel.id === 'sources' ? (
                      sourcesPanel
                    ) : panel.id === 'export' ? (
                      exportPanel
                    ) : (
                      <div className="p-4 h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <panel.icon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">{panel.description}</p>
                          <p className="text-xs mt-2 text-gray-400">
                            {language === 'vi' ? 'Sắp ra mắt' : 'Coming soon'}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
        <div className="flex justify-center">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {panels.map(panel => (
              <button
                key={panel.id}
                onClick={() => onPanelChange?.(panel.id as any)}
                className={`px-3 py-2 text-xs font-medium rounded-md transition-all flex flex-col items-center gap-1 ${
                  activePanel === panel.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                <panel.icon className="w-4 h-4" />
                <span>{panel.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
