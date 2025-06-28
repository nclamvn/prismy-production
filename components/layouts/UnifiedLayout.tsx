'use client'

import { useState, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { motionSafe, slideUp, fadeIn } from '@/lib/motion'
import Footer from '@/components/Footer'
import UnifiedUserMenu from '@/components/auth/UnifiedUserMenu'
import CreditDisplay from '@/components/auth/CreditDisplay'
import InviteRedemptionModal from '@/components/auth/InviteRedemptionModal'
import { FeatureDiscoveryProvider, useFeatureDiscovery } from '@/contexts/FeatureDiscoveryContext'
import FeatureDiscovery from '@/components/ui/FeatureDiscovery'
import FeatureHint, { FeatureBadge } from '@/components/ui/FeatureHint'
import { 
  Menu, 
  X, 
  Home, 
  HelpCircle, 
  Sparkles,
  FileText,
  Brain,
  BarChart3,
  Settings,
  Building2,
  CreditCard,
  User,
  History,
  Zap,
  Network,
  FileIcon as DocumentIcon
} from 'lucide-react'

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type LayoutVariant = 'main' | 'workspace' | 'dashboard' | 'admin' | 'minimal'

export interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  category?: string
  badge?: string
  description?: string
}

export interface LayoutConfig {
  variant: LayoutVariant
  showNavbar?: boolean
  showFooter?: boolean
  showSidebar?: boolean
  sidebarCollapsible?: boolean
  showUserMenu?: boolean
  showCreditDisplay?: boolean
  language?: 'vi' | 'en'
  title?: string
  subtitle?: string
  navigation?: NavigationItem[]
  currentMode?: string
  onModeChange?: (mode: string) => void
  customNavigation?: ReactNode
  featureDiscovery?: boolean
}

export interface UnifiedLayoutProps {
  children: ReactNode
  config: LayoutConfig
  user?: any
}

// =============================================================================
// NAVIGATION CONFIGURATIONS
// =============================================================================

const getDefaultNavigation = (language: 'vi' | 'en', variant: LayoutVariant): NavigationItem[] => {
  const isVietnamese = language === 'vi'
  
  switch (variant) {
    case 'dashboard':
      return [
        {
          name: isVietnamese ? 'Tổng quan' : 'Overview',
          href: '/dashboard',
          icon: Home,
          category: 'main'
        },
        {
          name: isVietnamese ? 'Lịch sử dịch' : 'History',
          href: '/dashboard/history',
          icon: History,
          category: 'main'
        },
        {
          name: isVietnamese ? 'Phân tích' : 'Analytics',
          href: '/dashboard/analytics',
          icon: BarChart3,
          category: 'main'
        },
        {
          name: 'AI Agents',
          href: '/dashboard/agents',
          icon: Brain,
          category: 'ai',
          badge: isVietnamese ? 'Mới' : 'New'
        },
        {
          name: isVietnamese ? 'Thông tin thông minh' : 'Insights',
          href: '/dashboard/insights',
          icon: Zap,
          category: 'ai',
          badge: 'AI'
        },
        {
          name: 'Enterprise',
          href: '/dashboard/enterprise',
          icon: Network,
          category: 'ai',
          badge: 'Pro'
        },
        {
          name: isVietnamese ? 'Tài liệu' : 'Documents',
          href: '/dashboard/documents',
          icon: DocumentIcon,
          category: 'main'
        },
        {
          name: isVietnamese ? 'Cài đặt' : 'Settings',
          href: '/dashboard/settings',
          icon: Settings,
          category: 'main'
        }
      ]
    
    case 'workspace':
      return [
        {
          name: isVietnamese ? 'Tài liệu' : 'Documents',
          href: 'documents',
          icon: FileText,
          description: isVietnamese ? 'Dịch và xử lý tài liệu' : 'Translate and process documents'
        },
        {
          name: isVietnamese ? 'AI Phân tích' : 'AI Intelligence',
          href: 'intelligence',
          icon: Brain,
          description: isVietnamese ? 'AI phân tích thông minh' : 'AI intelligent analysis'
        },
        {
          name: isVietnamese ? 'Thống kê' : 'Analytics',
          href: 'analytics',
          icon: BarChart3,
          description: isVietnamese ? 'Thống kê sử dụng' : 'Usage analytics'
        },
        {
          name: 'API',
          href: 'api',
          icon: Settings,
          description: isVietnamese ? 'Quản lý API' : 'API management'
        },
        {
          name: isVietnamese ? 'Doanh nghiệp' : 'Enterprise',
          href: 'enterprise',
          icon: Building2,
          description: isVietnamese ? 'Giải pháp doanh nghiệp' : 'Enterprise solutions'
        },
        {
          name: isVietnamese ? 'Thanh toán' : 'Billing',
          href: 'billing',
          icon: CreditCard,
          description: isVietnamese ? 'Thanh toán & sử dụng' : 'Billing & usage'
        },
        {
          name: isVietnamese ? 'Cài đặt' : 'Settings',
          href: 'settings',
          icon: User,
          description: isVietnamese ? 'Cài đặt tài khoản' : 'Account settings'
        }
      ]
    
    case 'admin':
      return [
        {
          name: isVietnamese ? 'Tổng quan' : 'Overview',
          href: '/admin',
          icon: Home,
          category: 'main'
        },
        {
          name: isVietnamese ? 'Người dùng' : 'Users',
          href: '/admin/users',
          icon: User,
          category: 'main'
        },
        {
          name: isVietnamese ? 'Mời' : 'Invites',
          href: '/admin/invites',
          icon: CreditCard,
          category: 'main'
        },
        {
          name: isVietnamese ? 'Giám sát' : 'Monitor',
          href: '/admin/monitor',
          icon: BarChart3,
          category: 'main'
        }
      ]
    
    default:
      return []
  }
}

