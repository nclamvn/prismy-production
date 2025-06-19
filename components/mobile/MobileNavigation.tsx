'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMobile } from '@/hooks/useMobile'
import { useTouch } from '@/hooks/useTouch'
import { motionSafe, slideUp, fadeIn } from '@/lib/motion'

interface NavigationItem {
  id: string
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
  external?: boolean
}

interface MobileNavigationProps {
  items: NavigationItem[]
  activeItem?: string
  language?: 'vi' | 'en'
  onItemSelect?: (item: NavigationItem) => void
  showLabels?: boolean
  className?: string
}

export default function MobileNavigation({
  items,
  activeItem,
  language = 'en',
  onItemSelect,
  showLabels = true,
  className = ''
}: MobileNavigationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const { isMobile, orientation } = useMobile()

  const content = {
    vi: {
      menu: 'Menu',
      navigation: 'Điều hướng',
      home: 'Trang chủ',
      back: 'Quay lại',
      close: 'Đóng'
    },
    en: {
      menu: 'Menu',
      navigation: 'Navigation',
      home: 'Home',
      back: 'Back',
      close: 'Close'
    }
  }

  // Auto-hide navigation on scroll
  useEffect(() => {
    if (!isMobile) return

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide nav
        setIsVisible(false)
      } else {
        // Scrolling up - show nav
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY, isMobile])

  // Touch gestures for navigation
  const { touchHandlers } = useTouch({
    onSwipe: (gesture) => {
      if (gesture.direction === 'up' && gesture.distance > 50) {
        setIsVisible(false)
      } else if (gesture.direction === 'down' && gesture.distance > 50) {
        setIsVisible(true)
      }
    }
  })

  const handleItemClick = (item: NavigationItem, e: React.MouseEvent) => {
    e.preventDefault()
    
    onItemSelect?.(item)
    
    if (item.external) {
      window.open(item.href, '_blank')
    } else {
      // Handle internal navigation
      window.location.href = item.href
    }
  }

  if (!isMobile) {
    return null
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 ${className}`}
          variants={motionSafe({
            hidden: { y: 100 },
            visible: { y: 0 }
          })}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          {...touchHandlers}
        >
          {/* Safe area padding for devices with home indicators */}
          <div className="pb-safe">
            <div className="flex items-center justify-around px-2 py-1">
              {items.map((item, index) => (
                <motion.button
                  key={item.id}
                  onClick={(e) => handleItemClick(item, e)}
                  className={`flex flex-col items-center justify-center p-2 min-w-0 flex-1 relative ${
                    activeItem === item.id
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  variants={motionSafe({
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  })}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Icon */}
                  <div className={`transition-colors ${
                    activeItem === item.id ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {item.icon}
                  </div>

                  {/* Label */}
                  {showLabels && (
                    <span className={`text-xs mt-1 transition-colors truncate max-w-full ${
                      activeItem === item.id ? 'text-blue-600 font-medium' : 'text-gray-600'
                    }`}>
                      {item.label}
                    </span>
                  )}

                  {/* Badge */}
                  {item.badge && item.badge > 0 && (
                    <motion.div
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </motion.div>
                  )}

                  {/* Active indicator */}
                  {activeItem === item.id && (
                    <motion.div
                      className="absolute top-0 left-1/2 w-1 h-1 bg-blue-600 rounded-full"
                      layoutId="activeIndicator"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  )
}

// Mobile menu overlay component
interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  language?: 'vi' | 'en'
}

export function MobileMenu({ isOpen, onClose, children, language = 'en' }: MobileMenuProps) {
  const { touchHandlers } = useTouch({
    onSwipe: (gesture) => {
      if (gesture.direction === 'right' && gesture.distance > 100) {
        onClose()
      }
    }
  })

  const content = {
    vi: {
      close: 'Đóng menu',
      menu: 'Menu'
    },
    en: {
      close: 'Close menu',
      menu: 'Menu'
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Menu */}
          <motion.div
            className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white z-50 shadow-xl"
            variants={motionSafe({
              hidden: { x: '-100%' },
              visible: { x: 0 }
            })}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            {...touchHandlers}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="heading-4 text-gray-900">{content[language].menu}</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={content[language].close}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Floating Action Button for mobile
interface FloatingActionButtonProps {
  onClick: () => void
  icon: React.ReactNode
  label?: string
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

export function FloatingActionButton({
  onClick,
  icon,
  label,
  className = '',
  position = 'bottom-right'
}: FloatingActionButtonProps) {
  const { isMobile } = useMobile()

  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  }

  if (!isMobile) {
    return null
  }

  return (
    <motion.button
      onClick={onClick}
      className={`fixed z-40 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center ${positionClasses[position]} ${className}`}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      aria-label={label}
    >
      {icon}
    </motion.button>
  )
}

// Safe area utilities for mobile devices
export function SafeAreaView({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`pt-safe pb-safe pl-safe pr-safe ${className}`}>
      {children}
    </div>
  )
}

// Custom CSS for safe areas (add to globals.css)
export const safeAreaStyles = `
  @supports (padding-top: env(safe-area-inset-top)) {
    .pt-safe {
      padding-top: env(safe-area-inset-top);
    }
    
    .pb-safe {
      padding-bottom: env(safe-area-inset-bottom);
    }
    
    .pl-safe {
      padding-left: env(safe-area-inset-left);
    }
    
    .pr-safe {
      padding-right: env(safe-area-inset-right);
    }
  }
`