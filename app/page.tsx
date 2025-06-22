'use client'

// Force deployment rebuild - June 21, 2025
import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import Footer from '@/components/Footer'
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
  const { language, setLanguage } = useLanguage()
  const [activePricingIndex, setActivePricingIndex] = useState(0)
  const pricingScrollRef = useRef<HTMLDivElement>(null)

  const content = {
    vi: {
      hero: {
        title: 'AI Agent tiên phong trong xử lý tài liệu thông minh',
        subtitle: '',
        description:
          'Giải pháp dịch thuật thông minh với độ chính xác cao, hỗ trợ hơn 100 ngôn ngữ',
        getStarted: 'Bắt đầu ngay',
        watchDemo: 'Xem demo',
        trustIndicator: 'Tin cậy bởi 10,000+ doanh nghiệp',
      },
      features: {
        title: 'Tính năng nổi bật',
        subtitle:
          'Công nghệ AI tiên tiến phục vụ nhu cầu dịch thuật chuyên nghiệp',
        items: [
          {
            title: 'Dịch thuật tức thì',
            description:
              'AI thế hệ mới với công nghệ neural machine translation tiên tiến, đảm bảo độ chính xác cao và tốc độ xử lý nhanh chóng chỉ trong vài giây. Hỗ trợ dịch thuật theo ngữ cảnh và giữ nguyên định dạng tài liệu gốc.',
            icon: Zap,
          },
          {
            title: 'Hỗ trợ 100+ ngôn ngữ',
            description:
              'Hệ thống dịch thuật đa ngôn ngữ toàn diện, bao phủ tất cả các ngôn ngữ chính thống trên thế giới. Từ các ngôn ngữ phổ biến như Anh, Trung, Nhật đến các ngôn ngữ địa phương hiếm gặp, đảm bảo chất lượng dịch thuật nhất quán.',
            icon: Globe,
          },
          {
            title: 'Thanh toán Việt Nam',
            description:
              'Tích hợp đầy đủ các phương thức thanh toán phổ biến tại Việt Nam: VNPay, MoMo, ZaloPay và thẻ quốc tế. Giao dịch an toàn, nhanh chóng với mã hóa 256-bit và tuân thủ chuẩn bảo mật PCI DSS.',
            icon: CreditCard,
          },
          {
            title: 'Bảo mật tuyệt đối',
            description:
              'Hệ thống bảo mật đa lớp với mã hóa AES-256, xác thực hai yếu tố và tuân thủ các tiêu chuẩn quốc tế ISO 27001, SOC 2. Tất cả dữ liệu được xử lý trong môi trường cloud bảo mật và tự động xóa sau khi hoàn tất.',
            icon: Shield,
          },
          {
            title: 'API doanh nghiệp',
            description:
              'RESTful API mạnh mẽ và linh hoạt, dễ dàng tích hợp vào hệ thống hiện tại của doanh nghiệp. Hỗ trợ webhook, batch processing và SDK cho các ngôn ngữ lập trình phổ biến. Tài liệu API chi tiết và mẫu code sẵn sàng.',
            icon: Settings,
          },
          {
            title: 'Hỗ trợ 24/7',
            description:
              'Đội ngũ chuyên gia kỹ thuật và customer success sẵn sàng hỗ trợ 24/7 qua nhiều kênh: live chat, email, phone và ticket system. Thời gian phản hồi trung bình dưới 15 phút, đảm bảo doanh nghiệp luôn được hỗ trợ kịp thời.',
            icon: Headphones,
          },
        ],
      },
      social_proof: {
        title: 'Được tin cậy bởi các doanh nghiệp hàng đầu',
        stats: [
          { number: '10,000+', label: 'Doanh nghiệp', icon: Building2 },
          { number: '1M+', label: 'Tài liệu đã dịch', icon: FileText },
          { number: '50+', label: 'Ngôn ngữ', icon: Languages },
          { number: '99.9%', label: 'Uptime', icon: Clock },
        ],
      },
      pricing: {
        title: 'Bảng giá minh bạch',
        subtitle: 'Chọn gói phù hợp với nhu cầu của bạn',
        monthly: 'Hàng tháng',
        getStarted: 'Bắt đầu',
        mostPopular: 'Phổ biến nhất',
      },
    },
    en: {
      hero: {
        title: 'Pioneering AI Agent for Document Intelligence',
        subtitle: '',
        description:
          'Intelligent translation solution with high accuracy, supporting 100+ languages',
        getStarted: 'Get Started',
        watchDemo: 'Watch Demo',
        trustIndicator: 'Trusted by 10,000+ businesses',
      },
      features: {
        title: 'Powerful Features',
        subtitle:
          'Advanced AI technology serving professional translation needs',
        items: [
          {
            title: 'Instant Translation',
            description:
              'Next-generation AI with advanced neural machine translation technology, ensuring high accuracy and lightning-fast processing in just seconds. Supports context-aware translation while preserving original document formatting.',
            icon: Zap,
          },
          {
            title: '100+ Languages',
            description:
              'Comprehensive multilingual translation system covering all major world languages. From popular languages like English, Chinese, Japanese to rare regional dialects, ensuring consistent translation quality across all language pairs.',
            icon: Globe,
          },
          {
            title: 'Vietnamese Payments',
            description:
              'Full integration with popular Vietnamese payment methods: VNPay, MoMo, ZaloPay, and international cards. Secure, fast transactions with 256-bit encryption and PCI DSS compliance standards.',
            icon: CreditCard,
          },
          {
            title: 'Absolute Security',
            description:
              'Multi-layered security system with AES-256 encryption, two-factor authentication, and compliance with international standards ISO 27001, SOC 2. All data processed in secure cloud environment and automatically deleted after completion.',
            icon: Shield,
          },
          {
            title: 'Enterprise API',
            description:
              'Powerful and flexible RESTful API, easily integrated into existing enterprise systems. Supports webhooks, batch processing, and SDKs for popular programming languages. Comprehensive API documentation and ready-to-use code samples.',
            icon: Settings,
          },
          {
            title: '24/7 Support',
            description:
              'Expert technical and customer success teams available 24/7 through multiple channels: live chat, email, phone, and ticket system. Average response time under 15 minutes, ensuring businesses receive timely support.',
            icon: Headphones,
          },
        ],
      },
      social_proof: {
        title: 'Trusted by Leading Enterprises',
        stats: [
          { number: '10,000+', label: 'Businesses', icon: Building2 },
          { number: '1M+', label: 'Documents Translated', icon: FileText },
          { number: '50+', label: 'Languages', icon: Languages },
          { number: '99.9%', label: 'Uptime', icon: Clock },
        ],
      },
      pricing: {
        title: 'Transparent Pricing',
        subtitle: 'Choose the plan that fits your needs',
        monthly: 'Monthly',
        getStarted: 'Get Started',
        mostPopular: 'Most Popular',
      },
    },
  }

  const llmCompanies = [
    { name: 'OpenAI', logo: '/assets/logos/OpenAI.png', baseSize: 66 }, // 44 * 1.5
    { name: 'Anthropic', logo: '/assets/logos/Anthropic.png', baseSize: 35 }, // Giữ nguyên
    { name: 'Google', logo: '/assets/logos/Google.png', baseSize: 78 }, // 52 * 1.5
    { name: 'Cohere', logo: '/assets/logos/Cohere.png', baseSize: 44 }, // Giữ nguyên
    { name: 'DeepL', logo: '/assets/logos/DeepL.png', baseSize: 75 }, // 50 * 1.5
  ]

  // Thu nhỏ toàn bộ 2.5 lần
  const getFinalLogoSize = (baseSize: number) => Math.round(baseSize / 2.5)

  // Handle pricing carousel scroll
  useEffect(() => {
    const scrollContainer = pricingScrollRef.current
    if (!scrollContainer) return

    const handleScroll = () => {
      const scrollPosition = scrollContainer.scrollLeft
      const cardWidth = scrollContainer.offsetWidth * 0.9 // 90vw
      const newIndex = Math.round(scrollPosition / cardWidth)
      setActivePricingIndex(newIndex)
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-bg-main">
      <main>
        {/* Hero Section - Full Width */}
        <section className="relative overflow-hidden bg-white pt-6 md:pt-8 w-full">
          <div className="w-full py-8 md:py-12">
            <div className="w-full">
              <motion.div
                variants={motionSafe(staggerContainer)}
                initial="hidden"
                animate="visible"
                className="text-center px-4 md:px-8 lg:px-12"
              >
                {/* Hero GIF */}
                <motion.div
                  variants={motionSafe(slideUp)}
                  className="mb-8 md:mb-12 lg:mb-16"
                >
                  <div
                    className="hero-gif-container mx-auto"
                    style={{ maxWidth: '720px' }}
                  >
                    <img
                      src="/assets/header.gif"
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="hero-gif w-full"
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                      }}
                    />
                  </div>
                </motion.div>

                <motion.h1
                  variants={motionSafe(slideUp)}
                  className="heading-hero text-center mb-6"
                >
                  {content[language].hero.title}
                </motion.h1>

                <motion.p
                  variants={motionSafe(slideUp)}
                  className="subheadline text-center max-w-4xl mx-auto mb-8"
                >
                  {content[language].hero.description}
                </motion.p>

                <motion.div
                  variants={motionSafe(slideUp)}
                  className="flex flex-col sm:flex-row gap-4 justify-center mb-8 md:mb-10 lg:mb-12"
                >
                  <button className="btn-primary btn-pill-lg">
                    {content[language].hero.getStarted}
                  </button>
                  <button className="btn-secondary btn-pill-lg">
                    {content[language].hero.watchDemo}
                  </button>
                </motion.div>

                <motion.p
                  variants={motionSafe(slideUp)}
                  className="body-sm text-gray-500 text-center mb-4 md:mb-6 lg:mb-8"
                >
                  {content[language].hero.trustIndicator}
                </motion.p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Company Logos - Full Width */}
        <section className="py-4 md:py-6 lg:py-8 border-b border-border-subtle w-full">
          <div className="w-full">
            <div className="w-full">
              {/* Mobile: Marquee Animation */}
              <div className="md:hidden overflow-hidden relative py-2">
                <div className="logo-marquee gap-x-12">
                  {/* Duplicate logos for seamless loop */}
                  {[...llmCompanies, ...llmCompanies].map((company, idx) => (
                    <div
                      key={`${company.name}-${idx}`}
                      className="flex-shrink-0 inline-flex items-center"
                    >
                      <img
                        src={company.logo}
                        alt={company.name}
                        className="llm-logo"
                        style={{
                          height: `${getFinalLogoSize(company.baseSize)}px`,
                          width: 'auto',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop: Current Layout */}
              <div className="hidden md:flex flex-wrap justify-center items-center gap-x-16 gap-y-2 px-4 md:px-8 lg:px-12 llm-logos-container">
                {llmCompanies.map(company => (
                  <div key={company.name} className="llm-logo-container">
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="llm-logo"
                      style={{
                        height: `${getFinalLogoSize(company.baseSize)}px`,
                        width: 'auto',
                      }}
                    />
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
                <motion.div
                  variants={motionSafe(slideUp)}
                  className="text-center mb-16"
                >
                  <h2 className="heading-2 mb-4">
                    {content[language].features.title}
                  </h2>
                  <p className="subheadline max-w-2xl mx-auto">
                    {content[language].features.subtitle}
                  </p>
                </motion.div>

                {/* Mobile: Horizontal Carousel */}
                <div className="md:hidden overflow-x-auto snap-x snap-mandatory -mx-4">
                  <div className="flex gap-4 px-4 pb-4">
                    {content[language].features.items.map((feature, index) => (
                      <div
                        key={index}
                        className="snap-center shrink-0 w-[85vw]"
                      >
                        <FeatureCard
                          icon={feature.icon}
                          title={feature.title}
                          description={feature.description}
                          delay={0} // No delay for mobile carousel
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop: Grid Layout */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-8 lg:px-12">
                  {content[language].features.items.map((feature, index) => (
                    <FeatureCard
                      key={index}
                      icon={feature.icon}
                      title={feature.title}
                      description={feature.description}
                      delay={index * 0.1}
                    />
                  ))}
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
                  className="heading-2 mb-12"
                >
                  {content[language].social_proof.title}
                </motion.h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-4 md:px-8 lg:px-12">
                  {content[language].social_proof.stats.map((stat, index) => {
                    const IconComponent = stat.icon
                    return (
                      <motion.div
                        key={index}
                        variants={motionSafe(slideUp)}
                        className="mini-card text-center"
                      >
                        <div className="flex justify-center mb-3">
                          <IconComponent
                            size={32}
                            className="text-gray-600"
                            strokeWidth={1.5}
                          />
                        </div>
                        <div className="heading-1 text-gray-900 mb-2">
                          {stat.number}
                        </div>
                        <div className="body-base">{stat.label}</div>
                      </motion.div>
                    )
                  })}
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
                <motion.div
                  variants={motionSafe(slideUp)}
                  className="text-center mb-16"
                >
                  <h2 className="heading-2 mb-4">
                    {content[language].pricing.title}
                  </h2>
                  <p className="subheadline">
                    {content[language].pricing.subtitle}
                  </p>
                </motion.div>

                {/* Mobile: Pricing Carousel */}
                <div className="md:hidden">
                  <div
                    ref={pricingScrollRef}
                    className="overflow-x-auto snap-x snap-mandatory -mx-4"
                  >
                    <div className="flex gap-4 px-4 pb-4">
                      {Object.entries(UNIFIED_SUBSCRIPTION_PLANS).map(
                        ([key, plan], index) => (
                          <div
                            key={key}
                            className="snap-center shrink-0 w-[90vw]"
                          >
                            <div
                              className={`card-base card-hover p-6 h-full ${
                                key === 'standard'
                                  ? 'ring-2 ring-gray-900 ring-offset-2'
                                  : ''
                              }`}
                            >
                              {key === 'standard' && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                  <span className="badge-primary">
                                    {content[language].pricing.mostPopular}
                                  </span>
                                </div>
                              )}

                              <h3 className="heading-4 mb-4">
                                {language === 'vi' ? plan.nameVi : plan.name}
                              </h3>

                              <div className="mb-6">
                                <span className="heading-2">
                                  {new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND',
                                  }).format(plan.priceVND)}
                                </span>
                                <span className="body-sm text-gray-500">
                                  /{content[language].pricing.monthly}
                                </span>
                              </div>

                              <ul className="space-y-3 mb-8">
                                {(language === 'vi'
                                  ? plan.featuresVi
                                  : plan.features
                                ).map((feature, index) => (
                                  <li
                                    key={index}
                                    className="flex items-start space-x-3"
                                  >
                                    <svg
                                      className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <span className="body-sm">{feature}</span>
                                  </li>
                                ))}
                              </ul>

                              <button
                                className={`w-full ${key === 'standard' ? 'btn-primary btn-pill-lg' : 'btn-secondary btn-pill-lg'}`}
                              >
                                {content[language].pricing.getStarted}
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Dot Indicators */}
                  <div className="flex justify-center gap-2 mt-6">
                    {Object.keys(UNIFIED_SUBSCRIPTION_PLANS).map((_, index) => (
                      <div
                        key={index}
                        className={`carousel-dot w-2 h-2 rounded-full ${
                          index === activePricingIndex
                            ? 'carousel-dot-active bg-gray-900'
                            : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Desktop: Grid Layout */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4 md:px-8 lg:px-12">
                  {Object.entries(UNIFIED_SUBSCRIPTION_PLANS).map(
                    ([key, plan]) => (
                      <motion.div
                        key={key}
                        variants={motionSafe(slideUp)}
                        className="relative"
                      >
                        <div
                          className={`card-base card-hover p-8 h-full ${
                            key === 'standard'
                              ? 'ring-2 ring-gray-900 ring-offset-2'
                              : ''
                          }`}
                        >
                          {key === 'standard' && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                              <span className="badge-primary">
                                {content[language].pricing.mostPopular}
                              </span>
                            </div>
                          )}

                          <h3 className="heading-4 mb-4">
                            {language === 'vi' ? plan.nameVi : plan.name}
                          </h3>

                          <div className="mb-6">
                            <span className="heading-2">
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              }).format(plan.priceVND)}
                            </span>
                            <span className="body-sm text-gray-500">
                              /{content[language].pricing.monthly}
                            </span>
                          </div>

                          <ul className="space-y-3 mb-8">
                            {(language === 'vi'
                              ? plan.featuresVi
                              : plan.features
                            ).map((feature, index) => (
                              <li
                                key={index}
                                className="flex items-start space-x-3"
                              >
                                <svg
                                  className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span className="body-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>

                          <button
                            className={`w-full ${key === 'standard' ? 'btn-primary btn-pill-lg' : 'btn-secondary btn-pill-lg'}`}
                          >
                            {content[language].pricing.getStarted}
                          </button>
                        </div>
                      </motion.div>
                    )
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
