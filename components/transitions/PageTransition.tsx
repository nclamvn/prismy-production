'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { notebookLMPageTransition, motionSafe } from '@/lib/motion'
import { ReactNode, useEffect, useState } from 'react'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export default function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Small delay to ensure proper SSR hydration
    const timer = setTimeout(() => setIsReady(true), 50)
    return () => clearTimeout(timer)
  }, [])

  if (!isReady) {
    return <div className={className}>{children}</div>
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={motionSafe(notebookLMPageTransition)}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={className}
        style={{
          minHeight: '100vh'
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Loading transition for async content
export function LoadingTransition({ isLoading, children }: { isLoading: boolean; children: ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      {!isLoading ? (
        <motion.div
          key="content"
          variants={motionSafe(notebookLMPageTransition)}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {children}
        </motion.div>
      ) : (
        <motion.div
          key="loading"
          variants={motionSafe({
            hidden: { opacity: 0 },
            visible: { opacity: 1 },
            exit: { opacity: 0 }
          })}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="flex items-center justify-center min-h-64"
        >
          <div 
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{
              borderColor: 'var(--notebooklm-primary)',
              borderTopColor: 'transparent'
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Modal/Dialog transition
export function ModalTransition({ 
  isOpen, 
  children, 
  onClose 
}: { 
  isOpen: boolean; 
  children: ReactNode; 
  onClose?: () => void 
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={motionSafe({
                hidden: {
                  opacity: 0,
                  scale: 0.95,
                  y: 20
                },
                visible: {
                  opacity: 1,
                  scale: 1,
                  y: 0
                },
                exit: {
                  opacity: 0,
                  scale: 0.95,
                  y: 20
                }
              })}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                backgroundColor: 'var(--surface-elevated)',
                borderRadius: 'var(--mat-card-elevated-container-shape)',
                boxShadow: 'var(--elevation-level-4)',
                border: '1px solid var(--surface-outline)',
                maxHeight: 'calc(100vh - 2rem)',
                overflow: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}