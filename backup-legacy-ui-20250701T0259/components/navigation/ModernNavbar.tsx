'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import { useUnifiedAuthContext } from '@/contexts/UnifiedAuthProvider'
import { useSmartNavigation } from '@/hooks/useSmartNavigation'
import { useIsHydrated } from '@/hooks/useHydrationSafeAnimation'
import UnifiedUserMenu from '../auth/UnifiedUserMenu'
import UnifiedGetStartedButton from '../ui/UnifiedGetStartedButton'
import CreditHUD from '../credits/CreditHUD'
import {
  Globe,
  ChevronDown,
  Menu,
  X,
  Zap,
  FileText,
  DollarSign,
  Building2,
  BookOpen,
  Users,
  Sparkles,
} from 'lucide-react'

export default function ModernNavbar() {
  const { language, setLanguage } = useSSRSafeLanguage()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const { user, loading } = useAuth()
  const { handleSignIn } = useUnifiedAuthContext()
  const { handleLogoClick: smartLogoClick, isAuthenticated } =
    useSmartNavigation()
  const router = useRouter()
  const pathname = usePathname()
  const isHydrated = useIsHydrated()

  // Enhanced scroll detection with throttling
  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
    setActiveDropdown(null)
  }, [pathname])

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    smartLogoClick(e)
  }

  const content = {
    vi: {
      navigation: {
        product: {
          title: 'Sản phẩm',
          items: [
            {
              name: 'Tính năng',
              href: '/features',
              icon: Zap,
              description: 'Khám phá tính năng AI translation',
            },
            {
              name: 'Tài liệu',
              href: '/documents',
              icon: FileText,
              description: 'Dịch tài liệu thông minh',
            },
            {
              name: 'API',
              href: '/api-docs',
              icon: Sparkles,
              description: 'Tích hợp API mạnh mẽ',
            },
          ],
        },
        solutions: {
          title: 'Giải pháp',
          items: [
            {
              name: 'Doanh nghiệp',
              href: '/enterprise',
              icon: Building2,
              description: 'Giải pháp cho doanh nghiệp',
            },
            {
              name: 'Workspace',
              href: '/workspace',
              icon: Users,
              description: 'Cộng tác nhóm hiệu quả',
            },
          ],
        },
        resources: {
          title: 'Tài nguyên',
          items: [
            {
              name: 'Blog',
              href: '/blog',
              icon: BookOpen,
              description: 'Tin tức và hướng dẫn',
            },
            {
              name: 'Cộng đồng',
              href: '/community',
              icon: Users,
              description: 'Kết nối với cộng đồng',
            },
            {
              name: 'Hỗ trợ',
              href: '/support',
              icon: Users,
              description: 'Nhận hỗ trợ kỹ thuật',
            },
          ],
        },
        pricing: { name: 'Giá cả', href: '/pricing' },
      },
      signin: 'Đăng nhập',
      getStarted: 'Bắt đầu miễn phí',
      languages: {
        vi: 'Tiếng Việt',
        en: 'English',
      },
    },
    en: {
      navigation: {
        product: {
          title: 'Product',
          items: [
            {
              name: 'Features',
              href: '/features',
              icon: Zap,
              description: 'Explore AI translation features',
            },
            {
              name: 'Documents',
              href: '/documents',
              icon: FileText,
              description: 'Smart document translation',
            },
            {
              name: 'API',
              href: '/api-docs',
              icon: Sparkles,
              description: 'Powerful API integration',
            },
          ],
        },
        solutions: {
          title: 'Solutions',
          items: [
            {
              name: 'Enterprise',
              href: '/enterprise',
              icon: Building2,
              description: 'Enterprise solutions',
            },
            {
              name: 'Workspace',
              href: '/workspace',
              icon: Users,
              description: 'Team collaboration',
            },
          ],
        },
        resources: {
          title: 'Resources',
          items: [
            {
              name: 'Blog',
              href: '/blog',
              icon: BookOpen,
              description: 'News and tutorials',
            },
            {
              name: 'Community',
              href: '/community',
              icon: Users,
              description: 'Connect with community',
            },
            {
              name: 'Support',
              href: '/support',
              icon: Users,
              description: 'Get technical support',
            },
          ],
        },
        pricing: { name: 'Pricing', href: '/pricing' },
      },
      signin: 'Sign In',
      getStarted: 'Start for free',
      languages: {
        vi: 'Tiếng Việt',
        en: 'English',
      },
    },
  }

  // Ensure language has a valid value, fallback to 'en'
  const safeLanguage =
    language && (language === 'vi' || language === 'en') ? language : 'en'
  const currentContent = content[safeLanguage]

  // Show loading state if content is missing
  if (!currentContent || !currentContent.navigation) {
    return (
      <nav className="w-full bg-white border-b">
        <div className="px-4 py-3">
          <div className="text-sm text-gray-600">Loading navigation...</div>
        </div>
      </nav>
    )
  }

  return (
    <nav
      className="prismy-navbar backdrop-blur transition-all duration-500 ease-out"
      style={{
        background: 'var(--surface-panel)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        borderBottom: isScrolled ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
        boxShadow: isScrolled
          ? '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)'
          : 'none',
      }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-12 lg:h-16">
          {/* Left side: Logo + Navigation */}
          <div className="flex items-center space-x-6">
            {/* Logo - NotebookLM Style */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0"
            >
              <button
                onClick={handleLogoClick}
                className="flex items-center space-x-2 font-bold"
                style={{
                  fontSize: 'var(--sys-title-large-size)',
                  lineHeight: 'var(--sys-title-large-line-height)',
                  fontFamily: 'var(--sys-title-large-font)',
                  fontWeight: 'var(--sys-title-large-weight)',
                  color: 'var(--notebooklm-primary)',
                }}
              >
                <img
                  src="/icons/logo.svg"
                  alt="Prismy Logo"
                  className="w-8 h-8"
                  style={{
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.opacity = '0.8'
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.opacity = '1'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                />
                <span>Prismy</span>
              </button>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:space-x-4">
              {/* Product Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('product')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  className="flex items-center px-3 py-2 transition-all duration-200 hover:font-bold"
                  style={{
                    fontSize: 'var(--sys-label-large-size)',
                    lineHeight: 'var(--sys-label-large-line-height)',
                    fontFamily: 'var(--sys-label-large-font)',
                    fontWeight: 'var(--sys-label-large-weight)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--shape-corner-small)',
                  }}
                >
                  {currentContent.navigation.product.title}
                  <ChevronDown className="ml-1 w-4 h-4" />
                </button>

                <AnimatePresence>
                  {activeDropdown === 'product' && (
                    <motion.div
                      initial={
                        isHydrated
                          ? { opacity: 0, y: 10, scale: 0.95 }
                          : { opacity: 1, y: 0, scale: 1 }
                      }
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={
                        isHydrated
                          ? { opacity: 0, y: 10, scale: 0.95 }
                          : { opacity: 1, y: 0, scale: 1 }
                      }
                      transition={
                        isHydrated ? { duration: 0.2 } : { duration: 0 }
                      }
                      className="absolute top-full left-0 mt-2 w-80 p-6"
                      style={{
                        background: 'rgba(251, 250, 249, 0.98)',
                        backdropFilter: 'blur(32px) saturate(240%) !important',
                        WebkitBackdropFilter:
                          'blur(32px) saturate(240%) !important',
                        borderRadius:
                          'var(--mat-card-elevated-container-shape)',
                        boxShadow: 'var(--elevation-level-2)',
                        border: '1px solid var(--surface-outline)',
                      }}
                    >
                      <div className="space-y-4">
                        {currentContent.navigation.product.items.map(item => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-start p-3 transition-colors duration-200 group "
                            style={{
                              borderRadius: 'var(--shape-corner-small)',
                            }}
                          >
                            <div
                              className="w-10 h-10 flex items-center justify-center mr-3 group-hover:opacity-80 transition-colors duration-200"
                              style={{
                                backgroundColor:
                                  'var(--notebooklm-primary-light)',
                                borderRadius: 'var(--shape-corner-small)',
                              }}
                            >
                              <item.icon
                                className="w-5 h-5"
                                style={{ color: 'var(--notebooklm-primary)' }}
                              />
                            </div>
                            <div>
                              <div
                                className="mb-1"
                                style={{
                                  fontSize: 'var(--sys-label-large-size)',
                                  lineHeight:
                                    'var(--sys-label-large-line-height)',
                                  fontFamily: 'var(--sys-label-large-font)',
                                  fontWeight: 'var(--sys-label-large-weight)',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {item.name}
                              </div>
                              <div
                                style={{
                                  fontSize: 'var(--sys-body-small-size)',
                                  lineHeight:
                                    'var(--sys-body-small-line-height)',
                                  fontFamily: 'var(--sys-body-small-font)',
                                  fontWeight: 'var(--sys-body-small-weight)',
                                  color: 'var(--text-secondary)',
                                }}
                              >
                                {item.description}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Solutions Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('solutions')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  className="flex items-center px-3 py-2 transition-all duration-200 hover:font-bold"
                  style={{
                    fontSize: 'var(--sys-label-large-size)',
                    lineHeight: 'var(--sys-label-large-line-height)',
                    fontFamily: 'var(--sys-label-large-font)',
                    fontWeight: 'var(--sys-label-large-weight)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--shape-corner-small)',
                  }}
                >
                  {currentContent.navigation.solutions.title}
                  <ChevronDown className="ml-1 w-4 h-4" />
                </button>

                <AnimatePresence>
                  {activeDropdown === 'solutions' && (
                    <motion.div
                      initial={
                        isHydrated
                          ? { opacity: 0, y: 10, scale: 0.95 }
                          : { opacity: 1, y: 0, scale: 1 }
                      }
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={
                        isHydrated
                          ? { opacity: 0, y: 10, scale: 0.95 }
                          : { opacity: 1, y: 0, scale: 1 }
                      }
                      transition={
                        isHydrated ? { duration: 0.2 } : { duration: 0 }
                      }
                      className="absolute top-full left-0 mt-2 w-80 p-6"
                      style={{
                        background: 'rgba(251, 250, 249, 0.98)',
                        backdropFilter: 'blur(32px) saturate(240%) !important',
                        WebkitBackdropFilter:
                          'blur(32px) saturate(240%) !important',
                        borderRadius:
                          'var(--mat-card-elevated-container-shape)',
                        boxShadow: 'var(--elevation-level-2)',
                        border: '1px solid var(--surface-outline)',
                      }}
                    >
                      <div className="space-y-4">
                        {currentContent.navigation.solutions.items.map(item => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-start p-3 transition-colors duration-200 group "
                            style={{
                              borderRadius: 'var(--shape-corner-small)',
                            }}
                          >
                            <div
                              className="w-10 h-10 flex items-center justify-center mr-3 group-hover:opacity-80 transition-colors duration-200"
                              style={{
                                backgroundColor:
                                  'var(--notebooklm-primary-light)',
                                borderRadius: 'var(--shape-corner-small)',
                              }}
                            >
                              <item.icon
                                className="w-5 h-5"
                                style={{ color: 'var(--notebooklm-primary)' }}
                              />
                            </div>
                            <div>
                              <div
                                className="mb-1"
                                style={{
                                  fontSize: 'var(--sys-label-large-size)',
                                  lineHeight:
                                    'var(--sys-label-large-line-height)',
                                  fontFamily: 'var(--sys-label-large-font)',
                                  fontWeight: 'var(--sys-label-large-weight)',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {item.name}
                              </div>
                              <div
                                style={{
                                  fontSize: 'var(--sys-body-small-size)',
                                  lineHeight:
                                    'var(--sys-body-small-line-height)',
                                  fontFamily: 'var(--sys-body-small-font)',
                                  fontWeight: 'var(--sys-body-small-weight)',
                                  color: 'var(--text-secondary)',
                                }}
                              >
                                {item.description}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Resources Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('resources')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  className="flex items-center px-3 py-2 transition-all duration-200 hover:font-bold"
                  style={{
                    fontSize: 'var(--sys-label-large-size)',
                    lineHeight: 'var(--sys-label-large-line-height)',
                    fontFamily: 'var(--sys-label-large-font)',
                    fontWeight: 'var(--sys-label-large-weight)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--shape-corner-small)',
                  }}
                >
                  {currentContent.navigation.resources.title}
                  <ChevronDown className="ml-1 w-4 h-4" />
                </button>

                <AnimatePresence>
                  {activeDropdown === 'resources' && (
                    <motion.div
                      initial={
                        isHydrated
                          ? { opacity: 0, y: 10, scale: 0.95 }
                          : { opacity: 1, y: 0, scale: 1 }
                      }
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={
                        isHydrated
                          ? { opacity: 0, y: 10, scale: 0.95 }
                          : { opacity: 1, y: 0, scale: 1 }
                      }
                      transition={
                        isHydrated ? { duration: 0.2 } : { duration: 0 }
                      }
                      className="absolute top-full left-0 mt-2 w-80 p-6"
                      style={{
                        background: 'rgba(251, 250, 249, 0.98)',
                        backdropFilter: 'blur(32px) saturate(240%) !important',
                        WebkitBackdropFilter:
                          'blur(32px) saturate(240%) !important',
                        borderRadius:
                          'var(--mat-card-elevated-container-shape)',
                        boxShadow: 'var(--elevation-level-2)',
                        border: '1px solid var(--surface-outline)',
                      }}
                    >
                      <div className="space-y-4">
                        {currentContent.navigation.resources.items.map(item => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-start p-3 transition-colors duration-200 group "
                            style={{
                              borderRadius: 'var(--shape-corner-small)',
                            }}
                          >
                            <div
                              className="w-10 h-10 flex items-center justify-center mr-3 group-hover:opacity-80 transition-colors duration-200"
                              style={{
                                backgroundColor:
                                  'var(--notebooklm-primary-light)',
                                borderRadius: 'var(--shape-corner-small)',
                              }}
                            >
                              <item.icon
                                className="w-5 h-5"
                                style={{ color: 'var(--notebooklm-primary)' }}
                              />
                            </div>
                            <div>
                              <div
                                className="mb-1"
                                style={{
                                  fontSize: 'var(--sys-label-large-size)',
                                  lineHeight:
                                    'var(--sys-label-large-line-height)',
                                  fontFamily: 'var(--sys-label-large-font)',
                                  fontWeight: 'var(--sys-label-large-weight)',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {item.name}
                              </div>
                              <div
                                style={{
                                  fontSize: 'var(--sys-body-small-size)',
                                  lineHeight:
                                    'var(--sys-body-small-line-height)',
                                  fontFamily: 'var(--sys-body-small-font)',
                                  fontWeight: 'var(--sys-body-small-weight)',
                                  color: 'var(--text-secondary)',
                                }}
                              >
                                {item.description}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Pricing Link - NotebookLM Style */}
              <Link
                href={currentContent.navigation.pricing.href}
                className="px-3 py-2 transition-all duration-200 hover:font-bold"
                style={{
                  fontSize: 'var(--sys-label-large-size)',
                  lineHeight: 'var(--sys-label-large-line-height)',
                  fontFamily: 'var(--sys-label-large-font)',
                  fontWeight: 'var(--sys-label-large-weight)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--shape-corner-small)',
                }}
              >
                {currentContent.navigation.pricing.name}
              </Link>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="ml-auto flex items-center space-x-4">
            {/* Language Selector - NotebookLM Style */}
            <div className="relative">
              <button
                onClick={() => setLanguage(safeLanguage === 'vi' ? 'en' : 'vi')}
                className="flex items-center px-3 py-2  transition-all duration-200"
                style={{
                  fontSize: 'var(--sys-label-large-size)',
                  lineHeight: 'var(--sys-label-large-line-height)',
                  fontFamily: 'var(--sys-label-large-font)',
                  fontWeight: 'var(--sys-label-large-weight)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--shape-corner-small)',
                }}
              >
                <Globe className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">
                  {currentContent.languages[safeLanguage]}
                </span>
              </button>
            </div>

            {/* Auth Actions */}
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-3">
                    <CreditHUD />
                    <UnifiedUserMenu variant="simple" />
                  </div>
                ) : (
                  <div className="hidden lg:flex items-center space-x-3">
                    <button
                      onClick={handleSignIn}
                      className="px-4 py-2 transition-colors duration-200 "
                      style={{
                        fontSize: 'var(--sys-label-large-size)',
                        lineHeight: 'var(--sys-label-large-line-height)',
                        fontFamily: 'var(--sys-label-large-font)',
                        fontWeight: 'var(--sys-label-large-weight)',
                        color: 'var(--text-primary)',
                        borderRadius: 'var(--shape-corner-small)',
                      }}
                    >
                      {currentContent.signin}
                    </button>
                    <UnifiedGetStartedButton
                      className="navbar-cta-outline transition-all duration-200"
                      style={{
                        fontSize: 'var(--sys-label-large-size)',
                        lineHeight: 'var(--sys-label-large-line-height)',
                        fontFamily: 'var(--sys-label-large-font)',
                        fontWeight: 'var(--sys-label-large-weight)',
                        color: 'var(--notebooklm-primary)',
                        backgroundColor: 'transparent',
                        border: '2px solid var(--notebooklm-primary)',
                        borderRadius: 'var(--shape-corner-full)',
                        padding: '0.5rem 1.5rem',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.fontWeight = '700'
                        e.currentTarget.style.color = '#000000'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.fontWeight = 'var(--sys-label-large-weight)'
                        e.currentTarget.style.color = 'var(--notebooklm-primary)'
                      }}
                    >
                      {currentContent.getStarted}
                    </UnifiedGetStartedButton>
                  </div>
                )}
              </>
            )}

            {/* Mobile Menu Button - NotebookLM Style */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 transition-colors duration-200"
              style={{
                borderRadius: 'var(--shape-corner-small)',
                color: 'var(--text-primary)',
              }}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={
              isHydrated
                ? { opacity: 0, height: 0 }
                : { opacity: 1, height: 'auto' }
            }
            animate={{ opacity: 1, height: 'auto' }}
            exit={
              isHydrated
                ? { opacity: 0, height: 0 }
                : { opacity: 1, height: 'auto' }
            }
            transition={isHydrated ? { duration: 0.3 } : { duration: 0 }}
            className="lg:hidden shadow-lg backdrop-blur backdrop-blur-lg"
            style={{
              background: 'rgba(251, 250, 249, 0.9)',
              backdropFilter: 'blur(20px) saturate(200%)',
              WebkitBackdropFilter: 'blur(20px) saturate(200%)',
              boxShadow: 'var(--elevation-level-2)',
            }}
          >
            <div className="px-4 py-6 space-y-6">
              {/* Mobile Navigation Links */}
              <div className="space-y-4">
                {Object.entries(currentContent.navigation).map(
                  ([key, section]) => {
                    if (key === 'pricing') {
                      return (
                        <Link
                          key={key}
                          href={(section as any).href}
                          className="block px-4 py-3 text-lg font-semibold text-gray-900  rounded-lg transition-colors duration-200"
                        >
                          {(section as any).name}
                        </Link>
                      )
                    }

                    return (
                      <div key={key} className="space-y-2">
                        <div className="px-4 py-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                          {(section as any).title}
                        </div>
                        {(section as any).items.map((item: any) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center px-4 py-3 text-gray-900  rounded-lg transition-colors duration-200"
                          >
                            <item.icon className="w-5 h-5 mr-3 text-gray-600" />
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-gray-600">
                                {item.description}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )
                  }
                )}
              </div>

              {/* Mobile Auth Actions - NotebookLM Style */}
              {!user && (
                <div className="pt-6 space-y-3">
                  <button
                    onClick={handleSignIn}
                    className="w-full px-4 py-3 text-center border  transition-colors duration-200"
                    style={{
                      fontSize: 'var(--sys-label-large-size)',
                      lineHeight: 'var(--sys-label-large-line-height)',
                      fontFamily: 'var(--sys-label-large-font)',
                      fontWeight: 'var(--sys-label-large-weight)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--surface-outline)',
                      borderRadius:
                        'var(--mat-button-outlined-container-shape)',
                    }}
                  >
                    {currentContent.signin}
                  </button>
                  <UnifiedGetStartedButton
                    className="w-full navbar-cta-outline transition-colors duration-200"
                    style={{
                      fontSize: 'var(--sys-label-large-size)',
                      lineHeight: 'var(--sys-label-large-line-height)',
                      fontFamily: 'var(--sys-label-large-font)',
                      fontWeight: 'var(--sys-label-large-weight)',
                      color: 'var(--notebooklm-primary)',
                      backgroundColor: 'transparent',
                      border: '2px solid var(--notebooklm-primary)',
                      borderRadius: 'var(--shape-corner-full)',
                      padding: '0.75rem 1rem',
                      textAlign: 'center',
                    }}
                  >
                    {currentContent.getStarted}
                  </UnifiedGetStartedButton>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
