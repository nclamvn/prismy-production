'use client'

import Navbar from '@/components/Navbar'
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
    <div className="min-h-screen bg-bg-main flex flex-col">
      {/* Global Navbar - Always visible on public pages */}
      <Navbar />

      {/* Main Content Area */}
      <motion.main
        className="flex-1"
        variants={motionSafe(fadeIn)}
        initial="hidden"
        animate="visible"
      >
        {children}
      </motion.main>

      {/* Footer - Optional based on page needs */}
      {showFooter && <Footer />}
    </div>
  )
}
