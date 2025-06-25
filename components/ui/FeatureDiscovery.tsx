'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Lightbulb, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Brain, 
  Network, 
  Zap, 
  ChevronDown,
  Star,
  Trophy,
  Gift
} from 'lucide-react'

interface FeatureStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  selector: string
  position: 'top' | 'bottom' | 'left' | 'right'
  feature: 'agents' | 'insights' | 'enterprise' | 'navigation'
}

interface FeatureDiscoveryProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (feature: string) => void
  userLevel?: 'beginner' | 'intermediate' | 'advanced'
}

export default function FeatureDiscovery({ 
  isOpen, 
  onClose, 
  onComplete, 
  userLevel = 'beginner' 
}: FeatureDiscoveryProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedFeatures, setCompletedFeatures] = useState<string[]>([])
  const [language, setLanguage] = useState<'vi' | 'en'>('en')

  const features = {
    vi: {
      title: 'Khám phá tính năng AI mới',
      subtitle: 'Hãy để chúng tôi giới thiệu các tính năng AI tiên tiến của Prismy',
      steps: [
        {
          id: 'welcome',
          title: 'Chào mừng đến với Prismy AI',
          description: 'Prismy không chỉ là công cụ dịch thuật thông thường. Đây là nền tảng AI tiên tiến với autonomous agents và enterprise features.',
          icon: Star,
          selector: '.dashboard-header',
          position: 'bottom' as const,
          feature: 'navigation' as const
        },
        {
          id: 'agents',
          title: 'AI Agents - Trí tuệ nhân tạo tự động',
          description: 'Tạo và quản lý các AI agents có thể làm việc độc lập, hợp tác với nhau để xử lý tài liệu phức tạp.',
          icon: Brain,
          selector: '[href="/dashboard/agents"]',
          position: 'right' as const,
          feature: 'agents' as const
        },
        {
          id: 'insights',
          title: 'Thông tin thông minh',
          description: 'AI dự đoán nhu cầu của bạn và phân tích mối quan hệ giữa nhiều tài liệu để đưa ra insights sâu sắc.',
          icon: Zap,
          selector: '[href="/dashboard/insights"]',
          position: 'right' as const,
          feature: 'insights' as const
        },
        {
          id: 'enterprise',
          title: 'Enterprise Features',
          description: 'Mạng lưới học tập, điều khiển giọng nói, và collaboration cho doanh nghiệp quy mô lớn.',
          icon: Network,
          selector: '[href="/dashboard/enterprise"]',
          position: 'right' as const,
          feature: 'enterprise' as const
        }
      ],
      buttons: {
        next: 'Tiếp theo',
        back: 'Quay lại',
        finish: 'Hoàn thành',
        skip: 'Bỏ qua',
        tryIt: 'Thử ngay'
      }
    },
    en: {
      title: 'Discover new AI features',
      subtitle: 'Let us introduce you to Prismy\'s advanced AI capabilities',
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to Prismy AI',
          description: 'Prismy is not just a translation tool. It\'s an advanced AI platform with autonomous agents and enterprise features.',
          icon: Star,
          selector: '.dashboard-header',
          position: 'bottom' as const,
          feature: 'navigation' as const
        },
        {
          id: 'agents',
          title: 'AI Agents - Autonomous Intelligence',
          description: 'Create and manage AI agents that work independently and collaborate with each other to process complex documents.',
          icon: Brain,
          selector: '[href="/dashboard/agents"]',
          position: 'right' as const,
          feature: 'agents' as const
        },
        {
          id: 'insights',
          title: 'Smart Insights',
          description: 'AI predicts your needs and analyzes relationships across multiple documents to provide deep insights.',
          icon: Zap,
          selector: '[href="/dashboard/insights"]',
          position: 'right' as const,
          feature: 'insights' as const
        },
        {
          id: 'enterprise',
          title: 'Enterprise Features',
          description: 'Learning networks, voice control, and collaboration for large-scale enterprise operations.',
          icon: Network,
          selector: '[href="/dashboard/enterprise"]',
          position: 'right' as const,
          feature: 'enterprise' as const
        }
      ],
      buttons: {
        next: 'Next',
        back: 'Back',
        finish: 'Complete',
        skip: 'Skip',
        tryIt: 'Try it'
      }
    }
  }

  const currentFeature = features[language]
  const currentStepData = currentFeature.steps[currentStep]
  const isLastStep = currentStep === currentFeature.steps.length - 1

  useEffect(() => {
    // Auto-detect language from localStorage or browser
    const savedLanguage = localStorage.getItem('prismy-language') as 'vi' | 'en'
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
  }, [])

  useEffect(() => {
    if (isOpen && currentStepData) {
      // Highlight the target element
      const element = document.querySelector(currentStepData.selector)
      if (element) {
        element.classList.add('feature-highlight')
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }

      return () => {
        const elements = document.querySelectorAll('.feature-highlight')
        elements.forEach(el => el.classList.remove('feature-highlight'))
      }
    }
  }, [isOpen, currentStep, currentStepData])

  const handleNext = () => {
    if (isLastStep) {
      handleComplete()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    if (currentStepData) {
      onComplete(currentStepData.feature)
      setCompletedFeatures(prev => [...prev, currentStepData.feature])
    }
    onClose()
    
    // Save completion state
    localStorage.setItem('prismy-feature-discovery', JSON.stringify({
      completed: true,
      features: [...completedFeatures, currentStepData?.feature].filter(Boolean),
      timestamp: new Date().toISOString()
    }))
  }

  const handleSkip = () => {
    onClose()
    localStorage.setItem('prismy-feature-discovery', JSON.stringify({
      skipped: true,
      timestamp: new Date().toISOString()
    }))
  }

  const handleTryFeature = () => {
    if (currentStepData) {
      const link = document.querySelector(currentStepData.selector) as HTMLAnchorElement
      if (link && link.href) {
        window.location.href = link.href
      }
    }
  }

  if (!isOpen || !currentStepData) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[9998]" />
      
      {/* Feature highlight styles */}
      <style jsx global>{`
        .feature-highlight {
          position: relative;
          z-index: 9999;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.3), 0 0 20px rgba(139, 92, 246, 0.2);
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .feature-highlight::before {
          content: '';
          position: absolute;
          inset: -8px;
          border: 2px solid #8B5CF6;
          border-radius: 12px;
          pointer-events: none;
          animation: pulse-border 2s infinite;
        }
        
        @keyframes pulse-border {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }
      `}</style>

      {/* Tour tooltip */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="fixed z-[10000] bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-sm"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <currentStepData.icon className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  {currentStep + 1} / {currentFeature.steps.length}
                </span>
              </div>
              <button
                onClick={handleSkip}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {currentStepData.title}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          {/* Progress bar */}
          <div className="px-6 py-3 bg-gray-50">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / currentFeature.steps.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">
                {Math.round(((currentStep + 1) / currentFeature.steps.length) * 100)}%
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                {currentStep > 0 && (
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center space-x-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{currentFeature.buttons.back}</span>
                  </button>
                )}
                
                {currentStepData.feature !== 'navigation' && (
                  <button
                    onClick={handleTryFeature}
                    className="px-4 py-2 text-purple-600 hover:text-purple-700 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors text-sm flex items-center space-x-1"
                  >
                    <Gift className="w-4 h-4" />
                    <span>{currentFeature.buttons.tryIt}</span>
                  </button>
                )}
              </div>

              <button
                onClick={handleNext}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all text-sm flex items-center space-x-1 font-medium"
              >
                <span>{isLastStep ? currentFeature.buttons.finish : currentFeature.buttons.next}</span>
                {!isLastStep && <ArrowRight className="w-4 h-4" />}
                {isLastStep && <Trophy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}