// =============================================================================
// SIDEBAR COMPONENT
// =============================================================================

interface SidebarProps {
  config: LayoutConfig
  isOpen: boolean
  onToggle: () => void
  user: any
  pathname: string
}

function Sidebar({ config, isOpen, onToggle, user, pathname }: SidebarProps) {
  const router = useRouter()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const language = config.language || 'en'
  const navigation = config.navigation || getDefaultNavigation(language, config.variant)
  
  const content = {
    vi: {
      workspace: 'Không gian làm việc',
      backToHome: 'Về trang chủ',
      toggleSidebar: 'Ẩn/Hiện menu',
      categories: {
        main: 'Chính',
        ai: 'AI & Enterprise'
      }
    },
    en: {
      workspace: 'Workspace',
      backToHome: 'Back to Home',
      toggleSidebar: 'Toggle sidebar',
      categories: {
        main: 'Main',
        ai: 'AI & Enterprise'
      }
    }
  }
  
  const currentContent = content[language]
  
  // Group navigation by category for dashboard
  const groupedNavigation = navigation.reduce((acc, item) => {
    const category = item.category || 'main'
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {} as Record<string, NavigationItem[]>)

  const renderNavigation = () => {
    if (config.variant === 'dashboard') {
      // Dashboard: categorized navigation
      return Object.entries(groupedNavigation).map(([categoryKey, categoryItems]) => (
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
            {currentContent.categories[categoryKey as keyof typeof currentContent.categories] || categoryKey}
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
                  description={`Discover the power of ${item.name}`}
                  position="right"
                  delay={categoryKey === 'ai' ? 8000 : 15000}
                >
                  <Link
                    href={item.href}
                    className="flex items-center justify-between px-3 py-2 transition-all duration-200 group"
                    style={{
                      fontSize: 'var(--sys-label-medium-size)',
                      borderRadius: 'var(--shape-corner-small)',
                      backgroundColor: isActive ? 'var(--notebooklm-primary-light)' : 'transparent',
                      color: isActive ? 'var(--notebooklm-primary)' : 'var(--text-secondary)',
                      boxShadow: isActive ? 'var(--elevation-level-1)' : 'none'
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
                      {categoryKey === 'ai' && item.badge && (
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
                          borderRadius: 'var(--shape-corner-full)',
                          backgroundColor: isActive 
                            ? 'rgba(11, 40, 255, 0.15)' 
                            : 'var(--notebooklm-primary-light)',
                          color: 'var(--notebooklm-primary)'
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
      ))
    } else {
      // Workspace: mode-based navigation
      return navigation.map((item) => {
        const IconComponent = item.icon
        const isActive = config.currentMode === item.href
        
        return (
          <button
            key={item.href}
            onClick={() => config.onModeChange?.(item.href)}
            className="w-full flex items-center p-4 transition-all duration-200 group"
            style={{
              borderRadius: 'var(--shape-corner-medium)',
              backgroundColor: isActive ? 'var(--notebooklm-primary-light)' : 'transparent',
              border: isActive ? `1px solid var(--surface-outline)` : '1px solid transparent',
              boxShadow: isActive ? 'var(--elevation-level-1)' : 'none'
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
                  color: isActive ? 'var(--notebooklm-primary)' : 'var(--text-primary)'
                }}
              >
                {item.name}
              </div>
              {item.description && (
                <div 
                  className="mt-0.5"
                  style={{
                    fontSize: 'var(--sys-body-small-size)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {item.description}
                </div>
              )}
            </div>
          </button>
        )
      })
    }
  }

  return (
    <>
      <motion.aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-0`}
        style={{
          backgroundColor: 'var(--surface-elevated)',
          borderRight: `1px solid var(--surface-outline)`,
          boxShadow: 'var(--elevation-level-1)'
        }}
        initial={false}
      >
        <div className="flex flex-col h-full">
          {/* Logo Header */}
          <div 
            className="flex items-center justify-between h-16 px-6"
            style={{ borderBottom: `1px solid var(--surface-outline)` }}
          >
            <Link href="/" className="flex items-center">
              <img 
                src="/icons/logo.svg" 
                alt="Prismy" 
                className="h-8 w-auto mr-3"
              />
              <div>
                <span 
                  className="font-bold"
                  style={{
                    fontSize: 'var(--sys-title-large-size)',
                    color: 'var(--notebooklm-primary)'
                  }}
                >
                  Prismy
                </span>
                <p 
                  style={{
                    fontSize: 'var(--sys-body-small-size)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {config.title || currentContent.workspace}
                </p>
              </div>
            </Link>
            <button
              onClick={onToggle}
              className="lg:hidden p-2 transition-colors duration-200"
              aria-label={currentContent.toggleSidebar}
            >
              <X size={20} />
            </button>
          </div>

          {/* User Info for Workspace/Dashboard */}
          {(config.variant === 'workspace' || config.variant === 'dashboard') && user && (
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
                      fontSize: 'var(--sys-label-medium-size)'
                    }}
                  >
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ color: 'var(--text-primary)' }}>
                    {user?.user_metadata?.full_name || user?.email}
                  </p>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 overflow-y-auto">
            {renderNavigation()}
          </nav>

          {/* User Menu for Dashboard */}
          {config.variant === 'dashboard' && (
            <div 
              className="p-4"
              style={{ borderTop: `1px solid var(--surface-outline)` }}
            >
              <UnifiedUserMenu variant="workspace" />
            </div>
          )}
        </div>
      </motion.aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
          onClick={onToggle}
        />
      )}

      {/* Invite Modal */}
      <InviteRedemptionModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={(result) => {
          console.log('Invite redeemed:', result)
          setShowInviteModal(false)
          window.location.reload()
        }}
        userEmail={user?.email}
      />
    </>
  )
}

// =============================================================================
// MAIN UNIFIED LAYOUT COMPONENT
// =============================================================================

function UnifiedLayoutInner({ children, config, user }: UnifiedLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user: authUser } = useAuth()
  const currentUser = user || authUser
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { isDiscoveryOpen, showDiscovery, hideDiscovery, completeFeature } = useFeatureDiscovery()
  
  const language = config.language || 'en'
  
  // Determine content padding based on navbar visibility
  const hiddenNavbarRoutes = ['/workspace', '/dashboard', '/admin']
  const isNavbarHidden = hiddenNavbarRoutes.some(route => pathname.startsWith(route))
  const needsPadding = config.showNavbar && !isNavbarHidden

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--surface-panel)' }}
    >
      {/* Sidebar */}
      {config.showSidebar && (
        <Sidebar
          config={config}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          user={currentUser}
          pathname={pathname}
        />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col overflow-hidden ${config.showSidebar ? 'lg:ml-64' : ''}`}>
        {/* Header for Workspace variants */}
        {(config.variant === 'workspace' || config.variant === 'admin') && (
          <header 
            className="px-4 py-3 lg:px-6 lg:py-4"
            style={{
              backgroundColor: 'var(--surface-elevated)',
              borderBottom: `1px solid var(--surface-outline)`,
              boxShadow: 'var(--elevation-level-1)'
            }}
          >
            <div className="flex items-center justify-between">
              {/* Left Section */}
              <div className="flex items-center">
                {/* Mobile Menu Button */}
                {config.showSidebar && (
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden p-2 mr-3 transition-colors"
                    style={{
                      color: 'var(--text-secondary)',
                      borderRadius: 'var(--shape-corner-small)'
                    }}
                  >
                    <Menu size={20} />
                  </button>
                )}

                {/* Section Info */}
                <div>
                  <h1 
                    className="font-semibold"
                    style={{
                      fontSize: 'var(--sys-title-medium-size)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {config.title}
                  </h1>
                  {config.subtitle && (
                    <p 
                      className="mt-0.5"
                      style={{
                        fontSize: 'var(--sys-body-small-size)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {config.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center space-x-3">
                {/* Credit Display */}
                {config.showCreditDisplay && currentUser && (
                  <CreditDisplay 
                    userId={currentUser.id}
                    size="md"
                    variant="badge"
                    className="mr-2"
                  />
                )}

                {/* Feature Discovery for Dashboard */}
                {config.featureDiscovery && (
                  <button
                    onClick={showDiscovery}
                    className="flex items-center space-x-2 px-3 py-2 transition-colors border"
                    style={{
                      color: 'var(--notebooklm-primary)',
                      borderColor: 'var(--surface-outline)',
                      borderRadius: 'var(--shape-corner-small)'
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{language === 'vi' ? 'Khám phá tính năng' : 'Discover Features'}</span>
                  </button>
                )}

                {/* Back to Home */}
                <a
                  href="/"
                  className="flex items-center px-3 py-1.5 transition-colors"
                  style={{
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--shape-corner-small)'
                  }}
                >
                  <Home size={16} className="mr-2" />
                  <span className="hidden sm:inline">
                    {language === 'vi' ? 'Về trang chủ' : 'Back to Home'}
                  </span>
                </a>

                {/* User Menu */}
                {config.showUserMenu && <UnifiedUserMenu variant="workspace" />}
              </div>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main 
          className={`flex-1 overflow-auto ${needsPadding ? 'pt-16 lg:pt-20' : ''}`}
          style={{ 
            backgroundColor: 'var(--surface-panel)',
            minHeight: needsPadding ? 'calc(100vh - 64px)' : '100vh'
          }}
        >
          <motion.div
            variants={motionSafe(fadeIn)}
            initial="hidden"
            animate="visible"
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Footer */}
      {config.showFooter && <Footer />}

      {/* Feature Discovery */}
      {config.featureDiscovery && (
        <FeatureDiscovery
          isOpen={isDiscoveryOpen}
          onClose={hideDiscovery}
          onComplete={completeFeature}
          userLevel="beginner"
        />
      )}
    </div>
  )
}

// Wrapper with Feature Discovery Provider
export default function UnifiedLayout(props: UnifiedLayoutProps) {
  if (props.config.featureDiscovery) {
    return (
      <FeatureDiscoveryProvider>
        <UnifiedLayoutInner {...props} />
      </FeatureDiscoveryProvider>
    )
  }
  
  return <UnifiedLayoutInner {...props} />
}