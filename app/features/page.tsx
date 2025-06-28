'use client'

import React from 'react'
import {
  Languages,
  FileText,
  Brain,
  Settings,
  Code,
  BarChart3,
  Users,
  Globe,
  Zap,
  Eye,
  MessageSquare,
  Shield,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import { motion } from 'framer-motion'
import Link from 'next/link'

/**
 * FEATURES DETAIL PAGE
 * Comprehensive showcase of all Prismy capabilities
 */
export default function FeaturesPage() {
  const { language } = useSSRSafeLanguage()

  const featureCategories = [
    {
      title: 'Core Translation',
      titleVi: 'Dịch Thuật Cốt Lõi',
      features: [
        {
          icon: Languages,
          name: 'NotebookLM Interface',
          nameVi: 'Giao Diện NotebookLM',
          description: "3-panel workspace inspired by Google's NotebookLM",
          descriptionVi:
            'Không gian làm việc 3 panel lấy cảm hứng từ NotebookLM của Google',
          href: '/workspace-v2',
        },
        {
          icon: Zap,
          name: 'Studio Actions',
          nameVi: 'Hành Động Studio',
          description: '8 quick improvement actions for translations',
          descriptionVi: '8 hành động cải thiện nhanh cho bản dịch',
          href: '/workspace-v2',
        },
        {
          icon: Eye,
          name: 'Real-time Preview',
          nameVi: 'Xem Trước Thời Gian Thực',
          description: 'Live translation with instant preview',
          descriptionVi: 'Dịch thuật trực tiếp với xem trước ngay lập tức',
          href: '/workspace-v2',
        },
      ],
    },
    {
      title: 'Document Processing',
      titleVi: 'Xử Lý Tài Liệu',
      features: [
        {
          icon: FileText,
          name: 'Multi-format Support',
          nameVi: 'Hỗ Trợ Đa Định Dạng',
          description: 'PDF, DOCX, TXT, and more formats supported',
          descriptionVi: 'Hỗ trợ PDF, DOCX, TXT và nhiều định dạng khác',
          href: '/documents',
        },
        {
          icon: Settings,
          name: 'Batch Processing',
          nameVi: 'Xử Lý Hàng Loạt',
          description: 'Process up to 20 documents simultaneously',
          descriptionVi: 'Xử lý đồng thời tới 20 tài liệu',
          href: '/documents',
        },
        {
          icon: Brain,
          name: 'Smart OCR',
          nameVi: 'OCR Thông Minh',
          description: 'AI-powered text extraction from images',
          descriptionVi: 'Trích xuất văn bản từ hình ảnh bằng AI',
          href: '/documents',
        },
      ],
    },
    {
      title: 'AI Intelligence',
      titleVi: 'Trí Tuệ Nhân Tạo',
      features: [
        {
          icon: Brain,
          name: 'Agent Swarm',
          nameVi: 'Hệ Thống Agents',
          description: 'Multi-AI collaboration for complex tasks',
          descriptionVi: 'Cộng tác đa AI cho các tác vụ phức tạp',
          href: '/dashboard/agents',
        },
        {
          icon: MessageSquare,
          name: 'Voice Control',
          nameVi: 'Điều Khiển Giọng Nói',
          description: 'Speech-to-text translation interface',
          descriptionVi: 'Giao diện dịch thuật giọng nói sang văn bản',
          href: '/dashboard/agents',
        },
        {
          icon: BarChart3,
          name: 'Predictive Insights',
          nameVi: 'Thông Tin Dự Đoán',
          description: 'AI-powered usage analytics and recommendations',
          descriptionVi: 'Phân tích sử dụng và đề xuất bằng AI',
          href: '/dashboard/insights',
        },
      ],
    },
    {
      title: 'Enterprise Tools',
      titleVi: 'Công Cụ Doanh Nghiệp',
      features: [
        {
          icon: Code,
          name: 'Developer API',
          nameVi: 'API Nhà Phát Triển',
          description: 'Full REST API with authentication',
          descriptionVi: 'API REST đầy đủ với xác thực',
          href: '/api-docs',
        },
        {
          icon: Settings,
          name: 'Workflow Builder',
          nameVi: 'Tạo Quy Trình',
          description: 'Visual automation designer',
          descriptionVi: 'Thiết kế tự động hóa trực quan',
          href: '/dashboard/workflows',
        },
        {
          icon: Users,
          name: 'Team Management',
          nameVi: 'Quản Lý Nhóm',
          description: 'User roles, permissions, and collaboration',
          descriptionVi: 'Vai trò người dùng, quyền hạn và cộng tác',
          href: '/admin',
        },
        {
          icon: Shield,
          name: 'Enterprise Security',
          nameVi: 'Bảo Mật Doanh Nghiệp',
          description: 'SSO, audit logs, and compliance',
          descriptionVi: 'SSO, nhật ký kiểm toán và tuân thủ',
          href: '/dashboard/settings',
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/landing" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Languages className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Prismy</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/landing"
                className="text-gray-600 hover:text-gray-900"
              >
                {language === 'vi' ? 'Trang chủ' : 'Home'}
              </Link>
              <Link
                href="/pricing"
                className="text-gray-600 hover:text-gray-900"
              >
                {language === 'vi' ? 'Bảng giá' : 'Pricing'}
              </Link>
              <Link
                href="/api-docs"
                className="text-gray-600 hover:text-gray-900"
              >
                API
              </Link>
              <Link
                href="/workspace-v2"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {language === 'vi' ? 'Bắt đầu' : 'Get Started'}
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {language === 'vi'
              ? 'Tất cả tính năng của Prismy'
              : 'All Prismy Features'}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {language === 'vi'
              ? 'Khám phá toàn bộ khả năng của nền tảng AI dịch thuật tiên tiến nhất'
              : 'Explore the complete capabilities of the most advanced AI translation platform'}
          </p>
          <Link
            href="/workspace-v2"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {language === 'vi' ? 'Dùng thử ngay' : 'Try Now'}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Features Categories */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {featureCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-16">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {language === 'vi' ? category.titleVi : category.title}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {category.features.map((feature, featureIndex) => (
                  <motion.div
                    key={featureIndex}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: featureIndex * 0.1 }}
                    className="group"
                  >
                    <Link href={feature.href}>
                      <div className="bg-white p-8 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all h-full">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
                          <feature.icon className="w-6 h-6 text-blue-600" />
                        </div>

                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                          {language === 'vi' ? feature.nameVi : feature.name}
                        </h3>

                        <p className="text-gray-600 mb-4">
                          {language === 'vi'
                            ? feature.descriptionVi
                            : feature.description}
                        </p>

                        <div className="flex items-center text-blue-600 group-hover:text-blue-700 transition-colors">
                          <span className="text-sm font-medium">
                            {language === 'vi' ? 'Khám phá' : 'Explore'}
                          </span>
                          <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            {language === 'vi'
              ? 'Sẵn sàng sử dụng tất cả tính năng?'
              : 'Ready to use all features?'}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {language === 'vi'
              ? 'Trải nghiệm toàn bộ sức mạnh của Prismy trong workspace NotebookLM'
              : 'Experience the full power of Prismy in the NotebookLM workspace'}
          </p>
          <Link
            href="/workspace-v2"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-all text-lg font-medium"
          >
            {language === 'vi' ? 'Bắt đầu miễn phí' : 'Start Free'}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
