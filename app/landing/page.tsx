'use client'

import React from 'react'
import {
  Languages,
  FileText,
  Zap,
  Brain,
  Users,
  BarChart3,
  Code,
  Settings,
  Globe,
  ArrowRight,
  CheckCircle,
  Star,
  Play,
} from 'lucide-react'
import { useSSRSafeLanguage } from '@/contexts/SSRSafeLanguageContext'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

/**
 * KAPO-INSPIRED LANDING PAGE FOR PRISMY
 * Showcasing all features beyond basic translation
 */
export default function LandingPage() {
  const { language } = useSSRSafeLanguage()

  const features = [
    {
      icon: Languages,
      title: language === 'vi' ? 'AI Translation' : 'AI Translation',
      titleVi: 'Dịch Thuật AI',
      description: 'NotebookLM-inspired 3-panel interface with 99.9% accuracy',
      descriptionVi: 'Giao diện 3 panel theo NotebookLM với độ chính xác 99.9%',
    },
    {
      icon: FileText,
      title: 'Document Processing',
      titleVi: 'Xử Lý Tài Liệu',
      description:
        'Batch upload, OCR, and multi-format support (PDF, DOCX, TXT)',
      descriptionVi:
        'Tải lên hàng loạt, OCR, hỗ trợ đa định dạng (PDF, DOCX, TXT)',
    },
    {
      icon: Brain,
      title: 'AI Agent Swarm',
      titleVi: 'Hệ Thống AI Agents',
      description: 'Multi-AI collaboration for complex translation tasks',
      descriptionVi: 'Cộng tác đa AI cho các tác vụ dịch thuật phức tạp',
    },
    {
      icon: Settings,
      title: 'Workflow Builder',
      titleVi: 'Tạo Quy Trình',
      description: 'Visual automation designer for translation workflows',
      descriptionVi: 'Thiết kế tự động hóa trực quan cho quy trình dịch thuật',
    },
    {
      icon: Code,
      title: 'Developer API',
      titleVi: 'API Nhà Phát Triển',
      description: 'Full REST API with authentication and rate limiting',
      descriptionVi: 'API REST đầy đủ với xác thực và giới hạn tốc độ',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      titleVi: 'Phân Tích Nâng Cao',
      description:
        'Real-time metrics, usage insights, and performance tracking',
      descriptionVi:
        'Số liệu thời gian thực, thông tin sử dụng và theo dõi hiệu suất',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      titleVi: 'Cộng Tác Nhóm',
      description: 'Shared workspaces, comments, and real-time editing',
      descriptionVi:
        'Không gian làm việc chia sẻ, bình luận và chỉnh sửa thời gian thực',
    },
    {
      icon: Globe,
      title: 'Enterprise Features',
      titleVi: 'Tính Năng Doanh Nghiệp',
      description: 'Admin dashboard, user management, and custom integrations',
      descriptionVi:
        'Bảng điều khiển quản trị, quản lý người dùng và tích hợp tùy chỉnh',
    },
  ]

  const stats = [
    { number: '150+', label: language === 'vi' ? 'Ngôn ngữ' : 'Languages' },
    { number: '99.9%', label: language === 'vi' ? 'Độ chính xác' : 'Accuracy' },
    {
      number: '15+',
      label: language === 'vi' ? 'Tính năng AI' : 'AI Features',
    },
    { number: '24/7', label: language === 'vi' ? 'Hỗ trợ' : 'Support' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Languages className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Prismy</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">
                {language === 'vi' ? 'Tính năng' : 'Features'}
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">
                {language === 'vi' ? 'Bảng giá' : 'Pricing'}
              </a>
              <a href="#api" className="text-gray-600 hover:text-gray-900">
                API
              </a>
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

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
            >
              {language === 'vi'
                ? 'Nền tảng AI Dịch thuật'
                : 'AI Translation Platform'}
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {language === 'vi' ? 'với 15+ Tính năng' : 'with 15+ Features'}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
            >
              {language === 'vi'
                ? 'Không chỉ dịch thuật - Prismy là hệ sinh thái AI hoàn chỉnh với Agent Swarm, Workflow Builder, API mạnh mẽ và nhiều hơn thế nữa.'
                : 'More than translation - Prismy is a complete AI ecosystem with Agent Swarm, Workflow Builder, powerful APIs and much more.'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Link
                href="/workspace-v2"
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 text-lg font-medium"
              >
                <Play className="w-5 h-5" />
                {language === 'vi' ? 'Dùng thử miễn phí' : 'Try Free Demo'}
              </Link>
              <Link
                href="/api-docs"
                className="px-8 py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2 text-lg font-medium"
              >
                <Code className="w-5 h-5" />
                {language === 'vi' ? 'Xem API Docs' : 'View API Docs'}
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {stat.number}
                  </div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {language === 'vi' ? 'Tính năng vượt trội' : 'Advanced Features'}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {language === 'vi'
                ? 'Prismy không chỉ là công cụ dịch thuật - đây là nền tảng AI hoàn chỉnh cho doanh nghiệp'
                : "Prismy is not just a translation tool - it's a complete AI platform for enterprises"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {language === 'vi' ? feature.titleVi : feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {language === 'vi'
                    ? feature.descriptionVi
                    : feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {language === 'vi'
              ? 'Sẵn sàng trải nghiệm tương lai của dịch thuật?'
              : 'Ready to experience the future of translation?'}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {language === 'vi'
              ? 'Khám phá workspace NotebookLM và toàn bộ tính năng AI của Prismy ngay hôm nay'
              : "Explore the NotebookLM workspace and all of Prismy's AI features today"}
          </p>
          <Link
            href="/workspace-v2"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-all text-lg font-medium"
          >
            {language === 'vi' ? 'Vào Workspace' : 'Enter Workspace'}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Languages className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Prismy</span>
            </div>
            <div className="text-gray-400">
              © 2024 Prismy.{' '}
              {language === 'vi'
                ? 'Tất cả quyền được bảo lưu.'
                : 'All rights reserved.'}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
