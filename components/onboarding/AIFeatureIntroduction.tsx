'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, FileText, Zap, Users, Mic, Network, ChevronRight, Play, X } from 'lucide-react'
import { motionSafe, slideUp, fadeIn, staggerContainer } from '@/lib/motion'

interface Feature {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  demo?: {
    type: 'video' | 'interactive' | 'animation'
    content: React.ReactNode
  }
  benefits: string[]
  availability: 'available' | 'coming-soon' | 'pro'
}

interface AIFeatureIntroductionProps {
  language?: 'vi' | 'en'
  onFeatureSelect?: (featureId: string) => void
  compact?: boolean
}

export default function AIFeatureIntroduction({ 
  language = 'en', 
  onFeatureSelect,
  compact = false 
}: AIFeatureIntroductionProps) {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)
  const [showDemo, setShowDemo] = useState(false)

  const content = {
    vi: {
      title: 'Sức mạnh của Prismy AI',
      subtitle: 'Khám phá các tính năng AI tiên tiến',
      learnMore: 'Tìm hiểu thêm',
      tryNow: 'Thử ngay',
      watchDemo: 'Xem demo',
      available: 'Có sẵn',
      comingSoon: 'Sắp ra mắt',
      proOnly: 'Chỉ dành cho Pro',
      features: {
        agents: {
          title: 'AI Agents Tự Động',
          description: 'Agents làm việc độc lập, phân tích tài liệu và tạo báo cáo tự động',
          benefits: [
            'Tự động hóa quy trình làm việc',
            'Phân tích 24/7 không ngừng nghỉ',
            'Học và cải thiện liên tục'
          ]
        },
        crossDoc: {
          title: 'Phân Tích Đa Tài Liệu',
          description: 'Tìm kiếm mối liên hệ và insights từ nhiều tài liệu cùng lúc',
          benefits: [
            'Phát hiện xu hướng ẩn',
            'Tổng hợp thông tin đa nguồn',
            'Tạo báo cáo tổng hợp'
          ]
        },
        predictive: {
          title: 'Dự Đoán Thông Minh',
          description: 'AI dự đoán nhu cầu và đề xuất hành động tiếp theo',
          benefits: [
            'Tiết kiệm thời gian',
            'Đề xuất chính xác',
            'Tối ưu quy trình làm việc'
          ]
        },
        swarm: {
          title: 'Agent Swarm',
          description: 'Nhiều agents cộng tác để giải quyết vấn đề phức tạp',
          benefits: [
            'Giải quyết nhanh chóng',
            'Đa góc nhìn chuyên môn',
            'Kết quả chính xác cao'
          ]
        },
        voice: {
          title: 'Điều Khiển Giọng Nói',
          description: 'Ra lệnh cho AI bằng giọng nói tự nhiên',
          benefits: [
            'Tương tác tự nhiên',
            'Hỗ trợ đa ngôn ngữ',
            'Làm việc rảnh tay'
          ]
        },
        learning: {
          title: 'Mạng Lưới Học Tập',
          description: 'Agents chia sẻ kiến thức và học từ nhau',
          benefits: [
            'Kiến thức tập thể',
            'Cải thiện nhanh chóng',
            'Thích ứng liên tục'
          ]
        }
      }
    },
    en: {
      title: 'The Power of Prismy AI',
      subtitle: 'Explore cutting-edge AI features',
      learnMore: 'Learn More',
      tryNow: 'Try Now',
      watchDemo: 'Watch Demo',
      available: 'Available',
      comingSoon: 'Coming Soon',
      proOnly: 'Pro Only',
      features: {
        agents: {
          title: 'Autonomous AI Agents',
          description: 'Agents work independently, analyze documents and create reports automatically',
          benefits: [
            'Automate workflows',
            '24/7 non-stop analysis',
            'Continuous learning & improvement'
          ]
        },
        crossDoc: {
          title: 'Cross-Document Analysis',
          description: 'Find connections and insights across multiple documents simultaneously',
          benefits: [
            'Discover hidden patterns',
            'Multi-source synthesis',
            'Comprehensive reports'
          ]
        },
        predictive: {
          title: 'Predictive Intelligence',
          description: 'AI predicts needs and suggests next actions',
          benefits: [
            'Save time',
            'Accurate suggestions',
            'Optimize workflows'
          ]
        },
        swarm: {
          title: 'Agent Swarm',
          description: 'Multiple agents collaborate to solve complex problems',
          benefits: [
            'Rapid problem solving',
            'Multi-expert perspectives',
            'High accuracy results'
          ]
        },
        voice: {
          title: 'Voice Control',
          description: 'Command AI with natural voice',
          benefits: [
            'Natural interaction',
            'Multi-language support',
            'Hands-free operation'
          ]
        },
        learning: {
          title: 'Learning Networks',
          description: 'Agents share knowledge and learn from each other',
          benefits: [
            'Collective intelligence',
            'Rapid improvement',
            'Continuous adaptation'
          ]
        }
      }
    }
  }

  const features: Feature[] = [
    {
      id: 'agents',
      title: content[language].features.agents.title,
      description: content[language].features.agents.description,
      icon: <Brain className="w-6 h-6" />,
      benefits: content[language].features.agents.benefits,
      availability: 'available',
      demo: {
        type: 'animation',
        content: <AgentAnimation />
      }
    },
    {
      id: 'cross-doc',
      title: content[language].features.crossDoc.title,
      description: content[language].features.crossDoc.description,
      icon: <FileText className="w-6 h-6" />,
      benefits: content[language].features.crossDoc.benefits,
      availability: 'available'
    },
    {
      id: 'predictive',
      title: content[language].features.predictive.title,
      description: content[language].features.predictive.description,
      icon: <Zap className="w-6 h-6" />,
      benefits: content[language].features.predictive.benefits,
      availability: 'available'
    },
    {
      id: 'swarm',
      title: content[language].features.swarm.title,
      description: content[language].features.swarm.description,
      icon: <Users className="w-6 h-6" />,
      benefits: content[language].features.swarm.benefits,
      availability: 'coming-soon'
    },
    {
      id: 'voice',
      title: content[language].features.voice.title,
      description: content[language].features.voice.description,
      icon: <Mic className="w-6 h-6" />,
      benefits: content[language].features.voice.benefits,
      availability: 'pro'
    },
    {
      id: 'learning',
      title: content[language].features.learning.title,
      description: content[language].features.learning.description,
      icon: <Network className="w-6 h-6" />,
      benefits: content[language].features.learning.benefits,
      availability: 'pro'
    }
  ]

  const handleFeatureClick = (feature: Feature) => {
    setSelectedFeature(feature.id)
    onFeatureSelect?.(feature.id)
    if (feature.demo) {
      setShowDemo(true)
    }
  }

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'available':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            {content[language].available}
          </span>
        )
      case 'coming-soon':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
            {content[language].comingSoon}
          </span>
        )
      case 'pro':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
            {content[language].proOnly}
          </span>
        )
      default:
        return null
    }
  }

  if (compact) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {features.map((feature) => (
          <motion.div
            key={feature.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:border-purple-300 hover:shadow-md transition-all"
            onClick={() => handleFeatureClick(feature)}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                {feature.icon}
              </div>
              {getAvailabilityBadge(feature.availability)}
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <motion.div
      variants={motionSafe(staggerContainer)}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={motionSafe(slideUp)} className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {content[language].title}
        </h2>
        <p className="text-lg text-gray-600">
          {content[language].subtitle}
        </p>
      </motion.div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.id}
            variants={motionSafe(slideUp)}
            custom={index}
            whileHover={{ y: -4 }}
            className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:border-purple-300 hover:shadow-lg transition-all"
            onClick={() => handleFeatureClick(feature)}
          >
            {/* Feature Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg">
                <div className="text-purple-600">
                  {feature.icon}
                </div>
              </div>
              {getAvailabilityBadge(feature.availability)}
            </div>

            {/* Feature Content */}
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-600 mb-4">
              {feature.description}
            </p>

            {/* Benefits */}
            <ul className="space-y-2 mb-4">
              {feature.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5" />
                  <span className="text-sm text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* Action Button */}
            <button className="w-full py-2 text-purple-600 hover:text-purple-700 font-medium flex items-center justify-center space-x-2 group">
              <span>{feature.demo ? content[language].watchDemo : content[language].learnMore}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Demo Modal */}
      <AnimatePresence>
        {showDemo && selectedFeature && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setShowDemo(false)}
          >
            <motion.div
              variants={motionSafe(scaleIn)}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-2xl p-8 max-w-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {features.find(f => f.id === selectedFeature)?.title}
                </h3>
                <button
                  onClick={() => setShowDemo(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {/* Demo Content */}
              <div className="mb-6">
                {features.find(f => f.id === selectedFeature)?.demo?.content}
              </div>

              <button
                onClick={() => {
                  setShowDemo(false)
                  window.location.href = '/dashboard/agents'
                }}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-medium"
              >
                {content[language].tryNow}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Simple Agent Animation Component
function AgentAnimation() {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-8">
      <div className="flex items-center justify-center space-x-6">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="w-24 h-24 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center"
        >
          <Brain className="w-12 h-12 text-white" />
        </motion.div>
        
        <div className="flex flex-col space-y-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.5
              }}
              className="h-1 w-24 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full"
            />
          ))}
        </div>
        
        <motion.div
          animate={{ scale: [0.9, 1, 0.9] }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            delay: 0.5
          }}
          className="w-16 h-20 bg-white rounded-lg shadow-lg flex items-center justify-center"
        >
          <FileText className="w-8 h-8 text-gray-400" />
        </motion.div>
      </div>
      
      <p className="text-center text-purple-700 font-medium mt-6">
        AI Agent Processing Documents in Real-time
      </p>
    </div>
  )
}

// Missing import
function scaleIn() {
  return {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1 }
  }
}