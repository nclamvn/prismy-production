'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { slideDown, motionSafe } from '@/lib/motion'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useUnifiedAuthContext } from '@/contexts/UnifiedAuthProvider'
import { useSmartNavigation } from '@/hooks/useSmartNavigation'
import UserMenu from './auth/UserMenu'
import UniversalDropdown from './ui/UniversalDropdown'
import UnifiedGetStartedButton from './ui/UnifiedGetStartedButton'
import { Globe, ChevronDown } from 'lucide-react'

interface NavbarProps {
  // Language props are now managed globally
}

export default function Navbar({}: NavbarProps) {
  const { language, setLanguage } = useLanguage()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, loading } = useAuth()
  const { handleSignIn } = useUnifiedAuthContext()
  const { handleLogoClick: smartLogoClick, isAuthenticated } =
    useSmartNavigation()
  const router = useRouter()
  const pathname = usePathname()

  // Handle logo click with smart navigation
  const handleLogoClick = (e: React.MouseEvent) => {
    console.log('🔷 Navbar: Logo clicked', {
      eventType: e.type,
      target: e.target,
      currentTarget: e.currentTarget,
      currentPath: pathname,
      isAuthenticated,
      button: e.button,
      clientX: e.clientX,
      clientY: e.clientY,
    })
    e.preventDefault()
    e.stopPropagation()
    console.log('🔷 Navbar: About to call smartLogoClick...')
    smartLogoClick(e)
    console.log('🔷 Navbar: smartLogoClick called')
  }

  // Scroll detection for desktop header styling only
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Clean navigation - logo handles homepage, no redundant tab
  const getNavigation = () => {
    return {
      vi: [
        { name: 'Tính năng', href: '/features' },
        { name: 'Tài liệu', href: '/documents' },
        { name: 'Giá cả', href: '/pricing' },
        { name: 'Doanh nghiệp', href: '/enterprise' },
        { name: 'Blog', href: '/blog' },
      ],
      en: [
        { name: 'Features', href: '/features' },
        { name: 'Documents', href: '/documents' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'Enterprise', href: '/enterprise' },
        { name: 'Blog', href: '/blog' },
      ],
    }
  }

  const content = {
    vi: {
      navigation: getNavigation().vi,
      signin: 'Đăng nhập',
      getStarted: 'Bắt đầu',
      languages: {
        vi: 'Tiếng Việt',
        en: 'English',
      },
    },
    en: {
      navigation: getNavigation().en,
      signin: 'Sign In',
      getStarted: 'Get Started',
      languages: {
        vi: 'Tiếng Việt',
        en: 'English',
      },
    },
  }

  // Desktop-only header style switching
  const shouldUseDesktopPill = isScrolled && !isMenuOpen

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      variants={motionSafe(slideDown)}
      initial="hidden"
      animate="visible"
    >
      {/* Mobile Navbar - Stable and Simple */}
      <div
        className="md:hidden w-full backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <nav className="w-full px-4 py-2" aria-label="Mobile navigation">
          <div className="flex items-center justify-between">
            {/* Mobile Logo */}
            <button
              onClick={handleLogoClick}
              className="flex items-center focus-visible-ring rounded-md"
              aria-label={isAuthenticated ? 'Go to workspace' : 'Prismy home'}
            >
              <img src="/logo.svg" alt="Prismy" className="h-8 w-auto mr-2" />
              <span className="heading-4 font-bold">Prismy</span>
            </button>

            {/* Mobile menu button */}
            <button
              type="button"
              className="relative p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle navigation menu"
            >
              {/* Circle background */}
              <div
                className="absolute inset-0 rounded-full bg-gray-100 
                            scale-[1.0] transition-all duration-200
                            hover:bg-gray-200"
              />

              {/* Icon */}
              <svg
                className="relative w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </nav>
      </div>

      {/* Desktop Navbar - Dynamic Styling */}
      <div className="hidden md:block w-full">
        <div
          className={`transition-all duration-300 backdrop-blur-md ${
            shouldUseDesktopPill ? 'mx-8 mt-4 rounded-full shadow-sm' : ''
          }`}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <nav className="w-full" aria-label="Desktop navigation">
            <div
              className={`${shouldUseDesktopPill ? 'px-8' : 'px-4 sm:px-6 lg:px-8'}`}
            >
              <div
                className={`flex items-center ${shouldUseDesktopPill ? 'h-10' : 'h-12'}`}
              >
                {/* Desktop Logo */}
                <button
                  onClick={handleLogoClick}
                  className="flex items-center focus-visible-ring rounded-md mr-5"
                  aria-label={
                    isAuthenticated ? 'Go to workspace' : 'Prismy home'
                  }
                >
                  <img
                    src="/logo.svg"
                    alt="Prismy"
                    className="h-8 w-auto mr-2"
                  />
                  <span className="heading-4 font-bold">Prismy</span>
                </button>

                {/* Desktop Navigation */}
                <div className="flex items-center space-x-5 flex-1">
                  {content[language].navigation.map(item => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="body-sm font-medium hover:font-bold text-gray-600 hover:text-gray-900 
                               transition-all duration-200 focus-visible-ring 
                               rounded-md px-2 py-1"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>

                {/* Desktop Right Section: Language Toggle + Auth */}
                <div className="flex items-center space-x-2.5">
                  {/* Language Selector */}
                  <UniversalDropdown
                    value={language}
                    onChange={value => setLanguage(value as 'vi' | 'en')}
                    size="sm"
                    options={[
                      {
                        value: 'vi',
                        label: content[language].languages.vi,
                        icon: <Globe size={14} strokeWidth={1.5} />,
                      },
                      {
                        value: 'en',
                        label: content[language].languages.en,
                        icon: <Globe size={14} strokeWidth={1.5} />,
                      },
                    ]}
                    className="min-w-[100px] sm:min-w-[120px]"
                  />

                  {!loading &&
                    (user ? (
                      <UserMenu />
                    ) : (
                      <>
                        <button
                          onClick={() => handleSignIn()}
                          className={`btn-ghost ${shouldUseDesktopPill ? 'h-8 px-3 text-xs' : 'btn-pill-compact-md'} font-normal hover:font-semibold`}
                        >
                          {content[language].signin}
                        </button>
                        <UnifiedGetStartedButton
                          variant="primary"
                          size={shouldUseDesktopPill ? 'sm' : 'compact-md'}
                          redirectTo="/workspace"
                        />
                      </>
                    ))}
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile menu - Separate and Stable */}
      {isMenuOpen && (
        <div className="md:hidden w-full bg-white">
          <motion.div
            id="mobile-menu"
            className="px-4 py-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-3">
              {content[language].navigation.map(item => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block py-2 body-sm font-medium hover:font-bold text-gray-600 hover:text-gray-900 focus-visible-ring rounded-md transition-all duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Language Selector */}
              <div className="py-2 border-t border-gray-100 mt-4">
                <div className="space-y-2">
                  <button
                    onClick={() => setLanguage('vi')}
                    className={`w-full text-left px-4 py-3 text-sm transition-all duration-300 cubic-bezier(0.25, 0.46, 0.45, 0.94)
                             hover:bg-gray-50 hover:font-semibold hover:-translate-y-px
                             ${language === 'vi' ? 'font-semibold text-gray-900 bg-gray-50' : 'text-gray-600 bg-white'}`}
                    style={{ borderRadius: 'var(--radius-md)' }}
                  >
                    {content[language].languages.vi}
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`w-full text-left px-4 py-3 text-sm transition-all duration-300 cubic-bezier(0.25, 0.46, 0.45, 0.94)
                             hover:bg-gray-50 hover:font-semibold hover:-translate-y-px
                             ${language === 'en' ? 'font-semibold text-gray-900 bg-gray-50' : 'text-gray-600 bg-white'}`}
                    style={{ borderRadius: 'var(--radius-md)' }}
                  >
                    {content[language].languages.en}
                  </button>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                {!loading &&
                  (user ? (
                    <div className="flex items-center justify-center py-4">
                      <UserMenu />
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          handleSignIn()
                          setIsMenuOpen(false)
                        }}
                        className="block btn-ghost btn-signin-enhanced w-full text-center font-normal hover:font-semibold h-8 px-3 text-xs"
                      >
                        {content[language].signin}
                      </button>
                      <UnifiedGetStartedButton
                        variant="primary"
                        size="sm"
                        className="block w-full text-center"
                        redirectTo="/workspace"
                        onClick={() => setIsMenuOpen(false)}
                      />
                    </>
                  ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.header>
  )
}
