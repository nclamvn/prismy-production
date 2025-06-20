'use client'

import { motion } from 'framer-motion'

interface HeroProps {
  language?: 'vi' | 'en'
}

export default function Hero({ language = 'en' }: HeroProps) {
  const content = {
    vi: {
      title: 'Dịch thuật',
      subtitle: 'Không giới hạn',
      description: 'Trí tuệ nhân tạo tiên tiến, dịch thuật tức thì với độ chính xác tuyệt đối.',
      action: 'Bắt đầu',
    },
    en: {
      title: 'Translation',
      subtitle: 'Without limits',
      description: 'Advanced AI that translates instantly with absolute precision.',
      action: 'Begin',
    }
  }

  // Zen breathing animation variants
  const breatheVariants = {
    hidden: { 
      opacity: 0, 
      y: 8,
      scale: 0.98
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
        staggerChildren: 0.2
      }
    }
  }

  const whisperVariants = {
    hidden: { 
      opacity: 0, 
      y: 4 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
      }
    }
  }

  return (
    <section className="zen-container">
      <div className="content-zen space-zen text-center">
        <motion.div
          variants={breatheVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Zen Title - Monumental Minimalism */}
          <motion.h1 
            variants={whisperVariants}
            className="heading-1 vietnamese-text mb-4"
          >
            {content[language].title}
          </motion.h1>

          {/* Subtle Subtitle */}
          <motion.h2 
            variants={whisperVariants}
            className="heading-2 text-mono-medium mb-12"
          >
            {content[language].subtitle}
          </motion.h2>

          {/* Minimal Description */}
          <motion.p 
            variants={whisperVariants}
            className="text-body-lg text-mono-medium mb-16 max-w-md mx-auto"
          >
            {content[language].description}
          </motion.p>

          {/* Single Action - Breath-Level Presence */}
          <motion.div 
            variants={whisperVariants}
            className="mb-20"
          >
            <button 
              className="btn btn-primary hover-whisper focus-breath px-12 py-4 text-base"
              onClick={() => {
                const workbench = document.querySelector('#workbench')
                workbench?.scrollIntoView({ behavior: 'smooth' })
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {content[language].action}
            </button>
          </motion.div>

          {/* Invisible Intelligence Indicator */}
          <motion.div 
            variants={whisperVariants}
            className="text-caption text-mono-light"
          >
            AI Ready
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}