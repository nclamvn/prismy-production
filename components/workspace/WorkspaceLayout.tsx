'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSmartNavigation } from '@/hooks/useSmartNavigation'
import { motionSafe, slideUp, fadeIn } from '@/lib/motion'
import { WorkspaceMode } from '@/app/workspace/page'
import UserMenu from '@/components/auth/UserMenu'
import {
  FileText,
  Brain,
  BarChart3,
  Settings,
  Building2,
  CreditCard,
  User,
  Bell,
  Search,
  Menu,
  X,
  Home,
  Zap,
  Globe,
  Users,
} from 'lucide-react'

interface WorkspaceLayoutProps {
  currentMode: WorkspaceMode
  onModeChange: (mode: WorkspaceMode) => void
  language: 'vi' | 'en'
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
  const router = useRouter()
  const { handleBackToHome: smartBackToHome, handleLogoClick } =
    useSmartNavigation()

  // Handle back to home navigation with smart navigation
  const handleBackToHome = () => {
    console.log('🏠 WorkspaceLayout: Back to Home clicked', {
      currentPath:
        typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      smartBackToHomeAvailable: typeof smartBackToHome === 'function',
    })
    console.log('🏠 WorkspaceLayout: About to call smartBackToHome...')
    smartBackToHome()
    console.log('🏠 WorkspaceLayout: smartBackToHome called')
  }

  // Handle logo click navigation
  const handleSidebarLogoClick = (e: React.MouseEvent) => {
    console.log('🔘 WorkspaceLayout: Sidebar logo clicked', {
      eventType: e.type,
      target: e.target,
      currentTarget: e.currentTarget,
      button: e.button,
      clientX: e.clientX,
      clientY: e.clientY,
    })
    e.preventDefault()
    e.stopPropagation()
    console.log('🔘 WorkspaceLayout: About to call handleLogoClick...')
    handleLogoClick(e)
    console.log('🔘 WorkspaceLayout: handleLogoClick called')
  }

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
    <div className="h-screen flex bg-bg-main">
      {/* Sidebar */}
      <motion.aside
        variants={motionSafe(slideUp)}
        initial="hidden"
        animate="visible"
        className="hidden lg:flex lg:flex-col lg:w-80 bg-white border-r border-border-subtle"
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border-subtle">
          <button
            onClick={handleSidebarLogoClick}
            className="flex items-center group w-full text-left hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-md"
          >
            <img src="/logo.svg" alt="Prismy" className="h-8 w-auto mr-3" />
            <div>
              <span className="heading-4 font-bold text-gray-900">Prismy</span>
              <p className="body-sm text-gray-500">
                {content[language].workspace}
              </p>
            </div>
          </button>
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
                className={`w-full flex items-center p-4 rounded-2xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gray-50 border border-border-subtle shadow-sm'
                    : 'hover:bg-gray-50'
                }`}
              >
                <IconComponent
                  size={20}
                  className={`mr-3 transition-colors ${
                    isActive
                      ? 'text-gray-900'
                      : 'text-gray-500 group-hover:text-gray-700'
                  }`}
                />
                <div className="flex-1 text-left">
                  <div
                    className={`body-sm font-medium ${
                      isActive ? 'text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {item.label}
                  </div>
                  <div className="body-xs text-gray-500 mt-0.5">
                    {item.description}
                  </div>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Sidebar Footer - User Info */}
        <div className="p-4 border-t border-border-subtle">
          <div className="flex items-center p-3 rounded-2xl bg-gray-50">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
              <User size={18} className="text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="body-sm font-medium text-gray-900">
                {user?.email || 'User'}
              </div>
              <div className="body-xs text-gray-500">
                {language === 'vi' ? 'Thành viên' : 'Member'}
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
            onClick={() => setIsSidebarOpen(false)}
          >
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              className="w-80 h-full bg-white border-r border-border-subtle"
              onClick={e => e.stopPropagation()}
            >
              {/* Mobile sidebar content - same as desktop */}
              <div className="p-6 border-b border-border-subtle flex items-center justify-between">
                <button
                  onClick={handleSidebarLogoClick}
                  className="flex items-center hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-md"
                >
                  <img
                    src="/logo.svg"
                    alt="Prismy"
                    className="h-8 w-auto mr-3"
                  />
                  <div>
                    <span className="heading-4 font-bold text-gray-900">
                      Prismy
                    </span>
                    <p className="body-sm text-gray-500">
                      {content[language].workspace}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} className="text-gray-500" />
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
                      className={`w-full flex items-center p-4 rounded-2xl transition-all duration-200 group ${
                        isActive
                          ? 'bg-gray-50 border border-border-subtle shadow-sm'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <IconComponent
                        size={20}
                        className={`mr-3 transition-colors ${
                          isActive
                            ? 'text-gray-900'
                            : 'text-gray-500 group-hover:text-gray-700'
                        }`}
                      />
                      <div className="flex-1 text-left">
                        <div
                          className={`body-sm font-medium ${
                            isActive ? 'text-gray-900' : 'text-gray-700'
                          }`}
                        >
                          {item.label}
                        </div>
                        <div className="body-xs text-gray-500 mt-0.5">
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
        {/* Clean Workspace Header - Professional & Minimal */}
        <header className="bg-white border-b border-border-subtle px-4 py-3 lg:px-6 lg:py-4">
          <div className="flex items-center justify-between">
            {/* Left Section: Mobile Menu + Current Section */}
            <div className="flex items-center">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg mr-3 transition-colors"
              >
                <Menu size={20} className="text-gray-600" />
              </button>

              {/* Current Section Info */}
              <div className="hidden lg:block">
                <h1 className="text-lg font-semibold text-gray-900">
                  {navigationItems.find(item => item.id === currentMode)?.label}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {
                    navigationItems.find(item => item.id === currentMode)
                      ?.description
                  }
                </p>
              </div>

              {/* Mobile Section Title */}
              <div className="lg:hidden">
                <h1 className="text-lg font-semibold text-gray-900">
                  {navigationItems.find(item => item.id === currentMode)?.label}
                </h1>
              </div>
            </div>

            {/* Right Section: Navigation + User */}
            <div className="flex items-center space-x-3">
              {/* Quick Stats - Desktop Only */}
              <div className="hidden xl:flex items-center space-x-6 text-center pr-6 border-r border-gray-200">
                <div>
                  <div className="text-sm font-medium text-gray-900">247</div>
                  <div className="text-xs text-gray-500">
                    {content[language].quickStats.documents}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">1.2M</div>
                  <div className="text-xs text-gray-500">
                    {content[language].quickStats.usage}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">15</div>
                  <div className="text-xs text-gray-500">
                    {content[language].quickStats.languages}
                  </div>
                </div>
              </div>

              {/* Back to Home Button */}
              <button
                onClick={handleBackToHome}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50"
                type="button"
              >
                <Home size={16} className="mr-2" />
                <span className="hidden sm:inline">
                  {content[language].backToHome}
                </span>
              </button>

              {/* User Menu */}
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
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
    </div>
  )
}
