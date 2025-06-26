'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Home, User, Settings, BookOpen } from 'lucide-react'
import { notebookLMDrawer, motionSafe } from '@/lib/motion'

interface SwipeableNavigationProps {
  language?: 'vi' | 'en'
}

export default function SwipeableNavigation({ language = 'en' }: SwipeableNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const constraintsRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-100, 0, 100], [0.8, 1, 0.8])

  const content = {
    vi: {
      navigation: 'Điều hướng',
      home: 'Trang chủ',
      dashboard: 'Bảng điều khiển',
      documents: 'Tài liệu',
      settings: 'Cài đặt',
      swipeHint: 'Vuốt để điều hướng'
    },
    en: {
      navigation: 'Navigation',
      home: 'Home',
      dashboard: 'Dashboard',
      documents: 'Documents',
      settings: 'Settings',
      swipeHint: 'Swipe to navigate'
    }
  }

  const navigationItems = [
    {
      href: '/',
      label: content[language].home,
      icon: Home
    },
    {
      href: '/dashboard',
      label: content[language].dashboard,
      icon: User
    },
    {
      href: '/documents',
      label: content[language].documents,
      icon: BookOpen
    },
    {
      href: '/dashboard/settings',
      label: content[language].settings,
      icon: Settings
    }
  ]

  const currentIndex = navigationItems.findIndex(item => item.href === pathname)

  const handlePanEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50
    
    if (info.offset.x > threshold && currentIndex > 0) {
      // Swipe right - go to previous page
      setDirection('right')
      router.push(navigationItems[currentIndex - 1].href)
    } else if (info.offset.x < -threshold && currentIndex < navigationItems.length - 1) {
      // Swipe left - go to next page
      setDirection('left')
      router.push(navigationItems[currentIndex + 1].href)
    }
    
    // Reset position
    x.set(0)
  }

  const toggleNavigation = () => {
    setIsOpen(!isOpen)
  }

  // Touch gesture detection
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      const startX = touch.clientX
      
      // Only trigger from edge swipes (left 20px of screen)
      if (startX < 20) {
        setIsOpen(true)
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
    }
  }, [])

  return (
    <>
      {/* Mobile Navigation Drawer */}
      <motion.div
        variants={motionSafe(notebookLMDrawer)}
        initial="hidden"
        animate={isOpen ? "visible" : "hidden"}
        className="fixed inset-y-0 left-0 z-50 w-80 md:hidden"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          borderRight: '1px solid var(--surface-outline)',
          boxShadow: 'var(--elevation-level-4)'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div 
            className="flex items-center justify-between p-6"
            style={{
              borderBottom: '1px solid var(--surface-outline)'
            }}
          >
            <h2 
              style={{
                fontSize: 'var(--sys-title-large-size)',
                lineHeight: 'var(--sys-title-large-line-height)',
                fontFamily: 'var(--sys-title-large-font)',
                fontWeight: 'var(--sys-title-large-weight)',
                color: 'var(--text-primary)'
              }}
            >
              {content[language].navigation}
            </h2>
            <button
              onClick={toggleNavigation}
              className="touch-target nav-touch-target mobile-focus"
              style={{
                color: 'var(--text-secondary)',
                borderRadius: 'var(--mat-button-text-container-shape)'
              }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navigationItems.map((item, index) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <li key={item.href}>
                    <motion.button
                      onClick={() => {
                        router.push(item.href)
                        setIsOpen(false)
                      }}
                      className="w-full flex items-center space-x-3 p-4 text-left touch-target mobile-focus transition-all"
                      style={{
                        backgroundColor: isActive ? 'var(--notebooklm-primary-light)' : 'transparent',
                        color: isActive ? 'var(--notebooklm-primary)' : 'var(--text-primary)',
                        borderRadius: 'var(--mat-card-outlined-container-shape)',
                        border: isActive ? '1px solid var(--notebooklm-primary)' : '1px solid transparent'
                      }}
                      whileHover={{
                        backgroundColor: 'var(--surface-filled)',
                        transition: { duration: 0.2 }
                      }}
                      whileTap={{
                        scale: 0.98,
                        transition: { duration: 0.1 }
                      }}
                    >
                      <Icon className="w-5 h-5" />
                      <span 
                        style={{
                          fontSize: 'var(--sys-body-large-size)',
                          lineHeight: 'var(--sys-body-large-line-height)',
                          fontFamily: 'var(--sys-body-large-font)',
                          fontWeight: isActive ? 'var(--sys-label-large-weight)' : 'var(--sys-body-large-weight)'
                        }}
                      >
                        {item.label}
                      </span>
                    </motion.button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Swipe Hint */}
          <div 
            className="p-4 text-center"
            style={{
              borderTop: '1px solid var(--surface-outline)'
            }}
          >
            <p 
              style={{
                fontSize: 'var(--sys-body-small-size)',
                lineHeight: 'var(--sys-body-small-line-height)',
                fontFamily: 'var(--sys-body-small-font)',
                fontWeight: 'var(--sys-body-small-weight)',
                color: 'var(--text-secondary)'
              }}
            >
              {content[language].swipeHint}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 md:hidden"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(2px)'
          }}
          onClick={toggleNavigation}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden mobile-safe-bottom">
        <motion.div
          ref={constraintsRef}
          className="swipe-horizontal"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            borderTop: '1px solid var(--surface-outline)',
            boxShadow: 'var(--elevation-level-2)'
          }}
        >
          <motion.div
            drag="x"
            dragConstraints={constraintsRef}
            dragElastic={0.2}
            onPanEnd={handlePanEnd}
            style={{ x, opacity }}
            className="flex items-center justify-around p-2"
          >
            {navigationItems.map((item, index) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <motion.button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className="flex flex-col items-center space-y-1 p-2 touch-target mobile-focus"
                  style={{
                    color: isActive ? 'var(--notebooklm-primary)' : 'var(--text-secondary)',
                    borderRadius: 'var(--mat-button-text-container-shape)'
                  }}
                  whileHover={{
                    scale: 1.05,
                    transition: { duration: 0.1 }
                  }}
                  whileTap={{
                    scale: 0.95,
                    transition: { duration: 0.1 }
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span 
                    style={{
                      fontSize: 'var(--sys-body-small-size)',
                      lineHeight: 'var(--sys-body-small-line-height)',
                      fontFamily: 'var(--sys-body-small-font)',
                      fontWeight: isActive ? 'var(--sys-label-medium-weight)' : 'var(--sys-body-small-weight)'
                    }}
                  >
                    {item.label}
                  </span>
                </motion.button>
              )
            })}
          </motion.div>

          {/* Swipe Indicators */}
          <div className="flex justify-center pb-2">
            {currentIndex > 0 && (
              <ChevronLeft 
                className="w-4 h-4 mx-1 animate-pulse" 
                style={{ color: 'var(--text-secondary)' }} 
              />
            )}
            <div className="flex space-x-1">
              {navigationItems.map((_, index) => (
                <div
                  key={index}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    backgroundColor: index === currentIndex 
                      ? 'var(--notebooklm-primary)' 
                      : 'var(--surface-outline)'
                  }}
                />
              ))}
            </div>
            {currentIndex < navigationItems.length - 1 && (
              <ChevronRight 
                className="w-4 h-4 mx-1 animate-pulse" 
                style={{ color: 'var(--text-secondary)' }} 
              />
            )}
          </div>
        </motion.div>
      </div>

      {/* Mobile Menu Toggle (Hamburger) */}
      <button
        onClick={toggleNavigation}
        className="fixed top-4 left-4 z-50 md:hidden touch-target nav-touch-target mobile-focus"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          borderRadius: 'var(--mat-button-filled-container-shape)',
          border: '1px solid var(--surface-outline)',
          boxShadow: 'var(--elevation-level-2)',
          color: 'var(--text-primary)'
        }}
      >
        <div className="flex flex-col space-y-1">
          <div className="w-5 h-0.5 bg-current rounded-full" />
          <div className="w-5 h-0.5 bg-current rounded-full" />
          <div className="w-5 h-0.5 bg-current rounded-full" />
        </div>
      </button>
    </>
  )
}