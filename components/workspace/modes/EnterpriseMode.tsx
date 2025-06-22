'use client'

import { motion } from 'framer-motion'
import { motionSafe, slideUp, staggerContainer } from '@/lib/motion'
import {
  Building2,
  Users,
  Shield,
  Globe,
  Zap,
  BarChart3,
  Clock,
  CheckCircle,
  Phone,
  Mail,
  Calendar,
  Settings,
} from 'lucide-react'

interface EnterpriseModeProps {
  language: 'vi' | 'en'
}

export default function EnterpriseMode({ language }: EnterpriseModeProps) {
  const content = {
    vi: {
      title: 'Giải pháp Doanh nghiệp',
      subtitle: 'Các tính năng cao cấp được thiết kế riêng cho tổ chức lớn',
      features: {
        title: 'Tính năng doanh nghiệp',
        sso: 'Single Sign-On (SSO)',
        ssoDesc: 'Tích hợp với Active Directory, SAML, OAuth',
        security: 'Bảo mật nâng cao',
        securityDesc: 'Mã hóa end-to-end, audit logs, compliance',
        api: 'API không giới hạn',
        apiDesc: 'Truy cập API với tốc độ cao, không giới hạn requests',
        support: 'Hỗ trợ 24/7',
        supportDesc: 'Dedicated account manager, phone support',
        custom: 'Tùy chỉnh mô hình AI',
        customDesc: 'Fine-tuning cho ngành nghề cụ thể',
        deploy: 'Triển khai riêng',
        deployDesc: 'On-premise hoặc private cloud deployment',
      },
      stats: {
        title: 'Thống kê doanh nghiệp',
        users: 'Người dùng',
        documents: 'Tài liệu/tháng',
        uptime: 'Uptime',
        languages: 'Ngôn ngữ hỗ trợ',
      },
      contact: {
        title: 'Liên hệ Sales',
        description: 'Để tìm hiểu thêm về giải pháp doanh nghiệp',
        phone: 'Gọi điện',
        email: 'Gửi email',
        demo: 'Đặt lịch demo',
      },
    },
    en: {
      title: 'Enterprise Solutions',
      subtitle:
        'Advanced features designed specifically for large organizations',
      features: {
        title: 'Enterprise Features',
        sso: 'Single Sign-On (SSO)',
        ssoDesc: 'Integration with Active Directory, SAML, OAuth',
        security: 'Advanced Security',
        securityDesc: 'End-to-end encryption, audit logs, compliance',
        api: 'Unlimited API',
        apiDesc: 'High-speed API access with unlimited requests',
        support: '24/7 Support',
        supportDesc: 'Dedicated account manager, phone support',
        custom: 'Custom AI Models',
        customDesc: 'Fine-tuning for specific industries',
        deploy: 'Private Deployment',
        deployDesc: 'On-premise or private cloud deployment',
      },
      stats: {
        title: 'Enterprise Statistics',
        users: 'Users',
        documents: 'Documents/month',
        uptime: 'Uptime',
        languages: 'Supported Languages',
      },
      contact: {
        title: 'Contact Sales',
        description: 'Learn more about enterprise solutions',
        phone: 'Call us',
        email: 'Send email',
        demo: 'Schedule demo',
      },
    },
  }

  const enterpriseFeatures = [
    {
      icon: Users,
      title: content[language].features.sso,
      description: content[language].features.ssoDesc,
      color: 'blue',
    },
    {
      icon: Shield,
      title: content[language].features.security,
      description: content[language].features.securityDesc,
      color: 'green',
    },
    {
      icon: Zap,
      title: content[language].features.api,
      description: content[language].features.apiDesc,
      color: 'yellow',
    },
    {
      icon: Phone,
      title: content[language].features.support,
      description: content[language].features.supportDesc,
      color: 'purple',
    },
    {
      icon: Settings,
      title: content[language].features.custom,
      description: content[language].features.customDesc,
      color: 'red',
    },
    {
      icon: Building2,
      title: content[language].features.deploy,
      description: content[language].features.deployDesc,
      color: 'indigo',
    },
  ]

  const stats = [
    {
      icon: Users,
      value: '10,000+',
      label: content[language].stats.users,
    },
    {
      icon: BarChart3,
      value: '1M+',
      label: content[language].stats.documents,
    },
    {
      icon: Clock,
      value: '99.99%',
      label: content[language].stats.uptime,
    },
    {
      icon: Globe,
      value: '150+',
      label: content[language].stats.languages,
    },
  ]

  return (
    <div className="h-full p-6">
      <motion.div
        variants={motionSafe(staggerContainer)}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header */}
        <motion.div variants={motionSafe(slideUp)} className="text-center">
          <h2 className="heading-2 text-gray-900 mb-4">
            {content[language].title}
          </h2>
          <p className="body-lg text-gray-600 max-w-2xl mx-auto">
            {content[language].subtitle}
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div variants={motionSafe(slideUp)}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <div
                  key={index}
                  className="bg-white rounded-3xl border border-border-subtle p-6 text-center"
                >
                  <IconComponent
                    size={32}
                    className="text-blue-500 mx-auto mb-4"
                  />
                  <div className="heading-2 text-gray-900 mb-2">
                    {stat.value}
                  </div>
                  <div className="body-sm text-gray-500">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Enterprise Features */}
        <motion.div variants={motionSafe(slideUp)}>
          <h3 className="heading-3 text-gray-900 mb-8 text-center">
            {content[language].features.title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enterpriseFeatures.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <div
                  key={index}
                  className="bg-white rounded-3xl border border-border-subtle p-8 hover:shadow-lg transition-shadow"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl bg-${feature.color}-100 flex items-center justify-center mb-6`}
                  >
                    <IconComponent
                      size={24}
                      className={`text-${feature.color}-600`}
                    />
                  </div>
                  <h4 className="heading-4 text-gray-900 mb-3">
                    {feature.title}
                  </h4>
                  <p className="body-sm text-gray-600">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          variants={motionSafe(slideUp)}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Contact Info */}
          <div className="bg-white rounded-3xl border border-border-subtle p-8">
            <h3 className="heading-3 text-gray-900 mb-4">
              {content[language].contact.title}
            </h3>
            <p className="body-base text-gray-600 mb-8">
              {content[language].contact.description}
            </p>

            <div className="space-y-4">
              <button className="w-full flex items-center justify-center p-4 border border-border-subtle rounded-2xl hover:bg-gray-50 transition-colors">
                <Phone size={20} className="text-blue-500 mr-3" />
                <span className="body-sm font-medium text-gray-900">
                  {content[language].contact.phone}
                </span>
              </button>

              <button className="w-full flex items-center justify-center p-4 border border-border-subtle rounded-2xl hover:bg-gray-50 transition-colors">
                <Mail size={20} className="text-green-500 mr-3" />
                <span className="body-sm font-medium text-gray-900">
                  {content[language].contact.email}
                </span>
              </button>

              <button className="w-full flex items-center justify-center p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors">
                <Calendar size={20} className="mr-3" />
                <span className="body-sm font-medium">
                  {content[language].contact.demo}
                </span>
              </button>
            </div>
          </div>

          {/* Compliance & Security */}
          <div className="bg-white rounded-3xl border border-border-subtle p-8">
            <h3 className="heading-3 text-gray-900 mb-6">
              {language === 'vi'
                ? 'Tuân thủ & Bảo mật'
                : 'Compliance & Security'}
            </h3>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <CheckCircle size={20} className="text-green-500 mt-0.5" />
                <div>
                  <div className="body-sm font-medium text-gray-900">
                    SOC 2 Type II
                  </div>
                  <div className="body-xs text-gray-500">
                    {language === 'vi'
                      ? 'Kiểm toán bảo mật độc lập'
                      : 'Independent security audit'}
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <CheckCircle size={20} className="text-green-500 mt-0.5" />
                <div>
                  <div className="body-sm font-medium text-gray-900">
                    ISO 27001
                  </div>
                  <div className="body-xs text-gray-500">
                    {language === 'vi'
                      ? 'Chuẩn quản lý bảo mật thông tin'
                      : 'Information security management standard'}
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <CheckCircle size={20} className="text-green-500 mt-0.5" />
                <div>
                  <div className="body-sm font-medium text-gray-900">GDPR</div>
                  <div className="body-xs text-gray-500">
                    {language === 'vi'
                      ? 'Tuân thủ quy định bảo vệ dữ liệu EU'
                      : 'EU data protection regulation compliance'}
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <CheckCircle size={20} className="text-green-500 mt-0.5" />
                <div>
                  <div className="body-sm font-medium text-gray-900">CCPA</div>
                  <div className="body-xs text-gray-500">
                    {language === 'vi'
                      ? 'Tuân thủ luật riêng tư California'
                      : 'California privacy law compliance'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-2xl">
              <h4 className="body-sm font-medium text-blue-900 mb-2">
                {language === 'vi' ? 'Bảo mật dữ liệu' : 'Data Security'}
              </h4>
              <p className="body-xs text-blue-700">
                {language === 'vi'
                  ? 'Tất cả dữ liệu được mã hóa trong quá trình truyền tải và lưu trữ. Chúng tôi không lưu trữ nội dung tài liệu sau khi xử lý.'
                  : 'All data is encrypted in transit and at rest. We do not store document content after processing.'}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
