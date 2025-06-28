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
      {/* Kapo Ultra-Modern Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        <div className="kapo-glass-light border-b border-white/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* Logo with Professional Styling */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 group"
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <Languages className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                </div>
                <span className="text-2xl font-black text-gray-900 tracking-tight">
                  Prismy
                </span>
              </motion.div>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-12">
                <motion.a
                  href="#features"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative text-gray-600 hover:text-gray-900 font-medium text-lg transition-colors duration-300 group"
                >
                  {language === 'vi' ? 'Tính năng' : 'Features'}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
                </motion.a>
                <motion.a
                  href="#pricing"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative text-gray-600 hover:text-gray-900 font-medium text-lg transition-colors duration-300 group"
                >
                  {language === 'vi' ? 'Bảng giá' : 'Pricing'}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
                </motion.a>
                <motion.a
                  href="#api"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative text-gray-600 hover:text-gray-900 font-medium text-lg transition-colors duration-300 group"
                >
                  API
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
                </motion.a>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Link
                    href="/workspace-v2"
                    className="kapo-btn-primary px-8 py-3 text-white font-semibold text-lg flex items-center gap-2 shadow-xl hover:shadow-2xl"
                  >
                    {language === 'vi' ? 'Vào Workspace' : 'Enter Workspace'}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              </nav>

              {/* Mobile Menu Button */}
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:hidden kapo-glass-light p-3 rounded-2xl border border-white/20"
              >
                <div className="w-6 h-6 flex flex-col justify-center items-center">
                  <span className="block h-0.5 w-6 bg-gray-600 rounded-full transition-all duration-300"></span>
                  <span className="block h-0.5 w-6 bg-gray-600 rounded-full mt-1.5 transition-all duration-300"></span>
                  <span className="block h-0.5 w-6 bg-gray-600 rounded-full mt-1.5 transition-all duration-300"></span>
                </div>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div className="lg:hidden absolute top-full left-0 right-0 kapo-glass border-t border-white/20 transform -translate-y-full opacity-0 pointer-events-none transition-all duration-300">
          <div className="px-6 py-8 space-y-6">
            <a
              href="#features"
              className="block text-xl font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              {language === 'vi' ? 'Tính năng' : 'Features'}
            </a>
            <a
              href="#pricing"
              className="block text-xl font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              {language === 'vi' ? 'Bảng giá' : 'Pricing'}
            </a>
            <a
              href="#api"
              className="block text-xl font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              API
            </a>
            <Link
              href="/workspace-v2"
              className="kapo-btn-primary w-full px-8 py-4 text-white font-semibold text-lg flex items-center justify-center gap-2"
            >
              {language === 'vi' ? 'Vào Workspace' : 'Enter Workspace'}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Kapo Hero Section - Massive Impact */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Hero Background with Advanced Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent"></div>

        {/* Floating Glass Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 kapo-glass rounded-full kapo-animate-float opacity-30"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 kapo-glass rounded-full kapo-animate-float opacity-20"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/4 w-48 h-48 kapo-glass rounded-full kapo-animate-float opacity-25"
          style={{ animationDelay: '4s' }}
        ></div>

        <div className="relative max-w-7xl mx-auto text-center z-10">
          {/* Massive Hero Typography */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="kapo-hero-massive text-gray-900 mb-8"
          >
            {language === 'vi' ? (
              <>
                Nền tảng{' '}
                <span className="kapo-animate-gradient bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  AI Dịch thuật
                </span>
                <br />
                <span className="text-gray-700">Thế hệ mới</span>
              </>
            ) : (
              <>
                Next-Gen{' '}
                <span className="kapo-animate-gradient bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  AI Translation
                </span>
                <br />
                <span className="text-gray-700">Platform</span>
              </>
            )}
          </motion.h1>

          {/* Enhanced Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="kapo-subtitle text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed"
          >
            {language === 'vi'
              ? 'Không chỉ dịch thuật - Prismy là hệ sinh thái AI hoàn chỉnh với Agent Swarm, NotebookLM Workspace, API mạnh mẽ và 15+ tính năng chuyên nghiệp'
              : 'Beyond translation - Prismy is a complete AI ecosystem featuring Agent Swarm, NotebookLM Workspace, powerful APIs and 15+ professional features'}
          </motion.p>

          {/* Professional CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
          >
            <Link
              href="/workspace-v2"
              className="kapo-btn-primary px-12 py-6 text-white text-lg font-semibold flex items-center gap-3 shadow-2xl"
            >
              <Play className="w-6 h-6" />
              {language === 'vi' ? 'Khám phá Workspace' : 'Explore Workspace'}
            </Link>
            <Link
              href="/api-docs"
              className="kapo-btn-secondary px-12 py-6 text-gray-700 text-lg font-medium flex items-center gap-3"
            >
              <Code className="w-6 h-6" />
              {language === 'vi'
                ? 'Xem API Documentation'
                : 'View API Documentation'}
            </Link>
          </motion.div>

          {/* Professional Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="kapo-glass-light rounded-3xl p-8 text-center group hover:scale-105 transition-all duration-300"
              >
                <div className="text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium text-lg">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="mt-16 flex flex-wrap justify-center items-center gap-8 text-gray-500 text-sm"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              {language === 'vi' ? 'Miễn phí 14 ngày' : '14-day free trial'}
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              {language === 'vi'
                ? 'Không cần thẻ tín dụng'
                : 'No credit card required'}
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              {language === 'vi' ? 'Hỗ trợ 24/7' : '24/7 enterprise support'}
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              {language === 'vi' ? '4.9/5 đánh giá' : '4.9/5 customer rating'}
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 kapo-animate-pulse"></div>
          </div>
        </motion.div>
      </section>

      {/* Kapo Bento-Box Features Section */}
      <section
        id="features"
        className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50/50"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="kapo-section-title text-gray-900 mb-6"
            >
              {language === 'vi' ? 'Tính năng vượt trội' : 'Advanced Features'}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="kapo-subtitle text-gray-600 max-w-4xl mx-auto"
            >
              {language === 'vi'
                ? 'Prismy không chỉ là công cụ dịch thuật - đây là nền tảng AI hoàn chỉnh cho doanh nghiệp hiện đại'
                : "Prismy is not just a translation tool - it's a complete AI platform designed for modern enterprises"}
            </motion.p>
          </div>

          {/* Bento-Box Grid Layout */}
          <div className="grid grid-cols-12 gap-6 lg:gap-8">
            {/* Large Feature Card - AI Translation (Spans 6 columns, 2 rows) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="col-span-12 lg:col-span-6 lg:row-span-2 kapo-card p-8 lg:p-12 relative overflow-hidden group cursor-pointer"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <Languages className="w-9 h-9 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  {language === 'vi' ? features[0].titleVi : features[0].title}
                </h3>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  {language === 'vi'
                    ? features[0].descriptionVi
                    : features[0].description}
                </p>
                <div className="inline-flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-4 transition-all">
                  <span>{language === 'vi' ? 'Khám phá' : 'Explore'}</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            </motion.div>

            {/* Medium Feature Cards - Right Column (3 cards) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="col-span-12 sm:col-span-6 lg:col-span-6 kapo-card p-6 lg:p-8 group cursor-pointer"
            >
              <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {language === 'vi' ? features[1].titleVi : features[1].title}
              </h3>
              <p className="text-gray-600">
                {language === 'vi'
                  ? features[1].descriptionVi
                  : features[1].description}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="col-span-12 sm:col-span-6 lg:col-span-6 kapo-card p-6 lg:p-8 group cursor-pointer"
            >
              <div className="w-14 h-14 bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {language === 'vi' ? features[2].titleVi : features[2].title}
              </h3>
              <p className="text-gray-600">
                {language === 'vi'
                  ? features[2].descriptionVi
                  : features[2].description}
              </p>
            </motion.div>

            {/* Wide Feature Card - Workflow Builder (Spans 8 columns) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="col-span-12 lg:col-span-8 kapo-card p-8 relative overflow-hidden group cursor-pointer"
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Settings className="w-9 h-9 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {language === 'vi'
                      ? features[3].titleVi
                      : features[3].title}
                  </h3>
                  <p className="text-lg text-gray-600">
                    {language === 'vi'
                      ? features[3].descriptionVi
                      : features[3].description}
                  </p>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-400/20 to-red-600/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500"></div>
            </motion.div>

            {/* Small Square Card - API */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="col-span-12 sm:col-span-6 lg:col-span-4 kapo-card p-6 lg:p-8 group cursor-pointer"
            >
              <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Code className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {language === 'vi' ? features[4].titleVi : features[4].title}
              </h3>
              <p className="text-gray-600">
                {language === 'vi'
                  ? features[4].descriptionVi
                  : features[4].description}
              </p>
            </motion.div>

            {/* Medium Cards - Bottom Row */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="col-span-12 sm:col-span-6 lg:col-span-4 kapo-card p-6 lg:p-8 group cursor-pointer"
            >
              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {language === 'vi' ? features[5].titleVi : features[5].title}
              </h3>
              <p className="text-gray-600">
                {language === 'vi'
                  ? features[5].descriptionVi
                  : features[5].description}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="col-span-12 sm:col-span-6 lg:col-span-4 kapo-card p-6 lg:p-8 group cursor-pointer"
            >
              <div className="w-14 h-14 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {language === 'vi' ? features[6].titleVi : features[6].title}
              </h3>
              <p className="text-gray-600">
                {language === 'vi'
                  ? features[6].descriptionVi
                  : features[6].description}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="col-span-12 sm:col-span-6 lg:col-span-4 kapo-card p-6 lg:p-8 group cursor-pointer"
            >
              <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {language === 'vi' ? features[7].titleVi : features[7].title}
              </h3>
              <p className="text-gray-600">
                {language === 'vi'
                  ? features[7].descriptionVi
                  : features[7].description}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Kapo CTA Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Advanced Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>

        {/* Floating Glass Elements */}
        <div className="absolute top-10 left-10 w-64 h-64 kapo-glass rounded-full opacity-20 kapo-animate-float"></div>
        <div
          className="absolute bottom-10 right-10 w-80 h-80 kapo-glass rounded-full opacity-15 kapo-animate-float"
          style={{ animationDelay: '3s' }}
        ></div>

        <div className="relative max-w-6xl mx-auto text-center z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="kapo-section-title text-white mb-8"
          >
            {language === 'vi'
              ? 'Sẵn sàng trải nghiệm tương lai của dịch thuật?'
              : 'Ready to experience the future of translation?'}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="kapo-subtitle text-blue-100 mb-12 max-w-4xl mx-auto"
          >
            {language === 'vi'
              ? 'Khám phá NotebookLM Workspace và toàn bộ hệ sinh thái AI của Prismy. Bắt đầu miễn phí ngay hôm nay.'
              : "Explore the NotebookLM Workspace and Prismy's complete AI ecosystem. Start your free journey today."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
          >
            <Link
              href="/workspace-v2"
              className="kapo-glass-light px-12 py-6 text-white border border-white/30 font-semibold text-xl flex items-center gap-3 group hover:bg-white/20 transition-all duration-300"
            >
              {language === 'vi' ? 'Khám phá Workspace' : 'Explore Workspace'}
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/api-docs"
              className="kapo-glass-light px-12 py-6 text-white border border-white/30 font-medium text-xl flex items-center gap-3 hover:bg-white/10 transition-all duration-300"
            >
              <Code className="w-6 h-6" />
              {language === 'vi' ? 'Xem API Docs' : 'View API Docs'}
            </Link>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center items-center gap-8 text-blue-100/80"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-medium">
                {language === 'vi' ? 'Miễn phí 14 ngày' : '14-day free trial'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-medium">
                {language === 'vi'
                  ? 'Không cần thẻ tín dụng'
                  : 'No credit card required'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-medium">
                {language === 'vi' ? 'Hủy bất cứ lúc nào' : 'Cancel anytime'}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Kapo Footer */}
      <footer className="relative py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Logo Section */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Languages className="w-7 h-7 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur-lg opacity-50"></div>
              </div>
              <div>
                <span className="text-2xl font-black text-white tracking-tight">
                  Prismy
                </span>
                <p className="text-gray-400 text-sm">
                  {language === 'vi'
                    ? 'Nền tảng AI Dịch thuật'
                    : 'AI Translation Platform'}
                </p>
              </div>
            </div>

            {/* Links Section */}
            <div className="flex flex-wrap items-center gap-8 text-gray-300">
              <a
                href="#features"
                className="hover:text-white transition-colors font-medium"
              >
                {language === 'vi' ? 'Tính năng' : 'Features'}
              </a>
              <a
                href="#pricing"
                className="hover:text-white transition-colors font-medium"
              >
                {language === 'vi' ? 'Bảng giá' : 'Pricing'}
              </a>
              <a
                href="#api"
                className="hover:text-white transition-colors font-medium"
              >
                API
              </a>
              <Link
                href="/workspace-v2"
                className="hover:text-white transition-colors font-medium"
              >
                {language === 'vi' ? 'Workspace' : 'Workspace'}
              </Link>
            </div>

            {/* Copyright */}
            <div className="text-gray-400 text-center lg:text-right">
              <p className="font-medium">
                © 2024 Prismy.{' '}
                {language === 'vi'
                  ? 'Tất cả quyền được bảo lưu.'
                  : 'All rights reserved.'}
              </p>
              <p className="text-sm mt-1">
                {language === 'vi'
                  ? 'Được tạo với ❤️ tại Việt Nam'
                  : 'Made with ❤️ in Vietnam'}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
