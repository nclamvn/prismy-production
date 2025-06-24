'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { slideUp, staggerContainer, motionSafe } from '@/lib/motion'

interface StatCardProps {
  number: string
  label: string
  description?: string
}

function StatCard({ number, label, description }: StatCardProps) {
  return (
    <motion.div
      className="stat-card"
      variants={motionSafe(slideUp)}
      whileHover={{ y: -2 }}
    >
      <div className="stat-number">{number}</div>
      <div className="stat-label">{label}</div>
      {description && (
        <div className="text-xs text-gray-400 mt-1">{description}</div>
      )}
    </motion.div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <motion.div
      className="card-base card-hover p-6 text-center"
      variants={motionSafe(slideUp)}
      whileHover={{ y: -4, scale: 1.05 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex justify-center mb-4 text-black hover:scale-105 transition-transform duration-150">
        {icon}
      </div>
      <h3 className="heading-4 text-black mb-3">{title}</h3>
      <p className="body-base text-gray-600">{description}</p>
    </motion.div>
  )
}

interface StatsAndFeaturesProps {
  language?: 'vi' | 'en'
}

export default function StatsAndFeatures({ language = 'en' }: StatsAndFeaturesProps) {
  const content = {
    vi: {
      trustedTitle: 'Được tin tưởng bởi các tổ chức toàn cầu',
      trustedSubtitle: 'Tham gia cùng hàng triệu người dùng tin tưởng Prismy cho nhu cầu dịch thuật',
      whyChooseTitle: 'Tại sao chọn Prismy?',
      whyChooseSubtitle: 'Công nghệ AI tiên tiến kết hợp với sự hiểu biết ở cấp độ con người để mang lại bản dịch thực sự nắm bắt được ý nghĩa và ngữ cảnh.',
      stats: [
        { number: '1M+', label: 'Lượt dịch hàng ngày', description: 'Được tin tưởng bởi hàng triệu người' },
        { number: '150+', label: 'Ngôn ngữ', description: 'Phủ sóng toàn cầu' },
        { number: '99.9%', label: 'Độ chính xác', description: 'Độ chính xác được hỗ trợ bởi AI' },
        { number: '24/7', label: 'Hoạt động', description: 'Luôn trực tuyến' }
      ],
      features: [
        {
          title: 'Dịch thuật chính xác',
          description: 'AI hiểu ngữ cảnh, nắm bắt sắc thái, thành ngữ và tham chiếu văn hóa để có bản dịch hoàn hảo.'
        },
        {
          title: 'Tốc độ ánh sáng',
          description: 'Dịch tức thì được hỗ trợ bởi cơ sở hạ tầng AI tiên tiến. Có kết quả trong vài mili giây.'
        },
        {
          title: 'Bảo mật doanh nghiệp',
          description: 'Mã hóa cấp ngân hàng và tuân thủ GDPR, SOC 2, và các tiêu chuẩn bảo mật doanh nghiệp.'
        },
        {
          title: 'Tầm với toàn cầu',
          description: 'Hỗ trợ 150+ ngôn ngữ bao gồm các phương ngữ hiếm và biến thể ngôn ngữ mới nổi.'
        },
        {
          title: 'Chỉ số chất lượng',
          description: 'Chấm điểm chất lượng thời gian thực và xếp hạng độ tin cậy cho mọi bản dịch với phân tích chi tiết.'
        },
        {
          title: 'Mô hình tùy chỉnh',
          description: 'Mô hình AI chuyên ngành được đào tạo trên chuyên môn lĩnh vực cho nội dung kỹ thuật, pháp lý và y tế.'
        }
      ]
    },
    en: {
      trustedTitle: 'Trusted by Global Organizations',
      trustedSubtitle: 'Join millions of users who rely on Prismy for their translation needs',
      whyChooseTitle: 'Why Choose Prismy?',
      whyChooseSubtitle: 'Advanced AI technology meets human-level understanding to deliver translations that truly capture meaning and context.',
      stats: [
        { number: '1M+', label: 'Daily Translations', description: 'Trusted by millions' },
        { number: '150+', label: 'Languages', description: 'Global coverage' },
        { number: '99.9%', label: 'Accuracy', description: 'AI-powered precision' },
        { number: '24/7', label: 'Availability', description: 'Always online' }
      ],
      features: [
        {
          title: 'Precision Translation',
          description: 'Context-aware AI that understands nuance, idioms, and cultural references for perfect translations.'
        },
        {
          title: 'Lightning Speed',
          description: 'Instant translations powered by cutting-edge AI infrastructure. Get results in milliseconds.'
        },
        {
          title: 'Enterprise Security',
          description: 'Bank-grade encryption and compliance with GDPR, SOC 2, and enterprise security standards.'
        },
        {
          title: 'Global Reach',
          description: 'Support for 150+ languages including rare dialects and emerging linguistic variations.'
        },
        {
          title: 'Quality Metrics',
          description: 'Real-time quality scoring and confidence ratings for every translation with detailed analytics.'
        },
        {
          title: 'Custom Models',
          description: 'Industry-specific AI models trained on domain expertise for technical, legal, and medical content.'
        }
      ]
    }
  }

  // Monochrome line-art icons (1.5px stroke, black)
  const featureIcons = [
    // Precision Target
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" key="precision">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>,
    // Lightning Speed
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" key="speed">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>,
    // Shield Security
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" key="security">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ]

  return (
    <section className="w-full py-24 bg-main">
      <div className="content-container">
        {/* Combined Stats and Features Section */}
        <motion.div
          className="text-center mb-20"
          variants={motionSafe(staggerContainer)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.h2
            variants={motionSafe(slideUp)}
            className="heading-2 text-black mb-4"
          >
            {content[language].trustedTitle}
          </motion.h2>
          <motion.p
            variants={motionSafe(slideUp)}
            className="body-lg text-gray-600 mb-12"
          >
            {content[language].trustedSubtitle}
          </motion.p>

          {/* Consolidated Stats - Single row, removed duplicates */}
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-20"
            variants={motionSafe(staggerContainer)}
          >
            {content[language].stats.map((stat, index) => (
              <StatCard
                key={index}
                number={stat.number}
                label={stat.label}
                description={stat.description}
              />
            ))}
          </motion.div>
        </motion.div>

        {/* Why Prismy - 3 Core Pillars */}
        <motion.div
          variants={motionSafe(staggerContainer)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div
            variants={motionSafe(slideUp)}
            className="text-center mb-12"
          >
            <h2 className="heading-2 text-black mb-4">
              {content[language].whyChooseTitle}
            </h2>
            <p className="body-lg text-gray-600 max-w-2xl mx-auto">
              {content[language].whyChooseSubtitle}
            </p>
          </motion.div>

          {/* 3 Core Features - Precision, Speed, Security */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            variants={motionSafe(staggerContainer)}
          >
            {content[language].features.slice(0, 3).map((feature, index) => (
              <FeatureCard
                key={index}
                icon={featureIcons[index]}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}