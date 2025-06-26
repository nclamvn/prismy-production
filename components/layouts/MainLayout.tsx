'use client'

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
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface-panel)' }}>
      {/* Main Content Area - Add top padding for fixed navbar (now in RootLayout) */}
      <motion.main
        className="pt-16 lg:pt-20"
        variants={motionSafe(fadeIn)}
        initial="hidden"
        animate="visible"
        style={{ backgroundColor: 'var(--surface-panel)', minHeight: 'calc(100vh - 64px)' }}
      >
        {children}
      </motion.main>

      {/* Footer - Optional based on page needs */}
      {showFooter && <Footer />}
    </div>
  )
}
