'use client'

// Simplified Home Page for MVP
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import MainLayout from '@/components/layouts/MainLayout'
import UnifiedGetStartedButton from '@/components/ui/UnifiedGetStartedButton'
import { slideUp, staggerContainer, motionSafe } from '@/lib/motion'
import { UNIFIED_SUBSCRIPTION_PLANS } from '@/lib/payments/payment-service'
import FeatureCard from '@/components/ui/FeatureCard'
import {
  Zap,
  Globe,
  CreditCard,
  Shield,
  Settings,
  Headphones,
  Building2,
  FileText,
  Languages,
  Clock,
} from 'lucide-react'

export default function Home() {
  const { language } = useLanguage()
  const [activePricingIndex, setActivePricingIndex] = useState(0)

  // Simplified content - removed optimization features
  const content = {
    vi: {
      hero: {
        title: 'Dịch thuật AI thông minh',
        subtitle: 'Nền tảng dịch thuật AI mạnh mẽ với độ chính xác cao và tốc độ siêu nhanh',
        cta: 'Bắt đầu dịch miễn phí'
      },
      features: {
        title: 'Tính năng nổi bật',
        items: [
          {
            icon: Zap,
            title: 'Dịch thuật tức thì',
            description: 'Công nghệ AI tiên tiến cho kết quả dịch chính xác trong giây lát'
          },
          {
            icon: Globe,
            title: 'Hỗ trợ đa ngôn ngữ',
            description: 'Hơn 100 ngôn ngữ được hỗ trợ với độ chính xác cao'
          },
          {
            icon: Shield,
            title: 'Bảo mật tuyệt đối',
            description: 'Dữ liệu được mã hóa và bảo vệ theo tiêu chuẩn quốc tế'
          }
        ]
      },
      pricing: {
        title: 'Gói dịch vụ',
        monthly: 'Hàng tháng',
        yearly: 'Hàng năm'
      }
    },
    en: {
      hero: {
        title: 'Intelligent AI Translation',
        subtitle: 'Powerful AI translation platform with high accuracy and lightning speed',
        cta: 'Start translating for free'
      },
      features: {
        title: 'Key Features',
        items: [
          {
            icon: Zap,
            title: 'Instant Translation',
            description: 'Advanced AI technology for accurate translation results in seconds'
          },
          {
            icon: Globe,
            title: 'Multi-language Support',
            description: 'Over 100 languages supported with high accuracy'
          },
          {
            icon: Shield,
            title: 'Absolute Security',
            description: 'Data encrypted and protected according to international standards'
          }
        ]
      },
      pricing: {
        title: 'Pricing Plans',
        monthly: 'Monthly',
        yearly: 'Yearly'
      }
    }
  }

  return (
    <MainLayout>
      <div className="relative">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
          <div className="absolute inset-0 bg-grid-gray-100/50 bg-[size:20px_20px] opacity-50" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <motion.div
              className="text-center"
              variants={motionSafe(staggerContainer)}
              initial="hidden"
              animate="visible"
            >
              <motion.h1 
                className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-8"
                variants={motionSafe(slideUp)}
              >
                {content[language].hero.title}
              </motion.h1>
              
              <motion.p 
                className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto"
                variants={motionSafe(slideUp)}
              >
                {content[language].hero.subtitle}
              </motion.p>
              
              <motion.div variants={motionSafe(slideUp)}>
                <UnifiedGetStartedButton size="lg">
                  {content[language].hero.cta}
                </UnifiedGetStartedButton>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-16"
              variants={motionSafe(slideUp)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {content[language].features.title}
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {content[language].features.items.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={motionSafe(slideUp)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <FeatureCard
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-16"
              variants={motionSafe(slideUp)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {content[language].pricing.title}
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {UNIFIED_SUBSCRIPTION_PLANS.map((plan, index) => (
                <motion.div
                  key={plan.key}
                  className="bg-white rounded-xl p-8 border border-gray-200 relative"
                  variants={motionSafe(slideUp)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.price === 0 ? 'Free' : `$${plan.price}`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-gray-500 ml-2">/month</span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-6">{plan.description}</p>
                    
                    <UnifiedGetStartedButton 
                      variant={plan.popular ? 'primary' : 'secondary'}
                      className="w-full"
                    >
                      Get Started
                    </UnifiedGetStartedButton>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  )
}