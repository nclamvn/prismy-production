'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { slideDown, motionSafe } from '@/lib/motion'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import AuthModal from './auth/AuthModal'
import UserMenu from './auth/UserMenu'
import UniversalDropdown from './ui/UniversalDropdown'
import { Globe, ChevronDown } from 'lucide-react'

interface NavbarProps {
  // Language props are now managed globally
}

export default function Navbar({}: NavbarProps) {
  const { language, setLanguage } = useLanguage()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { user, loading } = useAuth()
  
  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Scroll detection for dynamic border
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const content = {
    vi: {
      navigation: [
        { name: 'Tính năng', href: '/features' },
        { name: 'Tài liệu', href: '/documents' },
        { name: 'Giá cả', href: '/pricing' },
        { name: 'Doanh nghiệp', href: '/enterprise' },
        { name: 'Blog', href: '/blog' },
      ],
      signin: 'Đăng nhập',
      getStarted: 'Bắt đầu',
      languages: {
        vi: 'Tiếng Việt',
        en: 'English'
      }
    },
    en: {
      navigation: [
        { name: 'Features', href: '/features' },
        { name: 'Documents', href: '/documents' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'Enterprise', href: '/enterprise' },
        { name: 'Blog', href: '/blog' },
      ],
      signin: 'Sign In',
      getStarted: 'Get Started',
      languages: {
        vi: 'Tiếng Việt',
        en: 'English'
      }
    }
  }

  // Determine header style - force static when mobile menu is open
  const shouldUseStaticHeader = !isScrolled || (isMobile && isMenuOpen)
  
  return (
    <motion.header 
      className={`transition-all duration-300 ${
        shouldUseStaticHeader ? 'header-static' : 'header-pill-capsule'
      }`}
      variants={motionSafe(slideDown)}
      initial="hidden"
      animate="visible"
    >
      
      <nav className="w-full" aria-label="Main navigation">
        <div className={`${shouldUseStaticHeader ? 'content-container' : 'px-8'}`}>
          <div className={`flex items-center ${shouldUseStaticHeader ? 'h-16' : 'h-12'}`}>
          {/* Logo - Text only */}
          <Link 
            href="/" 
            className="focus-visible-ring rounded-md mr-5"
            aria-label="Prismy home"
          >
            <span className="heading-4 font-bold">Prismy</span>
          </Link>

          {/* Desktop Navigation - Moved left close to Prismy */}
          <div className="hidden md:flex items-center space-x-5 flex-1">
            {content[language].navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="body-base font-normal hover:font-semibold text-gray-600 hover:text-gray-900 
                         transition-all duration-200 focus-visible-ring 
                         rounded-md px-2 py-1"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right Section: Language Toggle + Auth */}
          <div className="hidden md:flex items-center space-x-2.5">
            {/* Language Selector - Universal Dropdown DNA */}
            <UniversalDropdown
              value={language}
              onChange={(value) => setLanguage(value as 'vi' | 'en')}
              size="sm"
              options={[
                {
                  value: 'vi',
                  label: content[language].languages.vi,
                  icon: <Globe size={14} strokeWidth={1.5} />
                },
                {
                  value: 'en', 
                  label: content[language].languages.en,
                  icon: <Globe size={14} strokeWidth={1.5} />
                }
              ]}
              className="min-w-[100px] sm:min-w-[120px] dropdown-mobile-safe"
            />
            
            {!loading && (
              user ? (
                <UserMenu />
              ) : (
                <>
                  <button
                    onClick={() => {
                      setAuthMode('signin')
                      setIsAuthModalOpen(true)
                    }}
                    className={`btn-ghost btn-signin-enhanced ${shouldUseStaticHeader ? 'btn-pill-compact-sm w-[50px]' : 'btn-pill-compact-xs w-[42px]'} font-normal hover:font-semibold !px-2`}
                  >
                    {content[language].signin}
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('signup')
                      setIsAuthModalOpen(true)
                    }}
                    className={`btn-primary ${shouldUseStaticHeader ? 'btn-pill-compact-sm w-[50px]' : 'btn-pill-compact-xs w-[42px]'} font-semibold !px-2`}
                  >
                    {content[language].getStarted}
                  </button>
                </>
              )
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden btn-ghost p-2 ml-auto"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <motion.div
              id="mobile-menu"
              className="md:hidden border-t border-gray-100 pt-4 pb-8 mb-4 z-[50] mobile-nav-zen"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-3">
              {content[language].navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block py-2 body-base font-normal hover:font-semibold text-gray-600 hover:text-gray-900 focus-visible-ring rounded-md transition-all duration-200"
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
                             hover:bg-gray-50 hover:font-semibold hover:-translate-y-px border border-border-subtle
                             ${language === 'vi' ? 'font-semibold text-gray-900 bg-gray-50 border-gray-300' : 'text-gray-600 bg-white'}`}
                    style={{ borderRadius: 'var(--radius-md)' }}
                  >
                    {content[language].languages.vi}
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`w-full text-left px-4 py-3 text-sm transition-all duration-300 cubic-bezier(0.25, 0.46, 0.45, 0.94)
                             hover:bg-gray-50 hover:font-semibold hover:-translate-y-px border border-border-subtle
                             ${language === 'en' ? 'font-semibold text-gray-900 bg-gray-50 border-gray-300' : 'text-gray-600 bg-white'}`}
                    style={{ borderRadius: 'var(--radius-md)' }}
                  >
                    {content[language].languages.en}
                  </button>
                </div>
              </div>
              
              <div className="pt-4 space-y-3">
                {!loading && (
                  user ? (
                    <div className="flex items-center justify-center py-4">
                      <UserMenu />
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setAuthMode('signin')
                          setIsAuthModalOpen(true)
                          setIsMenuOpen(false)
                        }}
                        className="block btn-ghost btn-signin-enhanced w-full text-center font-normal hover:font-semibold !px-2"
                      >
                        {content[language].signin}
                      </button>
                      <button
                        onClick={() => {
                          setAuthMode('signup')
                          setIsAuthModalOpen(true)
                          setIsMenuOpen(false)
                        }}
                        className="block btn-primary w-full text-center font-semibold !px-2"
                      >
                        {content[language].getStarted}
                      </button>
                    </>
                  )
                )}
              </div>
            </div>
            </motion.div>
          </div>
        )}
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
        language={language}
      />
    </motion.header>
  )
}