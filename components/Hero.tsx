'use client'

import { motion } from 'framer-motion'
import { slideUp, staggerContainer, motionSafe } from '@/lib/motion'

interface HeroProps {
  language?: 'vi' | 'en'
}

export default function Hero({ language = 'en' }: HeroProps) {
  const content = {
    vi: {
      badge: 'Độ chính xác 99.9% cho hơn 150 ngôn ngữ',
      title: 'Dịch thuật AI',
      subtitle: 'Xây dựng cho Tương lai',
      description: 'Trải nghiệm nền tảng dịch thuật AI tiên tiến nhất thế giới. Dịch văn bản và tài liệu ngay lập tức với độ chính xác hoàn hảo và hiểu biết văn hóa.',
      startButton: 'Bắt đầu dịch',
      watchDemo: 'Xem demo',
      stats: {
        daily: 'Lượt dịch hàng ngày',
        languages: 'Ngôn ngữ hỗ trợ',
        accuracy: 'Tỷ lệ chính xác'
      }
    },
    en: {
      badge: '99.9% accuracy across 150+ languages',
      title: 'AI-Powered Translation',
      subtitle: 'Built for the Future',
      description: 'Experience the world\'s most advanced AI translation platform. Translate text and documents instantly with perfect accuracy and cultural understanding.',
      startButton: 'Start Translating',
      watchDemo: 'Watch Demo',
      stats: {
        daily: 'Daily Translations',
        languages: 'Languages Supported',
        accuracy: 'Accuracy Rate'
      }
    }
  }

  return (
    <section className="w-full pt-24 pb-20 bg-main">
      <div className="w-full">
        <motion.div
          className="content-container text-center"
          variants={motionSafe(staggerContainer)}
          initial="hidden"
          animate="visible"
        >

          {/* Main Heading */}
          <motion.h1
            variants={motionSafe(slideUp)}
            className="text-black mb-6 text-balance font-bold tracking-tight"
            style={{ fontSize: 'calc(3rem * 1.5)', lineHeight: '1.1' }}
          >
            {content[language].title}
            <br />
            <span className="bg-accent-rainbow bg-clip-text text-transparent">
              {content[language].subtitle}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={motionSafe(slideUp)}
            className="text-gray-600 mb-12 max-w-2xl mx-auto text-balance"
            style={{ fontSize: 'calc(1.125rem * 1.2)', lineHeight: '1.75' }}
          >
            {content[language].description}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={motionSafe(slideUp)}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button 
              className="btn-primary text-lg px-8 py-4"
              onClick={() => {
                const workbench = document.querySelector('#workbench')
                workbench?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              {content[language].startButton}
            </button>
            <button className="btn-ghost text-lg px-8 py-4 border border-gray-200 hover:border-black">
              {content[language].watchDemo}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}