'use client'

import { motion } from 'framer-motion'
import { slideUp, staggerContainer, motionSafe } from '@/lib/motion'

interface LogoWallProps {
  language?: 'vi' | 'en'
}

export default function LogoWall({ language = 'en' }: LogoWallProps) {
  const content = {
    vi: {
      title: 'Được tin tưởng bởi các tổ chức hàng đầu',
      subtitle: 'Hàng nghìn doanh nghiệp đã chọn Prismy cho nhu cầu dịch thuật của họ'
    },
    en: {
      title: 'Trusted by leading organizations',
      subtitle: 'Thousands of businesses have chosen Prismy for their translation needs'
    }
  }

  // Simulated company logos (in production, these would be actual client logos)
  const logos = [
    { name: 'TechCorp', width: 120 },
    { name: 'GlobalInc', width: 100 },
    { name: 'InnovateSpace', width: 140 },
    { name: 'FutureWorks', width: 110 },
    { name: 'WorldBridge', width: 130 },
    { name: 'NextGen', width: 95 },
    { name: 'SmartSolutions', width: 135 },
    { name: 'ConnectGlobal', width: 115 }
  ]

  return (
    <section className="w-full py-16 bg-main border-t border-gray-100">
      <div className="content-container">
        <motion.div
          variants={motionSafe(staggerContainer)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center"
        >
          <motion.h3
            variants={motionSafe(slideUp)}
            className="heading-4 text-black mb-2"
          >
            {content[language].title}
          </motion.h3>
          <motion.p
            variants={motionSafe(slideUp)}
            className="body-sm text-gray-600 mb-8"
          >
            {content[language].subtitle}
          </motion.p>

          {/* Logo Grid with Grayscale Effect */}
          <motion.div
            variants={motionSafe(staggerContainer)}
            className="flex flex-wrap items-center justify-center gap-8 lg:gap-12 max-w-4xl mx-auto"
          >
            {logos.map((logo, index) => (
              <motion.div
                key={logo.name}
                variants={motionSafe(slideUp)}
                className="flex items-center justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                style={{ width: logo.width, height: 60 }}
              >
                {/* Placeholder logo - in production, replace with actual SVG logos */}
                <div className="w-full h-full bg-black rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-xs">
                    {logo.name}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Additional Info */}
          <motion.div
            variants={motionSafe(slideUp)}
            className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Enterprise-grade security</span>
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>99.9% uptime SLA</span>
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>24/7 support</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}