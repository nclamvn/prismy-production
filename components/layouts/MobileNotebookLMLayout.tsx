'use client'

import React from 'react'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import { motion, AnimatePresence } from 'framer-motion'

interface MobileNotebookLMLayoutProps {
  activePanel: 'sources' | 'translate' | 'export'
  sourcesPanel?: React.ReactNode
  translatePanel?: React.ReactNode
  exportPanel?: React.ReactNode
}

/**
 * MOBILE-OPTIMIZED NOTEBOOKLM LAYOUT
 * Full-screen panel switching for mobile devices
 */
export default function MobileNotebookLMLayout({
  activePanel,
  sourcesPanel,
  translatePanel,
  exportPanel,
}: MobileNotebookLMLayoutProps) {
  const { language } = useSSRSafeLanguage()

  const panels = {
    sources: {
      content: sourcesPanel,
      title: language === 'vi' ? 'Nguồn' : 'Sources',
    },
    translate: {
      content: translatePanel,
      title: language === 'vi' ? 'Dịch Thuật' : 'Translate',
    },
    export: {
      content: exportPanel,
      title: language === 'vi' ? 'Xuất' : 'Export',
    },
  }

  return (
    <div className="h-full w-full relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={activePanel}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="h-full w-full absolute inset-0"
        >
          {panels[activePanel]?.content || (
            <div className="h-full flex items-center justify-center text-gray-500">
              <p>{panels[activePanel]?.title}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
