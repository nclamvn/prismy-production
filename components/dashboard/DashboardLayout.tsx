'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import UnifiedUserMenu from '@/components/auth/UnifiedUserMenu'
import { FeatureDiscoveryProvider, useFeatureDiscovery } from '@/contexts/FeatureDiscoveryContext'
import FeatureDiscovery from '@/components/ui/FeatureDiscovery'
import FeatureHint, { FeatureBadge } from '@/components/ui/FeatureHint'
import { HelpCircle, Sparkles } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
  language?: 'vi' | 'en'
}

function DashboardLayoutInner({ children, language = 'en' }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { isDiscoveryOpen, showDiscovery, hideDiscovery, completeFeature } = useFeatureDiscovery()

  const navigation = {
    vi: {
      menu: [
        { 
          name: 'Tổng quan', 
          href: '/dashboard', 
          icon: HomeIcon,
          category: 'main'
        },
        { 
          name: 'Lịch sử dịch', 
          href: '/dashboard/history', 
          icon: HistoryIcon,
          category: 'main'
        },
        { 
          name: 'Phân tích', 
          href: '/dashboard/analytics', 
          icon: ChartIcon,
          category: 'main'
        },
        { 
          name: 'AI Agents', 
          href: '/dashboard/agents', 
          icon: BrainIcon,
          category: 'ai',
          badge: 'Mới'
        },
        { 
          name: 'Thông tin thông minh', 
          href: '/dashboard/insights', 
          icon: ZapIcon,
          category: 'ai',
          badge: 'AI'
        },
        { 
          name: 'Enterprise', 
          href: '/dashboard/enterprise', 
          icon: NetworkIcon,
          category: 'ai',
          badge: 'Pro'
        },
        { 
          name: 'Tài liệu', 
          href: '/dashboard/documents', 
          icon: DocumentIcon,
          category: 'main'
        },
        { 
          name: 'Cài đặt', 
          href: '/dashboard/settings', 
          icon: SettingsIcon,
          category: 'main'
        },
      ],
      toggleSidebar: 'Ẩn/Hiện menu',
      categories: {
        main: 'Chính',
        ai: 'AI & Enterprise'
      }
    },
    en: {
      menu: [
        { 
          name: 'Overview', 
          href: '/dashboard', 
          icon: HomeIcon,
          category: 'main'
        },
        { 
          name: 'History', 
          href: '/dashboard/history', 
          icon: HistoryIcon,
          category: 'main'
        },
        { 
          name: 'Analytics', 
          href: '/dashboard/analytics', 
          icon: ChartIcon,
          category: 'main'
        },
        { 
          name: 'AI Agents', 
          href: '/dashboard/agents', 
          icon: BrainIcon,
          category: 'ai',
          badge: 'New'
        },
        { 
          name: 'Insights', 
          href: '/dashboard/insights', 
          icon: ZapIcon,
          category: 'ai',
          badge: 'AI'
        },
        { 
          name: 'Enterprise', 
          href: '/dashboard/enterprise', 
          icon: NetworkIcon,
          category: 'ai',
          badge: 'Pro'
        },
        { 
          name: 'Documents', 
          href: '/dashboard/documents', 
          icon: DocumentIcon,
          category: 'main'
        },
        { 
          name: 'Settings', 
          href: '/dashboard/settings', 
          icon: SettingsIcon,
          category: 'main'
        },
      ],
      toggleSidebar: 'Toggle sidebar',
      categories: {
        main: 'Main',
        ai: 'AI & Enterprise'
      }
    }
  }

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--surface-panel)' }}
    >
      {/* Sidebar - NotebookLM Style */}
      <motion.aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-0`}
        style={{
          backgroundColor: 'var(--surface-elevated)',
          borderRight: `1px solid var(--surface-outline)`,
          boxShadow: 'var(--elevation-level-1)'
        }}
        initial={false}
      >
        <div className="flex flex-col h-full">
          {/* Logo - NotebookLM Style */}
          <div 
            className="flex items-center justify-between h-16 px-6"
            style={{ borderBottom: `1px solid var(--surface-outline)` }}
          >
            <Link href="/" className="flex items-center">
              <span 
                className="font-bold"
                style={{
                  fontSize: 'var(--sys-title-large-size)',
                  lineHeight: 'var(--sys-title-large-line-height)',
                  fontFamily: 'var(--sys-title-large-font)',
                  color: 'var(--notebooklm-primary)'
                }}
              >
                Prismy
              </span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 transition-colors duration-200"
              style={{
                color: 'var(--text-secondary)',
                borderRadius: 'var(--shape-corner-small)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.backgroundColor = 'var(--surface-filled)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label={navigation[language].toggleSidebar}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info - NotebookLM Style */}
          <div 
            className="px-6 py-4"
            style={{ borderBottom: `1px solid var(--surface-outline)` }}
          >
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--notebooklm-primary-light)',
                  borderRadius: 'var(--shape-corner-medium)'
                }}
              >
                <span 
                  className="font-medium"
                  style={{
                    color: 'var(--notebooklm-primary)',
                    fontSize: 'var(--sys-label-medium-size)',
                    fontFamily: 'var(--sys-label-medium-font)',
                    fontWeight: 'var(--sys-label-medium-weight)'
                  }}
                >
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p 
                  className="truncate"
                  style={{
                    fontSize: 'var(--sys-body-medium-size)',
                    lineHeight: 'var(--sys-body-medium-line-height)',
                    fontFamily: 'var(--sys-body-medium-font)',
                    fontWeight: 'var(--sys-body-medium-weight)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {user?.user_metadata?.full_name || user?.email}
                </p>
                <p 
                  className="truncate"
                  style={{
                    fontSize: 'var(--sys-body-small-size)',
                    lineHeight: 'var(--sys-body-small-line-height)',
                    fontFamily: 'var(--sys-body-small-font)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 overflow-y-auto">
            {Object.entries(navigation[language].categories).map(([categoryKey, categoryName]) => {
              const categoryItems = navigation[language].menu.filter(item => item.category === categoryKey)
              
              return (
                <div key={categoryKey} className="mb-6">
                  <h3 
                    className="px-3 mb-2 uppercase tracking-wider"
                    style={{
                      fontSize: 'var(--sys-label-small-size)',
                      lineHeight: 'var(--sys-label-small-line-height)',
                      fontFamily: 'var(--sys-label-small-font)',
                      fontWeight: 'var(--sys-label-small-weight)',
                      color: 'var(--text-muted)'
                    }}
                  >
                    {categoryName}
                  </h3>
                  <div className="space-y-1">
                    {categoryItems.map((item) => {
                      const isActive = pathname === item.href
                      const featureId = item.href.split('/').pop() || 'main'
                      
                      return (
                        <FeatureHint
                          key={item.href}
                          feature={featureId}
                          title={item.name}
                          description={`Discover the power of ${item.name} - ${
                            featureId === 'agents' ? 'Create autonomous AI agents that work for you' :
                            featureId === 'insights' ? 'Get AI-powered predictive insights and cross-document analysis' :
                            featureId === 'enterprise' ? 'Access learning networks and voice control features' :
                            'Explore this powerful feature'
                          }`}
                          position="right"
                          delay={categoryKey === 'ai' ? 8000 : 15000}
                        >
                          <Link
                            href={item.href}
                            className="flex items-center justify-between px-3 py-2 transition-all duration-200 group"
                            style={{
                              fontSize: 'var(--sys-label-medium-size)',
                              lineHeight: 'var(--sys-label-medium-line-height)',
                              fontFamily: 'var(--sys-label-medium-font)',
                              fontWeight: 'var(--sys-label-medium-weight)',
                              borderRadius: 'var(--shape-corner-small)',
                              backgroundColor: isActive ? 'var(--notebooklm-primary-light)' : 'transparent',
                              color: isActive ? 'var(--notebooklm-primary)' : 'var(--text-secondary)',
                              boxShadow: isActive ? 'var(--elevation-level-1)' : 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.backgroundColor = 'var(--surface-filled)';
                                e.currentTarget.style.color = 'var(--text-primary)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                              }
                            }}
                          >
                            <div className="flex items-center">
                              <item.icon 
                                className="w-5 h-5 mr-3"
                                style={{
                                  color: isActive ? 'var(--notebooklm-primary)' : 'currentColor'
                                }}
                              />
                              <span>{item.name}</span>
                              {categoryKey === 'ai' && (
                                <FeatureBadge 
                                  feature={featureId} 
                                  type={item.badge === 'Pro' ? 'pro' : item.badge === 'AI' ? 'ai' : 'new'}
                                  size="sm"
                                />
                              )}
                            </div>
                            {item.badge && (
                              <span 
                                className="px-2 py-1"
                                style={{
                                  fontSize: 'var(--sys-label-small-size)',
                                  lineHeight: 'var(--sys-label-small-line-height)',
                                  fontFamily: 'var(--sys-label-small-font)',
                                  fontWeight: 'var(--sys-label-small-weight)',
                                  borderRadius: 'var(--shape-corner-full)',
                                  backgroundColor: isActive 
                                    ? 'rgba(11, 40, 255, 0.15)' 
                                    : item.badge === 'Pro' 
                                      ? 'var(--notebooklm-primary-light)'
                                      : item.badge === 'AI'
                                        ? 'var(--notebooklm-primary-light)'
                                        : 'var(--success-50)',
                                  color: isActive 
                                    ? 'var(--notebooklm-primary)' 
                                    : item.badge === 'Pro' 
                                      ? 'var(--notebooklm-primary)'
                                      : item.badge === 'AI'
                                        ? 'var(--notebooklm-primary)'
                                        : 'var(--success-600)'
                                }}
                              >
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        </FeatureHint>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </nav>

          {/* Bottom section - NotebookLM Style */}
          <div 
            className="p-4"
            style={{ borderTop: `1px solid var(--surface-outline)` }}
          >
            <UnifiedUserMenu variant="workspace" />
          </div>
        </div>
      </motion.aside>

      {/* Main content - NotebookLM Style */}
      <div className={`flex-1 ${isSidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Top bar */}
        <header 
          className="dashboard-header"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            borderBottom: `1px solid var(--surface-outline)`,
            boxShadow: 'var(--elevation-level-1)'
          }}
        >
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 lg:hidden transition-colors duration-200"
              style={{
                color: 'var(--text-secondary)',
                borderRadius: 'var(--shape-corner-small)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.backgroundColor = 'var(--surface-filled)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label={navigation[language].toggleSidebar}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Feature Discovery Button */}
            <div className="flex items-center space-x-3">
              <FeatureHint
                feature="feature-tour"
                title="Take a feature tour"
                description="Discover Prismy's advanced AI capabilities with a guided tour"
                position="bottom"
                delay={20000}
              >
                <button
                  onClick={showDiscovery}
                  className="flex items-center space-x-2 px-3 py-2 transition-colors border"
                  style={{
                    fontSize: 'var(--sys-label-medium-size)',
                    lineHeight: 'var(--sys-label-medium-line-height)',
                    fontFamily: 'var(--sys-label-medium-font)',
                    fontWeight: 'var(--sys-label-medium-weight)',
                    color: 'var(--notebooklm-primary)',
                    borderColor: 'var(--surface-outline)',
                    borderRadius: 'var(--shape-corner-small)',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--notebooklm-primary-light)';
                    e.currentTarget.style.borderColor = 'var(--notebooklm-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'var(--surface-outline)';
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{language === 'vi' ? 'Khám phá tính năng' : 'Discover Features'}</span>
                </button>
              </FeatureHint>

              <button
                onClick={showDiscovery}
                className="p-2 transition-colors"
                style={{
                  color: 'var(--text-secondary)',
                  borderRadius: 'var(--shape-corner-small)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--surface-filled)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title={language === 'vi' ? 'Trợ giúp' : 'Help'}
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content - NotebookLM Style */}
        <main 
          className="p-6"
          style={{ backgroundColor: 'var(--surface-panel)' }}
        >
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Feature Discovery */}
      <FeatureDiscovery
        isOpen={isDiscoveryOpen}
        onClose={hideDiscovery}
        onComplete={completeFeature}
        userLevel="beginner"
      />
    </div>
  )
}

export default function DashboardLayout({ children, language = 'en' }: DashboardLayoutProps) {
  return (
    <FeatureDiscoveryProvider>
      <DashboardLayoutInner language={language}>
        {children}
      </DashboardLayoutInner>
    </FeatureDiscoveryProvider>
  )
}

// Icon components
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function BrainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function NetworkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
    </svg>
  )
}