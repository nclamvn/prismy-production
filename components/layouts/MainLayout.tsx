'use client'

import { usePathname } from 'next/navigation'
import Footer from '@/components/Footer'
import { motion } from 'framer-motion'
import { motionSafe, fadeIn } from '@/lib/motion'

interface MainLayoutProps {
  children: React.ReactNode
  showFooter?: boolean
}

export default function MainLayout({
  children,
  showFooter = true,
}: MainLayoutProps) {
  const pathname = usePathname()

  // Check if navbar is hidden (same logic as ConditionalNavbar)
  const hiddenNavbarRoutes = ['/workspace', '/dashboard', '/admin']
  const isNavbarHidden = hiddenNavbarRoutes.some(route =>
    pathname.startsWith(route)
  )

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--surface-panel)' }}
    >
      {/* Main Content Area - Conditional padding based on navbar visibility */}
      <motion.main
        className={isNavbarHidden ? '' : 'pt-16 lg:pt-20'}
        variants={motionSafe(fadeIn)}
        initial="hidden"
        animate="visible"
        style={{
          backgroundColor: 'var(--surface-panel)',
          minHeight: isNavbarHidden ? '100vh' : 'calc(100vh - 64px)',
        }}
      >
        {children}
      </motion.main>

      {/* Footer - Optional based on page needs */}
      {showFooter && <Footer />}
    </div>
  )
}
