'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { slideDown, motionSafe } from '@/lib/motion'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import AuthModal from './auth/AuthModal'
import UserMenu from './auth/UserMenu'
import { Globe, ChevronDown } from 'lucide-react'

interface NavbarProps {
  // Language props are now managed globally
}

export default function Navbar({}: NavbarProps) {
  const { language, setLanguage } = useLanguage()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false)
  const langDropdownRef = useRef<HTMLDivElement>(null)
  
  const { user, loading } = useAuth()
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  return (
    <motion.header 
      className="glass-header"
      variants={motionSafe(slideDown)}
      initial="hidden"
      animate="visible"
    >
      {/* Rainbow bar */}
      <div className="rainbow-bar" />
      
      <nav className="w-full" aria-label="Main navigation">
        <div className="content-container">
          <div className="flex items-center h-16">
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
                className="body-base font-bold text-gray-600 hover:text-gray-900 
                         transition-[var(--transition-base)] focus-visible-ring 
                         rounded-md px-2 py-1"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right Section: Language Toggle + Auth */}
          <div className="hidden md:flex items-center space-x-2.5">
            {/* Language Selector - Custom Dropdown */}
            {true && (
              <div className="relative" ref={langDropdownRef}>
                <button
                  onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-border-subtle rounded-md
                           text-sm font-medium text-text-primary
                           hover:font-semibold hover:transform hover:-translate-y-px
                           transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
                >
                  <Globe size={16} strokeWidth={1.5} />
                  <span>{content[language].languages[language]}</span>
                  <ChevronDown 
                    size={14} 
                    strokeWidth={1.5}
                    className={`transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                
                {/* Dropdown Menu */}
                {isLangDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white border border-border-subtle rounded-md overflow-hidden z-50"
                  >
                    <button
                      onClick={() => {
                        setLanguage('vi')
                        setIsLangDropdownOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-300
                               hover:bg-gray-50 hover:font-semibold hover:transform hover:-translate-y-px
                               ${language === 'vi' ? 'font-semibold text-text-primary bg-gray-50' : 'text-text-secondary'}`}
                    >
                      {content[language].languages.vi}
                    </button>
                    <button
                      onClick={() => {
                        setLanguage('en')
                        setIsLangDropdownOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-300
                               hover:bg-gray-50 hover:font-semibold hover:transform hover:-translate-y-px
                               ${language === 'en' ? 'font-semibold text-text-primary bg-gray-50' : 'text-text-secondary'}`}
                    >
                      {content[language].languages.en}
                    </button>
                  </motion.div>
                )}
              </div>
            )}
            
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
                    className="btn-ghost font-bold"
                  >
                    {content[language].signin}
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('signup')
                      setIsAuthModalOpen(true)
                    }}
                    className="btn-primary font-bold"
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
          <div className="content-container">
            <motion.div
              id="mobile-menu"
              className="md:hidden border-t border-gray-100 pt-4 pb-6"
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
                  className="block py-2 body-base font-bold text-gray-600 hover:text-gray-900 focus-visible-ring rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Language Selector */}
              {true && (
                <div className="py-2">
                  <div className="space-y-1">
                    <button
                      onClick={() => setLanguage('vi')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-300
                               hover:bg-gray-50 hover:font-semibold
                               ${language === 'vi' ? 'font-semibold text-text-primary bg-gray-50' : 'text-text-secondary'}`}
                    >
                      <span className="flex items-center gap-2">
                        <Globe size={16} strokeWidth={1.5} />
                        {content[language].languages.vi}
                      </span>
                    </button>
                    <button
                      onClick={() => setLanguage('en')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-300
                               hover:bg-gray-50 hover:font-semibold
                               ${language === 'en' ? 'font-semibold text-text-primary bg-gray-50' : 'text-text-secondary'}`}
                    >
                      <span className="flex items-center gap-2">
                        <Globe size={16} strokeWidth={1.5} />
                        {content[language].languages.en}
                      </span>
                    </button>
                  </div>
                </div>
              )}
              
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
                        className="block btn-ghost w-full text-center font-bold"
                      >
                        {content[language].signin}
                      </button>
                      <button
                        onClick={() => {
                          setAuthMode('signup')
                          setIsAuthModalOpen(true)
                          setIsMenuOpen(false)
                        }}
                        className="block btn-primary w-full text-center font-bold"
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