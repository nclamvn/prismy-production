'use client'

import { motion } from 'framer-motion'
import { AuthProvider } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { slideUp, staggerContainer, motionSafe } from '@/lib/motion'
import { UNIFIED_SUBSCRIPTION_PLANS } from '@/lib/payments/payment-service'
import { 
  Zap, 
  Globe, 
  CreditCard, 
  Shield, 
  Settings, 
  Headphones 
} from 'lucide-react'

export default function Home() {
  const { language, setLanguage } = useLanguage()

  const content = {
    vi: {
      hero: {
        title: 'Dịch thuật AI chuyên nghiệp',
        subtitle: 'cho doanh nghiệp Việt Nam',
        description: 'Giải pháp dịch thuật thông minh với độ chính xác cao, hỗ trợ hơn 100 ngôn ngữ và tích hợp thanh toán VNPay, MoMo',
        getStarted: 'Bắt đầu ngay',
        watchDemo: 'Xem demo',
        trustIndicator: 'Tin cậy bởi 10,000+ doanh nghiệp'
      },
      features: {
        title: 'Tính năng nổi bật',
        subtitle: 'Công nghệ AI tiên tiến phục vụ nhu cầu dịch thuật chuyên nghiệp',
        items: [
          {
            title: 'Dịch thuật tức thì',
            description: 'AI thế hệ mới dịch chính xác trong vài giây',
            icon: Zap
          },
          {
            title: 'Hỗ trợ 100+ ngôn ngữ',
            description: 'Dịch giữa tất cả các ngôn ngữ phổ biến trên thế giới',
            icon: Globe
          },
          {
            title: 'Thanh toán Việt Nam',
            description: 'VNPay, MoMo và thẻ quốc tế - linh hoạt thanh toán',
            icon: CreditCard
          },
          {
            title: 'Bảo mật tuyệt đối',
            description: 'Dữ liệu được mã hóa và bảo vệ theo chuẩn quốc tế',
            icon: Shield
          },
          {
            title: 'API doanh nghiệp',
            description: 'Tích hợp dễ dàng vào hệ thống hiện tại',
            icon: Settings
          },
          {
            title: 'Hỗ trợ 24/7',
            description: 'Đội ngũ chuyên gia sẵn sàng hỗ trợ mọi lúc',
            icon: Headphones
          }
        ]
      },
      social_proof: {
        title: 'Được tin cậy bởi các doanh nghiệp hàng đầu',
        stats: [
          { number: '10,000+', label: 'Doanh nghiệp' },
          { number: '1M+', label: 'Tài liệu đã dịch' },
          { number: '50+', label: 'Ngôn ngữ' },
          { number: '99.9%', label: 'Uptime' }
        ]
      },
      pricing: {
        title: 'Bảng giá minh bạch',
        subtitle: 'Chọn gói phù hợp với nhu cầu của bạn',
        monthly: 'Hàng tháng',
        getStarted: 'Bắt đầu',
        mostPopular: 'Phổ biến nhất'
      },
      cta: {
        title: 'Sẵn sàng bắt đầu?',
        description: 'Tham gia cùng hàng nghìn doanh nghiệp đang sử dụng Prismy',
        getStarted: 'Bắt đầu miễn phí',
        contactSales: 'Liên hệ bán hàng'
      }
    },
    en: {
      hero: {
        title: 'Professional AI Translation',
        subtitle: 'for Vietnamese Enterprises',
        description: 'Intelligent translation solution with high accuracy, supporting 100+ languages and Vietnamese payment integration',
        getStarted: 'Get Started',
        watchDemo: 'Watch Demo',
        trustIndicator: 'Trusted by 10,000+ businesses'
      },
      features: {
        title: 'Powerful Features',
        subtitle: 'Advanced AI technology serving professional translation needs',
        items: [
          {
            title: 'Instant Translation',
            description: 'Next-gen AI translates accurately in seconds',
            icon: Zap
          },
          {
            title: '100+ Languages',
            description: 'Translate between all major world languages',
            icon: Globe
          },
          {
            title: 'Vietnamese Payments',
            description: 'VNPay, MoMo and international cards - flexible payment',
            icon: CreditCard
          },
          {
            title: 'Absolute Security',
            description: 'Data encrypted and protected by international standards',
            icon: Shield
          },
          {
            title: 'Enterprise API',
            description: 'Easy integration into existing systems',
            icon: Settings
          },
          {
            title: '24/7 Support',
            description: 'Expert team ready to help anytime',
            icon: Headphones
          }
        ]
      },
      social_proof: {
        title: 'Trusted by Leading Enterprises',
        stats: [
          { number: '10,000+', label: 'Businesses' },
          { number: '1M+', label: 'Documents Translated' },
          { number: '50+', label: 'Languages' },
          { number: '99.9%', label: 'Uptime' }
        ]
      },
      pricing: {
        title: 'Transparent Pricing',
        subtitle: 'Choose the plan that fits your needs',
        monthly: 'Monthly',
        getStarted: 'Get Started',
        mostPopular: 'Most Popular'
      },
      cta: {
        title: 'Ready to get started?',
        description: 'Join thousands of businesses already using Prismy',
        getStarted: 'Start Free',
        contactSales: 'Contact Sales'
      }
    }
  }

  const companies = [
    'Vinamilk', 'Vietcombank', 'VNPT', 'Viettel', 'FPT', 'VinGroup'
  ]

  return (
    <AuthProvider>
      <div className="min-h-screen bg-bg-main">
        <Navbar />
        
        <main>
          {/* Hero Section - Full Width */}
          <section className="relative overflow-hidden bg-white pt-20 w-full">
            <div className="w-full py-20">
              <div className="w-full">
                <motion.div
                  variants={motionSafe(staggerContainer)}
                  initial="hidden"
                  animate="visible"
                  className="text-center px-4 md:px-8 lg:px-12"
                >
                <motion.h1 
                  variants={motionSafe(slideUp)}
                  className="heading-1 text-text-primary mb-6"
                >
                  {content[language].hero.title}
                  <span className="text-primary-600"> {content[language].hero.subtitle}</span>
                </motion.h1>
                
                <motion.p 
                  variants={motionSafe(slideUp)}
                  className="body-xl text-text-secondary mb-8"
                >
                  {content[language].hero.description}
                </motion.p>
                
                <motion.div 
                  variants={motionSafe(slideUp)}
                  className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
                >
                  <button className="btn-primary btn-lg">
                    {content[language].hero.getStarted}
                  </button>
                  <button className="btn-secondary btn-lg">
                    {content[language].hero.watchDemo}
                  </button>
                </motion.div>
                
                <motion.p 
                  variants={motionSafe(slideUp)}
                  className="body-sm text-text-muted"
                >
                  {content[language].hero.trustIndicator}
                </motion.p>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Company Logos - Full Width */}
          <section className="py-12 border-b border-border-subtle w-full">
            <div className="w-full">
              <div className="w-full">
              <div className="flex flex-wrap justify-center items-center gap-8 opacity-60 px-4 md:px-8 lg:px-12">
                {companies.map((company) => (
                  <div key={company} className="body-base font-semibold text-text-muted">
                    {company}
                  </div>
                ))}
              </div>
              </div>
            </div>
          </section>

          {/* Features Section - Full Width */}
          <section id="features" className="py-20 w-full">
            <div className="w-full">
              <div className="w-full">
              <motion.div
                variants={motionSafe(staggerContainer)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <motion.div variants={motionSafe(slideUp)} className="text-center mb-16">
                  <h2 className="heading-2 text-text-primary mb-4">
                    {content[language].features.title}
                  </h2>
                  <p className="body-lg text-text-secondary max-w-2xl mx-auto">
                    {content[language].features.subtitle}
                  </p>
                </motion.div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-8 lg:px-12">
                  {content[language].features.items.map((feature, index) => {
                    const IconComponent = feature.icon
                    return (
                      <motion.div
                        key={index}
                        variants={motionSafe(slideUp)}
                        className="feature-card-vertical zen-card-hover-enhanced"
                      >
                        <div className="feature-icon-container">
                          <IconComponent 
                            size={26} 
                            className="text-black zen-icon-hover transition-all duration-300" 
                            strokeWidth={1.5}
                          />
                        </div>
                        <h3 className="feature-title">{feature.title}</h3>
                        <p className="feature-description">{feature.description}</p>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
              </div>
            </div>
          </section>

          {/* Stats Section - Full Width */}
          <section className="py-20 bg-gray-50 w-full">
            <div className="w-full">
              <div className="w-full">
              <motion.div
                variants={motionSafe(staggerContainer)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="text-center"
              >
                <motion.h2 
                  variants={motionSafe(slideUp)}
                  className="heading-2 text-text-primary mb-12"
                >
                  {content[language].social_proof.title}
                </motion.h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-4 md:px-8 lg:px-12">
                  {content[language].social_proof.stats.map((stat, index) => (
                    <motion.div key={index} variants={motionSafe(slideUp)}>
                      <div className="heading-1 text-primary-600 mb-2">{stat.number}</div>
                      <div className="body-base text-text-secondary">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              </div>
            </div>
          </section>

          {/* Pricing Section - Full Width */}
          <section id="pricing" className="py-20 w-full">
            <div className="w-full">
              <div className="w-full">
              <motion.div
                variants={motionSafe(staggerContainer)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <motion.div variants={motionSafe(slideUp)} className="text-center mb-16">
                  <h2 className="heading-2 text-text-primary mb-4">
                    {content[language].pricing.title}
                  </h2>
                  <p className="body-lg text-text-secondary">
                    {content[language].pricing.subtitle}
                  </p>
                </motion.div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4 md:px-8 lg:px-12">
                  {Object.entries(UNIFIED_SUBSCRIPTION_PLANS).map(([key, plan]) => (
                    <motion.div
                      key={key}
                      variants={motionSafe(slideUp)}
                      className="relative"
                    >
                      <div className={`bg-bg-secondary rounded-xl p-8 border-2 h-full ${
                        key === 'standard' ? 'border-border-pricing' : 'border-border-subtle'
                      }`}>
                      
                      <h3 className="heading-4 text-text-primary mb-2">
                        {language === 'vi' ? plan.nameVi : plan.name}
                      </h3>
                      
                      <div className="mb-4">
                        <span className="heading-2 text-text-primary">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(plan.priceVND)}
                        </span>
                        <span className="body-sm text-text-muted">/{content[language].pricing.monthly}</span>
                      </div>
                      
                      <ul className="space-y-3 mb-8">
                        {(language === 'vi' ? plan.featuresVi : plan.features).map((feature, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <svg className="w-5 h-5 text-secondary-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="body-sm text-text-secondary">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <button className={key === 'standard' ? 'btn-primary w-full' : 'btn-secondary w-full'}>
                        {content[language].pricing.getStarted}
                      </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              </div>
            </div>
          </section>

          {/* CTA Section - Full Width */}
          <section className="py-20 bg-black w-full">
            <div className="w-full">
              <div className="w-full">
              <motion.div
                variants={motionSafe(staggerContainer)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="text-center"
              >
                <motion.h2 
                  variants={motionSafe(slideUp)}
                  className="heading-2 text-white mb-4"
                >
                  {content[language].cta.title}
                </motion.h2>
                
                <motion.p 
                  variants={motionSafe(slideUp)}
                  className="body-lg text-primary-100 mb-8"
                >
                  {content[language].cta.description}
                </motion.p>
                
                <motion.div 
                  variants={motionSafe(slideUp)}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <button className="bg-white text-black hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold transition-colors zen-language-hover">
                    {content[language].cta.getStarted}
                  </button>
                  <button className="border border-gray-600 text-white hover:bg-gray-900 px-8 py-4 rounded-xl font-semibold transition-colors zen-language-hover">
                    {content[language].cta.contactSales}
                  </button>
                </motion.div>
              </motion.div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </AuthProvider>
  )
}