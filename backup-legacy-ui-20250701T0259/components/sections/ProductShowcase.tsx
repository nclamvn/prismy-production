'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import {
  Zap,
  FileText,
  Globe,
  Shield,
  Clock,
  Users,
  ArrowRight,
  Play,
  CheckCircle,
  Sparkles,
  BarChart3,
} from 'lucide-react'

export default function ProductShowcase() {
  const { language } = useSSRSafeLanguage()
  const [activeFeature, setActiveFeature] = useState(0)

  const content = {
    vi: {
      title: 'Trải nghiệm dịch thuật AI thế hệ mới',
      subtitle:
        'Khám phá cách Prismy thay đổi hoàn toàn quy trình dịch thuật của bạn',
      features: [
        {
          icon: Zap,
          title: 'Dịch tức thì',
          description: 'AI dịch thuật trong 2 giây với độ chính xác 99.9%',
          stats: '10x nhanh hơn',
          demo: 'Xem demo',
          benefits: [
            'Dịch 1000 từ trong 2 giây',
            'Hỗ trợ 100+ ngôn ngữ',
            'Tự động nhận diện ngôn ngữ',
          ],
        },
        {
          icon: FileText,
          title: 'Dịch tài liệu thông minh',
          description: 'Giữ nguyên format, layout và styling của tài liệu gốc',
          stats: '95% giảm thời gian',
          demo: 'Xem demo',
          benefits: [
            'Hỗ trợ PDF, Word, PowerPoint',
            'Giữ nguyên định dạng',
            'Batch processing hàng loạt',
          ],
        },
        {
          icon: Globe,
          title: 'Đa ngôn ngữ nâng cao',
          description: 'Hiểu context văn hóa và thuật ngữ chuyên ngành',
          stats: '100+ ngôn ngữ',
          demo: 'Xem demo',
          benefits: [
            'Context-aware translation',
            'Thuật ngữ chuyên ngành',
            'Localization tự động',
          ],
        },
        {
          icon: Shield,
          title: 'Bảo mật Enterprise',
          description: 'Mã hóa end-to-end, tuân thủ GDPR và SOC2',
          stats: '100% bảo mật',
          demo: 'Xem demo',
          benefits: [
            'Mã hóa AES-256',
            'Tuân thủ GDPR, SOC2',
            'Không lưu trữ dữ liệu',
          ],
        },
      ],
      beforeAfter: {
        title: 'Trước và sau khi sử dụng Prismy',
        before: {
          title: 'Trước khi có Prismy',
          items: [
            'Dịch thủ công mất 2-3 ngày',
            'Chi phí dịch vụ cao',
            'Khó kiểm soát chất lượng',
            'Mất format tài liệu',
          ],
        },
        after: {
          title: 'Sau khi có Prismy',
          items: [
            'Dịch tự động trong vài phút',
            'Tiết kiệm 90% chi phí',
            'Chất lượng nhất quán',
            'Giữ nguyên format hoàn hảo',
          ],
        },
      },
      cta: 'Dùng thử miễn phí ngay',
    },
    en: {
      title: 'Experience next-generation AI translation',
      subtitle:
        'Discover how Prismy completely transforms your translation workflow',
      features: [
        {
          icon: Zap,
          title: 'Instant Translation',
          description: 'AI translation in 2 seconds with 99.9% accuracy',
          stats: '10x faster',
          demo: 'Watch demo',
          benefits: [
            'Translate 1000 words in 2 seconds',
            'Support 100+ languages',
            'Auto language detection',
          ],
        },
        {
          icon: FileText,
          title: 'Smart Document Translation',
          description: 'Preserve original format, layout and styling',
          stats: '95% time reduction',
          demo: 'Watch demo',
          benefits: [
            'Support PDF, Word, PowerPoint',
            'Preserve formatting',
            'Batch processing',
          ],
        },
        {
          icon: Globe,
          title: 'Advanced Multilingual',
          description: 'Understand cultural context and technical terminology',
          stats: '100+ languages',
          demo: 'Watch demo',
          benefits: [
            'Context-aware translation',
            'Technical terminology',
            'Auto localization',
          ],
        },
        {
          icon: Shield,
          title: 'Enterprise Security',
          description: 'End-to-end encryption, GDPR and SOC2 compliant',
          stats: '100% secure',
          demo: 'Watch demo',
          benefits: [
            'AES-256 encryption',
            'GDPR, SOC2 compliant',
            'No data storage',
          ],
        },
      ],
      beforeAfter: {
        title: 'Before and after using Prismy',
        before: {
          title: 'Before Prismy',
          items: [
            'Manual translation takes 2-3 days',
            'High service costs',
            'Hard to control quality',
            'Document formatting lost',
          ],
        },
        after: {
          title: 'After Prismy',
          items: [
            'Auto translation in minutes',
            'Save 90% costs',
            'Consistent quality',
            'Perfect format preservation',
          ],
        },
      },
      cta: 'Start free trial now',
    },
  }

  const currentContent = content[language]

  return (
    <section
      className="py-24"
      style={{ backgroundColor: 'rgba(251, 250, 249, 1)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            {currentContent.title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {currentContent.subtitle}
          </p>
        </motion.div>

        {/* Feature Showcase */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          {/* Feature List */}
          <div className="space-y-6">
            {currentContent.features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 ${
                  activeFeature === index
                    ? 'bg-white'
                    : 'bg-white hover:-translate-y-0.5'
                }`}
                style={{
                  boxShadow:
                    activeFeature === index
                      ? '0 12px 40px rgba(0,0,0,0.05)'
                      : '0 12px 40px rgba(0,0,0,0.05)',
                }}
                onMouseEnter={e => {
                  if (activeFeature !== index) {
                    e.currentTarget.style.boxShadow =
                      '0 16px 48px rgba(0,0,0,0.06)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={e => {
                  if (activeFeature !== index) {
                    e.currentTarget.style.boxShadow =
                      '0 12px 40px rgba(0,0,0,0.05)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
                onClick={() => setActiveFeature(index)}
              >
                <div className="flex items-start">
                  <div
                    className={`p-3 rounded-xl mr-4 ${
                      activeFeature === index ? 'text-black' : 'text-gray-600'
                    }`}
                  >
                    <feature.icon className="w-6 h-6" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {feature.title}
                      </h3>
                      <span className="text-sm font-semibold text-gray-700 bg-gray-200 px-3 py-1 rounded-full">
                        {feature.stats}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-4">{feature.description}</p>

                    {activeFeature === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="space-y-2">
                          {feature.benefits.map((benefit, i) => (
                            <div
                              key={i}
                              className="flex items-center text-gray-700"
                            >
                              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                              {benefit}
                            </div>
                          ))}
                        </div>

                        <button className="flex items-center mt-4 text-gray-600 hover:text-gray-700 font-medium">
                          <Play className="w-4 h-4 mr-2" />
                          {feature.demo}
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Interactive Demo */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="bg-gray-100 rounded-3xl p-8 shadow-2xl">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Prismy Translation
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-100 rounded-lg">
                    <div className="text-sm text-gray-500 mb-2">
                      Input (English)
                    </div>
                    <div className="text-gray-900">
                      Hello, this is a demo translation...
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
                    />
                  </div>

                  <div className="p-4 bg-gray-200 rounded-lg">
                    <div className="text-sm text-gray-500 mb-2">
                      Output (Vietnamese)
                    </div>
                    <div className="text-gray-900">
                      Xin chào, đây là bản dịch demo...
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center mt-6 text-green-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Translated in 0.8s</span>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-4 -right-4 bg-gray-700 text-white p-3 rounded-xl shadow-lg"
            >
              <Sparkles className="w-6 h-6" />
            </motion.div>
          </motion.div>
        </div>

        {/* Before/After Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-gray-100 rounded-3xl p-12"
        >
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {currentContent.beforeAfter.title}
          </h3>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Before */}
            <div className="text-left">
              <div className="w-16 h-16 bg-white border border-gray-300 rounded-full flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-gray-600" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-6">
                {currentContent.beforeAfter.before.title}
              </h4>
              <div className="space-y-4">
                {currentContent.beforeAfter.before.items.map((item, index) => (
                  <div key={index} className="flex items-center text-gray-600">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* After */}
            <div className="text-left">
              <div className="w-16 h-16 bg-white border border-gray-300 rounded-full flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-gray-600" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-6">
                {currentContent.beforeAfter.after.title}
              </h4>
              <div className="space-y-4">
                {currentContent.beforeAfter.after.items.map((item, index) => (
                  <div key={index} className="flex items-center text-gray-600">
                    <CheckCircle className="w-5 h-5 text-gray-600 mr-3" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Impact Chart */}
            <div className="text-left">
              <div className="w-16 h-16 bg-white border border-gray-300 rounded-full flex items-center justify-center mb-6">
                <BarChart3 className="w-8 h-8 text-gray-600" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-6">
                {language === 'vi' ? 'Tác động rõ rệt' : 'Clear Impact'}
              </h4>

              {/* Bar Chart Visualization */}
              <div className="space-y-6">
                {/* Cost Comparison */}
                <div>
                  <div className="text-sm text-gray-600 mb-2">
                    {language === 'vi' ? 'Chi phí' : 'Cost'}
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <div
                        className="h-6 bg-gray-400 rounded"
                        style={{ width: '90%' }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {language === 'vi' ? 'Trước' : 'Before'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-2">
                    <div className="flex-1">
                      <div
                        className="h-6 bg-gray-800 rounded"
                        style={{ width: '20%' }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {language === 'vi' ? 'Sau' : 'After'}
                    </div>
                  </div>
                </div>

                {/* Time Comparison */}
                <div>
                  <div className="text-sm text-gray-600 mb-2">
                    {language === 'vi' ? 'Thời gian' : 'Time'}
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <div
                        className="h-6 bg-gray-400 rounded"
                        style={{ width: '85%' }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {language === 'vi' ? 'Trước' : 'Before'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-2">
                    <div className="flex-1">
                      <div
                        className="h-6 bg-gray-800 rounded"
                        style={{ width: '15%' }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {language === 'vi' ? 'Sau' : 'After'}
                    </div>
                  </div>
                </div>

                {/* Accuracy Comparison */}
                <div>
                  <div className="text-sm text-gray-600 mb-2">
                    {language === 'vi' ? 'Độ chính xác' : 'Accuracy'}
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <div
                        className="h-6 bg-gray-400 rounded"
                        style={{ width: '40%' }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {language === 'vi' ? 'Trước' : 'Before'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mt-2">
                    <div className="flex-1">
                      <div
                        className="h-6 bg-gray-800 rounded"
                        style={{ width: '95%' }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {language === 'vi' ? 'Sau' : 'After'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <button className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              {currentContent.cta}
              <ArrowRight className="ml-2 w-5 h-5 inline" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
