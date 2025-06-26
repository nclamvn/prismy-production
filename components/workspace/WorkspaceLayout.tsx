'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { motionSafe, slideUp, fadeIn } from '@/lib/motion'
import { WorkspaceMode } from '@/app/workspace/page'
import UserMenu from '@/components/auth/UserMenu'
import CreditDisplay from '@/components/auth/CreditDisplay'
import InviteRedemptionModal from '@/components/auth/InviteRedemptionModal'
import {
  FileText,
  Brain,
  BarChart3,
  Settings,
  Building2,
  CreditCard,
  Menu,
  X,
  Home,
  User,
} from 'lucide-react'

interface WorkspaceLayoutProps {
  currentMode: WorkspaceMode
  onModeChange: (mode: WorkspaceMode) => void
  language: 'vi' | 'en'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any
  children: React.ReactNode
}

export default function WorkspaceLayout({
  currentMode,
  onModeChange,
  language,
  user,
  children,
}: WorkspaceLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter()

  const content = {
    vi: {
      workspace: 'Không gian làm việc',
      backToHome: 'Về trang chủ',
      navigation: {
        documents: 'Tài liệu',
        intelligence: 'AI Phân tích',
        analytics: 'Thống kê',
        api: 'API',
        enterprise: 'Doanh nghiệp',
        billing: 'Thanh toán',
        settings: 'Cài đặt',
      },
      quickStats: {
        documents: 'tài liệu',
        usage: 'sử dụng tháng này',
        languages: 'ngôn ngữ',
      },
      user: {
        profile: 'Hồ sơ',
        logout: 'Đăng xuất',
      },
    },
    en: {
      workspace: 'Workspace',
      backToHome: 'Back to Home',
      navigation: {
        documents: 'Documents',
        intelligence: 'AI Intelligence',
        analytics: 'Analytics',
        api: 'API',
        enterprise: 'Enterprise',
        billing: 'Billing',
        settings: 'Settings',
      },
      quickStats: {
        documents: 'documents',
        usage: 'usage this month',
        languages: 'languages',
      },
      user: {
        profile: 'Profile',
        logout: 'Logout',
      },
    },
  }

  const navigationItems = [
    {
      id: 'documents' as WorkspaceMode,
      label: content[language].navigation.documents,
      icon: FileText,
      description:
        language === 'vi'
          ? 'Dịch và xử lý tài liệu'
          : 'Translate and process documents',
    },
    {
      id: 'intelligence' as WorkspaceMode,
      label: content[language].navigation.intelligence,
      icon: Brain,
      description:
        language === 'vi'
          ? 'AI phân tích thông minh'
          : 'AI intelligent analysis',
    },
    {
      id: 'analytics' as WorkspaceMode,
      label: content[language].navigation.analytics,
      icon: BarChart3,
      description: language === 'vi' ? 'Thống kê sử dụng' : 'Usage analytics',
    },
    {
      id: 'api' as WorkspaceMode,
      label: content[language].navigation.api,
      icon: Settings,
      description: language === 'vi' ? 'Quản lý API' : 'API management',
    },
    {
      id: 'enterprise' as WorkspaceMode,
      label: content[language].navigation.enterprise,
      icon: Building2,
      description:
        language === 'vi' ? 'Giải pháp doanh nghiệp' : 'Enterprise solutions',
    },
    {
      id: 'billing' as WorkspaceMode,
      label: content[language].navigation.billing,
      icon: CreditCard,
      description:
        language === 'vi' ? 'Thanh toán & sử dụng' : 'Billing & usage',
    },
    {
      id: 'settings' as WorkspaceMode,
      label: content[language].navigation.settings,
      icon: User,
      description: language === 'vi' ? 'Cài đặt tài khoản' : 'Account settings',
    },
  ]

  return (
    <div 
      className="h-screen flex"
      style={{ backgroundColor: 'var(--surface-panel)' }}
    >
      {/* Sidebar - NotebookLM Style */}
      <motion.aside
        variants={motionSafe(slideUp)}
        initial="hidden"
        animate="visible"
        className="hidden lg:flex lg:flex-col lg:w-80"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          borderRight: `1px solid var(--surface-outline)`,
          boxShadow: 'var(--elevation-level-1)'
        }}
      >
        {/* Sidebar Header - NotebookLM Style */}
        <div 
          className="p-6"
          style={{ borderBottom: `1px solid var(--surface-outline)` }}
        >
          <div className="flex items-center">
            <img 
              src="/icons/logo.svg" 
              alt="Prismy" 
              className="h-8 w-auto mr-3"
              style={{
                borderRadius: 'var(--shape-corner-small)',
                boxShadow: 'var(--elevation-level-1)',
                overflow: 'hidden'
              }}
            />
            <div>
              <span 
                className="font-bold"
                style={{
                  fontSize: 'var(--sys-title-medium-size)',
                  lineHeight: 'var(--sys-title-medium-line-height)',
                  fontFamily: 'var(--sys-title-medium-font)',
                  color: 'var(--text-primary)'
                }}
              >
                Prismy
              </span>
              <p 
                style={{
                  fontSize: 'var(--sys-body-small-size)',
                  lineHeight: 'var(--sys-body-small-line-height)',
                  fontFamily: 'var(--sys-body-small-font)',
                  color: 'var(--text-secondary)'
                }}
              >
                {content[language].workspace}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map(item => {
            const IconComponent = item.icon
            const isActive = currentMode === item.id

            return (
              <button
                key={item.id}
                onClick={() => onModeChange(item.id)}
                className="w-full flex items-center p-4 transition-all duration-200 group"
                style={{
                  borderRadius: 'var(--shape-corner-medium)',
                  backgroundColor: isActive ? 'var(--notebooklm-primary-light)' : 'transparent',
                  border: isActive ? `1px solid var(--surface-outline)` : '1px solid transparent',
                  boxShadow: isActive ? 'var(--elevation-level-1)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--surface-filled)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <IconComponent
                  size={20}
                  className="mr-3 transition-colors"
                  style={{
                    color: isActive ? 'var(--notebooklm-primary)' : 'var(--text-secondary)'
                  }}
                />
                <div className="flex-1 text-left">
                  <div
                    className="font-medium"
                    style={{
                      fontSize: 'var(--sys-body-medium-size)',
                      lineHeight: 'var(--sys-body-medium-line-height)',
                      fontFamily: 'var(--sys-body-medium-font)',
                      color: isActive ? 'var(--notebooklm-primary)' : 'var(--text-primary)'
                    }}
                  >
                    {item.label}
                  </div>
                  <div 
                    className="mt-0.5"
                    style={{
                      fontSize: 'var(--sys-body-small-size)',
                      lineHeight: 'var(--sys-body-small-line-height)',
                      fontFamily: 'var(--sys-body-small-font)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {item.description}
                  </div>
                </div>
              </button>
            )
          })}
        </nav>
      </motion.aside>

      {/* Mobile Sidebar Overlay - NotebookLM Style */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            onClick={() => setIsSidebarOpen(false)}
          >
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              className="w-80 h-full"
              style={{
                backgroundColor: 'var(--surface-elevated)',
                borderRight: `1px solid var(--surface-outline)`,
                boxShadow: 'var(--elevation-level-2)'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Mobile sidebar content - NotebookLM Style */}
              <div 
                className="p-6 flex items-center justify-between"
                style={{ borderBottom: `1px solid var(--surface-outline)` }}
              >
                <div className="flex items-center">
                  <img
                    src="/icons/logo.svg"
                    alt="Prismy"
                    className="h-8 w-auto mr-3"
                    style={{
                      borderRadius: 'var(--shape-corner-small)',
                      boxShadow: 'var(--elevation-level-1)',
                      overflow: 'hidden'
                    }}
                  />
                  <div>
                    <span 
                      className="font-bold"
                      style={{
                        fontSize: 'var(--sys-title-medium-size)',
                        lineHeight: 'var(--sys-title-medium-line-height)',
                        fontFamily: 'var(--sys-title-medium-font)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      Prismy
                    </span>
                    <p 
                      style={{
                        fontSize: 'var(--sys-body-small-size)',
                        lineHeight: 'var(--sys-body-small-line-height)',
                        fontFamily: 'var(--sys-body-small-font)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {content[language].workspace}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 transition-colors"
                  style={{
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--shape-corner-small)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-filled)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-2">
                {navigationItems.map(item => {
                  const IconComponent = item.icon
                  const isActive = currentMode === item.id

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onModeChange(item.id)
                        setIsSidebarOpen(false)
                      }}
                      className="w-full flex items-center p-4 transition-all duration-200 group"
                      style={{
                        borderRadius: 'var(--shape-corner-medium)',
                        backgroundColor: isActive ? 'var(--notebooklm-primary-light)' : 'transparent',
                        border: isActive ? `1px solid var(--surface-outline)` : '1px solid transparent',
                        boxShadow: isActive ? 'var(--elevation-level-1)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'var(--surface-filled)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <IconComponent
                        size={20}
                        className="mr-3 transition-colors"
                        style={{
                          color: isActive ? 'var(--notebooklm-primary)' : 'var(--text-secondary)'
                        }}
                      />
                      <div className="flex-1 text-left">
                        <div
                          className="font-medium"
                          style={{
                            fontSize: 'var(--sys-body-medium-size)',
                            lineHeight: 'var(--sys-body-medium-line-height)',
                            fontFamily: 'var(--sys-body-medium-font)',
                            color: isActive ? 'var(--notebooklm-primary)' : 'var(--text-primary)'
                          }}
                        >
                          {item.label}
                        </div>
                        <div 
                          className="mt-0.5"
                          style={{
                            fontSize: 'var(--sys-body-small-size)',
                            lineHeight: 'var(--sys-body-small-line-height)',
                            fontFamily: 'var(--sys-body-small-font)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {item.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Clean Workspace Header - NotebookLM Style */}
        <header 
          className="px-4 py-3 lg:px-6 lg:py-4"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            borderBottom: `1px solid var(--surface-outline)`,
            boxShadow: 'var(--elevation-level-1)'
          }}
        >
          <div className="flex items-center justify-between">
            {/* Left Section: Mobile Menu + Current Section */}
            <div className="flex items-center">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 mr-3 transition-colors"
                style={{
                  color: 'var(--text-secondary)',
                  borderRadius: 'var(--shape-corner-small)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-filled)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <Menu size={20} />
              </button>

              {/* Current Section Info */}
              <div className="hidden lg:block">
                <h1 
                  className="font-semibold"
                  style={{
                    fontSize: 'var(--sys-title-medium-size)',
                    lineHeight: 'var(--sys-title-medium-line-height)',
                    fontFamily: 'var(--sys-title-medium-font)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {navigationItems.find(item => item.id === currentMode)?.label}
                </h1>
                <p 
                  className="mt-0.5"
                  style={{
                    fontSize: 'var(--sys-body-small-size)',
                    lineHeight: 'var(--sys-body-small-line-height)',
                    fontFamily: 'var(--sys-body-small-font)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {
                    navigationItems.find(item => item.id === currentMode)
                      ?.description
                  }
                </p>
              </div>

              {/* Mobile Section Title */}
              <div className="lg:hidden">
                <h1 
                  className="font-semibold"
                  style={{
                    fontSize: 'var(--sys-title-medium-size)',
                    lineHeight: 'var(--sys-title-medium-line-height)',
                    fontFamily: 'var(--sys-title-medium-font)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {navigationItems.find(item => item.id === currentMode)?.label}
                </h1>
              </div>
            </div>

            {/* Right Section: Navigation + User */}
            <div className="flex items-center space-x-3">
              {/* Credit Display */}
              <CreditDisplay 
                userId={user?.id}
                size="md"
                variant="badge"
                onInviteClick={() => setShowInviteModal(true)}
                onTopUpClick={() => router.push('/pricing')}
                className="mr-2"
              />

              {/* Quick Stats - Desktop Only */}
              <div 
                className="hidden xl:flex items-center space-x-6 text-center pr-6"
                style={{ borderRight: `1px solid var(--surface-outline)` }}
              >
                <div>
                  <div 
                    className="font-medium"
                    style={{
                      fontSize: 'var(--sys-body-medium-size)',
                      lineHeight: 'var(--sys-body-medium-line-height)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    247
                  </div>
                  <div 
                    style={{
                      fontSize: 'var(--sys-body-small-size)',
                      lineHeight: 'var(--sys-body-small-line-height)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {content[language].quickStats.documents}
                  </div>
                </div>
                <div>
                  <div 
                    className="font-medium"
                    style={{
                      fontSize: 'var(--sys-body-medium-size)',
                      lineHeight: 'var(--sys-body-medium-line-height)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    1.2M
                  </div>
                  <div 
                    style={{
                      fontSize: 'var(--sys-body-small-size)',
                      lineHeight: 'var(--sys-body-small-line-height)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {content[language].quickStats.usage}
                  </div>
                </div>
                <div>
                  <div 
                    className="font-medium"
                    style={{
                      fontSize: 'var(--sys-body-medium-size)',
                      lineHeight: 'var(--sys-body-medium-line-height)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    15
                  </div>
                  <div 
                    style={{
                      fontSize: 'var(--sys-body-small-size)',
                      lineHeight: 'var(--sys-body-small-line-height)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {content[language].quickStats.languages}
                  </div>
                </div>
              </div>

              {/* Back to Home - NotebookLM Style */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/"
                className="flex items-center px-3 py-1.5 transition-colors focus:outline-none no-underline"
                style={{
                  fontSize: 'var(--sys-body-medium-size)',
                  lineHeight: 'var(--sys-body-medium-line-height)',
                  fontFamily: 'var(--sys-body-medium-font)',
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
              >
                <Home size={16} className="mr-2" />
                <span className="hidden sm:inline">
                  {content[language].backToHome}
                </span>
              </a>

              {/* User Menu */}
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Main Content - NotebookLM Style */}
        <main 
          className="flex-1 overflow-auto"
          style={{ backgroundColor: 'var(--surface-panel)' }}
        >
          <motion.div
            key={currentMode}
            variants={motionSafe(fadeIn)}
            initial="hidden"
            animate="visible"
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Invite Redemption Modal */}
      <InviteRedemptionModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={(result) => {
          console.log('Invite redeemed:', result)
          setShowInviteModal(false)
          // Optionally show a success message or refresh the page
          window.location.reload()
        }}
        userEmail={user?.email}
      />
    </div>
  )
}
